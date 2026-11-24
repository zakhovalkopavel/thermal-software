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
_EDITION = re.compile(r"\b(\d+)\s*(?:st|nd|rd|th)?\s+Ed(?:ition)?\b", re.I)
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


_ASOF = re.compile(r",?\s*;?\s*available\b(?:,|\s+from|\s+as of).*$", re.I)
_POSTING = re.compile(r"\s*\.?\s*(?:online |on-line )?posting date:.*$", re.I)
_COVERAGE = re.compile(r"\(\s*(?:19|20)\d{2}\s*[-–]\s*\d{2,5}\s*\)")
_LONE_YEAR = re.compile(r"\(\s*(?:19|20)\d{2}\s*\)")
_PUB_NO = re.compile(r"Publication No\.\s*(\d{2,4}-\d+)", re.I)
_PRODUCT = re.compile(r"Product Number:?\s*([A-Za-z0-9-]+)", re.I)
_NIST_RELEASE = re.compile(
    r"\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|"
    r"Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+((?:19|20)\d{2})\b",
    re.I,
)
_ONLINE_WORKS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"Kirk-Othmer Encyclopedia of Chemical Technology", re.I),
     "Kirk-Othmer Encyclopedia of Chemical Technology"),
    (re.compile(r"Ullmann's Encyclopedia of Industrial Chemistry", re.I),
     "Ullmann's Encyclopedia of Industrial Chemistry"),
    (re.compile(r"Patty's Toxicology", re.I), "Patty's Toxicology"),
)
_EDITION_WORD = re.compile(r"\b(\d+)(st|nd|rd|th)\s+edition\b", re.I)
# "689 (1995)" is a page and the page's year. "Volume 3 (1980)" is the volume, so it stays.
_PAGE_THEN_YEAR = re.compile(r",\s*(\d{1,5}(?:\s*[-–]\s*\d{1,5})?)\s*\((?:19|20)\d{2}\)\s*$")
_TRAILING_LOCATORS: tuple[tuple[re.Pattern[str], int], ...] = (
    (re.compile(r"\bp\.?\s+(\d+\s*[-–]\s*\d+)\s*(?:\((?:19|20)\d{2}\))?\s*$", re.I), 1),
    (re.compile(r",?\s*p\.?\s*@\s*(\d+\s*K)\s*$", re.I), 1),
    (re.compile(r",?\s*\(\d{2,4}\)\s*(\d{1,5})\s*$"), 1),
    (re.compile(r",?\s*/\s*(\d{1,5}(?:\s*[-–]\s*\d{1,5})?)\s*$"), 1),
    (re.compile(r",\s*-(\d{1,5})\s*$"), 1),
    (re.compile(r",\s*([A-Z]{1,4}:\s*\d+)\s*$"), 1),
    (re.compile(r",\s*\.(\d{1,4})\s*$"), 1),
    (re.compile(r"\.,\s*([A-Z]{2,4})\s*$"), 1),
)
_ORDINAL_WORDS = (
    ("first", "1st"), ("second", "2nd"), ("third", "3rd"), ("fourth", "4th"), ("fifth", "5th"),
    ("sixth", "6th"), ("seventh", "7th"), ("eighth", "8th"), ("ninth", "9th"), ("tenth", "10th"),
)
_KEY_DROP = frozenset({"of", "inc", "llc", "ltd"})
_BARE_PAGE = re.compile(r"\s+(\d{1,5})\s*$")
_MID_PAGE = re.compile(r"\bp\.?\s*(\d+-\d+)\s+(?=DOE-STD-)", re.I)
_JOURNAL_YEAR = re.compile(r"\s*\((?:19|20)\d{2}\)\s*$")
_JOURNAL_ISSUE = re.compile(r"(\d+)\s*\(\d+\)\s*:")
_JOURNAL_SPAN = re.compile(r"(\d+)\s*-\s*(\d+)")


_KIRK = "Kirk-Othmer Encyclopedia of Chemical Technology."
_ULLMANN_7 = "Ullmann's Encyclopedia of Industrial Chemistry. 7th ed."


def canonicalize_source(text: str) -> tuple[str, Optional[str]]:
    """Catalog source and the locator (page or product number) that belongs on the value.

    Page tails, access dates, and the chemical looked up in a database are not part of the source.
    Kirk-Othmer is one source. Ullmann's 7th edition is one source. Perry's handbook is the edition.
    Perrin (organic bases), the Merck Index, Atkinson monographs, Ambrose, and the Daubert
    Taylor and Francis compilation are the year. Burdock's Fenaroli is the edition.
    Yaws vapor pressure is the volume. A database URL is the site root.
    The work is the text before ``as cited in``. A leading ``SRC;`` is the depositor, not the work.
    """
    cited = re.search(r"\s+as cited in\b", text, re.I)
    if cited:
        text = text[:cited.start()].strip(" ,.;")
    text = re.sub(r"^(?:SRC;\s*)+", "", text, flags=re.I)
    doi = re.match(r"\s*DOI:\s*(\S+)", text, re.I)
    if doi:
        return f"DOI:{doi.group(1)}", None
    collected = _collected_source(text)
    if collected is not None:
        return collected
    family = _database_source(text)
    if family is not None:
        return family
    article = _online_article(text)
    if article is not None:
        return article, None
    return _strip_literature(text)


def _collected_source(text: str) -> Optional[tuple[str, Optional[str]]]:
    """Works that are one catalog row no matter which article or page was cited."""
    lowered = text.lower()
    if "kirk-othmer" in lowered or "kirk othmer" in lowered:
        return _KIRK, _strip_literature(text)[1]
    if "ullmann" in lowered and "5th" in lowered:
        return "Ullmann's Encyclopedia of Industrial Chemistry. 5th ed.", _page_tail(text)
    if "ullmann" in lowered and "vol a" not in lowered:
        return _ULLMANN_7, _strip_literature(text)[1]
    if "perry" in lowered and "chemical" in lowered and "handbook" in lowered and "inorganic" not in lowered:
        edition = _edition(text)
        if edition:
            number = int(edition)
            suffix = "th" if number % 100 in {11, 12, 13} else {1: "st", 2: "nd", 3: "rd"}.get(number % 10, "th")
            return f"Perry's Chemical Handbook. {number}{suffix} ed.", _strip_literature(text)[1]
    if re.search(r"\b(?:serjeant|sargeant|sergeant)\b", lowered) and "dempsey" in lowered and "1979" in lowered:
        return ("Serjeant EP, Dempsey B. Ionisation Constants of Organic Acids in Aqueous Solution. 1979", None)
    folded = re.sub(r"[^a-z0-9]+", " ", lowered).strip()
    if folded in {"human metabolome database", "human metabolome database hmdb", "hmdb"}:
        return "Human Metabolome Database (HMDB)", None
    if "amoore" in lowered and "hautala" in lowered:
        return "Amoore JE, Hautala E; J Appl Toxicol 3 (1983)", None
    if "aquasol" in lowered and "handbook of aqueous" not in lowered and re.search(
            r"\b(?:5th|fifth|ver(?:sion)?\.?\s*5)\b", lowered):
        return "Yalkowsky SH, Dannenfelser RM; Aquasol Database of Aqueous Solubility. 5th ed. 1992", None
    patty = _patty_toxicology(text, lowered)
    if patty is not None:
        return patty
    if "ruth" in lowered and "ind hyg" in lowered and "1986" in lowered:
        return "Ruth JH; Am Ind Hyg Assoc J 47 (1986)", "A142-151"
    named = _named_work(text, lowered)
    if named is not None:
        return named
    return None


