"""
compound_data.cas_external_lookup — Free CAS → formula (+ identifiers) for unresolved rows.

Order: PubChem → NIST WebBook → NCI CACTUS → ChemicalBook → LookChem.

PubChem and NIST formulas are trusted. CACTUS / ChemicalBook / LookChem formulas are
verified against the compound name (and Mr when present). Unverified marketplace hits
get status ``needs_recheck`` and belong on the recheck list — they are not accepted as
solid formulas (e.g. ChemicalBook ``C5H10O5Os`` for osmium pentacarbonyl / Os(CO)5).

When a hit lacks Mr / SMILES / InChIKey, ``enrich_identifiers`` fills gaps from CACTUS,
PubChem, ChemicalBook, then LookChem detail pages.
"""
from __future__ import annotations

import csv
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass, replace
from pathlib import Path
from typing import Iterable

from chemical_formula.formula_elements import formula_elements
from chemical_formula.hill_formula import hill_formula

USER_AGENT = "thermal-software/0.1 (compound-data; research; CAS formula lookup)"

# Only these sources are accepted without name/Mr cross-check.
TRUSTED_FORMULA_SOURCES = frozenset({"pubchem", "nist_webbook"})
# Marketplace / resolver sources — formula must pass ``verify_marketplace_formula``.
UNTRUSTED_FORMULA_SOURCES = frozenset({"chemicalbook", "lookchem", "cactus"})

# IUPAC-ish standard atomic weights used only for Mr cross-checks (g/mol).
_ATOMIC_WEIGHT: dict[str, float] = {
    "H": 1.00794, "D": 2.0141, "T": 3.01605, "He": 4.0026, "Li": 6.941, "Be": 9.0122,
    "B": 10.811, "C": 12.0107, "N": 14.0067, "O": 15.9994, "F": 18.9984, "Ne": 20.1797,
    "Na": 22.9898, "Mg": 24.305, "Al": 26.9815, "Si": 28.0855, "P": 30.9738, "S": 32.065,
    "Cl": 35.453, "Ar": 39.948, "K": 39.0983, "Ca": 40.078, "Sc": 44.9559, "Ti": 47.867,
    "V": 50.9415, "Cr": 51.9961, "Mn": 54.938, "Fe": 55.845, "Co": 58.9332, "Ni": 58.6934,
    "Cu": 63.546, "Zn": 65.38, "Ga": 69.723, "Ge": 72.64, "As": 74.9216, "Se": 78.96,
    "Br": 79.904, "Kr": 83.798, "Rb": 85.4678, "Sr": 87.62, "Y": 88.9059, "Zr": 91.224,
    "Nb": 92.9064, "Mo": 95.96, "Tc": 98.0, "Ru": 101.07, "Rh": 102.906, "Pd": 106.42,
    "Ag": 107.868, "Cd": 112.411, "In": 114.818, "Sn": 118.71, "Sb": 121.76, "Te": 127.6,
    "I": 126.904, "Xe": 131.293, "Cs": 132.905, "Ba": 137.327, "La": 138.906, "Ce": 140.116,
    "Pr": 140.908, "Nd": 144.242, "Sm": 150.36, "Eu": 151.964, "Gd": 157.25, "Tb": 158.925,
    "Dy": 162.5, "Ho": 164.93, "Er": 167.259, "Tm": 168.934, "Yb": 173.054, "Lu": 174.967,
    "Hf": 178.49, "Ta": 180.948, "W": 183.84, "Re": 186.207, "Os": 190.23, "Ir": 192.217,
    "Pt": 195.084, "Au": 196.967, "Hg": 200.59, "Tl": 204.383, "Pb": 207.2, "Bi": 208.98,
    "Th": 232.038, "U": 238.029,
}

_METAL_NAME_TO_SYMBOL: dict[str, str] = {
    "lithium": "Li", "beryllium": "Be", "sodium": "Na", "magnesium": "Mg", "aluminum": "Al",
    "aluminium": "Al", "potassium": "K", "calcium": "Ca", "scandium": "Sc", "titanium": "Ti",
    "vanadium": "V", "chromium": "Cr", "manganese": "Mn", "iron": "Fe", "cobalt": "Co",
    "nickel": "Ni", "copper": "Cu", "zinc": "Zn", "gallium": "Ga", "germanium": "Ge",
    "rubidium": "Rb", "strontium": "Sr", "yttrium": "Y", "zirconium": "Zr", "niobium": "Nb",
    "molybdenum": "Mo", "technetium": "Tc", "ruthenium": "Ru", "rhodium": "Rh",
    "palladium": "Pd", "silver": "Ag", "cadmium": "Cd", "indium": "In", "tin": "Sn",
    "antimony": "Sb", "cesium": "Cs", "caesium": "Cs", "barium": "Ba", "lanthanum": "La",
    "cerium": "Ce", "praseodymium": "Pr", "neodymium": "Nd", "samarium": "Sm",
    "europium": "Eu", "gadolinium": "Gd", "terbium": "Tb", "dysprosium": "Dy",
    "holmium": "Ho", "erbium": "Er", "thulium": "Tm", "ytterbium": "Yb", "lutetium": "Lu",
    "hafnium": "Hf", "tantalum": "Ta", "tungsten": "W", "rhenium": "Re", "osmium": "Os",
    "iridium": "Ir", "platinum": "Pt", "gold": "Au", "mercury": "Hg", "thallium": "Tl",
    "lead": "Pb", "bismuth": "Bi", "thorium": "Th", "uranium": "U",
}

