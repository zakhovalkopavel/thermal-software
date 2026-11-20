"""Parse Surya OCR dumps of ASM chem-composition gap tables into raw-tables JSON."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Optional

from metal_data.asm_chem_composition import SOURCE_CITATION


_RANGE = re.compile(
    r"(?P<a>\d+(?:\.\d+)?)\s*[-–—]\s*(?P<b>\d+(?:\.\d+)?)"
)
_MAX = re.compile(r"(?P<a>\d+(?:\.\d+)?)\s*max", re.I)
_MIN = re.compile(r"(?P<a>\d+(?:\.\d+)?)\s*min", re.I)
_NUM = re.compile(r"^(?P<a>\d+(?:\.\d+)?)$")
_ELLIPSIS = re.compile(r"^\.{2,}$|^\u2026$|^…$")


def _parse_cell(token: str) -> Any:
    t = token.strip()
    if not t or _ELLIPSIS.match(t) or t in {"...", "…", "—", "-", "–"}:
        return None
    # dual ranges joined by ;
    if ";" in t and _RANGE.search(t):
        parts = [p.strip() for p in t.split(";") if p.strip()]
        parsed = [_parse_cell(p) for p in parts]
        # keep as list of ranges if multiple
        if all(p is not None for p in parsed):
            return parsed if len(parsed) > 1 else parsed[0]
    m = _RANGE.search(t)
    if m and m.group(0) == t or (m and re.fullmatch(r"[\d.\s\-–—]+", t)):
        if m:
            return {"min": float(m.group("a")), "max": float(m.group("b"))}
    m = _MAX.search(t)
    if m and "×" not in t:
        return {"min": 0.0, "max": float(m.group("a"))}
    m = _MIN.search(t)
    if m and "×" not in t and not re.search(r"\bC\b", t):
        return {"min": float(m.group("a")), "max": None}
    # formula-like / other text kept as string
    if any(ch in t for ch in ("×", "x", "+", "Nb", "Ti", "C", "N", "Al", "Cu", "S", "W", "V")) and not _NUM.match(t):
        if _NUM.match(t.split()[0] if t.split() else ""):
            pass
        else:
            return t
    m = _NUM.match(t)
    if m:
        v = float(m.group("a"))
        return v
    return t


def _tokens(line: str) -> list[str]:
    # Normalize separators
    s = line.replace("\t", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s.split(" ")


def parse_tool_steel_pages(texts: list[str]) -> list[dict[str, Any]]:
    """Parse Table 1 principal tool steels from Surya lines."""
    elements = ["C", "Mn", "Si", "Cr", "Ni", "Mo", "W", "V", "Co"]
    rows: list[dict[str, Any]] = []
    # Match: AISI [qualifier] UNS values...
    row_re = re.compile(
        r"^(?P<aisi>[A-Z]\d+[A-Z]?|"
        r"M3,\s*class\s*[12]|"
        r"[A-Z]\d+)\s+"
        r"(?P<uns>T\d{5})\s+"
        r"(?P<rest>.+)$",
        re.I,
    )
    for text in texts:
        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("Table ") or "Composition" in line and "Designation" in line:
                continue
            if re.match(r"^(Molybdenum|Tungsten|Chromium|Hot-work|Cold-work|Shock|Low-Alloy|Low-carbon|Water-hardening|Intermediate)", line, re.I):
                continue
            m = row_re.match(line)
            if not m:
                continue
            aisi_raw = m.group("aisi").strip()
            if re.match(r"M3,\s*class\s*1", aisi_raw, re.I):
                aisi = "M3, class 1"
            elif re.match(r"M3,\s*class\s*2", aisi_raw, re.I):
                aisi = "M3, class 2"
            else:
                aisi = aisi_raw.upper()
            uns = m.group("uns").upper()
            rest = m.group("rest")
            # Strip footnote markers like (c) on values
            rest = re.sub(r"(\d)\([a-z]\)", r"\1", rest)
            # Split rest into up to 9 composition cells; cells may contain "0.78-0.88;" "0.95-1.05"
            cells = _split_comp_cells(rest, expected=9)
            comp: dict[str, Any] = {}
            for el, cell in zip(elements, cells):
                val = _parse_cell(cell) if cell is not None else None
                if val is None:
                    continue
                if isinstance(val, list):
                    # dual C ranges → store as cRanges
                    comp[el] = val
                else:
                    comp[el] = val
            rows.append(
                {
                    "type": aisi,
                    "uns_number": uns,
                    "chemical_composition_percent": comp,
                }
            )
    return _dedupe_by_key(rows, "uns_number")


def _split_comp_cells(rest: str, expected: int) -> list[Optional[str]]:
    """Split composition tail into cells; merge dual-range tokens like '0.78-0.88;' + '0.95-1.05'."""
    raw = rest.split()
    cells: list[str] = []
    i = 0
    while i < len(raw):
        tok = raw[i]
        if tok.endswith(";") and i + 1 < len(raw):
            cells.append(f"{tok} {raw[i + 1]}")
            i += 2
            continue
        # "0.30 max"
        if i + 1 < len(raw) and raw[i + 1].lower() == "max" and re.match(r"^\d", tok):
            cells.append(f"{tok} max")
            i += 2
            continue
        if i + 1 < len(raw) and raw[i + 1].lower() == "min" and re.match(r"^\d", tok):
            cells.append(f"{tok} min")
            i += 2
            continue
        cells.append(tok)
        i += 1
    # Pad / trim
    while len(cells) < expected:
        cells.append("...")
    return cells[:expected]


def parse_stainless_pages(texts: list[str]) -> list[dict[str, Any]]:
    """Parse Table 1 wrought iron-base heat-resistant / stainless nominal compositions."""
    # Columns: Designation UNS C Cr Ni Mo N Nb Ti Other
    rows: list[dict[str, Any]] = []
    row_re = re.compile(
        r"^(?P<name>.+?)\s+"
        r"(?P<uns>S\d{5}|K\d{5}|\.{3}|…)\s+"
        r"(?P<rest>.+)$"
    )
    section = None
    for text in texts:
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            if re.match(r"^(Ferritic|Martensitic|Austenitic|Precipitation|Quenched)", line, re.I):
                section = line
                continue
            if line.startswith("Table ") or line.startswith("Designation") or line.startswith("Copyright"):
                continue
            if line.startswith("ASM ") or line.startswith("Page ") or line.startswith("01 Sep"):
                continue
            m = row_re.match(line)
            if not m:
                # designation without UNS sometimes: "18 SR ... 0.05 ..."
                m2 = re.match(r"^(?P<name>[A-Za-z0-9][A-Za-z0-9\- /.]+?)\s+(\.{3}|…)\s+(?P<rest>.+)$", line)
                if not m2:
                    continue
                name = m2.group("name").strip()
                uns = None
                rest = m2.group("rest")
            else:
                name = m.group("name").strip()
                uns_raw = m.group("uns")
                uns = None if uns_raw in {"...", "…"} else uns_raw.upper()
                rest = m.group("rest")

            # Avoid absorbing section headers
            if name.lower().startswith("ferritic") or "stainless steels" in name.lower():
                continue

            cells = _split_comp_cells(rest, expected=8)
            keys = ["C", "Cr", "Ni", "Mo", "N", "Nb", "Ti", "Other"]
            comp: dict[str, Any] = {}
            for el, cell in zip(keys, cells):
                if cell is None:
                    continue
                val = _parse_cell(cell)
                if val is None:
                    continue
                if el == "Other":
                    # remaining tokens may be part of Other — join leftover
                    idx = keys.index("Other")
                    other_tokens = cells[idx:]
                    other_s = " ".join(t for t in other_tokens if t and not _ELLIPSIS.match(t or ""))
                    if other_s and other_s not in {"...", "…"}:
                        comp["Other"] = other_s
                    break
                comp[el] = val
            entry: dict[str, Any] = {
                "type": name,
                "chemical_composition_percent": comp,
            }
            if uns:
                entry["uns_number"] = uns
            if section:
                entry["category"] = section
            rows.append(entry)
    return _dedupe_by_key(rows, "uns_number", fallback="type")


def parse_former_sae_pages(texts: list[str]) -> list[dict[str, Any]]:
    """Parse Table 22 former standard SAE steels.

    Typical: SAE AISI UNS C Mn P S Si Cr Ni Mo other date
    """
    rows: list[dict[str, Any]] = []
    row_re = re.compile(
        r"^(?P<sae>\d{4}[A-Z]?|X?\d{4}H?)\s+"
        r"(?P<aisi>[A-Z]?\d{4}H?|[A-Z]\d{4}|\.{3})\s+"
        r"(?P<uns>G\d{5}|H\d{5}|\.{3}|…)?\s*"
        r"(?P<rest>.+)$"
    )
    for text in texts:
        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("Table ") or "Composition" in line[:40] and "SAE" in line:
                continue
            m = row_re.match(line)
            if not m:
                continue
            sae = m.group("sae")
            aisi = m.group("aisi")
            uns = m.group("uns")
            rest = m.group("rest").strip()
            if uns in {"...", "…", None, ""}:
                # maybe UNS missing and first token of rest is values
                uns_val = None
                rest_tokens = rest.split()
            else:
                uns_val = uns.upper() if uns and uns not in {"...", "…"} else None
                rest_tokens = rest.split()

            # Last token often year
            year = None
            if rest_tokens and re.fullmatch(r"19\d{2}|20\d{2}", rest_tokens[-1]):
                year = int(rest_tokens[-1])
                rest_tokens = rest_tokens[:-1]
            rest_line = " ".join(rest_tokens)
            cells = _split_comp_cells(rest_line, expected=8)
            keys = ["C", "Mn", "P", "S", "Si", "Cr", "Ni", "Mo"]
            comp: dict[str, Any] = {}
            for el, cell in zip(keys, cells):
                val = _parse_cell(cell) if cell else None
                if val is None:
                    continue
                if el in {"P", "S"} and isinstance(val, (int, float)):
                    comp[f"{el}_max"] = {"min": 0.0, "max": float(val)}
                else:
                    comp[el] = val
            entry: dict[str, Any] = {
                "sae_isi_number": sae,
                "chemical_composition_percent": comp,
            }
            if aisi and aisi not in {"...", "…"}:
                entry["aisi_number"] = aisi
            if uns_val:
                entry["uns_number"] = uns_val
            if year:
                entry["obsolescence_year"] = year
            rows.append(entry)
    return _dedupe_by_key(rows, "sae_isi_number")


def parse_obsolete_tool_pages(texts: list[str]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    row_re = re.compile(
        r"^(?P<type>[A-Z]\d+)\s+(?P<rest>.+)$"
    )
    for text in texts:
        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("Table ") or line.startswith("Type "):
                continue
            if re.match(r"^(High-speed|Hot-work|Cold-work|Water)", line, re.I):
                continue
            m = row_re.match(line)
            if not m:
                continue
            typ = m.group("type")
            parts = m.group("rest").split()
            # Type C W Mo Cr V Others...
            keys = ["C", "W", "Mo", "Cr", "V"]
            comp: dict[str, Any] = {}
            for i, el in enumerate(keys):
                if i >= len(parts):
                    break
                val = _parse_cell(parts[i])
                if val is not None:
                    comp[el] = val
            if len(parts) > 5:
                other = " ".join(parts[5:])
                if other and other not in {"...", "…"}:
                    comp["Other"] = other
            rows.append({"type": typ, "chemical_composition_percent": comp})
    return _dedupe_by_key(rows, "type")


def _dedupe_by_key(
    rows: list[dict[str, Any]], key: str, fallback: Optional[str] = None
) -> list[dict[str, Any]]:
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for r in rows:
        k = r.get(key) or (r.get(fallback) if fallback else None)
        if not k:
            out.append(r)
            continue
        if k in seen:
            continue
        seen.add(str(k))
        out.append(r)
    return out


def load_surya_texts(surya_dir: Path, pages: list[int]) -> list[str]:
    texts = []
    for p in pages:
        path = surya_dir / f"page-{p:04d}.txt"
        if not path.is_file():
            raise FileNotFoundError(path)
        texts.append(path.read_text(encoding="utf-8"))
    return texts


def write_raw_table(
    out_path: Path,
    *,
    table_title: str,
    printed_pages: dict[str, int],
    pdf_pages: dict[str, int],
    data: list[dict[str, Any]],
    table_subtitle: str = "",
    notes: Optional[list[str]] = None,
) -> None:
    payload: dict[str, Any] = {
        "source": SOURCE_CITATION,
        "ref": "AsmHandbook2005Vol1",
        "table_title": table_title,
        "printed_pages": printed_pages,
        "pdf_pages": pdf_pages,
        "units": {"composition": "wt%"},
        "notes": notes
        or [
            "OCR via page-ocr (Surya); composition ranges preserved as min/max where printed.",
        ],
        "data": data,
    }
    if table_subtitle:
        payload["table_subtitle"] = table_subtitle
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