# Journal volumes stored without a year. J. Chem. Thermodyn. vol. 7 is 1975 and vol. 8 is 1976.
_AMBROSE_VOLUME_YEAR = {"7": "1975", "8": "1976"}


def _named_work(text: str, lowered: str) -> Optional[tuple[str, Optional[str]]]:
    """One row per year, edition, or volume. Publisher spelling is not a different source."""
    if "perrin" in lowered and "dissociation" in lowered and "organic bases" in lowered:
        year = _year(text)
        if year:
            page = re.search(r"\bp\.?\s+(\d{1,5})\b", text, re.I)
            number = re.search(r"\bNo\.?\s*(\d+)\b", text)
            locator = page.group(1) if page else number.group(1) if number else None
            return f"Perrin DD; Dissociation Constants of Organic Bases in Aqueous Solution ({year})", locator
    if "merck index" in lowered:
        year = _year(text)
        if year:
            return (f"The Merck Index - An Encyclopedia of Chemicals, Drugs, and Biologicals. {year}",
                    page_of(text))
    if "atkinson" in lowered and (
            "phys chem ref" in lowered or "physical and chemical reference" in lowered
            or "monograph" in lowered or "mongraph" in lowered):
        # "No 1 (1989)" is Monograph 1. A line with the year and no journal volume is the same monograph.
        # "J Phys Chem Ref Data 21" is the journal, and stays separate.
        journal_volume = re.search(r"(?:ref|reference) data(?:\.)?\s+(\d+)\b", lowered)
        if journal_volume is None and (
                "monograph" in lowered or "mongraph" in lowered or re.search(r"\bno\.?\s+\d+\b", lowered) or _year(text)):
            year = _year(text)
            if year:
                return f"Atkinson R; J Phys Chem Ref Data. Monograph ({year})", None
    if "atkinson" in lowered and "atmos chem phys" in lowered:
        volume = re.search(r"atmos chem phys\s+(\d+)", lowered)
        pages = re.search(r":\s*(\d{1,5}(?:\s*[-–]\s*\d{1,5})?)", text)
        if volume:
            locator = re.sub(r"\s+", "", pages.group(1)) if pages else None
            return f"Atkinson R et al; Atmos Chem Phys {volume.group(1)}", locator
    if "betterton" in lowered and "gaseous pollutants" in lowered:
        year = _year(text)
        if year:
            return f"Betterton EA; Gaseous Pollutants: Characterization and Cycling ({year})", None
    if "burdock" in lowered and "fenaroli" in lowered:
        edition = _edition(text)
        if edition:
            number = int(edition)
            suffix = "th" if number % 100 in {11, 12, 13} else {1: "st", 2: "nd", 3: "rd"}.get(number % 10, "th")
            return f"Burdock GA, ed; Fenaroli's Handbook of Flavor Ingredients. {number}{suffix} ed.", None
    if "yaws" in lowered and re.search(r"handbook\s+(?:of|og)\s+vapor pressure", lowered):
        volume = re.search(r"\bvol(?:ume)?\.?\s*(\d+)\b|\bv(\d+)\b", text, re.I)
        number = (volume.group(1) or volume.group(2)) if volume else None
        return "Yaws CL; Handbook of Vapor Pressure.", number
    if "foodb.ca/compounds" in lowered:
        compound = re.search(r"/compounds/([^/\s]+)", text, re.I)
        return "http://foodb.ca/compounds", compound.group(1) if compound else None
    if "ambrose" in lowered and re.search(r"j chem therm", lowered):
        year = _year(text)
        volume = re.search(r"j chem therm(?:odyn)?\s+(\d+)", lowered)
        if year is None and volume:
            year = _AMBROSE_VOLUME_YEAR.get(volume.group(1))
        if year:
            return f"Ambrose D et al; J Chem Thermodyn ({year})", None
    if ("daubert" in lowered and "greyden" not in lowered and (
            "pure chemicals" in lowered or "pure compounds" in lowered or "pure cmpds" in lowered
            or "data complilation" in lowered or "data compilation" in lowered)):
        year = _year(text)
        if year:
            return ("Daubert TE, Danner RP; Physical and Thermodynamic Properties of Pure Chemicals "
                    f"Data Compilation ({year})", None)
    if "e-pesticide manual" in lowered and "15th" in lowered and "5.1" in lowered:
        chemical = re.search(r"Council\.\s*(.+?)\s*\(([0-9]{2,7}-[0-9]{2}-[0-9])\)", text)
        locator = f"{chemical.group(1).strip()} ({chemical.group(2)})" if chemical else None
        return ("MacBean C, ed; e-Pesticide Manual. 15th ed., ver. 5.1, Alton, UK; "
                "British Crop Protection Council.", locator)
    manual = _epesticide_manual(text, lowered)
    if manual is not None:
        return manual
    if "national library of medicine" in lowered and "hsdb" in lowered:
        return "National Library of Medicine HSDB Database", None
    if re.search(r"zwolin\w+", lowered) and "wilhoit" in lowered and "vapor" in lowered:
        return ("Zwolinski BJ, Wilhoit RC; Handbook of Vapor Pressures and Heats of Formation "
                "of Hydrocarbons and Related Compounds (1971)", None)
    if "fenaroli" in lowered and "burdock" not in lowered:
        volume = re.search(r"\bvolume\s+(\d+)\b", lowered)
        if volume:
            return "Fenaroli's Handbook of Flavor Ingredients.", volume.group(1)
    if lowered.startswith("yaws") and re.search(r"\bchem eng", lowered):
        printed = _year(text)
        volume = re.search(r"\bchem eng(?:in|n)?;?\s*(\d+)\b", lowered)
        pages = re.search(r":\s*(\d{1,5}(?:\s*[-–]\s*\d{1,5})?)\s*(?:\(\d{4}\))?\s*$", text)
        # The stored rows lost "(1990)" and "(1999)" when the page range was cut off.
        year = printed or {"97": "1990", "106": "1999"}.get(volume.group(1) if volume else "")
        if volume and year:
            locator = re.sub(r"\s+", "", pages.group(1)) if pages else None
            return f"Yaws CL et al; Chem Eng {volume.group(1)} ({year})", locator
    same = _same_work(text, lowered)
    if same is not None:
        return same
    site = _site_root(text)
    if site is not None:
        return site
    return None