_CO_PREFIX: dict[str, int] = {
    "": 1, "mono": 1, "di": 2, "tri": 3, "tetra": 4, "penta": 5, "hexa": 6,
    "hepta": 7, "octa": 8, "nona": 9, "deca": 10,
}

_MR_TOLERANCE = 1.0  # Da — marketplace Mr vs computed Hill mass

_PUBCHEM_PROPS = (
    "MolecularFormula,MolecularWeight,Title,IUPACName,"
    "InChI,InChIKey,CanonicalSMILES,ConnectivitySMILES"
)
PUBCHEM_NAME_URL = (
    "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{q}"
    f"/property/{_PUBCHEM_PROPS}/JSON"
)
PUBCHEM_XREF_URL = (
    "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/xref/RN/{q}"
    f"/property/{_PUBCHEM_PROPS}/JSON"
)
NIST_URL = "https://webbook.nist.gov/cgi/cbook.cgi?ID={cas}&Units=SI"
CACTUS_BASE = "https://cactus.nci.nih.gov/chemical/structure/{q}/{path}"
CHEMICALBOOK_CAS_URL = "https://www.chemicalbook.com/CASEN_{cas}.htm"
LOOKCHEM_SEARCH_URL = "https://www.lookchem.com/newsell/searchdata.aspx?key={q}"
LOOKCHEM_DETAIL_URL = "https://www.lookchem.com/casno{cas}.html"

_FORMULA_JSON = re.compile(r'"molecularFormula"\s*:\s*"([^"]+)"')
_ENTITY_BLOCK = re.compile(
    r'"@type"\s*:\s*"MolecularEntity"\s*,(.*?)\}',
    re.S,
)
_JSON_STR = re.compile(r'"([^"]+)"\s*:\s*"([^"]*)"')
_MW_NUM = re.compile(r"([0-9]+(?:\.[0-9]+)?)")
_STRIP_TAGS = re.compile(r"<[^>]+>")
_LOOKCHEM_FORMULA = re.compile(
    r"Molecular Formula:</span>\s*([^<]+)", re.I,
)
_LOOKCHEM_WEIGHT = re.compile(
    r"Formula Weight:</span>\s*([0-9.]+)", re.I,
)
_LOOKCHEM_CAS = re.compile(
    r'CAS No\.</span>\s*<a href="/casno([0-9-]+)\.html"', re.I,
)
_LOOKCHEM_NAME = re.compile(
    r'<a href="/cas-[0-9]+/[0-9-]+\.html"[^>]*>\s*([^<]+?)\s*</a>',
    re.I,
)
_LOOKCHEM_INCHI = re.compile(r"(InChI=[^\s<]+)", re.I)
_CB_FIELD = re.compile(
    r"\[([^\]]+)\]</font><br\s*/?\s*><br\s*/?\s*>(.*?)</td>",
    re.I | re.S,
)
_CB_NUMBER = re.compile(r'data-cbnumber="(CB\d+)"', re.I)
_CB_PRODUCT_NAME = re.compile(r'data-product-name="([^"]+)"', re.I)


@dataclass(frozen=True)
class FormulaVerification:
    """Result of checking an untrusted (marketplace) formula."""

    ok: bool
    reason: str
    expected_hill: str | None = None
    reported_hill: str | None = None


@dataclass(frozen=True)
class CasLookupResult:
    cas: str
    formula: str | None
    name: str | None
    source: str  # pubchem | nist_webbook | cactus | chemicalbook | lookchem | none
    status: str  # found | not_found | blocked | error | needs_recheck
    notes: str = ""
    mr: float | None = None
    smiles: str | None = None
    inchikey: str | None = None
    inchi: str | None = None
    synonyms: str | None = None
    cbnumber: str | None = None
    expected_formula: str | None = None

    def as_row(self) -> dict[str, str]:
        d = asdict(self)
        out: dict[str, str] = {}
        for k, v in d.items():
            if v is None:
                out[k] = ""
            elif isinstance(v, float):
                out[k] = f"{v:g}"
            else:
                out[k] = str(v)
        return out

    def missing_identifiers(self) -> bool:
        return self.status == "found" and (
            self.mr is None or not self.smiles or not self.inchikey
        )


def _http_get(url: str, timeout: float = 30.0, accept: str = "*/*") -> tuple[int, str]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": accept,
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", "replace")
            return int(getattr(resp, "status", 200) or 200), body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace") if e.fp else ""
        return int(e.code), body
    except Exception as e:
        return 0, str(e)


