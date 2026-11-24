"""Tests for janaf.janaf_formula, janaf.janaf_classes and janaf.janaf_files — placement of the tables."""
from __future__ import annotations

import json

import pytest

from janaf.janaf_classes import JanafClasses
from janaf.janaf_files import janaf_files, janaf_placement
from janaf.janaf_formula import janaf_charge, janaf_counts
from janaf.janaf_table import JanafTable

COMPOUNDS = {
    "74-82-8": {"class": "organic", "group": "alkanes", "hill": "CH4", "janaf": ["C-067"]},
    "2229-07-4": {"class": "organic", "group": "unclassified", "hill": "CH3", "janaf": ["C-062"]},
    "56-23-5": {"class": "organic", "group": "halogenated", "hill": "CCl4", "janaf": ["C-074"]},
    "74-90-8": {"class": "inorganic", "group": "C", "hill": "CHN", "janaf": ["C-084"]},
    "1344-28-1": {"class": "inorganic", "group": "Al", "hill": "Al2O3", "janaf": ["Al-096"]},
}


def _table(table_id: str, janaf_formula: str, name: str = "Test", formula: str = None) -> JanafTable:
    return JanafTable(table_id, name, formula, janaf_formula, "g")


class TestFormula:
    def test_counts(self):
        assert janaf_counts("O2Ti1") == {"O": 2, "Ti": 1}
        assert janaf_counts("Mo1O2.750") == {"Mo": 1, "O": 2.75}
        assert janaf_counts("Al1Cl2+") == {"Al": 1, "Cl": 2}
        assert janaf_counts("D2O1") == {"D": 2, "O": 1}

    def test_not_element_counts(self):
        assert janaf_counts("e1-") is None
        assert janaf_counts("Xx1") is None

    def test_charge(self):
        assert janaf_charge("Al1+") == "+"
        assert janaf_charge("Al1-") == "-"
        assert janaf_charge("O2Ti1") == ""


class TestPlacement:
    @pytest.fixture
    def classes(self):
        return JanafClasses(COMPOUNDS)

    @pytest.mark.parametrize("janaf_formula, expected", [
        ("O2Ti1", ("inorganic", "Ti", "O2Ti", "TiO2")),
        ("I1Ti1", ("inorganic", "Ti", "ITi", "TiI")),
        ("F4Ti1", ("inorganic", "Ti", "F4Ti", "TiF4")),
        ("Al2O3", ("inorganic", "Al", "Al2O3", "Al2O3")),
        ("H3N1", ("inorganic", "N", "H3N", "NH3")),
        ("H4N2", ("inorganic", "N", "H4N2", "N2H4")),
        ("H2O1", ("inorganic", "O", "H2O", "H2O")),
        ("D2O1", ("inorganic", "O", "D2O", "D2O")),
        ("Al1+", ("inorganic", "Al", "Al+", "Al+")),
        ("C1O2", ("inorganic", "C", "CO2", "CO2")),
        ("B4C1", ("inorganic", "B", "CB4", "B4C")),
    ])
    def test_inorganic(self, classes, janaf_formula, expected):
        assert janaf_placement(_table("X-001", janaf_formula), classes) == expected

    def test_organic_family_from_record(self, classes):
        assert janaf_placement(_table("C-067", "C1H4"), classes) == ("organic", "alkanes", "CH4", "CH4")

    def test_halocarbon_is_organic(self, classes):
        assert janaf_placement(_table("C-074", "C1Cl4"), classes) == ("organic", "halogenated", "CCl4", "CCl4")
        assert janaf_placement(_table("C-999", "C2F6"), classes) == ("organic", "halogenated", "C2F6", "C2F6")

    def test_formula_family_when_record_is_unclassified_or_missing(self, classes):
        assert janaf_placement(_table("C-062", "C1H3"), classes)[:2] == ("organic", "unclassified")
        assert janaf_placement(_table("C-050", "C1Cl3"), classes)[:2] == ("organic", "halogenated")
        assert janaf_placement(_table("C-051", "C1F1+"), classes)[:2] == ("organic", "halogenated")
        assert janaf_placement(_table("C-052", "C2H2"), classes)[:2] == ("organic", "alkynes")

    def test_carbon_carbon_bond_is_organic_without_record(self, classes):
        assert janaf_placement(_table("C-053", "C2N2"), classes) == ("organic", "unclassified", "C2N2", "C2N2")

    def test_record_class_wins_over_formula_rule(self, classes):
        assert janaf_placement(_table("C-084", "C1H1N1"), classes) == ("inorganic", "C", "CHN", "HCN")

    def test_ion_takes_class_of_neutral_formula(self, classes):
        assert janaf_placement(_table("C-998", "C1H4+"), classes) == ("organic", "alkanes", "CH4+", "CH4+")

    def test_organic_without_record(self, classes):
        assert janaf_placement(_table("C-997", "C2H6"), classes) == ("organic", "alkanes", "C2H6", "C2H6")
        assert janaf_placement(_table("C-996", "C1H1O1"), classes) == ("organic", "unclassified", "CHO", "CHO")

    def test_electron_gas(self, classes):
        table = _table("D-020", "e1-", "Electron Gas", "e-")
        assert janaf_placement(table, classes) == ("inorganic", "other", "e-", "e-")

    def test_missing_index_uses_formula_rule(self, tmp_path):
        classes = JanafClasses.from_index(tmp_path / "missing.json")
        assert janaf_placement(_table("C-067", "C1H4"), classes)[:2] == ("organic", "alkanes")
        assert janaf_placement(_table("C-084", "C1H1N1"), classes)[:2] == ("organic", "unclassified")

    def test_from_index(self, tmp_path):
        path = tmp_path / "index.json"
        path.write_text(json.dumps({"compounds": COMPOUNDS}))
        classes = JanafClasses.from_index(path)
        assert classes.lookup("C-067", "CH4") == ("organic", "alkanes")
        assert classes.lookup("X-001", "Al2O3") == ("inorganic", "Al")
        assert classes.lookup("X-001", "Xe") is None


class TestFiles:
    def test_file_named_after_iupac_formula_and_shortest_name(self):
        tables = [
            _table("Al-096", "Al2O3", "Aluminum Oxide, Alpha", "Al2O3"),
            _table("Al-101", "Al2O3", "Aluminum Oxide", "Al2O3"),
            _table("Ba-010", "Ba1H2O2", "Barium Hydroxide, Alpha (Ba(OH)2)", "Ba(OH)2"),
            _table("Ba-011", "Ba1H2O2", "Barium Hydroxide (Ba(OH)2)", "Ba(OH)2"),
            _table("O-045", "O2Ti1", "Titanium Oxide", "TiO2"),
        ]
        files = janaf_files(tables, JanafClasses())
        assert [(f.path, f.hill, f.display_formula, [t.table_id for t in f.tables]) for f in files] == [
            ("inorganic/Al/Al2O3-aluminum-oxide.json", "Al2O3", "Al2O3", ["Al-096", "Al-101"]),
            ("inorganic/Ba/BaO2H2-barium-hydroxide.json", "BaH2O2", "BaO2H2", ["Ba-010", "Ba-011"]),
            ("inorganic/Ti/TiO2-titanium-oxide.json", "O2Ti", "TiO2", ["O-045"]),
        ]

    def test_ions_get_own_file(self):
        tables = [_table("Al-001", "Al1", "Aluminum"), _table("Al-002", "Al1+", "Aluminum, Ion")]
        assert [f.path for f in janaf_files(tables, JanafClasses())] == [
            "inorganic/Al/Al+-aluminum-ion.json", "inorganic/Al/Al-aluminum.json",
        ]