_DATE_SLASH = re.compile(r"\d{1,2}/\d{1,2}/(?:19|20)\d{2}\s*$")
_PAGE_TOKEN = (
    r"((?:V\d+|VA\d+|[0-9A-Za-z]+(?:[./][0-9A-Za-z]+)*)(?:\s*[-–]\s*[0-9A-Za-z]+)*)"
)
_PAGE_TAIL = re.compile(
    r",?\s*\bpp?(?:\.|\s)\s*" + _PAGE_TOKEN + r"-?(?:\(\d{2}\))?(?:\s+(\d{2,5}))?"
    r"\s*(?:\(\s*((?:19|20)\d{2})\s*\))?\s*$",
    re.I,
)


def _is_slash_date(text: str, pattern: re.Pattern[str]) -> bool:
    """A revision date (``06/20/2008``) is not a page."""
    return "/" in pattern.pattern and _DATE_SLASH.search(text) is not None


def _page_tail(text: str) -> Optional[str]:
    """Page at the end of a citation, including ``p. VA16 (1990)`` and ``p. 3-327C-326``."""
    matches = list(re.finditer(r"\bpp?(?:\.|\s)\s*" + _PAGE_TOKEN, text, re.I))
    if not matches:
        return None
    return re.sub(r"\s+", "", matches[-1].group(1))


def _catalog_span(text: str) -> Optional[str]:
    """Catalog years ``2000-2001``. A doubled digit (``2000-20001``) and a shifted span fold in."""
    span = re.search(r"\b((?:19|20)\d{2})\s*[-–]\s*(\d{2,5})\b", text)
    paren = re.search(r"\(((?:19|20)\d{2})\)\s*$", text.strip().rstrip("."))
    if span:
        start = span.group(1)
        end_raw = span.group(2)
        if len(end_raw) == 4 and end_raw[:2] in {"19", "20"}:
            end = end_raw
        elif len(end_raw) == 2:
            end = start[:2] + end_raw
        else:
            end = start[:2] + end_raw[-2:]
        if (paren and start != paren.group(1)
                and end.endswith(str((int(paren.group(1)) + 1) % 100).zfill(2))):
            start = paren.group(1)
        return f"{start}-{end}"
    if paren:
        return paren.group(1)
    return _year(text)


def _same_work(text: str, lowered: str) -> Optional[tuple[str, Optional[str]]]:
    """One row for one edition or one year. A page or a spelling difference is not a new source."""
    page = _page_tail(text)
    if "aldrich" in lowered and "fine chem" in lowered:
        span = _catalog_span(text)
        if span:
            return f"Aldrich; Handbook of Fine Chemicals. {span}", page
    if "glycol ethers handbook" in lowered:
        year = _year(text)
        if year:
            return f"Dow Chemical; The Glycol Ethers Handbook ({year})", page
    if "compilation of odor and taste threshold" in lowered:
        year = _year(text)
        if year:
            return f"ASTM; Compilation of Odor and Taste Threshold Values Data ({year})", page
    if "bioaccumulation" in lowered and "cscl" in lowered:
        return ("Chemicals Inspection and Testing Institute; Biodegradation and Bioaccumulation "
                "Data of Existing Chemicals Based on the CSCL Japan (1992)", page)
    if "vapor pressure distribution of selected organic chemicals" in lowered:
        return ("Weber RC et al; Vapor Pressure Distribution of Selected Organic Chemicals. "
                "EPA-600/2-81-021 (1981)", page)
    if "matheson gas data book" in lowered and re.search(r"\b6th\b", lowered):
        return "Braker W, Mossman A; Matheson Gas Data Book. 6th ed. (1980)", page
    if "food chemicals codex" in lowered and re.search(r"\b5th\b", lowered):
        return "Food Chemicals Codex. 5th ed.", page
    if "encyclop" in lowered and "occupational health" in lowered and re.search(r"\b4th\b", lowered):
        return ("International Labour Office. Encyclopaedia of Occupational Health and Safety. "
                "4th ed. 1998", page)
    if "emergency handling" in lowered and "surface trans" in lowered:
        year = _year(text)
        label = "Bureau of Explosives; Emergency Handling of Hazardous Materials in Surface Transportation"
        if year:
            label = f"{label} ({year})"
        return label, page
    if "agrochemicals handbook" in lowered and re.search(r"\b2nd\b", lowered):
        return "Hartley D, Kidd H. The Agrochemicals Handbook. 2nd ed. 1987", page
    if "seidell" in lowered and "solubilities of organic compounds" in lowered:
        return "Seidell A; Solubilities of Organic Compounds (1941)", page
    if "ohe" in lowered and "computer aided" in lowered and "vapor pressure" in lowered:
        return "Ohe S; Computer Aided Data Book of Vapor Pressure (1976)", page
    if "horvath" in lowered and "halogenated hydrocarbon" in lowered:
        year = _year(text) or "1982"
        return f"Horvath AL; Halogenated Hydrocarbons: Solubility-Miscibility with Water ({year})", page
    if "jordan" in lowered and "vapor pressure" in lowered and "organic compounds" in lowered:
        return "Jordan TE; Vapor Pressure of Organic Compounds (1954)", page
    if "phenoxyalkanoic herbicides" in lowered:
        return "Que Hee SS, Sutherland RG; The Phenoxyalkanoic Herbicides (1981)", page
    if "ellison" in lowered and "chemical and biological warfare" in lowered:
        return "Ellison DH; Handbook of Chemical and Biological Warfare Agents (2000)", page
    if "hann" in lowered and "jensen" in lowered and "hazardous materials" in lowered:
        return "Hann RW Jr, Jensen PA; Water Quality Characteristics of Hazardous Materials (1977)", page
    if ("kwok" in lowered or "kowk" in lowered) and "atkinson" in lowered and "hydroxyl radical" in lowered:
        return ("Kwok ESC, Atkinson R; Estimation of Hydroxyl Radical Reaction Rate Constants "
                "for Gas-Phase Organic Compounds (1994)", None)
    if "hansch" in lowered and "leo" in lowered and "medchem" in lowered:
        issue = re.search(r"issue\s+(?:no\.?\s*)?#?\s*(\d+)", lowered)
        year = _year(text)
        if issue and year:
            return f"Hansch C, Leo AJ; Medchem Project Issue No. {issue.group(1)} ({year})", None
    if (re.search(r"\b(?:dutz|deitz|dietz|deltz)\b", lowered) and re.search(r"\b(?:traud|travd)\b", lowered)
            and "1978" in lowered and "wasser" in lowered):
        return "Dietz F, Traud J; Gwf-Wasser/Abwasser 199: 318 (1978)", None
    if "ambient water quality criteria" in lowered:
        document = re.search(r"440/5-80-(\d+)", text)
        if document:
            return f"USEPA; Ambient Water Quality Criteria (1980). EPA 440/5-80-{document.group(1)}", page
    report = _report(text, lowered)
    if report is not None:
        return report
    book = _same_book(text, lowered)
    if book is not None:
        return book
    journal = _journal_article(text, lowered)
    if journal is not None:
        return journal
    return None


def _ordinal(number: int) -> str:
    suffix = "th" if number % 100 in {11, 12, 13} else {1: "st", 2: "nd", 3: "rd"}.get(number % 10, "th")
    return f"{number}{suffix}"


