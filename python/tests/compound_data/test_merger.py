"""Tests for identifiers, formula resolution and merging."""
from __future__ import annotations

import pytest
from chemicals_fixtures import tsv

from chemical_formula.organic_family import OrganicFamilyClassifier
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.constants.source_tables import SOURCE_TABLES
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.identifier import Identifier
from chemicals_tables.parsers.identifiers import load_identifiers
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.source_entry import SourceEntry
from compound_data.merger import merge_compounds
from references import RefKey


@pytest.fixture(scope="module")
def classifier():
    return OrganicFamilyClassifier()


def _ids(*rows):
    return tsv(*rows)


@pytest.fixture
def identifier_source(make_source):
    return make_source({
        "Inorganic db": _ids(
            [-1, "1344-28-1", "Al2O3", 101.961, "O=[Al]O[Al]=O", "", "TWNQ", "iupac", "aluminium oxide"],
        ),
        "pubchem small": _ids(
            [14769, "1344-28-1", "Al2O3", 101.96, "", "", "", "", "electrocorundum"],
            [702, "64-17-5", "C2H6O", 46.07, "CCO", "", "LFQSCWFLJHTTHZ-UHFFFAOYSA-N", "ethanol", "ethanol"],
            [6587, "79-24-3", "C2H5NO2", 75.07, "CCN(=O)=O", "", "", "nitroethane", "nitroethane"],
            [1, "12004-39-6", "Al2O7Ti2", 293.7, "", "", "", "", "aluminum titanate"],
        ),
        "pubchem large": _ids(
            [9, "64-17-5", "C2H6O", 46.0, "", "", "", "", "large ethanol"],
            [10, "7440-37-1", "Ar", 39.948, "[Ar]", "", "", "argon", "argon"],
        ),
    })


class TestIdentifiers:
    def test_precedence_and_only_wanted(self, identifier_source, chem):
        found = load_identifiers(identifier_source, chem, {"1344-28-1", "64-17-5", "7440-37-1"})
        assert found["1344-28-1"].name == "aluminium oxide"
        assert found["1344-28-1"].source.table == "Inorganic db"
        assert found["64-17-5"].source.table == "pubchem small" and found["64-17-5"].source.line == 2
        assert found["7440-37-1"].source.table == "pubchem large"
        assert "79-24-3" not in found


def _prop(cas, value, ref, chem, table="CRC inorganic constants", formula=None, label=None):
    return SourceEntry(
        cas=cas, formula=formula, label=label, property="meltingPoint",
        value=PropertyValue(value, ref, chem.link(SOURCE_TABLES[table], 2, label)),
    )


def _eq(cas, ref, type_, chem, table, formula=None, phase="solid"):
    return SourceEntry(
        cas=cas, formula=formula, label=formula, property="heatCapacity", phase=phase,
        value=EquationValue(type_, ref, {"a": 1, "b": 0, "d": 0}, 300, 1000, chem.link(SOURCE_TABLES[table], 3)),
    )


