"""yaws1999.synonym_index — Appendix E name / synonym list pages.

Layout per line: ``Name (Synonym)  Formula  Name in Tables  CAS Reg. No``.
OCR emits one synonym per line; public rows group by compound
(``cas``, else ``name``+``formula``) into ``{id, synonyms, formula, name, cas}``.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Optional

from yaws1999.cas_index import _clean_index_formula
from yaws1999.row_parser import clean_name

# Standard CAS RN at end of line, or OCR placeholder dashes.
_CAS_END = re.compile(r"(?<!\d)(\d{2,7}-\d{2}-\d)(?!\d)\s*$")
_CAS_MISSING = re.compile(r"-{3,}\s*$")
_FORMULA_CHARSET = re.compile(r"^[A-Za-z][A-Za-z0-9]*$")
_HEADER = re.compile(r"Name\s*\(\s*Synonym\s*\)", re.I)
_PAGE_NUM = re.compile(r"^\d{1,3}$")

# Two-letter elements used when segmenting digit-free formulas (CO, CHN, Zr, …).
# Omit rare symbols (Ac, Am, Es, …) that false-match name words like ACID / ESTER.
_EL2 = frozenset(
    {
        "He",
        "Li",
        "Be",
        "Ne",
        "Na",
        "Mg",
        "Al",
        "Si",
        "Cl",
        "Ar",
        "Ca",
        "Sc",
        "Ti",
        "Cr",
        "Mn",
        "Fe",
        "Co",
        "Ni",
        "Cu",
        "Zn",
        "Ga",
        "Ge",
        "As",
        "Se",
        "Br",
        "Kr",
        "Rb",
        "Sr",
        "Zr",
        "Nb",
        "Mo",
        "Tc",
        "Ru",
        "Rh",
        "Pd",
        "Ag",
        "Cd",
        "In",
        "Sn",
        "Sb",
        "Te",
        "Xe",
        "Cs",
        "Ba",
        "La",
        "Ce",
        "Pr",
        "Nd",
        "Pm",
        "Sm",
        "Eu",
        "Gd",
        "Tb",
        "Dy",
        "Ho",
        "Er",
        "Tm",
        "Yb",
        "Lu",
        "Hf",
        "Ta",
        "Re",
        "Os",
        "Ir",
        "Pt",
        "Au",
        "Hg",
        "Tl",
        "Pb",
        "Bi",
        "Po",
        "At",
        "Rn",
        "Th",
        "Pa",
        "Np",
        "Pu",
    }
)
_EL1 = frozenset("HBCNOFPSKVYIWU")  # + D via deuterium below


@dataclass
class _SynonymLine:
    """One OCR line before compound grouping."""

    synonym: str
    formula: str
    name: str
    cas: str | None
    line: int = 0
    djvu_page: int = 0
    raw: str = ""
    formula_raw: str = ""


@dataclass
class SynonymIndexEntry:
    """One compound row: all synonyms for the same table name / CAS."""

    id: int
    synonyms: list[str]
    formula: str
    name: str
    cas: str | None

    def to_dict(self) -> dict[str, Any]:
        """Public row shape aligned with handbook tables."""
        return {
            "id": self.id,
            "synonyms": list(self.synonyms),
            "formula": self.formula,
            "name": self.name,
            "cas": self.cas,
        }


@dataclass
class SynonymIndexParse:
    """Result of parsing a name / synonym appendix page."""

    entries: list[SynonymIndexEntry] = field(default_factory=list)
    unparsed: list[str] = field(default_factory=list)


def looks_like_synonym_index(
    lines: list[str],
    *,
    min_hits: int = 5,
    min_ratio: float = 0.5,
) -> bool:
    """True when enough lines match synonym · formula · name · CAS layout."""
    candidates = 0
    hits = 0
    has_header = False
    for raw in lines:
        line = raw.strip()
        if not line or _PAGE_NUM.fullmatch(line):
            continue
        if _HEADER.search(line):
            has_header = True
            continue
        if _is_noise_line(line):
            continue
        candidates += 1
        if parse_synonym_index_entry(line, 0, line_no=0, raw=line) is not None:
            hits += 1
    if has_header and hits >= 3:
        return True
    if hits < min_hits:
        return False
    return (hits / candidates) >= min_ratio if candidates else False


def parse_synonym_index_lines(lines: list[str], djvu_page: int) -> SynonymIndexParse:
    """Parse one Appendix E page into compound rows with ``synonyms`` arrays.

    Lines that share the same CAS (or name+formula when CAS is missing) are
    merged; ids are assigned in first-seen compound order.
    """
    out = SynonymIndexParse()
    line_no = 0
    parsed_lines: list[_SynonymLine] = []
    for raw_line in lines:
        line = raw_line.strip()
        if not line or _PAGE_NUM.fullmatch(line):
            continue
        if _HEADER.search(line) or _is_noise_line(line):
            continue
        line_no += 1
        entry = parse_synonym_index_entry(line, djvu_page, line_no=line_no, raw=line)
        if entry is None:
            out.unparsed.append(f"p{djvu_page}: {line}")
            continue
        parsed_lines.append(entry)
    out.entries = group_synonym_lines(parsed_lines)
    return out


def group_synonym_lines(lines: list[_SynonymLine]) -> list[SynonymIndexEntry]:
    """Merge OCR lines for the same compound into ``synonyms`` arrays."""
    return group_synonym_rows(
        [
            {
                "synonym": line.synonym,
                "formula": line.formula,
                "name": line.name,
                "cas": line.cas,
            }
            for line in lines
        ]
    )


def group_synonym_rows(rows: list[dict[str, Any]]) -> list[SynonymIndexEntry]:
    """Group row dicts (``synonym`` or ``synonyms``) by compound identity."""
    order: list[tuple[Any, ...]] = []
    groups: dict[tuple[Any, ...], dict[str, Any]] = {}
    for row in rows:
        name = row.get("name")
        formula = row.get("formula")
        cas = row.get("cas")
        key = ("cas", cas) if cas else ("nf", name, formula)
        syns: list[str] = []
        if isinstance(row.get("synonyms"), list):
            syns.extend(str(s) for s in row["synonyms"] if s)
        elif row.get("synonym"):
            syns.append(str(row["synonym"]))
        if key not in groups:
            order.append(key)
            groups[key] = {
                "synonyms": [],
                "formula": formula,
                "name": name,
                "cas": cas,
            }
        bucket = groups[key]["synonyms"]
        for syn in syns:
            if syn not in bucket:
                bucket.append(syn)
        # Prefer non-empty name/formula/cas if a later line fills them.
        if name and not groups[key]["name"]:
            groups[key]["name"] = name
        if formula and not groups[key]["formula"]:
            groups[key]["formula"] = formula
        if cas and not groups[key]["cas"]:
            groups[key]["cas"] = cas

    entries: list[SynonymIndexEntry] = []
    for i, key in enumerate(order, start=1):
        g = groups[key]
        entries.append(
            SynonymIndexEntry(
                id=i,
                synonyms=list(g["synonyms"]),
                formula=str(g["formula"] or ""),
                name=str(g["name"] or ""),
                cas=g["cas"],
            )
        )
    return entries


def parse_synonym_index_entry(
    text: str,
    djvu_page: int,
    *,
    line_no: int,
    raw: str,
) -> Optional[_SynonymLine]:
    """Parse ``synonym formula name cas`` from one OCR line."""
    cleaned = re.sub(r"\s+", " ", text).strip(" |")
    cas: str | None
    cas_match = _CAS_END.search(cleaned)
    if cas_match is not None:
        cas = cas_match.group(1)
        body = cleaned[: cas_match.start()].strip()
    elif _CAS_MISSING.search(cleaned):
        cas = None
        body = _CAS_MISSING.sub("", cleaned).strip()
    else:
        return None
    tokens = body.split()
    if len(tokens) < 3:
        return None
    formula_i = None
    for i, token in enumerate(tokens):
        if i < 1 or i + 1 >= len(tokens):
            continue
        if not _is_formula_token(token):
            continue
        formula_i = i
        break
    if formula_i is None:
        return None
    synonym = clean_name(" ".join(tokens[:formula_i]))
    formula_raw = tokens[formula_i]
    name = clean_name(" ".join(tokens[formula_i + 1 :]))
    if not synonym or not name:
        return None
    return _SynonymLine(
        synonym=synonym,
        formula=_clean_index_formula(formula_raw, name),
        formula_raw=formula_raw,
        name=name,
        cas=cas,
        line=line_no,
        djvu_page=djvu_page,
        raw=raw,
    )


def _is_formula_token(token: str) -> bool:
    """True for chemical-formula tokens, not name words like ACID / ETHYL."""
    if not _FORMULA_CHARSET.fullmatch(token):
        return False
    if any(ch.isdigit() for ch in token):
        return True
    return _segments_as_formula(token)


def _segments_as_formula(token: str) -> bool:
    """Greedy element-symbol segmentation (allows digit-free CO / CHN / Zr)."""
    i = 0
    n = len(token)
    parts = 0
    while i < n:
        ch = token[i]
        if ch.isdigit():
            if parts == 0:
                return False
            while i < n and token[i].isdigit():
                i += 1
            continue
        if not ch.isalpha():
            return False
        matched = False
        if i + 1 < n and token[i + 1].isalpha() and not token[i + 1].isdigit():
            two = token[i].upper() + token[i + 1].lower()
            if two in _EL2:
                i += 2
                parts += 1
                matched = True
        if not matched:
            one = token[i].upper()
            if one in _EL1 or one == "D":
                i += 1
                parts += 1
                matched = True
        if not matched:
            return False
    return parts >= 1


def _is_noise_line(line: str) -> bool:
    upper = line.upper()
    if upper.startswith("APPENDIX"):
        return True
    if "COMPILATION FOR" in upper:
        return True
    if upper.startswith("ORGANICS ") or upper.startswith("INORGANICS "):
        return True
    if upper == "ORGANICS" or upper == "INORGANICS":
        return True
    return False
