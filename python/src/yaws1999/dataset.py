"""
yaws1999.dataset — Shape parsed tables into public dataset JSON vs debug JSON.

Public dataset (``shared/processed/yaws1999/``):
  id, title, refKey, equation, columns, pages, rows
  — ``columns`` is an ordered list of ``{key, header, unit}`` (no parallel
    header/units maps),
  — rows use ``id`` (not ``no``), expand ``values`` into named columns,
  — no ``djvuPage`` / ``raw`` / ``formulaRaw`` / ``engine`` / ``quant`` / ``dpi``.

Debug copy (``reports/yaws1999/debug/``) keeps OCR provenance fields.
"""
from __future__ import annotations

import re
from typing import Any

from yaws1999.constants import PAGE_OFFSET, REF_KEY

_NON_ALNUM = re.compile(r"[^a-z0-9]+")
_VALUE_KEY = re.compile(r"[^A-Za-z0-9]+")

# OCR often splits ``density @ 25 C`` into density / @ / 25 / C.
_AT_PHRASE = re.compile(
    r"(?P<prop>[A-Za-z][A-Za-z0-9_]*)\s*@\s*"
    r"(?P<cond>25(?:\s*C)?|T[Bb]|TMIN|TMAX|T)(?=\s|$)",
    re.IGNORECASE,
)
# Printed unit under a temperature column: ``T, K`` / ``T, C``.
_T_COMMA_UNIT = re.compile(r"\bT,\s*(?P<unit>K|C|F)\b", re.IGNORECASE)
_EQ_UNIT_GROUP = re.compile(r"\(([^)]+)\)\s*$")
_EQ_UNIT_PAIR = re.compile(
    r"([A-Za-z][A-Za-z0-9_]*)\s*-\s*([^,;]+)",
)
_TEMP_KEYS = frozenset(
    {"T", "Tc", "TB", "Tb", "TMIN", "TMAX", "Tmelt", "Tboil"}
)
_UNIT_ONLY = frozenset(
    {
        "k",
        "bar",
        "g/mol",
        "cm3/mol",
        "g/cm3",
        "g/ml",
        "kjoule/mol",
        "kjoule/kg",
        "btu/lb",
        "dynes/cm",
        "mm hg",
        "mmhg",
    }
)


def dataset_file_name(title: str | None, table_id: str) -> str:
    """``Critical_properties_…_(table_1-1).json`` from title + id."""
    slug = _title_slug(title) or f"table_{table_id.replace('-', '_')}"
    return f"{slug}_(table_{table_id}).json"


def debug_file_name(title: str | None, table_id: str) -> str:
    """Same stem as the dataset file (written under the debug folder)."""
    return dataset_file_name(title, table_id)


