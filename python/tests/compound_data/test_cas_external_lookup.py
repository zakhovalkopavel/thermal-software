"""Unit tests for ChemicalBook parsing and marketplace formula verification."""
from __future__ import annotations

import importlib.util
import sys
import types
from pathlib import Path

# Host: …/python/tests/compound_data → parents[2]=…/python
# Docker: /app/tests/compound_data → parents[2]=/app (src mounted at /app/src)
_PYTHON_ROOT = Path(__file__).resolve().parents[2]
MOD_PATH = _PYTHON_ROOT / "src" / "compound_data" / "cas_external_lookup.py"


def _load():
    pkg = types.ModuleType("compound_data")
    pkg.__path__ = [str(_PYTHON_ROOT / "src" / "compound_data")]
    sys.modules.setdefault("compound_data", pkg)
    # Prefer already-loaded module after edits in the same interpreter.
    if "compound_data.cas_external_lookup" in sys.modules:
        del sys.modules["compound_data.cas_external_lookup"]
    spec = importlib.util.spec_from_file_location(
        "compound_data.cas_external_lookup", MOD_PATH,
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules["compound_data.cas_external_lookup"] = mod
    spec.loader.exec_module(mod)
    return mod


CB_SAMPLE = """
<html><title>16406-49-8 | CAS DataBase</title>
<a data-cbnumber="CB24652850" data-product-name="osmium pentacarbonyl"></a>
<img src="/CAS/20200331/GIF/16406-49-8.gif" alt="structure"/>
<a href="/CAS/20200331/mol/16406-49-8.mol">16406-49-8.mol</a>
<table>
<tr><td><font>[Name]</font><br /><br />osmium pentacarbonyl</td></tr>
<tr><td><font>[CAS]</font><br /><br /><b>16406-49-8</b></td></tr>
<tr><td><font>[Synonyms]</font><br /><br />osmium pentacarbonyl</td></tr>
<tr><td><font>[Molecular Formula]</font><br /><br />C5H10O5Os</td></tr>
<tr><td><font>[Molecular Weight]</font><br /><br />340.36</td></tr>
<tr><td><font>[Melting point&nbsp;]</font><br /><br />2°C</td></tr>
<tr><td><font>[form&nbsp;]</font><br /><br />pale yellow liquid</td></tr>
</table>
</html>
"""


def test_parse_chemicalbook_cas():
    m = _load()
    r = m.parse_chemicalbook_cas("16406-49-8", CB_SAMPLE)
    assert r.status == "found"
    assert r.source == "chemicalbook"
    assert r.formula == "C5H10O5Os"
    assert r.name == "osmium pentacarbonyl"
    assert r.synonyms == "osmium pentacarbonyl"
    assert r.cbnumber == "CB24652850"
    assert r.mr == 340.36
    assert "mp=2°C" in (r.notes or "")


def test_osmium_pentacarbonyl_expected_os_co5():
    m = _load()
    assert m.expected_formula_from_name("osmium pentacarbonyl") == "C5O5Os"
    assert m.expected_formula_from_name("Osmium pentacarbonyl") == "C5O5Os"
    assert m.expected_formula_from_name("chromium hexacarbonyl") == "C6CrO6"
    assert m.expected_formula_from_name("nickel tetracarbonyl") == "C4NiO4"


def test_chemicalbook_osmium_fails_verification():
    """CB's C5H10O5Os must not be accepted; Os(CO)5 → C5O5Os goes to recheck."""
    m = _load()
    raw = m.parse_chemicalbook_cas("16406-49-8", CB_SAMPLE)
    r = m.apply_formula_verification(raw)
    assert r.status == "needs_recheck"
    assert r.expected_formula == "C5O5Os"
    assert r.formula == "C5H10O5Os"
    assert "name expects" in (r.notes or "")


def test_verified_hexenol_with_mr():
    m = _load()
    raw = m.CasLookupResult(
        cas="77053-92-0",
        formula="C7H14O",
        name="5-methyl-2-hexenol",
        source="chemicalbook",
        status="found",
        mr=114.19,
    )
    r = m.apply_formula_verification(raw)
    assert r.status == "found"
    assert r.formula == "C7H14O"


def test_unverified_without_mr_or_name_expectation():
    m = _load()
    raw = m.CasLookupResult(
        cas="x",
        formula="C7H14O",
        name="5-methyl-2-hexenol",
        source="chemicalbook",
        status="found",
        mr=None,
    )
    r = m.apply_formula_verification(raw)
    assert r.status == "needs_recheck"
    assert "unverified" in (r.notes or "")


def test_pubchem_trusted_skips_verification():
    m = _load()
    raw = m.CasLookupResult(
        cas="x",
        formula="C5H10O5Os",
        name="osmium pentacarbonyl",
        source="pubchem",
        status="found",
    )
    r = m.apply_formula_verification(raw)
    assert r.status == "found"
    assert r.formula == "C5H10O5Os"


def test_deuterated_name_rejects_undeuterated_formula():
    m = _load()
    raw = m.CasLookupResult(
        cas="3748-86-5",
        formula="C5H5N",
        name="Pyridine-3-d",
        source="chemicalbook",
        status="found",
        mr=80.11,
    )
    r = m.apply_formula_verification(raw)
    assert r.status == "needs_recheck"
    assert "deuterated" in (r.notes or "")


def test_lowercase_d_normalized_to_capital_D():
    """Deuterium in formulas must be D, never d (Cd/Pd stay intact)."""
    m = _load()
    assert m._normalize_deuterium_symbol("C5H4dN") == "C5H4DN"
    assert m._normalize_deuterium_symbol("C6d6") == "C6D6"
    assert m._normalize_deuterium_symbol("CdCl2") == "CdCl2"
    assert m._normalize_deuterium_symbol("Pd") == "Pd"
    assert m._clean_formula("C5H4dN") == "C5H4DN"
    assert m._to_hill("C5H4dN") == "C5H4DN"
    assert m._to_hill("C5H4DN") == "C5H4DN"
    mr = m._formula_mr("C5H4DN")
    assert mr is not None
    assert abs(mr - 80.11) < 0.05


def test_verified_deuterated_formula_keeps_D():
    m = _load()
    raw = m.CasLookupResult(
        cas="3748-86-5",
        formula="C5H4dN",  # marketplace lowercase
        name="pyridine-3-d",
        source="chemicalbook",
        status="found",
        mr=80.11,
    )
    r = m.apply_formula_verification(raw)
    assert r.status == "found"
    assert r.formula == "C5H4DN"


def test_parse_chemicalbook_junk_formula_keeps_name():
    m = _load()
    html = CB_SAMPLE.replace("C5H10O5Os", "C")
    r = m.parse_chemicalbook_cas("16406-49-8", html)
    assert r.status == "not_found"
    assert r.name == "osmium pentacarbonyl"
    assert r.mr == 340.36
    assert "junk" in (r.notes or "").lower()


def test_is_junk_formula():
    m = _load()
    assert m._is_junk_formula("C")
    assert m._is_junk_formula("")
    assert m._is_junk_formula(None)
    assert not m._is_junk_formula("C5O5Os")
    assert not m._is_junk_formula("C7H14O")
