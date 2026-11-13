"""yaws1999.cas_index — Two-column CAS registry index pages.

Appendix pages list ``CAS  NAME  FORMULA`` in two side-by-side columns, so one
OCR line holds two entries. This module splits them and returns entries in
column-major order (full left column, then full right) to match CAS sort order.
Public rows match handbook tables: ``{id, cas, name, formula}``.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Optional

from yaws1999.row_parser import clean_formula, clean_name

# Standard CAS RN: 2–7 digits, 2 digits, 1 check digit.
_CAS = re.compile(r"(?<!\d)(\d{2,7}-\d{2}-\d)(?!\d)")
_FORMULA_TOKEN = re.compile(r"^[A-Za-z][A-Za-z0-9]*$")


@dataclass
class CasIndexEntry:
    """One compound from a CAS index page."""

    id: int
    cas: str
    name: str
    formula: str
    column: int = 0  # internal: 0 = left, 1 = right
    line: int = 0  # internal OCR line among kept lines
    djvu_page: int = 0
    raw: str = ""
    formula_raw: str = ""

    def to_dict(self) -> dict[str, Any]:
        """Public row shape aligned with handbook tables."""
        return {
            "id": self.id,
            "cas": self.cas,
            "name": self.name,
            "formula": self.formula,
        }


@dataclass
class CasIndexParse:
    """Result of parsing a two-column CAS index page."""

    entries: list[CasIndexEntry] = field(default_factory=list)
    unparsed: list[str] = field(default_factory=list)
    dual_lines: int = 0
    single_lines: int = 0


def looks_like_cas_index(lines: list[str], *, min_hits: int = 5, min_ratio: float = 0.5) -> bool:
    """True when enough non-empty lines start with / contain a CAS RN pair layout."""
    candidates = 0
    hits = 0
    for raw in lines:
        line = raw.strip()
        if not line or re.fullmatch(r"\d{1,3}", line):
            continue
        candidates += 1
        if _is_cas_index_line(line):
            hits += 1
    if hits < min_hits:
        return False
    return (hits / candidates) >= min_ratio if candidates else False


def parse_cas_index_lines(lines: list[str], djvu_page: int) -> CasIndexParse:
    """Split two-column CAS index OCR lines into structured entries.

    IDs are assigned left column top→bottom, then right column (column-major).
    """
    out = CasIndexParse()
    left: list[CasIndexEntry] = []
    right: list[CasIndexEntry] = []
    line_no = 0
    for raw_line in lines:
        line = raw_line.strip()
        if not line or re.fullmatch(r"\d{1,3}", line):
            continue
        line_no += 1
        parts = split_cas_index_line(line)
        if not parts:
            out.unparsed.append(f"p{djvu_page}: {line}")
            continue
        if len(parts) == 2:
            out.dual_lines += 1
        else:
            out.single_lines += 1
        for col, chunk in enumerate(parts):
            entry = parse_cas_index_entry(chunk, djvu_page, column=col, line=line_no, raw=line)
            if entry is None:
                out.unparsed.append(f"p{djvu_page}:col{col}: {chunk}")
                continue
            (left if col == 0 else right).append(entry)
    ordered = left + right
    for i, entry in enumerate(ordered, start=1):
        entry.id = i
    out.entries = ordered
    return out


def split_cas_index_line(line: str) -> list[str]:
    """Return 1–2 CAS-entry chunks from one OCR line (left, optional right)."""
    matches = list(_CAS.finditer(line))
    if not matches:
        return []
    if len(matches) == 1:
        return [line.strip()]
    # Two (or more) CAS tokens: first → left column, second → right; ignore extras.
    left = line[: matches[1].start()].strip()
    right = line[matches[1].start() :].strip()
    out = []
    if left:
        out.append(left)
    if right:
        out.append(right)
    return out


def parse_cas_index_entry(
    text: str,
    djvu_page: int,
    *,
    column: int,
    line: int,
    raw: str,
) -> Optional[CasIndexEntry]:
    """Parse ``CAS NAME FORMULA`` from one column chunk."""
    cleaned = re.sub(r"\s+", " ", text).strip(" |")
    match = _CAS.match(cleaned)
    if match is None:
        return None
    cas = match.group(1)
    rest = cleaned[match.end() :].strip()
    if not rest:
        return None
    tokens = rest.split()
    if len(tokens) < 2:
        return None
    formula_raw = tokens[-1]
    if not _FORMULA_TOKEN.fullmatch(formula_raw):
        return None
    name = clean_name(" ".join(tokens[:-1]))
    if not name:
        return None
    return CasIndexEntry(
        id=0,
        cas=cas,
        name=name,
        formula=_clean_index_formula(formula_raw, name),
        formula_raw=formula_raw,
        column=column,
        line=line,
        djvu_page=djvu_page,
        raw=raw,
    )


def _clean_index_formula(formula_raw: str, name: str) -> str:
    """Formula OCR cleanup for index pages (0→O even when the name is only ACID/…)."""
    out = clean_formula(formula_raw, name)
    # Property-table oxygen gate is oxide-oriented; index names say ACID/ALCOHOL/…
    # letter+0 (S02, Cl0) — do not use "digit+0 before element" (breaks C10H…).
    out = re.sub(r"(?<=[A-Za-z])0(?=\d|$|[A-Z])", "O", out)
    out = re.sub(r"(?<=\d)0$", "O", out)  # H160 → H16O, Cl20 → Cl2O
    # H1406 → H14O6, H602 → H6O2 (fixed-width lookbehinds only).
    out = re.sub(r"(?<=H\d)0(?=\d)", "O", out)
    out = re.sub(r"(?<=H\d\d)0(?=\d)", "O", out)
    return out


def _is_cas_index_line(line: str) -> bool:
    matches = list(_CAS.finditer(line))
    if not matches:
        return False
    # Dual-column: two CAS RNs. Single-column leftover: one CAS at start + formula token.
    if len(matches) >= 2:
        return True
    return parse_cas_index_entry(line, 0, column=0, line=0, raw=line) is not None