def _title_slug(title: str | None) -> str:
    if not title:
        return ""
    text = title.strip()
    # Subtitle after em/en dash or " - " → "_of_…" (matches handbook naming).
    text = re.sub(r"\s*[-–—]\s*", "_of_", text)
    text = text.lower()
    text = _NON_ALNUM.sub("_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    if not text:
        return ""
    return text[0].upper() + text[1:]


def _clean_header_latex(header_line: str) -> str:
    """Strip common OCR/LaTeX noise from a header line before tokenization."""
    text = header_line
    text = text.replace(r"^\circ", "")
    text = re.sub(r"\\circ", "", text)
    text = re.sub(r"\\text\{?\s*C\}?", "C", text)
    text = re.sub(r"\\text\{([^}]*)\}", r"\1", text)
    text = text.replace("{", " ").replace("}", " ")
    text = re.sub(r"@\s*", "@ ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def coalesce_header_labels(header_line: str | None) -> list[tuple[str, str | None]]:
    """Tokenize a header line into ``(label, unit_hint)`` pairs.

    Merges ``prop @ condition`` into one label. ``T, K`` / ``T, C`` become label
    ``T`` with the matching unit hint.
    """
    if not header_line:
        return []
    text = _clean_header_latex(header_line)

    t_unit_hints: list[str | None] = []

    def _store_t(match: re.Match[str]) -> str:
        unit = match.group("unit").upper()
        if unit == "C":
            unit = "°C"
        t_unit_hints.append(unit)
        return f" __TUNIT{len(t_unit_hints) - 1}__ "

    text = _T_COMMA_UNIT.sub(_store_t, text)

    placeholders: list[str] = []

    def _store_at(match: re.Match[str]) -> str:
        prop = match.group("prop")
        cond = re.sub(r"\s+", " ", match.group("cond").strip())
        if re.fullmatch(r"25", cond, re.IGNORECASE):
            cond = "25 C"
        elif re.fullmatch(r"25\s*C", cond, re.IGNORECASE):
            cond = "25 C"
        placeholders.append(f"{prop} @ {cond}")
        return f" __AT{len(placeholders) - 1}__ "

    text = _AT_PHRASE.sub(_store_at, text)
    tokens: list[tuple[str, str | None]] = []
    for tok in text.split():
        m_at = re.fullmatch(r"__AT(\d+)__", tok)
        m_t = re.fullmatch(r"__TUNIT(\d+)__", tok)
        if m_at:
            tokens.append((placeholders[int(m_at.group(1))], None))
        elif m_t:
            tokens.append(("T", t_unit_hints[int(m_t.group(1))]))
        else:
            tokens.append((tok, None))
    return tokens


def header_tokens(header_line: str | None) -> list[str]:
    """Split an OCR header line into column labels (``@`` conditions coalesced)."""
    return [label for label, _unit in coalesce_header_labels(header_line)]


def columns_from_header(header_line: str | None) -> list[dict[str, str | None]]:
    """Return ordered ``[{key, header, unit}, …]`` from an OCR header line.

    Identity columns are always ``id``, ``formula``, ``name``. Remaining header
    tokens (after NO/FORMULA/NAME) become value columns; duplicate labels get
    ``_2``, ``_3``, … key suffixes. Unit hints from ``T, K`` / ``T, C`` are set
    here; equation-based units are filled by ``attach_column_units``.
    """
    tokens = coalesce_header_labels(header_line)
    i = 0
    while i < len(tokens):
        label, _hint = tokens[i]
        low = re.sub(r"[^a-z]", "", label.lower())
        if i < 3 and low in {"no", "mo", "n0", "formula", "name"}:
            i += 1
            continue
        break
    value_labels = tokens[i:]

    columns: list[dict[str, str | None]] = [
        {"key": "id", "header": "NO", "unit": None},
        {"key": "formula", "header": "FORMULA", "unit": None},
        {"key": "name", "header": "NAME", "unit": None},
    ]
    seen: dict[str, int] = {}
    for label, unit_hint in value_labels:
        key = _value_column_key(label)
        n = seen.get(key, 0) + 1
        seen[key] = n
        if n > 1:
            key = f"{key}_{n}"
        columns.append({"key": key, "header": label, "unit": unit_hint})
    return columns


def _value_column_key(label: str) -> str:
    """``g/mol`` → ``g_mol``; ``density @ 25 C`` → ``density_at_25_C``."""
    text = label.strip()
    text = re.sub(r"\s*@\s*", "_at_", text)
    key = _VALUE_KEY.sub("_", text).strip("_")
    if not key:
        return "value"
    if key.isupper() and len(key) <= 8:
        return key
    if re.fullmatch(r"[A-Za-z]\d*", key):
        return key  # A, B, C, …
    return key


def parse_equation_units(equation: str | None) -> dict[str, str]:
    """Parse trailing ``(density - g/ml, T - K)`` footnotes into a name→unit map."""
    if not equation:
        return {}
    match = _EQ_UNIT_GROUP.search(equation.strip())
    if not match:
        return {}
    out: dict[str, str] = {}
    for pair in _EQ_UNIT_PAIR.finditer(match.group(1)):
        name = pair.group(1).strip()
        unit = pair.group(2).strip()
        out[name] = unit
        out[name.lower()] = unit
    return out


def _looks_like_unit(label: str) -> bool:
    low = label.strip().lower().replace(" ", "")
    if "/" in low:
        return True
    return low in _UNIT_ONLY


def attach_column_units(
    columns: list[dict[str, str | None]],
    equation: str | None,
) -> list[dict[str, str | None]]:
    """Fill ``unit`` on each column dict from the header label and equation footnote."""
    eq_units = parse_equation_units(equation)
    out: list[dict[str, str | None]] = []
    for col in columns:
        key = str(col["key"])
        label = str(col.get("header") or key)
        preset = col.get("unit")
        unit: str | None = preset if preset else None
        if key in ("id", "formula", "name") or key.startswith("value_extra_"):
            unit = None
        elif unit:
            pass  # keep T, C / T, K hint from coalesce
        elif _looks_like_unit(label):
            unit = label
        else:
            at = re.match(r"^(.+?)\s*@\s*(.+)$", label)
            if at:
                prop = at.group(1).strip()
                unit = (
                    eq_units.get(prop)
                    or eq_units.get(prop.lower())
                    or eq_units.get(prop.replace("_", ""))
                )
            elif key in _TEMP_KEYS or label in _TEMP_KEYS:
                unit = eq_units.get("T") or eq_units.get("t") or "K"
            elif key in eq_units:
                unit = eq_units[key]
            elif label in eq_units:
                unit = eq_units[label]
            else:
                unit = None
        # Unit-named headers (Debye, Angstrom) are themselves the unit.
        if unit is None and label.lower() in {"debye", "angstrom", "ångstrom"}:
            unit = label
        out.append({"key": key, "header": label, "unit": unit})
    return out


def column_keys(columns: list[dict[str, str | None]] | list[str]) -> list[str]:
    """Row-field keys in order (supports legacy string-list columns)."""
    if not columns:
        return []
    if isinstance(columns[0], str):
        return list(columns)  # type: ignore[arg-type]
    return [str(c["key"]) for c in columns]  # type: ignore[index]


def align_values(values: list[Any], n_cols: int) -> list[Any]:
    """Fit a parser ``values`` list to ``n_cols`` header slots.

    Missing cells are ``None`` (printed ``-``). OCR sometimes inserts an extra
    leading dash, e.g. ``- - - - - - - 1.020`` for 6 blanks + density → strip
    surplus leading nulls so the trailing number lands on the last column
    instead of inventing ``value_extra_*``.
    """
    if n_cols <= 0:
        return []
    vals = list(values)
    while len(vals) > n_cols and vals and vals[0] is None:
        vals.pop(0)
    if len(vals) < n_cols:
        vals.extend([None] * (n_cols - len(vals)))
    elif len(vals) > n_cols:
        # Still long after stripping leading nulls: keep the rightmost n_cols
        # when the overflow head is empty, else keep left-aligned head.
        head = vals[:-n_cols]
        if all(v is None for v in head):
            vals = vals[-n_cols:]
        else:
            vals = vals[:n_cols]
    return vals


def expand_row(
    row: dict[str, Any],
    columns: list[dict[str, str | None]] | list[str],
    *,
    keep_debug: bool = False,
) -> dict[str, Any]:
    """Map a parser row (``no`` + ``values``) onto named columns."""
    keys = column_keys(columns)
    value_cols = [c for c in keys if c not in ("id", "formula", "name")]
    values = align_values(list(row.get("values") or []), len(value_cols))
    out: dict[str, Any] = {
        "id": row.get("no"),
        "formula": row.get("formula"),
        "name": row.get("name"),
    }
    for i, col in enumerate(value_cols):
        out[col] = values[i] if i < len(values) else None
    if keep_debug:
        if row.get("djvuPage") is not None:
            out["djvuPage"] = row["djvuPage"]
        if row.get("raw"):
            out["raw"] = row["raw"]
        if row.get("formulaRaw") and row.get("formulaRaw") != row.get("formula"):
            out["formulaRaw"] = row["formulaRaw"]
        if row.get("unparsedTail"):
            out["unparsedTail"] = row["unparsedTail"]
    return out


def _shape_columns(parsed: dict[str, Any]) -> list[dict[str, str | None]]:
    header_line = parsed.get("header")
    existing = parsed.get("columns")
    # Already shaped as [{key, header, unit}, …]
    if (
        isinstance(existing, list)
        and existing
        and isinstance(existing[0], dict)
        and "key" in existing[0]
    ):
        return [dict(c) for c in existing]
    # Legacy: header dict + columns string list
    if isinstance(header_line, dict):
        keys = list(existing) if isinstance(existing, list) and existing and isinstance(existing[0], str) else list(header_line.keys())
        return [
            {"key": str(k), "header": str(header_line.get(k, k)), "unit": None}
            for k in keys
        ]
    columns = columns_from_header(header_line if isinstance(header_line, str) else None)
    if len(columns) == 3 and parsed.get("rows"):
        n_vals = len((parsed["rows"][0] or {}).get("values") or [])
        for i in range(1, n_vals + 1):
            key = f"value_{i}"
            columns.append({"key": key, "header": key, "unit": None})
    return columns


def _pages_from_parsed(parsed: dict[str, Any]) -> dict[str, Any]:
    pages = parsed.get("pages")
    if pages is not None:
        return pages
    printed = parsed.get("printedPages") or {}
    djvu = parsed.get("djvuPages") or {}
    if printed:
        return {"first": printed.get("first"), "last": printed.get("last")}
    if djvu:
        return {
            "first": (djvu.get("first") or 0) - PAGE_OFFSET,
            "last": (djvu.get("last") or 0) - PAGE_OFFSET,
        }
    return {"first": None, "last": None}


def to_dataset_table(parsed: dict[str, Any]) -> dict[str, Any]:
    """Public processed-table document (no OCR provenance)."""
    columns = attach_column_units(_shape_columns(parsed), parsed.get("equation"))
    pages = _pages_from_parsed(parsed)
    rows = [expand_row(r, columns, keep_debug=False) for r in parsed.get("rows") or []]

    return {
        "id": parsed["id"],
        "title": parsed.get("title"),
        "refKey": parsed.get("refKey") or REF_KEY,
        "equation": parsed.get("equation"),
        "columns": columns,
        "pages": pages,
        "rows": rows,
    }


def to_debug_table(parsed: dict[str, Any]) -> dict[str, Any]:
    """Debug document: dataset fields + engine/quant/dpi + per-row OCR fields + unparsed."""
    header_line = parsed.get("header")
    columns = attach_column_units(_shape_columns(parsed), parsed.get("equation"))
    pages = parsed.get("pages")
    if pages is None:
        printed = parsed.get("printedPages") or {}
        pages = {
            "first": printed.get("first"),
            "last": printed.get("last"),
        }

    rows = [expand_row(r, columns, keep_debug=True) for r in parsed.get("rows") or []]
    return {
        "id": parsed["id"],
        "title": parsed.get("title"),
        "refKey": parsed.get("refKey") or REF_KEY,
        "engine": parsed.get("engine"),
        "backend": parsed.get("backend"),
        "model": parsed.get("model"),
        "quant": parsed.get("quant"),
        "dpi": parsed.get("dpi"),
        "equation": parsed.get("equation"),
        "headerRaw": header_line if isinstance(header_line, str) else None,
        "columns": columns,
        "pages": pages,
        "djvuPages": parsed.get("djvuPages"),
        "rows": rows,
        "unparsed": list(parsed.get("unparsed") or []),
    }