def _normalize_deuterium_symbol(formula: str) -> str:
    """Marketplace pages sometimes write isotope ``d``/``t``; we always use ``D``/``T``.

    Two-letter elements that end with ``d`` (``Cd``, ``Pd``, ``Nd``, ``Gd``, ``Md``) are
    left unchanged. Deuterium in formulas must be capital ``D``, never ``d``.
    """
    out: list[str] = []
    i = 0
    n = len(formula)
    while i < n:
        ch = formula[i]
        # Keep two-letter element symbols intact (Cd, Pd, … / Mt, …).
        if ch.isupper() and i + 1 < n and formula[i + 1].islower():
            out.append(formula[i : i + 2])
            i += 2
            continue
        if ch == "d":
            out.append("D")
            i += 1
            continue
        if ch == "t":
            out.append("T")
            i += 1
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def _clean_formula(raw: str) -> str:
    """Normalize formulas like ``AlBr3 . 6 H2 O`` → ``AlBr3·6H2O``.

    Drops ionic charge suffixes (``Ag2F+``, ``SO4-2``) — those are not neutral formulas.
    Lowercase isotope ``d``/``t`` become ``D``/``T``.
    """
    s = raw.strip()
    if s.lower() in ("", "null", "none", "n/a"):
        return ""
    s = re.sub(r"\s*\.\s*", "·", s)
    s = re.sub(r"\s+", "", s)
    if re.search(r"[+-]\d*$", s) or s.endswith(("+", "−", "–")):
        return ""
    return _normalize_deuterium_symbol(s)


def _is_junk_formula(formula: str | None) -> bool:
    """Marketplace stubs often ship bare ``C`` (or empty) instead of a real formula."""
    if not formula:
        return True
    return formula in {"C", "c", "N/A", "n/a", "-", "—", "?"}


def _has_deuterium(formula: str) -> bool:
    """True when the formula uses isotope ``D`` / ``T`` (not Cd/Pd/… or Mt)."""
    i = 0
    n = len(formula)
    while i < n:
        ch = formula[i]
        if ch.isupper() and i + 1 < n and formula[i + 1].islower():
            i += 2
            continue
        if ch in ("D", "T"):
            return True
        i += 1
    return False


def _to_hill(formula: str) -> str | None:
    """Canonical formula for comparison.

    Plain formulas → Hill. Deuterium/tritium formulas keep ``D``/``T`` (Hill would fold
    them to H); isotope letter is always capital ``D``/``T``.
    """
    cleaned = _clean_formula(formula)
    if not cleaned:
        return None
    try:
        hill = hill_formula(formula_elements(cleaned))
    except Exception:
        return None
    if _has_deuterium(cleaned):
        return cleaned
    return hill


_MR_TOKEN = re.compile(r"([A-Z][a-z]?)(\d*\.?\d*)|([(\[])|([)\]])(\d*\.?\d*)")


def _element_counts_for_mr(formula: str) -> dict[str, float] | None:
    """Element counts for Mr; keep ``D``/``T`` distinct (do not fold to H)."""
    from chemical_formula.formula_elements import ELEMENTS

    cleaned = _clean_formula(formula)
    if not cleaned:
        return None
    text = cleaned.replace("·", "").replace("•", "")
    stack: list[dict[str, float]] = [{}]
    pos = 0
    try:
        while pos < len(text):
            match = _MR_TOKEN.match(text, pos)
            if match is None:
                return None
            element, count, opening, closing, group_count = match.groups()
            if element:
                if element not in ELEMENTS and element not in ("D", "T"):
                    return None
                n = float(count) if count else 1.0
                stack[-1][element] = stack[-1].get(element, 0.0) + n
            elif opening:
                stack.append({})
            else:
                if len(stack) == 1:
                    return None
                group = stack.pop()
                n = float(group_count) if group_count else 1.0
                for e, c in group.items():
                    stack[-1][e] = stack[-1].get(e, 0.0) + c * n
            pos = match.end()
        if len(stack) != 1 or not stack[0]:
            return None
        return stack[0]
    except Exception:
        return None


def _formula_mr(formula: str) -> float | None:
    counts = _element_counts_for_mr(formula)
    if not counts:
        return None
    total = 0.0
    for el, n in counts.items():
        w = _ATOMIC_WEIGHT.get(el)
        if w is None:
            return None
        total += w * float(n)
    return total


def expected_formula_from_name(name: str | None) -> str | None:
    """Derive a Hill formula from common systematic names (metal carbonyls, …).

    Returns Hill notation (e.g. osmium pentacarbonyl → ``C5O5Os`` for Os(CO)5).
    """
    if not name:
        return None
    raw = re.sub(r"\s+", " ", name.strip().lower())
    raw = raw.replace("−", "-")
    # Explicit structural formula already in the name: "osmium pentacarbonyl (Os(CO)5)"
    m_struct = re.search(r"\(([A-Za-z0-9()\[\]]+)\)\s*$", name.strip())
    if m_struct:
        hill = _to_hill(m_struct.group(1))
        if hill:
            return hill

    # "{metal} {prefix}carbonyl" / "{prefix}carbonyl {metal}"
    metals = "|".join(sorted(_METAL_NAME_TO_SYMBOL, key=len, reverse=True))
    prefixes = "|".join(sorted((p for p in _CO_PREFIX if p), key=len, reverse=True))
    pat = (
        rf"^(?:({metals}))\s+(?:({prefixes}))?carbonyls?$"
        rf"|^(?:({prefixes}))?carbonyl\s+({metals})$"
    )
    m = re.match(pat, raw)
    if m:
        metal = m.group(1) or m.group(4)
        prefix = (m.group(2) or m.group(3) or "") or ""
        sym = _METAL_NAME_TO_SYMBOL[metal]
        n = _CO_PREFIX.get(prefix, 1)
        return _to_hill(f"{sym}(CO){n}")
    return None