def _report(text: str, lowered: str) -> Optional[tuple[str, Optional[str]]]:
    """One EPA or NTIS report number. The page and the chemical name are locators. The year stays."""
    if re.search(r"EPA[-/\s]*450/3-85-007|EPA[-/\s]*600/3-89/063", text, re.I) or (
            "dixon" in lowered and "rissman" in lowered):
        return ("Dixon D, Rissmann E; Physical-chemical properties and categorization of RCRA "
                "wastes according to volatility (1985)", _page_tail(text))
    jprs = re.search(r"\bJPRS\s+(\d+)\b", text, re.I)
    if jprs:
        year = _year(text)
        label = f"Aleksandrov VN; Toxic Agents. NTIS JPRS {jprs.group(1)}"
        if year:
            label += f" ({year})"
        return label, _page_tail(text)
    if re.search(r"\b(?:environ sci|j chem|j phys|chemosphere|atmos)\b", lowered):
        return None
    match = re.search(
        r"\b((?:US\s*)?EPA|PB)\s*[-/]?\s*(\d{2,4}(?:[\s/-]+[A-Z0-9]+){1,4})",
        text,
        re.I,
    )
    if match is None:
        return None
    number = re.sub(r"\s+", "-", match.group(0)).upper().replace("USEPA", "EPA")
    number = re.sub(r"^PB-", "PB", number)
    year = _year(text)
    label = f"USEPA; {number}"
    if year:
        label += f" ({year})"
    return label, _page_tail(text)


def _same_book(text: str, lowered: str) -> Optional[tuple[str, Optional[str]]]:
    """One edition or one year of a book. Publisher city and a dropped initial are not a new source."""
    page = _page_tail(text)
    year = _year(text)
    if re.search(r"estimation programs?\s+interface", lowered) and re.search(r"\bepi\b", lowered):
        version = re.search(r"\bver(?:sion)?\.?\s*(\d+\.\d+)", lowered)
        if version:
            module = re.search(r"\b(pchydro)\b", lowered)
            return (f"US EPA; Estimation Program Interface (EPI) Suite. Ver. {version.group(1)}",
                    module.group(1).upper() if module else None)
    if "lange" in lowered and "handbook" in lowered and re.search(r"\bchem", lowered):
        edition = _edition(text)
        if edition:
            return f"Dean JA; Lange's Handbook of Chemistry. {_ordinal(int(edition))} ed.", page
    if re.search(r"boubli[ck]", lowered) and "pure substances" in lowered:
        volume = re.search(r"\bvol(?:ume)?\.?\s*(\d+)\b", lowered)
        label = "Boublik T et al; The Vapor Pressures of Pure Substances"
        if year:
            label += f" ({year})"
        return label, volume.group(1) if volume else page
    if "compton" in lowered and "military chemical and biological agents" in lowered:
        return f"Compton JAF; Military Chemical and Biological Agents ({year or '1987'})", page
    if "clinical toxicology of commercial products" in lowered:
        edition = _edition(text)
        if edition and year:
            return (f"Gosselin RE et al; Clinical Toxicology of Commercial Products. "
                    f"{_ordinal(int(edition))} ed. ({year})", page)
    if "patty" in lowered and "industrial hygiene" in lowered:
        edition = _edition(text)
        if edition:
            return f"Patty's Industrial Hygiene and Toxicology. {_ordinal(int(edition))} ed.", page
    if "ds 4b" in lowered and "physical constants" in lowered:
        return "ASTM; Physical Constants of Hydrocarbon and Non-Hydrocarbon Compounds. 2nd ed. DS 4B", page
    if re.search(r"log\s*kow", lowered) and "sangster" in lowered:
        if year:
            return f"Sangster J; LOGKOW Databank ({year})", page
    if "sigma-aldrich handbook of stains" in lowered:
        if year:
            return f"Green FJ; The Sigma-Aldrich Handbook of Stains, Dyes and Indicators ({year})", page
    if "langford" in lowered and "weapons of mass destruction" in lowered:
        if year:
            return f"Langford RE; Introduction to Weapons of Mass Destruction ({year})", page
    if "handbook of pharmaceutical excipients" in lowered:
        edition = _edition(text)
        if edition and year:
            return (f"Rowe RC, Sheskey PJ, Quinn ME; Handbook of Pharmaceutical Excipients. "
                    f"{_ordinal(int(edition))} ed. ({year})", page)
    if "emergency care for hazardous materials exposure" in lowered:
        edition = _edition(text)
        if edition and year:
            return (f"Bronstein AC, Currance PL; Emergency Care for Hazardous Materials Exposure. "
                    f"{_ordinal(int(edition))} ed. ({year})", page)
    if "kaufman" in lowered and "mode of action" in lowered and "herbicides" in lowered:
        edition = _edition(text)
        if edition and year:
            return (f"Kearney PC, Kaufman DD; Herbicides: Chemistry, Degradation and Mode of Action. "
                    f"{_ordinal(int(edition))} ed. ({year})", page)
    if "yalkowsky" in lowered and ("aqueous solubility" in lowered or "aquasol" in lowered):
        if year == "1992" or ("aquasol" in lowered and re.search(r"\b5th\b", lowered)):
            return "Yalkowsky SH, Dannenfelser RM; Aquasol Database of Aqueous Solubility. 5th ed. 1992", page
        edition = " 2nd ed." if "second" in lowered else ""
        if year:
            return f"Yalkowsky SH, He Yan, Jain P; Handbook of Aqueous Solubility Data.{edition} ({year})", page
    if "voogt" in lowered and "1990" in text:
        return "De Voogt P et al; J Planar Chromatogr 3 (1990)", None
    if "general electric" in lowered and "material safety data sheet" in lowered:
        sheet = re.search(r"#\s*([A-Za-z0-9]+)", text)
        label = "General Electric Co; Material Safety Data Sheet"
        if year:
            label += f" ({year})"
        return label, sheet.group(1) if sheet else page
    if "hansch" in lowered and "exploring qsar" in lowered:
        return "Hansch C et al; Exploring QSAR: Hydrophobic, Electronic, and Steric Constants (1995)", None
    if "health and safety executive" in lowered and "formaldehyde" in lowered and year:
        return f"Health and Safety Executive Monograph: Formaldehyde ({year})", None
    if "flick" in lowered and "industrial solvents handbook" in lowered:
        edition = _edition(text)
        label = "Flick EW; Industrial Solvents Handbook."
        if edition:
            label += f" {_ordinal(int(edition))} ed."
        if year:
            label += f" ({year})"
        return label, page
    if "fire protection guide to hazardous materials" in lowered:
        edition = _edition(text)
        label = "Fire Protection Guide to Hazardous Materials."
        if edition:
            label += f" {_ordinal(int(edition))} ed."
        if year:
            label += f" {year}"
        return label, page
    if "ohnishi" in lowered and "tanabe" in lowered and "bull chem soc" in lowered:
        return "Ohnishi R, Tanabe K; Bull Chem Soc Jpn 44 (1971)", None
    if "riddick" in lowered and "organic solvents" in lowered and year:
        return f"Riddick JA et al; Organic Solvents ({year})", None
    if "spanggord" in lowered and "munition" in lowered and year:
        return ("Spanggord RJ et al; Environmental Fate Studies on Certain Munitions "
                f"Wastewater Constituents ({year})", None)
    if "verschueren" in lowered and "environmental data" in lowered:
        edition = _edition(text)
        if edition:
            return (f"Verschueren K; Handbook of Environmental Data on Organic Chemicals. "
                    f"{_ordinal(int(edition))} ed.", page)
        if year:
            return f"Verschueren K; Handbook of Environmental Data on Organic Chemicals ({year})", page
    if "warner" in lowered and "weiss" in lowered and "deep sea" in lowered:
        return "Warner MJ, Weiss RF; Deep Sea Res 32 (1985)", None
    if "wasik" in lowered and "octanol" in lowered and "2406" in lowered:
        return ("Wasik SP et al; Octanol/Water Partition Coefficients and Aqueous Solubilities "
                "of Organic Compounds. NBSIR 81-2406 (1981)", page)
    if "weiss" in lowered and "hazardous chemicals" in lowered and year == "1986":
        return "Weiss G; Hazardous Chemicals Data Book. 2nd ed. (1986)", page
    if re.search(r"\bli\b", lowered) and re.search(r"\bp[eu]rdue\b", lowered) and "1995" in text:
        return ("Li J, Perdue EM; Physicochemical properties of selected monoterpenes. "
                "209th ACS National Meeting, Anaheim, CA, April 2-7 (1995)", None)
    if re.search(r"\bsouthw(?:ick|orth)\b", lowered) and "keller" in lowered and "1986" in text:
        return "Southworth GR, Keller JL; Water Air Soil Pollut 28 (1986)", page
    if re.search(r"\bta[ck]a[ck]s-novak\b", lowered) and "1995" in text:
        return "Takacs-Novak K et al (1995)", None
    if re.search(r"\bmeylan\b", lowered) and "howard" in lowered and "1995" in text and "pharm" not in lowered:
        return "Meylan WM, Howard PH; J Pharm Sci 84 (1995)", None
    if re.search(r"\bmeylan\b", lowered) and "1996" in text and "toxicol" not in lowered:
        return "Meylan WM, Howard PH, Boethling RS; Environ Toxicol Chem 15 (1996)", None
    if "yaws" in lowered and "physical property data" in lowered and "vapor" not in lowered and year:
        return f"Yaws CL; Thermodynamic and Physical Property Data ({year})", None
    if lowered.strip(" .") in {"msds", "from msds", "msds label"}:
        return "MSDS", None
    if "phthalate esters in the aquatic environment" in lowered and "research council" in lowered:
        if year:
            return f"National Research Council Canada; Phthalate Esters in the Aquatic Environment ({year})", page
    if "blister agents" in lowered and "sulfur mustard" in lowered:
        if year:
            return f"ATSDR; Blister Agents: Sulfur Mustard Agent H/HD, Sulfur Mustard Agent HT ({year})", page
    if "screening information data set" in lowered:
        found = re.findall(
            r"data set for\s+([^,;]+?)\s*,\s*([0-9]{2,7}-[0-9]{2}-[0-9])", text, re.I)
        if year and found:
            name, cas = found[-1]
            return f"OECD; Screening Information Data Set for {name.strip()} ({cas}) ({year})", page
    return None