class TestMerge:
    def test_override_and_conflict(self, identifier_source, chem, classifier):
        ids = load_identifiers(identifier_source, chem, {"12004-39-6"})
        result = merge_compounds([_prop("12004-39-6", 2133.15, RefKey.CRC95, chem)], ids, classifier)
        record = result.records["12004-39-6"]
        assert record.formula == "Al2TiO5" and record.group == "Ti"
        assert record.Mr is None
        conflict = next(c for c in result.conflicts if c["cas"] == "12004-39-6")
        assert conflict["resolution"] == "override" and conflict["identifierFormula"] == "Al2O7Ti2"

    def test_class_override_and_formula_rule_are_reported(self, chem, classifier):
        link = chem.link(SOURCE_TABLES["pubchem small"], 1)
        ids = {"74-90-8": Identifier("74-90-8", "CHN", 27.03, "C#N", None, "hydrogen cyanide", link)}
        entries = [_prop("74-90-8", 259.9, RefKey.CRC95, chem),
                   _prop(None, 250.3, RefKey.CRC95, chem, formula="CCl4", label="carbon tetrachloride")]
        result = merge_compounds(entries, ids, classifier)
        hcn = result.records["74-90-8"]
        assert (hcn.compound_class, hcn.group, hcn.display_formula) == ("inorganic", "C", "HCN")
        assert result.class_overridden == [{
            "cas": "74-90-8", "formula": "CHN", "name": "hydrogen cyanide", "class": "inorganic",
            "bondRule": True, "reason": result.class_overridden[0]["reason"],
        }]
        ccl4 = result.records["formula:CCl4"]
        assert (ccl4.compound_class, ccl4.group, ccl4.families) == ("organic", "halogenated", ["halogenated"])
        assert result.class_from_formula == [
            {"cas": None, "formula": "CCl4", "name": "carbon tetrachloride", "class": "organic"},
        ]
        assert result.family_from_formula == [
            {"cas": None, "formula": "CCl4", "name": "carbon tetrachloride", "family": "halogenated"},
        ]

    def test_values_kept_and_def_follows_priority(self, identifier_source, chem, classifier):
        ids = load_identifiers(identifier_source, chem, {"7440-37-1"})
        entries = [
            _eq("7440-37-1", RefKey.NISTWebBook, EquationType.shomate, chem, "WebBook Shomate", phase="gas"),
            _eq("7440-37-1", RefKey.Poling5, EquationType.quartic, chem, "Poling databank", phase="gas"),
            _eq("7440-37-1", RefKey.Perry8, EquationType.dipprN102, chem, "Perry 2-312", phase="gas"),
            _prop("7440-37-1", 83.8, RefKey.CRC95, chem),
            _prop("7440-37-1", 83.81, RefKey.CRC95, chem),
        ]
        record = merge_compounds(entries, ids, classifier).records["7440-37-1"]
        gas = record.to_dict()["equations"]["heatCapacity"]["gas"]
        assert [v["ref"][0] for v in gas["values"]] == ["Perry8", "Poling5", "NISTWebBook"]
        assert gas["def"] == 0
        assert [p.value for p in record.properties["meltingPoint"]] == [83.8, 83.81]
        assert record.Mr == pytest.approx(0.039948)

    def test_def_skips_planned_types(self, identifier_source, chem, classifier):
        ids = load_identifiers(identifier_source, chem, {"64-17-5"})
        entries = [
            _eq("64-17-5", RefKey.Perry8, EquationType.dipprN114, chem, "Perry 2-153 DIPPR 114", phase="liquid"),
            _eq("64-17-5", RefKey.Perry8, EquationType.quartic, chem, "Perry 2-153 DIPPR 100", phase="liquid"),
        ]
        record = merge_compounds(entries, ids, classifier).records["64-17-5"]
        assert record.to_dict()["equations"]["heatCapacity"]["liquid"]["def"] == 1
        assert (record.compound_class, record.group) == ("organic", "alcohols")

    def test_wrong_cas_row_is_detached(self, identifier_source, chem, classifier):
        ids = load_identifiers(identifier_source, chem, {"79-24-3"})
        entries = [
            _eq("79-24-3", RefKey.Perry8, EquationType.linearHyperbolic, chem, "Perry 2-151", formula="Ne",
                phase="gas"),
            _prop("79-24-3", 183.6, RefKey.CRC95, chem),
        ]
        result = merge_compounds(entries, ids, classifier)
        assert result.records["formula:Ne"].cas is None
        assert (result.records["formula:Ne"].compound_class, result.records["formula:Ne"].group) == ("inorganic", "Ne")
        assert "heatCapacity" not in result.records["79-24-3"].equations
        assert any(c["resolution"] == "detached" and c["sourceFormula"] == "Ne" for c in result.conflicts)

    def test_proportional_formula_keeps_cas(self, identifier_source, chem, classifier):
        ids = load_identifiers(identifier_source, chem, {"1344-28-1"})
        entry = _eq("1344-28-1", RefKey.Perry8, EquationType.linearHyperbolic, chem, "Perry 2-151",
                    formula="Al4O6")
        result = merge_compounds([entry], ids, classifier)
        assert "heatCapacity" in result.records["1344-28-1"].equations

    def test_unresolved(self, chem, classifier):
        entries = [
            _prop(None, 1.0, RefKey.Zabransky1996, chem, label="Pentaethoxyuranium"),
            _prop("50-00-0", 2.0, RefKey.Yaws2014, chem, label="formaldehyde"),
        ]
        result = merge_compounds(entries, {}, classifier)
        assert result.records == {}
        assert [u["reason"] for u in result.unresolved] == ["no CAS and no formula", "formula not found"]

    def test_unknown_cas_moves_to_the_identified_record(self, identifier_source, chem, classifier):
        ids = load_identifiers(identifier_source, chem, {"7440-37-1"})
        entries = [
            _prop("7440-37-1", 83.8, RefKey.CRC95, chem),
            _eq("1111-11-1", RefKey.Perry8, EquationType.linearHyperbolic, chem, "Perry 2-151", formula="Ar",
                phase="gas"),
        ]
        result = merge_compounds(entries, ids, classifier)
        assert list(result.records) == ["7440-37-1"]
        argon = result.records["7440-37-1"]
        assert argon.other_cas == ["1111-11-1"]
        assert argon.equations["heatCapacity"]["gas"][0].ref == RefKey.Perry8
        assert result.unknown_cas_moved == [
            {"from": "1111-11-1", "cas": "1111-11-1", "formula": "Ar", "name": "Ar", "id": "7440-37-1"},
        ]

    def test_unknown_organic_cas_is_kept(self, identifier_source, chem, classifier):
        ids = load_identifiers(identifier_source, chem, {"64-17-5"})
        entries = [
            _prop("64-17-5", 351.4, RefKey.CRC95, chem),
            _prop("115-10-6", 248.3, RefKey.CRC95, chem, formula="C2H6O", label="Dimethyl ether"),
        ]
        result = merge_compounds(entries, ids, classifier)
        assert set(result.records) == {"64-17-5", "115-10-6"}
        assert result.unknown_cas_kept == [
            {"id": "115-10-6", "cas": "115-10-6", "formula": "C2H6O", "name": "Dimethyl ether",
             "candidates": ["64-17-5"]},
        ]

    def test_unknown_cas_without_single_target_is_kept(self, chem, classifier):
        entries = [_eq("2222-22-2", RefKey.Perry8, EquationType.linearHyperbolic, chem, "Perry 2-151", formula="Kr",
                       phase="gas")]
        result = merge_compounds(entries, {}, classifier)
        assert "2222-22-2" in result.records
        assert result.unknown_cas_kept[0]["candidates"] == []

    def test_detached_row_moves_to_the_identified_record(self, identifier_source, chem, classifier):
        ids = load_identifiers(identifier_source, chem, {"79-24-3", "7440-37-1"})
        entries = [
            _prop("7440-37-1", 83.8, RefKey.CRC95, chem),
            _eq("79-24-3", RefKey.Perry8, EquationType.linearHyperbolic, chem, "Perry 2-151", formula="Ar",
                phase="gas"),
        ]
        result = merge_compounds(entries, ids, classifier)
        assert "formula:Ar" not in result.records
        argon = result.records["7440-37-1"]
        assert "gas" in argon.equations["heatCapacity"] and argon.other_cas == []
        assert result.no_cas_moved == [
            {"from": "formula:Ar", "cas": None, "formula": "Ar", "name": "Ar", "id": "7440-37-1"},
        ]

    def test_isotope_formula_is_not_moved(self, identifier_source, chem, classifier):
        ids = {"1333-74-0": Identifier("1333-74-0", "H2", 2.016, "[HH]", None, "hydrogen",
                                       chem.link(SOURCE_TABLES["pubchem small"], 4, "hydrogen"))}
        entries = [
            _prop("1333-74-0", 13.99, RefKey.CRC95, chem),
            _eq(None, RefKey.Perry8, EquationType.linearHyperbolic, chem, "Perry 2-151", formula="D2", phase="gas"),
        ]
        result = merge_compounds(entries, ids, classifier)
        assert "formula:D2" in result.records
        assert result.no_cas_kept[0]["id"] == "formula:D2"

    def test_pubchem_cid_and_override_smiles(self, identifier_source, chem, classifier):
        ids = load_identifiers(identifier_source, chem, {"64-17-5"})
        entries = [
            _prop("64-17-5", 351.4, RefKey.CRC95, chem),
            SourceEntry(None, "C10H25O5U", "Pentaethoxyuranium", "meltingPoint",
                        PropertyValue(1.0, RefKey.Zabransky1996, chem.link(SOURCE_TABLES["Zabransky"], 2)),
                        smiles="CCO[U](OCC)(OCC)(OCC)OCC"),
        ]
        records = merge_compounds(entries, ids, classifier).records
        assert records["64-17-5"].pubchem_cid == 702
        assert records["64-17-5"].to_dict()["pubchemCid"] == 702
        assert records["formula:C10H25O5U"].smiles == "CCO[U](OCC)(OCC)(OCC)OCC"
        assert records["formula:C10H25O5U"].pubchem_cid is None

    def test_no_cas_record_uses_formula_id(self, chem, classifier):
        entry = _eq(None, RefKey.Perry8, EquationType.linearHyperbolic, chem, "Perry 2-151", formula="Ag2Al")
        record = merge_compounds([entry], {}, classifier).records["formula:Ag2Al"]
        assert (record.hill, record.group) == ("Ag2Al", "Al")