def verify_marketplace_formula(
    formula: str | None,
    *,
    name: str | None = None,
    mr: float | None = None,
    source: str = "",
) -> FormulaVerification:
    """Cross-check an untrusted formula against name-derived expectation and Mr.

    PubChem / NIST should not call this — they are trusted.
    """
    if _is_junk_formula(formula):
        return FormulaVerification(False, "junk formula", expected_formula_from_name(name), None)
    assert formula is not None
    cleaned = _clean_formula(formula)
    reported = _to_hill(cleaned) if cleaned else None
    if not reported:
        return FormulaVerification(
            False, f"unparseable formula {formula!r}",
            expected_formula_from_name(name), None,
        )

    expected = expected_formula_from_name(name)
    if expected and expected != reported:
        return FormulaVerification(
            False,
            f"name expects {expected}, source gave {reported}",
            expected,
            reported,
        )

    # Deuterated names must keep capital D/T in the formula (never lowercase d).
    if name and re.search(r"(?:-d\d*\b|\bd\d+\b|deuter)", name, re.I):
        if not _has_deuterium(reported):
            return FormulaVerification(
                False,
                f"deuterated name {name!r} but formula {reported!r} has no D",
                expected,
                reported,
            )

    computed = _formula_mr(reported)
    if mr is not None and computed is not None and abs(computed - mr) > _MR_TOLERANCE:
        return FormulaVerification(
            False,
            f"Mr mismatch: formula≈{computed:.2f}, source={mr:.2f}",
            expected,
            reported,
        )

    # Name gave a matching expectation → solid.
    if expected and expected == reported:
        return FormulaVerification(True, "name matches formula", expected, reported)

    # Mr agrees and formula parses → accept for marketplace.
    if mr is not None and computed is not None:
        return FormulaVerification(True, "Mr consistent", expected, reported)

    # No independent check possible (organic name we cannot parse, no Mr).
    return FormulaVerification(
        False,
        "unverified: no name expectation and no Mr cross-check",
        expected,
        reported,
    )


def apply_formula_verification(result: CasLookupResult) -> CasLookupResult:
    """Trust PubChem/NIST; verify CACTUS/ChemicalBook/LookChem formulas."""
    if result.status != "found":
        return result
    if result.source in TRUSTED_FORMULA_SOURCES:
        return result
    if result.source not in UNTRUSTED_FORMULA_SOURCES:
        return result
    v = verify_marketplace_formula(
        result.formula, name=result.name, mr=result.mr, source=result.source,
    )
    note_bits = [result.notes] if result.notes else []
    note_bits.append(f"verify:{v.reason}")
    if v.expected_hill:
        note_bits.append(f"expected={v.expected_hill}")
    if v.ok:
        return replace(
            result,
            formula=v.reported_hill or result.formula,
            expected_formula=v.expected_hill,
            notes="; ".join(note_bits),
        )
    return replace(
        result,
        status="needs_recheck",
        formula=v.reported_hill or result.formula,
        expected_formula=v.expected_hill,
        notes="; ".join(note_bits),
    )


def _parse_mr(raw: object) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    m = _MW_NUM.search(str(raw))
    return float(m.group(1)) if m else None


def _q(cas: str) -> str:
    return urllib.parse.quote(cas, safe="")


def _cactus_plain(cas: str, path: str) -> str | None:
    code, body = _http_get(CACTUS_BASE.format(q=_q(cas), path=path), accept="text/plain")
    if code != 200 or not body:
        return None
    line = body.splitlines()[0].strip()
    if not line or line.lower().startswith("error") or "page not found" in line.lower():
        return None
    return line


# ---------------------------------------------------------------------------
# PubChem
# ---------------------------------------------------------------------------

def _pubchem_from_properties(cas: str, body: str, via: str) -> CasLookupResult | None:
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return CasLookupResult(cas, None, None, "pubchem", "error", f"{via}: bad JSON")
    props = (data.get("PropertyTable") or {}).get("Properties") or []
    if not props:
        return None
    formulas = {_clean_formula(p.get("MolecularFormula") or "") for p in props}
    formulas.discard("")
    if len(formulas) != 1:
        return CasLookupResult(
            cas, None, None, "pubchem", "not_found",
            f"{via}: ambiguous ({len(props)} CIDs, {len(formulas)} formulas)",
        )
    formula = next(iter(formulas))
    chosen = next(
        p for p in props
        if _clean_formula(p.get("MolecularFormula") or "") == formula
    )
    name = (chosen.get("IUPACName") or chosen.get("Title") or "").strip() or None
    if name == cas:
        name = None
    smiles = (
        (chosen.get("CanonicalSMILES") or chosen.get("ConnectivitySMILES") or chosen.get("SMILES") or "")
        .strip() or None
    )
    return CasLookupResult(
        cas=cas,
        formula=formula,
        name=name,
        source="pubchem",
        status="found",
        notes=via,
        mr=_parse_mr(chosen.get("MolecularWeight")),
        smiles=smiles,
        inchikey=(chosen.get("InChIKey") or "").strip() or None,
        inchi=(chosen.get("InChI") or "").strip() or None,
    )