def _journal_article(text: str, lowered: str) -> Optional[tuple[str, Optional[str]]]:
    """One abbreviated journal citation. A different volume or year stays a different source."""
    if "griffin" in lowered and "chromat" in lowered and "1999" in lowered:
        return "Griffin S et al; J Chromatogr A 864 (1999)", None
    if re.search(r"\b(?:munro|monro)\b", lowered) and "health perspect" in lowered and "1999" in lowered:
        return "Munro NB et al; Environ Health Perspect 107 (1999)", "12" if "(12)" in text else None
    if "chao" in lowered and re.search(r"\b(?:j phys chem ref|j phy ref|j chem phys ref)\b", lowered):
        return "Chao J et al; J Phys Chem Ref Data 12 (1983)", None
    if "hine" in lowered and "mookerjee" in lowered and "j org chem" in lowered:
        return "Hine J, Mookerjee PK; J Org Chem 40 (1975)", None
    if "gunther" in lowered and re.search(r"\bres rev\b", lowered):
        return "Gunther FA et al; Res Rev 20 (1968)", None
    if "sanemasa" in lowered and "bull chem soc" in lowered:
        if re.search(r"\b18\b", text) and not re.search(r"\b55\b", text):
            return None
        return "Sanemasa I et al; Bull Chem Soc Jpn 55 (1982)", _page_tail(text)
    if "shiu" in lowered and "mackay" in lowered and re.search(r"chem eng dat", lowered):
        volume = re.search(r"dat[ae]?\s+(\d+)", lowered)
        year = _year(text)
        if volume and volume.group(1) == "42" and year in {None, "1997"}:
            return "Shiu WY, Mackay D; J Chem Eng Data 42 (1997)", None
    if "horvath" in lowered and "phys chem ref" in lowered and re.search(r"\b28\b", text) and "128" not in text:
        return "Horvath AL et al; J Phys Chem Ref Data 28 (1999)", None
    return None


_SITE_ROOTS = (
    ("chemspider.com", "http://www.chemspider.com"),
    ("pubchem.ncbi.nlm.nih.gov", "https://pubchem.ncbi.nlm.nih.gov/"),
    ("inchem.org", "http://www.inchem.org"),
    ("chemicalbook.com", "https://www.chemicalbook.com/"),
)


def _patty_toxicology(text: str, lowered: str) -> Optional[tuple[str, Optional[str]]]:
    """Patty's Toxicology is the edition. A chapter title with no edition is the 6th edition."""
    if "patty" not in lowered or "toxicology" not in lowered or "industrial hygiene" in lowered:
        return None
    edition = _edition(text) or "6"
    number = int(edition)
    suffix = "th" if number % 100 in {11, 12, 13} else {1: "st", 2: "nd", 3: "rd"}.get(number % 10, "th")
    return f"Patty's Toxicology. {number}{suffix} ed.", _patty_locator(text)


def _patty_locator(text: str) -> Optional[str]:
    volumes = re.search(r"\bVolumes?\s+\d+(?:\s*[-–]\s*\d+)?", text, re.I)
    edition = re.search(r"\d+(?:st|nd|rd|th)\s+ed\.?\s*(.*)$", text, re.I)
    if edition and edition.group(1).strip(" ."):
        tail = edition.group(1).strip(" .")
    else:
        title = re.search(r"Patty's Toxicology\.?\s*(.*)$", text, re.I)
        tail = title.group(1).strip(" .") if title else ""
    tail = re.split(r"\b(?:John Wiley|New York|\bNY\b)", tail, maxsplit=1, flags=re.I)[0]
    tail = re.sub(r"\s*\((?:19|20)\d{2}\)\s*$", "", tail).strip(" .;,")
    if tail:
        return tail
    if volumes:
        return re.sub(r"\s+", " ", volumes.group(0))
    trailing = re.search(r"\b(\d+)\s*$", text)
    return trailing.group(1) if trailing else None


