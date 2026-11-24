"""Unit tests for English name → formula proposals."""
from __future__ import annotations

from compound_data.name_to_formula import load_exact_name_dict, name_to_formula


def test_calcium_carbide():
    r = name_to_formula("Calcium carbide", exact_dict={})
    assert r.formula == "CaC2"
    assert r.status == "proposed"


def test_aluminum_bromide_hexahydrate():
    r = name_to_formula("Aluminum bromide hexahydrate", exact_dict={})
    assert r.formula == "AlBr3·6H2O"
    assert r.status == "proposed"


def test_samarium_trinitrate_hexahydrate():
    r = name_to_formula("samarium trinitrate hexahydrate", exact_dict={})
    assert r.formula == "Sm(NO3)3·6H2O"


def test_ferrous_sulfate_heptahydrate():
    r = name_to_formula("ferrous sulfate heptahydrate", exact_dict={})
    assert r.formula == "FeSO4·7H2O"


def test_aluminum_nitrate_nonahydrate():
    r = name_to_formula("aluminum nitrate nonahydrate", exact_dict={})
    assert r.formula == "Al(NO3)3·9H2O"


def test_aluminum_potassium_sulfate_dodecahydrate():
    r = name_to_formula("aluminum potassium sulfate dodecahydrate", exact_dict={})
    assert r.formula == "KAl(SO4)2·12H2O"


def test_copper_nitrate_trihydrate_defaults_to_ii():
    r = name_to_formula("copper nitrate trihydrate", exact_dict={})
    assert r.formula == "Cu(NO3)2·3H2O"


def test_trisodium_phosphate_dodecahydrate():
    r = name_to_formula("trisodium phosphate dodecahydrate", exact_dict={})
    assert r.formula == "Na3PO4·12H2O"


def test_aluminium_spelling():
    r = name_to_formula("Aluminium bromide hexahydrate", exact_dict={})
    assert r.formula == "AlBr3·6H2O"


def test_iron_boride_from_parens():
    r = name_to_formula("Iron boride (Fe2B)", exact_dict={})
    assert r.formula == "Fe2B"
    assert r.status == "from_parens"


def test_iron_iii_chloride():
    r = name_to_formula("Iron(III) chloride", exact_dict={})
    assert r.formula == "FeCl3"
    assert r.status == "proposed"


def test_multivalent_without_roman_needs_review():
    r = name_to_formula("Iron chloride", exact_dict={})
    assert r.formula is None
    assert r.method == "needs_review"


def test_exact_dict_hit():
    d = {"sodium chloride": "NaCl"}
    r = name_to_formula("Sodium chloride", exact_dict=d)
    assert r.formula == "NaCl"
    assert r.status == "exact_dict"


def test_rhenium_trioxychloride():
    r = name_to_formula("Rhenium(VII) trioxychloride", exact_dict={})
    assert r.formula == "ReO3Cl"
    assert r.status == "proposed"


def test_silicon_dioxide():
    r = name_to_formula("Silicon dioxide", exact_dict={})
    assert r.formula == "SiO2"


def test_load_exact_name_dict_has_nacl():
    d = load_exact_name_dict()
    assert d.get("sodium chloride") == "NaCl"
