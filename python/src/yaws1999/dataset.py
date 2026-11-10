"""
yaws1999.dataset — Shape parsed tables into public dataset JSON vs debug JSON.

Public dataset (``shared/processed/yaws1999/``):
  id, title, refKey, equation, header (object), columns, pages, rows
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


def header_tokens(header_line: str | None) -> list[str]:
    """Split an OCR header line into tokens (keeps units like ``g/mol``)."""
    if not header_line:
        return []
    return [tok for tok in header_line.split() if tok]


def columns_from_header(header_line: str | None) -> tuple[list[str], dict[str, str]]:
    """Return ``(columns, header_object)`` from an OCR header line.

    Identity columns are always ``id``, ``formula``, ``name``. Remaining header
    tokens (after NO/FORMULA/NAME) become value column keys; duplicate labels
    get ``_2``, ``_3``, … suffixes. ``header`` maps each column key → original label.
    """
    tokens = header_tokens(header_line)
    # Drop leading identity labels when present.
    value_labels: list[str] = []
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        low = re.sub(r"[^a-z]", "", tok.lower())
        if i < 3 and low in {"no", "mo", "n0", "formula", "name"}:
            i += 1
            continue
        break
    value_labels = tokens[i:]

    columns = ["id", "formula", "name"]
    header_obj: dict[str, str] = {"id": "NO", "formula": "FORMULA", "name": "NAME"}
    seen: dict[str, int] = {}
    for label in value_labels:
        key = _value_column_key(label)
        n = seen.get(key, 0) + 1
        seen[key] = n
        if n > 1:
            key = f"{key}_{n}"
        columns.append(key)
        header_obj[key] = label
    return columns, header_obj


def _value_column_key(label: str) -> str:
    """``g/mol`` → ``g_mol``; ``TMIN`` → ``TMIN``; ``C_p`` stays letter-ish."""
    key = _VALUE_KEY.sub("_", label.strip()).strip("_")
    if not key:
        return "value"
    # Keep chemical-ish case for short all-caps tokens; otherwise lower units.
    if key.isupper() and len(key) <= 8:
        return key
    if re.fullmatch(r"[A-Za-z]\d*", key):
        return key  # A, B, C, …
    return key


def expand_row(
    row: dict[str, Any],
    columns: list[str],
    *,
    keep_debug: bool = False,
) -> dict[str, Any]:
    """Map a parser row (``no`` + ``values``) onto named columns."""
    values = list(row.get("values") or [])
    value_cols = [c for c in columns if c not in ("id", "formula", "name")]
    out: dict[str, Any] = {
        "id": row.get("no"),
        "formula": row.get("formula"),
        "name": row.get("name"),
    }
    for i, col in enumerate(value_cols):
        out[col] = values[i] if i < len(values) else None
    # Extra trailing values beyond the header → value_extra_N
    if len(values) > len(value_cols):
        for j, extra in enumerate(values[len(value_cols) :], start=1):
            out[f"value_extra_{j}"] = extra
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


def to_dataset_table(parsed: dict[str, Any]) -> dict[str, Any]:
    """Public processed-table document (no OCR provenance)."""
    header_line = parsed.get("header")
    if isinstance(header_line, dict):
        columns = list(parsed.get("columns") or header_line.keys())
        header_obj = header_line
    else:
        columns, header_obj = columns_from_header(header_line)
        # If header missing, synthesize value_1… from first row length.
        if columns == ["id", "formula", "name"] and parsed.get("rows"):
            n_vals = len((parsed["rows"][0] or {}).get("values") or [])
            for i in range(1, n_vals + 1):
                key = f"value_{i}"
                columns.append(key)
                header_obj[key] = key

    pages = parsed.get("pages")
    if pages is None:
        printed = parsed.get("printedPages") or {}
        djvu = parsed.get("djvuPages") or {}
        if printed:
            pages = {"first": printed.get("first"), "last": printed.get("last")}
        elif djvu:
            pages = {
                "first": (djvu.get("first") or 0) - PAGE_OFFSET,
                "last": (djvu.get("last") or 0) - PAGE_OFFSET,
            }
        else:
            pages = {"first": None, "last": None}

    rows = [expand_row(r, columns, keep_debug=False) for r in parsed.get("rows") or []]
    # Include any value_extra_* keys in columns for stable schema.
    extra_cols: list[str] = []
    for row in rows:
        for key in row:
            if key.startswith("value_extra_") and key not in columns and key not in extra_cols:
                extra_cols.append(key)
    columns = columns + sorted(extra_cols, key=lambda k: int(k.rsplit("_", 1)[-1]))

    return {
        "id": parsed["id"],
        "title": parsed.get("title"),
        "refKey": parsed.get("refKey") or REF_KEY,
        "equation": parsed.get("equation"),
        "header": header_obj,
        "columns": columns,
        "pages": pages,
        "rows": rows,
    }


def to_debug_table(parsed: dict[str, Any]) -> dict[str, Any]:
    """Debug document: dataset fields + engine/quant/dpi + per-row OCR fields + unparsed."""
    header_line = parsed.get("header")
    if isinstance(header_line, dict):
        columns = list(parsed.get("columns") or header_line.keys())
        header_obj = dict(header_line)
    else:
        columns, header_obj = columns_from_header(header_line)
        if columns == ["id", "formula", "name"] and parsed.get("rows"):
            n_vals = len((parsed["rows"][0] or {}).get("values") or [])
            for i in range(1, n_vals + 1):
                key = f"value_{i}"
                columns.append(key)
                header_obj[key] = key

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
        "quant": parsed.get("quant"),
        "dpi": parsed.get("dpi"),
        "equation": parsed.get("equation"),
        "header": header_obj,
        "headerRaw": header_line if isinstance(header_line, str) else None,
        "columns": columns,
        "pages": pages,
        "djvuPages": parsed.get("djvuPages"),
        "rows": rows,
        "unparsed": list(parsed.get("unparsed") or []),
    }