def _epesticide_manual(text: str, lowered: str) -> Optional[tuple[str, Optional[str]]]:
    """The e-Pesticide Manual is the edition and version. The chemical is a locator."""
    if "e-pesticide manual" not in lowered:
        return None
    version = re.search(r"version\s+(\d+(?:\.\d+)?)", lowered)
    if version is None:
        return None
    edition = _edition(text)
    if edition:
        number = int(edition)
        suffix = "th" if number % 100 in {11, 12, 13} else {1: "st", 2: "nd", 3: "rd"}.get(number % 10, "th")
        label = f"The e-Pesticide Manual, {number}{suffix} ed Version {version.group(1)}"
    else:
        label = f"The e-Pesticide Manual, Version {version.group(1)}"
    chemical = re.search(r"\.\s*(.+?)\s*\(([0-9]{2,7}-[0-9]{2}-[0-9])\)", text)
    locator = f"{chemical.group(1).strip()} ({chemical.group(2)})" if chemical else None
    return label, locator


def _site_root(text: str) -> Optional[tuple[str, Optional[str]]]:
    """A compound page on these sites is the site. The path stays on the value."""
    body = re.sub(r"^#\s*", "", text.strip())
    match = re.match(r"https?://([^/\s]+)(/.*)?$", body, re.I)
    if match is None:
        return None
    host = match.group(1).lower()
    root = next((label for needle, label in _SITE_ROOTS if needle in host), None)
    if root is None:
        return None
    path = (match.group(2) or "").lstrip("/")
    return root, path or None