def lookup_pubchem(cas: str) -> CasLookupResult:
    """PUG REST: compound/name/{CAS}, then xref/RN if needed."""
    q = _q(cas)
    code, body = _http_get(PUBCHEM_NAME_URL.format(q=q), accept="application/json")
    if code == 200:
        hit = _pubchem_from_properties(cas, body, "name")
        if hit and hit.status == "found":
            return hit
        if hit and hit.status != "not_found":
            return hit
    elif code in (403, 429, 503):
        return CasLookupResult(cas, None, None, "pubchem", "blocked", f"name HTTP {code}")

    code, body = _http_get(PUBCHEM_XREF_URL.format(q=q), accept="application/json")
    if code == 200:
        hit = _pubchem_from_properties(cas, body, "xref/RN")
        if hit:
            return hit
        return CasLookupResult(cas, None, None, "pubchem", "not_found", "xref empty")
    if code == 404:
        return CasLookupResult(cas, None, None, "pubchem", "not_found")
    if code in (403, 429, 503) or code == 0:
        return CasLookupResult(
            cas, None, None, "pubchem", "blocked",
            f"xref HTTP {code}" if code else body[:120],
        )
    return CasLookupResult(cas, None, None, "pubchem", "error", f"xref HTTP {code}")


# ---------------------------------------------------------------------------
# NIST WebBook
# ---------------------------------------------------------------------------

def parse_nist_webbook(cas: str, text: str) -> CasLookupResult:
    if not text:
        return CasLookupResult(cas, None, None, "nist_webbook", "error", "empty body")
    if "No matching species" in text:
        return CasLookupResult(cas, None, None, "nist_webbook", "not_found")
    m = _FORMULA_JSON.search(text)
    formula = _clean_formula(m.group(1)) if m else ""
    fields: dict[str, str] = {}
    block = _ENTITY_BLOCK.search(text)
    if block:
        fields = dict(_JSON_STR.findall(block.group(1)))
    name = fields.get("name") or None
    if formula:
        return CasLookupResult(
            cas=cas,
            formula=formula,
            name=name,
            source="nist_webbook",
            status="found",
            mr=_parse_mr(fields.get("molecularWeight") or fields.get("monoisotopicMolecularWeight")),
            inchikey=fields.get("inChIKey") or None,
            inchi=fields.get("inChI") or None,
        )
    return CasLookupResult(cas, None, name, "nist_webbook", "not_found")


def lookup_nist_webbook(cas: str) -> CasLookupResult:
    code, body = _http_get(NIST_URL.format(cas=cas), accept="text/html")
    if code in (403, 429, 503) or code == 0:
        return CasLookupResult(
            cas, None, None, "nist_webbook", "blocked",
            f"HTTP {code}" if code else body[:120],
        )
    if code != 200:
        return CasLookupResult(cas, None, None, "nist_webbook", "error", f"HTTP {code}")
    return parse_nist_webbook(cas, body)


# ---------------------------------------------------------------------------
# NCI CACTUS
# ---------------------------------------------------------------------------

def lookup_cactus(cas: str) -> CasLookupResult:
    code, body = _http_get(CACTUS_BASE.format(q=_q(cas), path="formula"), accept="text/plain")
    if code in (403, 429, 503) or code == 0:
        return CasLookupResult(
            cas, None, None, "cactus", "blocked",
            f"HTTP {code}" if code else body[:120],
        )
    if code != 200:
        return CasLookupResult(cas, None, None, "cactus", "not_found", f"HTTP {code}")
    line = (body.splitlines() or [""])[0].strip()
    if not line or line.lower().startswith("error"):
        return CasLookupResult(cas, None, None, "cactus", "not_found")
    formula = _clean_formula(line)
    if not formula:
        return CasLookupResult(cas, None, None, "cactus", "not_found")
    name = _cactus_plain(cas, "iupac_name")
    mw = _parse_mr(_cactus_plain(cas, "mw"))
    smiles = _cactus_plain(cas, "smiles")
    inchikey = _cactus_plain(cas, "stdinchikey")
    if inchikey and inchikey.startswith("InChIKey="):
        inchikey = inchikey.split("=", 1)[1]
    inchi = _cactus_plain(cas, "stdinchi")
    return CasLookupResult(
        cas=cas,
        formula=formula,
        name=name,
        source="cactus",
        status="found",
        mr=mw,
        smiles=smiles,
        inchikey=inchikey,
        inchi=inchi,
    )


