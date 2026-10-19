"""
pubchem.parsers.experimental_properties — Flatten a PUG View Experimental Properties body.

Groups strings under each heading as ``ExperimentalProperty`` with a ``citation`` list
(``text``, parsed ``values`` as number+unit, provisional ``refCode`` stem, ``refPage``).
``register_sources`` assigns catalog ``refNumber`` (1, 2, 3, …) and disambiguates colliding stems
with ``-2``, ``-3``. The references file stores the source (no page — one source, many values/pages).

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import re
from typing import Any, Optional

from pubchem.experimental_value import ExperimentalCitation, ExperimentalProperty, ExperimentalQuantity

_PAGE = re.compile(r"\bpp?\.\s*([0-9A-Za-z]+(?:\s*[-–—]\s*[0-9A-Za-z]+)?)", re.I)
_YEAR = re.compile(r"\b((?:19|20)\d{2})(?:\s*[-–/]\s*(?:19|20)?\d{2})?\b")
_EDITION = re.compile(r"\b(\d+)(?:st|nd|rd|th)\s+Ed(?:ition)?\b", re.I)
_ACRONYM = re.compile(r"\(([A-Z][A-Z0-9]{1,11})\)\s*$")
_STOP = frozenset({
    "a", "an", "and", "at", "available", "by", "chemical", "chemicals", "ed", "eds", "edition",
    "for", "from", "in", "inc", "llc", "of", "on", "or", "p", "pp", "press", "the", "to", "uk",
    "us", "usa", "vol", "vols", "with", "www",
})
_SOURCE_CODES: dict[str, str] = {
    "Hazardous Substances Data Bank (HSDB)": "HSDB",
    "CAMEO Chemicals": "CAMEO",
    "ILO International Chemical Safety Cards (ICSC)": "ICSC",
    "ILO-WHO International Chemical Safety Cards (ICSCs)": "ICSC",
    "NITE-CHRIP": "NITE",
    "Occupational Safety and Health Administration (OSHA)": "OSHA",
    "The National Institute for Occupational Safety and Health (NIOSH)": "NIOSH",
    "EPA DSSTox": "DSSTox",
    "EPA Chemical Data Reporting (CDR)": "EPACDR",
    "Human Metabolome Database (HMDB)": "HMDB",
    "DrugBank": "DrugBank",
    "ChEBI": "ChEBI",
    "Wikipedia": "Wikipedia",
}
# Magnitude + unit pairs inside a printed string (keep every match; do not convert units).
_UNIT = (
    r"°\s*[CF]|deg(?:rees?)?\s*[CF]|K|"
    r"g\s*/\s*cm[³3]|g\s*/\s*m[Ll]|kg\s*/\s*m[³3]|"
    r"mm\s*Hg|mmHg|Torr|Pa|kPa|MPa|atm|bar|%"
)
_NUMBER = r"-?\d{1,3}(?:,\d{3})+(?:\.\d+)?|-?\d+(?:\.\d+)?"
_RANGE_QUANTITY = re.compile(
    rf"(?<![\w.])({_NUMBER})\s*[-–—]\s*({_NUMBER})\s*({_UNIT})\b", re.I,
)
_QUANTITY = re.compile(rf"(?<![\w.])({_NUMBER})\s*({_UNIT})\b", re.I)
_UNIT_NORMALIZE = (
    (re.compile(r"^°\s*C$|^deg(?:rees?)?\s*C$", re.I), "°C"),
    (re.compile(r"^°\s*F$|^deg(?:rees?)?\s*F$", re.I), "°F"),
    (re.compile(r"^K$", re.I), "K"),
    (re.compile(r"^g\s*/\s*cm[³3]$", re.I), "g/cm³"),
    (re.compile(r"^g\s*/\s*m[Ll]$", re.I), "g/mL"),
    (re.compile(r"^kg\s*/\s*m[³3]$", re.I), "kg/m³"),
    (re.compile(r"^mm\s*Hg$|^mmHg$", re.I), "mmHg"),
)

_CITATION_WORKS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"CRC Handbook of Chemistry and Physics", re.I), "CRCHandbook"),
    (re.compile(r"CRC Handbook", re.I), "CRCHandbook"),
    (re.compile(r"Handbook of Chemistry and Physics", re.I), "CRCHandbook"),
    (re.compile(r"Merck Index", re.I), "MerckIndex"),
    (re.compile(r"Kirk-Othmer Encyclopedia", re.I), "KirkOthmer"),
    (re.compile(r"Hawley's Condensed Chemical Dictionary", re.I), "HawleyDict"),
    (re.compile(r"Sax's Dangerous Properties", re.I), "SaxDangerous"),
    (re.compile(r"Patty's Toxicology", re.I), "PattysTox"),
    (re.compile(r"Ashford's Dictionary of Industrial Chemicals", re.I), "AshfordDict"),
    (re.compile(r"Encyclopedia of Occupational Health", re.I), "ILOEncOccupHealth"),
    (re.compile(r"Sigma-Aldrich;\s*Safety Data Sheet", re.I), "SigmaAldrichSDS"),
    (re.compile(r"Registered Substances Dossier|European Chemical Agency|\bECHA\b", re.I), "ECHADossier"),
    (re.compile(r"IARC\.?\s*Monographs", re.I), "IARCMonographs"),
    (re.compile(r"National Toxicology Program", re.I), "NTP"),
    (re.compile(r"GESTIS", re.I), "GESTIS"),
)


def parse_experimental(body: Optional[dict[str, Any]], cid: int) -> tuple[list[ExperimentalProperty], list[dict[str, Any]]]:
    """Properties (heading + citation[]) and provisional source rows (stem ``refCode``, no ``refNumber``)."""
    del cid
    record = (body or {}).get("Record")
    if not record:
        return [], []
    catalog = {ref["ReferenceNumber"]: ref for ref in record.get("Reference", []) if "ReferenceNumber" in ref}
    by_heading: dict[str, list[ExperimentalCitation]] = {}
    sources: dict[str, dict[str, Any]] = {}
    for section in record.get("Section", []):
        _walk(section, None, catalog, by_heading, sources)
    properties = [ExperimentalProperty(heading, tuple(cites)) for heading, cites in by_heading.items()]
    return properties, list(sources.values())


def depositor_ref_code(source_name: Optional[str], source_id: Optional[str] = None) -> Optional[str]:
    """Stem for a PubChem depositor (``HSDB-6341``). Collisions get ``-2`` at register time."""
    if not source_name:
        return None
    base = _SOURCE_CODES.get(source_name)
    if base is None:
        match = _ACRONYM.search(source_name)
        base = match.group(1) if match else _slug_words(source_name, 3)
    if not base:
        return None
    if source_id:
        return f"{base}-{_slug_token(str(source_id))}"
    return base


def citation_ref_code(citation: str) -> str:
    """Stem for a literature source: work + edition/year (no page — page is per value)."""
    parts = [_work_label(citation)]
    edition = _edition(citation)
    year = _year(citation)
    if edition:
        parts.append(f"ed{edition}")
    if year:
        parts.append(year)
    return "-".join(parts)


def page_of(citation: str) -> Optional[str]:
    """Page fragment from a citation (``p. 4-57``); None when absent."""
    match = _PAGE.search(citation)
    return re.sub(r"\s+", "", match.group(1)) if match else None


def strip_page(citation: str) -> str:
    """Citation / source name without the page fragment (for the references catalog)."""
    cleaned = _PAGE.sub("", citation)
    return re.sub(r"[,\s.;]+$", "", cleaned).strip() or citation.strip()


def parse_quantities(text: str) -> list[ExperimentalQuantity]:
    """Pull ``spec`` + ``number`` + ``unit`` out of a printed string; original text is left unchanged.

    ``spec`` is the label/condition before the magnitude (``Triple point``, ``MP``, …).
    """
    hits: list[tuple[int, int, list[tuple[float, str]]]] = []
    covered: list[tuple[int, int]] = []
    for match in _RANGE_QUANTITY.finditer(text):
        unit = _normalize_unit(match.group(3))
        hits.append((match.start(), match.end(), [
            (_parse_number(match.group(1)), unit), (_parse_number(match.group(2)), unit),
        ]))
        covered.append(match.span())
    for match in _QUANTITY.finditer(text):
        if any(start <= match.start() < end for start, end in covered):
            continue
        hits.append((match.start(), match.end(), [
            (_parse_number(match.group(1)), _normalize_unit(match.group(2))),
        ]))
    hits.sort(key=lambda h: h[0])

    found: list[ExperimentalQuantity] = []
    cursor = 0
    for start, end, magnitudes in hits:
        spec = _spec_before(text, cursor, start)
        for number, unit in magnitudes:
            found.append(ExperimentalQuantity(number, unit, spec))
        cursor = end
    return found


def _spec_before(text: str, start: int, quantity_at: int) -> Optional[str]:
    """Label between the previous quantity and this one (strips ``=`` / ``:`` / separators)."""
    chunk = text[start:quantity_at]
    chunk = re.sub(r"^[\s;,/]+", "", chunk)
    chunk = re.sub(r"[\s=:]+$", "", chunk)
    chunk = re.sub(r"\s+", " ", chunk).strip(" .,;")
    return chunk or None


def normalize_source(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def source_key(row: dict[str, Any]) -> str:
    source = row.get("source")
    if isinstance(source, str) and source.strip():
        return "src:" + normalize_source(source)
    return "code:" + str(row.get("refCode") or "")


def _walk(
    section: dict[str, Any], heading: Optional[str], catalog: dict[int, dict[str, Any]],
    by_heading: dict[str, list[ExperimentalCitation]], sources: dict[str, dict[str, Any]],
) -> None:
    heading = section.get("TOCHeading") or heading
    for info in section.get("Information", []):
        pubchem_number = info.get("ReferenceNumber") if isinstance(info.get("ReferenceNumber"), int) else None
        depositor = catalog.get(pubchem_number) if pubchem_number is not None else None
        citations = [c.strip() for c in (info.get("Reference") or []) if isinstance(c, str) and c.strip()]
        entries = _value_entries(info.get("Value") or {})
        if not entries:
            continue
        if citations:
            for citation in citations:
                code = citation_ref_code(citation)
                source_name = strip_page(citation)
                _add_source(sources, {"refCode": code, "source": source_name})
                page = page_of(citation)
                for text, quantities in entries:
                    by_heading.setdefault(heading or "", []).append(
                        ExperimentalCitation(text, quantities, code, None, page, source_name))
        else:
            title = (depositor or {}).get("SourceName")
            code = depositor_ref_code(title, (depositor or {}).get("SourceID"))
            if code and title:
                row: dict[str, Any] = {"refCode": code, "source": title}
                if depositor.get("URL"):
                    row["url"] = depositor["URL"]
                if depositor.get("SourceID"):
                    row["sourceId"] = depositor["SourceID"]
                _add_source(sources, row)
            for text, quantities in entries:
                by_heading.setdefault(heading or "", []).append(
                    ExperimentalCitation(text, quantities, code, None, None, title))
    for child in section.get("Section", []):
        _walk(child, heading, catalog, by_heading, sources)


def _add_source(sources: dict[str, dict[str, Any]], row: dict[str, Any]) -> None:
    key = source_key(row)
    if key and key not in sources:
        sources[key] = {k: v for k, v in row.items() if v is not None}


def _work_label(citation: str) -> str:
    for pattern, label in _CITATION_WORKS:
        if pattern.search(citation):
            return label
    return _slug_words(citation, 4) or "Lit"


def _year(citation: str) -> Optional[str]:
    match = _YEAR.search(citation)
    return match.group(1) if match else None


def _edition(citation: str) -> Optional[str]:
    match = _EDITION.search(citation)
    return match.group(1) if match else None


def _slug_words(text: str, limit: int) -> str:
    words = [w for w in re.findall(r"[A-Za-z][A-Za-z0-9]+", text) if w.lower() not in _STOP]
    return "".join(w[:1].upper() + w[1:] for w in words[:limit])[:48]


def _slug_token(text: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "", text)[:32]


def _value_entries(value: dict[str, Any]) -> list[tuple[str, tuple[ExperimentalQuantity, ...]]]:
    """Original printed strings plus parsed ``(number, unit)`` tuples."""
    found: list[tuple[str, tuple[ExperimentalQuantity, ...]]] = []
    for markup in value.get("StringWithMarkup", []):
        text = markup.get("String")
        if text:
            found.append((text, tuple(parse_quantities(text))))
    if value.get("Number"):
        unit = _normalize_unit(value.get("Unit") or "")
        for number in value["Number"]:
            text = f"{number:g} {unit}".strip()
            quantities = (ExperimentalQuantity(float(number), unit),) if unit else tuple(parse_quantities(text))
            if not quantities and unit:
                quantities = (ExperimentalQuantity(float(number), unit),)
            found.append((text, quantities))
    return found


def _parse_number(text: str) -> float:
    return float(text.replace(",", ""))


def _normalize_unit(unit: str) -> str:
    cleaned = re.sub(r"\s+", " ", unit.strip())
    for pattern, label in _UNIT_NORMALIZE:
        if pattern.match(cleaned):
            return label
    return cleaned


def ref_code(source_name: Optional[str]) -> Optional[str]:
    return depositor_ref_code(source_name)