def preferred_ref_code(ref_code: str, source: str) -> str:
    """NIOSH Pocket Guide codes use the publication number (``2005-149``, ``2010-168``)."""
    match = _PUB_NO.search(source)
    if match is None or "niosh pocket guide" not in source.lower():
        return ref_code
    return f"NIOSHNIOSHPocketGuide-{match.group(1)}"


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
    """Identity of a source. Punctuation, New York/NY, and initials fold. Year, volume, and edition stay."""
    text = text.lower().replace("&", " and ").replace("new york", "ny").replace("mongraph", "monograph")
    text = re.sub(r"\busepa\b", "us epa", text)
    text = re.sub(r"\benviron sci tech\b", "environ sci technol", text)
    text = re.sub(r"\buniv\b", "university", text)
    text = re.sub(r"\bariz\b", "arizona", text)
    text = re.sub(r"\baz\b", "arizona", text)
    for word, ordinal in _ORDINAL_WORDS:
        text = re.sub(rf"\b{word}\b(?=\s+ed)", ordinal, text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    text = re.sub(r"\b(\d+(?:st|nd|rd|th))\s+edition\b", r"\1 ed", text)
    text = re.sub(r"\bver(?:sion)?\s+5\b", "5th ed", text)
    glued: list[str] = []
    initials = ""
    for part in text.split():
        if part in _KEY_DROP:
            continue
        if len(part) == 1 and part.isalpha():
            initials += part
            continue
        if initials:
            glued.append(initials)
            initials = ""
        glued.append(part)
    if initials:
        glued.append(initials)
    return " ".join(glued)


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
                source_name, locator = canonicalize_source(citation)
                code = preferred_ref_code(citation_ref_code(citation), citation)
                _add_source(sources, {"refCode": code, "source": source_name})
                for text, quantities in entries:
                    by_heading.setdefault(heading or "", []).append(
                        ExperimentalCitation(text, quantities, code, None, locator, source_name))
        else:
            title = (depositor or {}).get("SourceName")
            source_name, locator = canonicalize_source(title) if title else (None, None)
            code = depositor_ref_code(title, (depositor or {}).get("SourceID"))
            if code and source_name:
                row: dict[str, Any] = {"refCode": code, "source": source_name}
                if depositor.get("URL") and "http" not in source_name:
                    row["url"] = depositor["URL"]
                if depositor.get("SourceID"):
                    row["sourceId"] = depositor["SourceID"]
                _add_source(sources, row)
            for text, quantities in entries:
                by_heading.setdefault(heading or "", []).append(
                    ExperimentalCitation(text, quantities, code, None, locator, source_name))
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


def _database_source(text: str) -> Optional[tuple[str, Optional[str]]]:
    lowered = text.lower()
    # The database itself. A different work that is only hosted on cameochemicals.noaa.gov stays its own source.
    if "cameo chemicals" in lowered:
        return ("NOAA; CAMEO Chemicals. Database of Hazardous Materials. https://cameochemicals.noaa.gov/", None)
    if re.search(r"\becha\b|european chemical agency", lowered):
        return ("ECHA; Search for Chemicals. Registered Substances Dossier. European Chemical Agency. "
                "https://echa.europa.eu/", None)
    if lowered.startswith("sigma-aldrich; safety data") or lowered.startswith("sigma-aldrich; material safety"):
        product = _PRODUCT.search(text)
        number = product.group(1) if product and product.group(1) not in {"", ","} else None
        return ("Sigma-Aldrich; Safety Data Sheet. https://www.sigmaaldrich.com/safety-center.html", number)
    if "nist chemistry webbook" in lowered or (
            _nist_release(text) and re.search(r"standard reference database(?:\s+no\.?|\s+number)?\s*69\b", lowered)):
        release = _nist_release(text)
        label = f", {release} Release" if release else ""
        chemical = re.search(r"\(([0-9]{2,7}-[0-9]{2}-[0-9])\)", text)
        return (f"NIST; NIST Chemistry WebBook. NIST Standard Reference Database No. 69{label}. "
                "https://webbook.nist.gov", chemical.group(1) if chemical else None)
    if "iuclid" in lowered:
        return ("European Chemicals Bureau; IUCLID Dataset. https://esis.jrc.ec.europa.eu/", None)
    if lowered.startswith("environment canada; tech info for problem spills"):
        return ("Environment Canada; Tech Info for Problem Spills.", None)
    if ("inchem.org/pages/icsc" in lowered or lowered.startswith("cdc; international chemical safety cards")
            or "international chemical safety card" in lowered):
        return ("International Chemical Safety Cards (ICSC). https://www.inchem.org/pages/icsc.html", None)
    if "nuclide table" in lowered and "korea atomic" in lowered:
        return ("Korea Atomic Energy Research Institute. Nuclear Data Evaluation Lab. 2000. Nuclide Table. "
                "https://atom.kaeri.re.kr/ton/", None)
    if "niosh pocket guide" in lowered:
        pub = _PUB_NO.search(text)
        number = f" DHHS (NIOSH) Publication No. {pub.group(1)}." if pub else ""
        return (f"NIOSH. NIOSH Pocket Guide to Chemical Hazards.{number} https://www.cdc.gov/niosh/npg", None)
    return None


def _nist_release(text: str) -> Optional[str]:
    match = _NIST_RELEASE.search(text)
    if match is None:
        return None
    month = match.group(1)[:3].title()
    if month == "Sep":
        month = "Sep"
    return f"{month} {match.group(2)}"


def _online_article(text: str) -> Optional[str]:
    """Work + edition + article title. None when this is the printed book, not one article."""
    if _POSTING.search(text) is None and _COVERAGE.search(text) is None:
        return None
    label = next((name for pattern, name in _ONLINE_WORKS if pattern.search(text)), None)
    if label is None:
        return None
    edition = _edition(text)
    suffix = {1: "st", 2: "nd", 3: "rd"}.get(edition and int(edition) % 10, "th")
    if edition and int(edition) % 100 in {11, 12, 13}:
        suffix = "th"
    title = _article_title(text, label)
    if not title:
        return None
    parts = [label]
    if edition:
        parts.append(f"{edition}{suffix} ed")
    parts.append(title)
    return ". ".join(parts) + "."


def _article_title(text: str, work: str) -> Optional[str]:
    cleaned = _POSTING.sub("", text)
    cleaned = _COVERAGE.sub("", cleaned)
    cleaned = _LONE_YEAR.sub("", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    titles: list[str] = []
    for part in re.split(r"\s*;\s*", cleaned):
        chunks = [part] if work.lower() not in part.lower() else re.split(r"\.\s+", part)
        for chunk in chunks:
            piece = chunk.strip(" .")
            if not piece or work.lower() in piece.lower() or _is_publisher(piece) or _is_author(piece):
                continue
            if re.fullmatch(r"\d+(?:st|nd|rd|th)\s+ed(?:ition)?", piece, re.I):
                continue
            titles.append(piece)
    if not titles:
        return None
    title = titles[-1]
    title = re.sub(r"\bnitrates? and nitrites?\b", "Nitrates and Nitrites", title, flags=re.I)
    return re.sub(r"\s+", " ", title).strip(" .")


def _is_publisher(text: str) -> bool:
    lowered = text.lower()
    return "wiley" in lowered or "new york" in lowered or lowered.strip() in {"ny, ny", "ny"}


def _is_author(text: str) -> bool:
    if re.search(r"\bet al\b", text, re.I):
        return True
    if re.search(r"\b(?:and|compounds|compound|acid|oxide|cd-rom)\b", text, re.I):
        return False
    return re.search(r"\b[A-Z]{1,3}\b", text) is not None


_JOURNAL_SPELLING = (
    (re.compile(r"\bJ Agr Food Chem\b", re.I), "J Agric Food Chem"),
    (re.compile(r"\bEnviron Technol Letters\b", re.I), "Environ Technol Lett"),
    (re.compile(r"\bEnviron Sci Tech\b", re.I), "Environ Sci Technol"),
    (re.compile(r"\bEnviron Sci Hlth\b", re.I), "Environ Sci Health"),
    (re.compile(r"\bEnv Sci Technol\b", re.I), "Environ Sci Technol"),
    (re.compile(r"\bJ Nat Cancer Inst\b", re.I), "J Natl Cancer Inst"),
    (re.compile(r"\bInternat J Chem Kinet\b", re.I), "Int J Chem Kinet"),
    (re.compile(r"\bInt J Chem Kinetics\b", re.I), "Int J Chem Kinet"),
    (re.compile(r"\bAquatic Toxicol\b", re.I), "Aquat Toxicol"),
    (re.compile(r"\bEnviron Molec Mutagen\b", re.I), "Environ Mol Mutagen"),
    (re.compile(r"\bEnviron Tox and Chem\b", re.I), "Environ Toxicol Chem"),
    (re.compile(r"\bEnviron Tox Chem\b", re.I), "Environ Toxicol Chem"),
    (re.compile(r"\bJ Chen Eng Data\b", re.I), "J Chem Eng Data"),
    (re.compile(r"\bJ Chromatography\b", re.I), "J Chromatogr"),
    (re.compile(r"\bJ Chromatog\b", re.I), "J Chromatogr"),
    (re.compile(r"\bJ Chromat\b(?!ogr)", re.I), "J Chromatogr"),
    (re.compile(r"\bColl Czech Comm\b", re.I), "Coll Czech Chem Commun"),
    (re.compile(r"\bInternat J Chem Kin\b", re.I), "Int J Chem Kinet"),
    (re.compile(r"\bJ Planar Chromatogr-Mod TLC\b", re.I), "J Planar Chromatogr"),
    (re.compile(r"\bJ Environ Toxicol Chem\b", re.I), "Environ Toxicol Chem"),
    (re.compile(r"\bSoil Science\b", re.I), "Soil Sci"),
    (re.compile(r"\bBr J Indus Med\b", re.I), "Br J Ind Med"),
    (re.compile(r"\bEnviron Health Perspectives?\b", re.I), "Environ Health Perspect"),
    (re.compile(r"\bEnv Health Persp\b", re.I), "Environ Health Perspect"),
    (re.compile(r"\bDeep Sea Res(?:earch)?\s+A\b", re.I), "Deep Sea Res"),
    (re.compile(r"\bDeep Sea Res\s+(\d+)A\b", re.I), r"Deep Sea Res \1"),
    (re.compile(r"\bnos\b", re.I), "No"),
    (re.compile(r"\bBrit J Indust Med\b", re.I), "Br J Ind Med"),
    (re.compile(r"\bBrit J Ind Med\b", re.I), "Br J Ind Med"),
    (re.compile(r"\bAmer Water Works Assoc\b", re.I), "J Am Water Works Assoc"),
    (re.compile(r"\bWater Air Soil Poll\b(?!ut)", re.I), "Water Air Soil Pollut"),
    (re.compile(r"\bPollut Engin\b", re.I), "Pollut Eng"),
    (re.compile(r"\bChem Engin\b", re.I), "Chem Eng"),
    (re.compile(r"\bChem Engn\b", re.I), "Chem Eng"),
    (re.compile(r"\bJ Computer[- ]Aided Molec Design\b", re.I), "J Computer-Aided Molecular Design"),
    (re.compile(r"\bJ Computer-aided Molecular Design\b", re.I), "J Computer-Aided Molecular Design"),
    (re.compile(r"\bPure and Applied Chemistry\b", re.I), "Pure Appl Chem"),
    (re.compile(r"\bPure Applied Chem\b", re.I), "Pure Appl Chem"),
    (re.compile(r"\bWater Research(\s+\d+)", re.I), r"Water Res\1"),
    (re.compile(r"\bJ Chem Phys Ref Data\b", re.I), "J Phys Chem Ref Data"),
    (re.compile(r"\bJ Chem Ref Data\b", re.I), "J Phys Chem Ref Data"),
    (re.compile(r"\bQuant STruct Acxt Relat\b", re.I), "Quant Struct Act Relat"),
    (re.compile(r"\bParfume Kosmet\b", re.I), "Parfuem Kosmet"),
    (re.compile(r"\bTokyp\b", re.I), "Tokyo"),
    (re.compile(r"\bPetrochemi(?:cal|a)\b", re.I), "Petrochemia"),
    (re.compile(r"\bInter J Therm\b", re.I), "Int J Thermophys"),
    (re.compile(r"\bInt J Therm\b(?!ophys)", re.I), "Int J Thermophys"),
    (re.compile(r"\bBull Chem Soc Japan\b", re.I), "Bull Chem Soc Jpn"),
    (re.compile(r"\bBull Chem Soc Jap\b(?!n)", re.I), "Bull Chem Soc Jpn"),
    (re.compile(r"\s*\(Draft\)", re.I), ""),
)


def _journal_spelling(source: str) -> str:
    """One spelling of a journal name. The volume and the year stay on the source."""
    for pattern, replacement in _JOURNAL_SPELLING:
        source = pattern.sub(replacement, source)
    return source


def _strip_literature(text: str) -> tuple[str, Optional[str]]:
    source = _ASOF.sub("", text).strip()
    if re.match(r"^(PMID:|https?://|http://)", source, re.I):
        return re.sub(r"\s+", " ", source).strip(), None
    source = _EDITION_WORD.sub(lambda m: f"{m.group(1)}{m.group(2).lower()} ed", source)
    source = re.sub(
        r"(Encyclopedia of (?:Chemical Technology|Industrial Chemistry)\.)\s+[A-Z][a-z]+(?:\s+[A-Z]\.?){1,3},?\s+",
        r"\1 ",
        source,
    )
    source = re.sub(r"^\(\d+\)\s*", "", source)
    source = re.sub(r"\b[Hh]azarous\b", "Hazardous", source)
    source = re.sub(r"\bto man\b", "to humans", source, flags=re.I)
    source = source.replace("`", "")
    source = re.sub(r"\)\s*\]+$", ")", source)
    locs: list[str] = []
    section = re.search(r"(\d+)L\s+(\d+\s*[-–]\s*\d+)\s*(\((?:19|20)\d{2}\))\s*$", source)
    if section:
        locs.append(re.sub(r"\s+", "", section.group(2)))
        source = f"{source[:section.start()]}{section.group(1)} {section.group(3)}"
    supplement = re.search(
        r"(\d+)\(\s*(Suppl\.?\s*\d+)\s*\)\s*:\s*(\S+)\s*(\((?:19|20)\d{2}\))\s*$",
        source,
        re.I,
    )
    if supplement:
        locs.append(supplement.group(3))
        source = f"{source[:supplement.start()]}{supplement.group(1)} {supplement.group(4)}"
    issue = re.search(
        r"(\d+)\s*\(((?:Suppl\.?\s*)?(?:[A-Za-z]\d+|\d+(?:\s*[-–]\s*\d+)?))\)\s*(\(((?:19|20)\d{2})\))",
        source,
    )
    if issue:
        locs.append(re.sub(r"\s+", "", issue.group(2)))
        source = f"{source[:issue.start()]}{issue.group(1)} {issue.group(3)}{source[issue.end():]}"
    mid = _MID_PAGE.search(source)
    if mid:
        locs.append(re.sub(r"\s+", "", mid.group(1)))
        source = source[:mid.start()] + source[mid.end():]
    previous = None
    while previous != source:
        previous = source
        source, loc = _one_trailing_locator(source)
        if loc:
            locs.append(loc)
    if re.search(r"\bJ (?:Air|Appl)\b", source):
        source = _JOURNAL_YEAR.sub("", source)
        source = _JOURNAL_ISSUE.sub(r"\1:", source)
        source = _JOURNAL_SPAN.sub(lambda m: _expand_span(m.group(1), m.group(2)), source)
    if re.search(r"toxic and hazardous industrial chemicals safety manual", source, re.I):
        source = re.sub(r",?\s*(?:19|20)\d{2}\s*$", "", source)
    source = re.sub(r"\s+", " ", source).strip(" ,.;:")
    source = _drop_repeated_trailing_year(source)
    source = _journal_spelling(source)
    locator = locs[0] if len(locs) == 1 else ", ".join(locs) if locs else None
    return source or text.strip(), locator


def _drop_repeated_trailing_year(source: str) -> str:
    """A year already written on the work ("2005-2006 … 2005") is not a second edition."""
    match = re.search(r"\s+((?:19|20)\d{2})\s*$", source)
    if match and match.group(1) in source[:match.start()]:
        return source[:match.start()].strip(" ,.;")
    return source


def _one_trailing_locator(text: str) -> tuple[str, Optional[str]]:
    text = text.replace("`", "").rstrip()
    broken = re.search(r":\s*(\d{1,5}\s*[-–]\s*\d{1,5})\s+((?:19|20)\d{2})\)?\s*$", text)
    if broken:
        return f"{text[:broken.start()].strip(' ,.;')} ({broken.group(2)})", re.sub(r"\s+", "", broken.group(1))
    issued = re.search(r"\bpp?\.\s*(\d+)\s*(?=\(Issued:)", text, re.I)
    if issued:
        return f"{text[:issued.start()]}{text[issued.end():]}", issued.group(1)
    paged = _PAGE_THEN_YEAR.search(text)
    before = text[paged.start(1) - 1:paged.start(1)] if paged else ""
    if (paged and before not in {"-", "/"} and not before.isalnum()
            and not re.search(r"\bvol(?:ume)?s?\s*$", text[:paged.start(1)], re.I)):
        return text[:paged.start()].strip(" ,.;:"), re.sub(r"\s+", "", paged.group(1))
    colon = re.search(
        r",?\s*:\s*(\d{1,5}(?:\s*[-–]\s*\d{1,5})?(?:\s+\d{1,5})*)\s*(?:\(((?:19|20)\d{2})\))?\s*$",
        text,
    )
    if colon:
        source = text[:colon.start()].strip(" ,.;")
        source = re.sub(r",\s*(?=\d+\s*$)", " ", source)
        if colon.group(2):
            source = f"{source} ({colon.group(2)})"
        return source, re.sub(r"\s+", "", colon.group(1))
    paged = _PAGE_TAIL.search(text)
    if paged:
        source = text[:paged.start()].strip(" ,.;")
        if paged.group(3):
            source = f"{source} ({paged.group(3)})"
        locator = re.sub(r"\s+", "", paged.group(1))
        if paged.group(2):
            locator = f"{locator} {paged.group(2)}"
        return source, locator
    for pattern, group in _TRAILING_LOCATORS:
        match = pattern.search(text)
        if match and _is_slash_date(text, pattern):
            continue
        if match:
            return text[:match.start()].strip(" ,.;"), re.sub(r"\s+", "", match.group(group))
    if not re.search(r"(?:19|20)\d{2}|present", text, re.I):
        return text, None
    match = _BARE_PAGE.search(text)
    if match is None:
        return text, None
    number = match.group(1)
    if re.fullmatch(r"(?:19|20)\d{2}", number):
        return text, None
    if re.search(r"Publication No\.?\s*$", text[:match.start()], re.I):
        return text, None
    return text[:match.start()].strip(" ,.;"), number


def _expand_span(start: str, end: str) -> str:
    if len(end) < len(start) and int(end) < int(start):
        end = start[:len(start) - len(end)] + end
    return f"{start}-{end}"