def enrich_identifiers(result: CasLookupResult) -> CasLookupResult:
    """Fill missing Mr / SMILES / InChI / InChIKey from CACTUS, then PubChem."""
    if result.status != "found" or not result.missing_identifiers():
        return result
    cas = result.cas
    mr, smiles, inchikey, inchi = result.mr, result.smiles, result.inchikey, result.inchi
    filled: list[str] = []

    if mr is None:
        mw = _parse_mr(_cactus_plain(cas, "mw"))
        if mw is not None:
            mr, filled = mw, filled + ["mr:cactus"]
    if not smiles:
        s = _cactus_plain(cas, "smiles")
        if s:
            smiles, filled = s, filled + ["smiles:cactus"]
    if not inchikey:
        k = _cactus_plain(cas, "stdinchikey")
        if k:
            if k.startswith("InChIKey="):
                k = k.split("=", 1)[1]
            inchikey, filled = k, filled + ["inchikey:cactus"]
    if not inchi:
        i = _cactus_plain(cas, "stdinchi")
        if i:
            inchi, filled = i, filled + ["inchi:cactus"]

    still_missing = mr is None or not smiles or not inchikey
    if still_missing:
        pub = lookup_pubchem(cas)
        if pub.status == "found":
            if mr is None and pub.mr is not None:
                mr, filled = pub.mr, filled + ["mr:pubchem"]
            if not smiles and pub.smiles:
                smiles, filled = pub.smiles, filled + ["smiles:pubchem"]
            if not inchikey and pub.inchikey:
                inchikey, filled = pub.inchikey, filled + ["inchikey:pubchem"]
            if not inchi and pub.inchi:
                inchi, filled = pub.inchi, filled + ["inchi:pubchem"]

    name = result.name
    if result.source not in ("chemicalbook", "lookchem") and (
        mr is None or not name
    ):
        cb = lookup_chemicalbook(cas)
        # ChemicalBook may return name/Mr even when formula is junk (status not_found).
        if cb.name or cb.mr is not None or cb.synonyms or cb.status == "found":
            if mr is None and cb.mr is not None:
                mr, filled = cb.mr, filled + ["mr:chemicalbook"]
            if not name and cb.name:
                name, filled = cb.name, filled + ["name:chemicalbook"]
            if not result.synonyms and cb.synonyms:
                filled = filled + ["synonyms:chemicalbook"]
            if not result.cbnumber and cb.cbnumber:
                filled = filled + ["cbnumber:chemicalbook"]
            if cb.synonyms or cb.cbnumber:
                result = replace(
                    result,
                    synonyms=result.synonyms or cb.synonyms,
                    cbnumber=result.cbnumber or cb.cbnumber,
                )

    if result.source != "lookchem" and (mr is None or not inchi or not name):
        lc = lookup_lookchem(cas)
        if lc.status == "found":
            if mr is None and lc.mr is not None:
                mr, filled = lc.mr, filled + ["mr:lookchem"]
            if not inchi and lc.inchi:
                inchi, filled = lc.inchi, filled + ["inchi:lookchem"]
            if not name and lc.name:
                name, filled = lc.name, filled + ["name:lookchem"]

    if not filled:
        return result
    note = result.notes
    extra = "enrich " + ",".join(filled)
    notes = f"{note}; {extra}" if note else extra
    return replace(
        result, name=name, mr=mr, smiles=smiles, inchikey=inchikey, inchi=inchi, notes=notes,
    )


# ---------------------------------------------------------------------------
# ChemicalBook (CASEN_{cas}.htm)
# ---------------------------------------------------------------------------

def _chemicalbook_field(html: str, label: str) -> str | None:
    """Match Identification / Chemical Properties labels (nbsp / trailing space OK)."""
    want = re.sub(r"\s+", " ", label).strip().lower()
    for m in _CB_FIELD.finditer(html):
        got = re.sub(r"\s+", " ", m.group(1).replace("&nbsp;", " ")).strip().lower()
        if got != want:
            continue
        raw = _STRIP_TAGS.sub("", m.group(2))
        raw = raw.replace("&nbsp;", " ")
        raw = re.sub(r"\s+", " ", raw).strip()
        return raw or None
    return None


def _chemicalbook_abs_url(path: str | None) -> str | None:
    if not path:
        return None
    if path.startswith("http"):
        return path
    return "https://www.chemicalbook.com" + (path if path.startswith("/") else "/" + path)


def parse_chemicalbook_cas(cas: str, text: str) -> CasLookupResult:
    """Parse ChemicalBook ``CASEN_{cas}.htm`` — formula, name, synonyms, Mr, props."""
    if not text:
        return CasLookupResult(cas, None, None, "chemicalbook", "error", "empty body")
    if "CAS DataBase" not in text and f"CASEN_{cas}" not in text:
        return CasLookupResult(cas, None, None, "chemicalbook", "not_found", "no CAS page")

    page_cas = _chemicalbook_field(text, "CAS")
    if page_cas:
        page_cas = re.sub(r"[^0-9-]", "", page_cas)
        if page_cas and page_cas != cas:
            return CasLookupResult(
                cas, None, None, "chemicalbook", "not_found",
                f"page cas {page_cas} ≠ {cas}",
            )

    formula_raw = _chemicalbook_field(text, "Molecular Formula")
    formula = _clean_formula(formula_raw or "") or None

    name = _chemicalbook_field(text, "Name")
    if not name:
        m_n = _CB_PRODUCT_NAME.search(text)
        if m_n:
            name = m_n.group(1).strip() or None

    synonyms = _chemicalbook_field(text, "Synonyms")
    if synonyms:
        # Collapse multi-synonym blocks; keep first ~300 chars for CSV
        synonyms = re.sub(r"\s+", " ", synonyms).strip()[:300] or None

    mr = _parse_mr(_chemicalbook_field(text, "Molecular Weight"))
    m_cb = _CB_NUMBER.search(text)
    cbnumber = m_cb.group(1) if m_cb else None

    mol_m = re.search(r'href="(/CAS/[^"]+\.mol)"', text, re.I)
    struct_m = re.search(r'src="(/CAS/[^"]+\.(?:gif|png|jpg))"', text, re.I)
    extras: list[str] = ["CASEN.htm"]
    if cbnumber:
        extras.append(cbnumber)
    mol_url = _chemicalbook_abs_url(mol_m.group(1) if mol_m else None)
    struct_url = _chemicalbook_abs_url(struct_m.group(1) if struct_m else None)
    if mol_url:
        extras.append(f"mol={mol_url}")
    if struct_url:
        extras.append(f"structure={struct_url}")

    for label, key in (
        ("Melting point", "mp"),
        ("Boiling point", "bp"),
        ("density", "density"),
        ("solubility", "solubility"),
        ("form", "form"),
        ("color", "color"),
    ):
        val = _chemicalbook_field(text, label)
        if val:
            extras.append(f"{key}={val[:80]}")

    notes = "; ".join(extras)
    has_payload = bool(name or synonyms or mr is not None or (formula and not _is_junk_formula(formula)))
    if _is_junk_formula(formula):
        # Keep name / Mr / synonyms for review; cascade will not treat as found.
        reason = f"junk formula {formula_raw!r}" if formula_raw else "empty formula"
        return CasLookupResult(
            cas=cas,
            formula=None,
            name=name,
            source="chemicalbook",
            status="not_found",
            notes=f"{notes}; {reason}",
            mr=mr,
            synonyms=synonyms,
            cbnumber=cbnumber,
        )
    if not has_payload:
        return CasLookupResult(
            cas, None, None, "chemicalbook", "not_found", notes or "empty page",
        )
    return CasLookupResult(
        cas=cas,
        formula=formula,
        name=name,
        source="chemicalbook",
        status="found",
        mr=mr,
        notes=notes,
        synonyms=synonyms,
        cbnumber=cbnumber,
    )


def lookup_chemicalbook(cas: str) -> CasLookupResult:
    """ChemicalBook CAS DataBase page (``CASEN_{cas}.htm``)."""
    code, body = _http_get(
        CHEMICALBOOK_CAS_URL.format(cas=cas), accept="text/html",
    )
    if code in (403, 429, 503) or code == 0:
        return CasLookupResult(
            cas, None, None, "chemicalbook", "blocked",
            f"HTTP {code}" if code else body[:120],
        )
    if code == 404:
        return CasLookupResult(cas, None, None, "chemicalbook", "not_found", "HTTP 404")
    if code != 200:
        return CasLookupResult(cas, None, None, "chemicalbook", "error", f"HTTP {code}")
    return parse_chemicalbook_cas(cas, body)


# ---------------------------------------------------------------------------
# LookChem (newsell/searchdata.aspx)
# ---------------------------------------------------------------------------

def parse_lookchem_search(cas: str, text: str) -> CasLookupResult:
    """Parse ``newsell/searchdata.aspx?key=`` HTML."""
    if not text:
        return CasLookupResult(cas, None, None, "lookchem", "error", "empty body")
    if re.search(r"0\s+results?\s+found", text, re.I) and "Molecular Formula:" not in text:
        return CasLookupResult(cas, None, None, "lookchem", "not_found")
    m_cas = _LOOKCHEM_CAS.search(text)
    if m_cas and m_cas.group(1) != cas:
        return CasLookupResult(
            cas, None, None, "lookchem", "not_found",
            f"page cas {m_cas.group(1)} ≠ {cas}",
        )
    m_f = _LOOKCHEM_FORMULA.search(text)
    if not m_f:
        return CasLookupResult(cas, None, None, "lookchem", "not_found")
    formula = _clean_formula(m_f.group(1))
    if _is_junk_formula(formula):
        return CasLookupResult(
            cas, None, None, "lookchem", "not_found",
            f"junk formula {m_f.group(1)!r}",
        )
    m_w = _LOOKCHEM_WEIGHT.search(text)
    mr = _parse_mr(m_w.group(1)) if m_w else None
    name = None
    m_n = _LOOKCHEM_NAME.search(text)
    if m_n:
        name = _STRIP_TAGS.sub("", m_n.group(1)).strip() or None
    inchi = None
    # Detail page often has InChI; try when search hit is enough for formula
    code, detail = _http_get(LOOKCHEM_DETAIL_URL.format(cas=cas), accept="text/html")
    if code == 200:
        m_i = _LOOKCHEM_INCHI.search(detail)
        if m_i:
            inchi = m_i.group(1)
        if not name:
            m_pn = re.search(r"Product Name:\s*</[^>]+>\s*([^<\n]+)", detail, re.I)
            if m_pn:
                name = m_pn.group(1).strip() or None
        if mr is None:
            m_mw = re.search(r"Molecular Weight:\s*([0-9.]+)", detail, re.I)
            if m_mw:
                mr = _parse_mr(m_mw.group(1))
    return CasLookupResult(
        cas=cas,
        formula=formula,
        name=name,
        source="lookchem",
        status="found",
        mr=mr,
        inchi=inchi,
        notes="searchdata.aspx" + ("; casno detail" if code == 200 else ""),
    )


def lookup_lookchem(cas: str) -> CasLookupResult:
    """LookChem product search by CAS (``newsell/searchdata.aspx``)."""
    code, body = _http_get(
        LOOKCHEM_SEARCH_URL.format(q=_q(cas)), accept="text/html",
    )
    if code in (403, 429, 503) or code == 0:
        return CasLookupResult(
            cas, None, None, "lookchem", "blocked",
            f"HTTP {code}" if code else body[:120],
        )
    if code == 404:
        return CasLookupResult(cas, None, None, "lookchem", "not_found", "HTTP 404")
    if code != 200:
        return CasLookupResult(cas, None, None, "lookchem", "error", f"HTTP {code}")
    return parse_lookchem_search(cas, body)


# ---------------------------------------------------------------------------
# Cascade
# ---------------------------------------------------------------------------

def lookup_cas(cas: str, *, enrich: bool = True) -> CasLookupResult:
    """PubChem → NIST → CACTUS → ChemicalBook → LookChem.

    Trusted sources (PubChem, NIST) win immediately. Untrusted formulas are verified;
    failures become ``needs_recheck`` candidates while the cascade continues. If nothing
    solid is found, the first recheck candidate is returned.
    """
    trail: list[str] = []
    hit: CasLookupResult | None = None
    recheck: CasLookupResult | None = None
    for fn in (
        lookup_pubchem,
        lookup_nist_webbook,
        lookup_cactus,
        lookup_chemicalbook,
        lookup_lookchem,
    ):
        r = fn(cas)
        if r.status == "found" and _is_junk_formula(r.formula):
            trail.append(f"{r.source}=junk_formula")
            continue
        if r.status == "found":
            r = apply_formula_verification(r)
        trail.append(f"{r.source}={r.status}")
        if r.status == "found":
            note = "; ".join(trail[:-1])
            if note:
                r = replace(
                    r,
                    notes=f"{r.notes}; via {note}" if r.notes else f"via {note}",
                )
            hit = r
            break
        if r.status == "needs_recheck" and recheck is None:
            note = "; ".join(trail[:-1])
            if note:
                r = replace(
                    r,
                    notes=f"{r.notes}; via {note}" if r.notes else f"via {note}",
                )
            recheck = r
    if hit is None:
        if recheck is not None:
            return recheck
        return CasLookupResult(
            cas, None, None, "none", "not_found", "; ".join(trail),
        )
    return enrich_identifiers(hit) if enrich else hit


def unresolved_cas_needing_formula(
    unresolved_path: Path,
    proposals_path: Path | None = None,
) -> list[tuple[str, str]]:
    """CAS (+ label) from unresolved.json that still lack a proposed formula."""
    data = json.loads(unresolved_path.read_text(encoding="utf-8"))
    entries = data["entries"] if isinstance(data, dict) else data
    have_formula: set[str] = set()
    if proposals_path and proposals_path.is_file():
        with proposals_path.open(encoding="utf-8") as f:
            for row in csv.DictReader(f):
                if row.get("formula"):
                    have_formula.add(row["cas"])
    out: list[tuple[str, str]] = []
    for e in entries:
        cas = str(e.get("cas") or "")
        if not cas or cas in have_formula:
            continue
        labels = e.get("labels") or []
        label = labels[0] if labels else ""
        out.append((cas, label))
    return out


def verify_cas_list(
    items: Iterable[tuple[str, str]],
    *,
    delay_s: float = 0.25,
    progress_every: int = 50,
    enrich: bool = True,
) -> list[dict[str, str]]:
    """Look up each CAS; return CSV-ready rows including original label."""
    rows: list[dict[str, str]] = []
    items = list(items)
    for i, (cas, label) in enumerate(items, 1):
        r = lookup_cas(cas, enrich=enrich)
        row = r.as_row()
        row["label"] = label
        rows.append(row)
        if progress_every and i % progress_every == 0:
            found = sum(1 for x in rows if x["status"] == "found")
            print(f"[cas-lookup] {i}/{len(items)}  found={found}", flush=True)
        time.sleep(delay_s)
    return rows


CSV_FIELDS = [
    "cas", "label", "formula", "expected_formula", "name", "synonyms", "cbnumber",
    "mr", "smiles", "inchikey", "inchi", "source", "status", "notes",
]


def write_verify_csv(rows: list[dict[str, str]], path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CSV_FIELDS, extrasaction="ignore")
        w.writeheader()
        for row in rows:
            w.writerow({k: row.get(k, "") for k in CSV_FIELDS})
    return path
