"""Tests for compound_data.nasa_links — NASA-7 / NASA-9 keys attached by Hill formula and checked by ΔfH°(298.15)."""
from __future__ import annotations

import json

import pytest

from chemicals_tables.constants.source_tables import SOURCE_TABLES
from chemicals_tables.property_value import PropertyValue
from compound_data.builder import _attach_nasa
from compound_data.compound_record import CompoundRecord
from compound_data.merger import MergeResult
from compound_data.nasa_links import NasaSpecies, attach_nasa, nasa7_species, nasa9_species
from compound_data.writers import write_compound_sources
from nasa_thermo.nasa7_coeffs import Nasa7Coeffs
from nasa_thermo.nasa7_equation import Nasa7Equation
from nasa_thermo.nasa7_species import Nasa7Species
from nasa_thermo.nasa9_coeffs import Nasa9Coeffs
from nasa_thermo.nasa9_equation import Nasa9Equation
from nasa_thermo.nasa9_range import Nasa9Range
from nasa_thermo.nasa9_species import Nasa9Species
from references import RefKey

GENERATED = "2026-10-12T00:00:00+00:00"


@pytest.fixture
def make_record(chem):
    crc = SOURCE_TABLES["CRC standard thermodynamic"]

    def _make(id_, hill, elements, name, compound_class="inorganic", hf=None):
        record = CompoundRecord(id=id_, cas=id_, formula=hill, hill=hill, display_formula=hill, elements=elements,
                                compound_class=compound_class, group=elements[0], name=name)
        for phase, value in (hf or {}).items():
            record.properties.setdefault("enthalpyFormation298", []).append(
                PropertyValue(value, RefKey.CRC95, chem.link(crc, 2, name), phase))
        return record

    return _make


def _species(key, elements, h298, phase="gas"):
    return NasaSpecies(key, elements, phase, h298)


def _attach(records, species, dataset="nasa9"):
    records = {r.id: r for r in records}
    issues, counts = attach_nasa(records, dataset, species)
    return records, {i["label"]: i for i in issues}, counts


class TestHfCheck:
    def test_agreeing_species_is_linked_and_wrong_species_reported(self, make_record):
        records, issues, counts = _attach(
            [make_record("124-38-9", "CO2", ["C", "O"], "carbon dioxide", hf={"gas": -393500})],
            [_species("CO2", {"C": 1, "O": 2}, 49600.0), _species("CO2#2", {"C": 1, "O": 2}, -393510.0)],
        )
        assert records["124-38-9"].nasa9 == ["CO2#2"]
        assert issues["CO2"]["issue"] == "nasa9HfMismatch"
        assert issues["CO2"]["recordHf298"] == {"124-38-9": [-393500]}
        assert counts["nasa9Linked"] == 1 and counts["nasa9Records"] == 1

    def test_phase_of_the_key_is_compared(self, make_record):
        records, issues, _ = _attach(
            [make_record("7732-18-5", "H2O", ["H", "O"], "water", hf={"gas": -241826, "liquid": -285830})],
            [_species("H2O(L)", {"H": 2, "O": 1}, -285830.0, "liquid"),
             _species("H2O", {"H": 2, "O": 1}, -241830.0)],
        )
        assert records["7732-18-5"].nasa9 == ["H2O", "H2O(L)"]
        assert not issues

    def test_isomer_picked_by_hf(self, make_record):
        records, issues, _ = _attach(
            [make_record("67-64-1", "C3H6O", ["C", "H", "O"], "acetone", "organic", {"gas": -217100}),
             make_record("75-56-9", "C3H6O", ["C", "H", "O"], "propylene oxide", "organic", {"gas": -94700})],
            [_species("C3H6O#2", {"C": 3, "H": 6, "O": 1}, -217200.0)],
        )
        assert records["67-64-1"].nasa9 == ["C3H6O#2"] and records["75-56-9"].nasa9 == []

    def test_two_agreeing_organic_records_are_ambiguous(self, make_record):
        records, issues, _ = _attach(
            [make_record("107-06-2", "C2H4Cl2", ["C", "H", "Cl"], "1,2-dichloroethane", "organic", {"gas": -129800}),
             make_record("75-34-3", "C2H4Cl2", ["C", "H", "Cl"], "1,1-dichloroethane", "organic", {"gas": -127700})],
            [_species("C2H4Cl2", {"C": 2, "H": 4, "Cl": 2}, -128000.0)],
        )
        assert issues["C2H4Cl2"]["issue"] == "nasa9Ambiguous"
        assert issues["C2H4Cl2"]["ids"] == ["107-06-2", "75-34-3"]
        assert all(r.nasa9 == [] for r in records.values())

    def test_inorganic_within_single_tolerance(self, make_record):
        records, _, _ = _attach(
            [make_record("1314-98-3", "SZn", ["S", "Zn"], "zinc sulfide", hf={"solid": -206000})],
            [_species("ZnS(a)", {"Zn": 1, "S": 1}, -194000.0, "solid")],
        )
        assert records["1314-98-3"].nasa9 == ["ZnS(a)"]

    def test_organic_single_tolerance_needs_one_candidate(self, make_record):
        records, issues, _ = _attach(
            [make_record("75-71-8", "CCl2F2", ["C", "Cl", "F"], "dichlorodifluoromethane", "organic",
                         {"gas": -486600})],
            [_species("CF2CL2", {"C": 1, "F": 2, "Cl": 2}, -495800.0)],
        )
        assert records["75-71-8"].nasa9 == ["CF2CL2"]
        records, issues, _ = _attach(
            [make_record("1605-73-8", "C4H9", ["C", "H"], "tert-butyl radical", "organic", {"gas": 63400}),
             make_record("2348-55-2", "C4H9", ["C", "H"], "2-butyl radical", "organic", {"gas": 78500})],
            [_species("C4H9,t-butyl", {"C": 4, "H": 9}, 51700.0)],
        )
        assert issues["C4H9,t-butyl"]["issue"] == "nasa9HfMismatch"


class TestNames:
    def test_suffix_selects_isomer(self, make_record):
        records, _, _ = _attach(
            [make_record("106-97-8", "C4H10", ["C", "H"], "Butane", "organic", {"gas": -125600}),
             make_record("75-28-5", "C4H10", ["C", "H"], "Isobutane", "organic", {"gas": -134200})],
            [_species("C4H10,n-butane", {"C": 4, "H": 10}, -125790.0),
             _species("C4H10,isobutane", {"C": 4, "H": 10}, -134990.0)],
            "nasa7",
        )
        assert records["106-97-8"].nasa7 == ["C4H10,n-butane"]
        assert records["75-28-5"].nasa7 == ["C4H10,isobutane"]

    def test_truncated_and_abbreviated_suffix(self, make_record):
        records, _, _ = _attach(
            [make_record("111-65-9", "C8H18", ["C", "H"], "Octane", "organic"),
             make_record("592-27-8", "C8H18", ["C", "H"], "2-methylheptane", "organic"),
             make_record("624-64-6", "C4H8", ["C", "H"], "trans-2-butene", "organic"),
             make_record("590-18-1", "C4H8", ["C", "H"], "cis-2-butene", "organic")],
            [_species("C8H18(L),n-octa", {"C": 8, "H": 18}, None, "liquid"),
             _species("C4H8,tr2-butene", {"C": 4, "H": 8}, None)],
            "nasa7",
        )
        assert records["111-65-9"].nasa7 == ["C8H18(L),n-octa"]
        assert records["624-64-6"].nasa7 == ["C4H8,tr2-butene"]
        assert records["590-18-1"].nasa7 == [] and records["592-27-8"].nasa7 == []

    def test_deuterated_records_are_not_candidates(self, make_record):
        records, _, _ = _attach(
            [make_record("67-56-1", "CH4O", ["C", "H", "O"], "methanol", "organic", {"gas": -201000}),
             make_record("1849-29-2", "CH4O", ["C", "H", "O"], "methanol-d3", "organic", {"gas": -202400})],
            [_species("CH3OH", {"C": 1, "H": 4, "O": 1}, -201000.0)],
        )
        assert records["67-56-1"].nasa9 == ["CH3OH"] and records["1849-29-2"].nasa9 == []


class TestUnchecked:
    def test_inorganic_without_hf_is_linked_but_not_numbered_duplicates(self, make_record):
        records, issues, counts = _attach(
            [make_record("7439-89-6", "Fe", ["Fe"], "iron")],
            [_species("Fe(c)", {"Fe": 1}, None, "solid"), _species("Fe(a)#2", {"Fe": 1}, 0.0, "solid")],
            "nasa7",
        )
        assert records["7439-89-6"].nasa7 == ["Fe(c)"]
        assert issues["Fe(a)#2"]["issue"] == "nasa7Unchecked"
        assert counts["nasa7LinkedUnchecked"] == 1

    def test_organic_without_hf_needs_a_single_candidate(self, make_record):
        records, issues, _ = _attach(
            [make_record("463-51-4", "C2H2O", ["C", "H", "O"], "ethenone", "organic"),
             make_record("4789-21-3", "C2H2O", ["C", "H", "O"], "4789-21-3", "organic")],
            [_species("CH2CO", {"C": 2, "H": 2, "O": 1}, -47700.0)],
        )
        assert issues["CH2CO"]["issue"] == "nasa9Unchecked"
        assert all(r.nasa9 == [] for r in records.values())


class TestSkipped:
    def test_ions_isotopes_fractions_and_unparsed(self, make_record):
        records, issues, counts = _attach(
            [make_record("7782-44-7", "O2", ["O"], "oxygen")],
            [_species("O2+", {"O": 2, "E": -1}, None), _species("e-", {"E": 1}, None),
             _species("D2O", {"D": 2, "O": 1}, None), _species("Air", {"N": 1.56, "O": 0.42, "Ar": 0.01}, None),
             _species("-1.908376689D+05", {".5": 804328.0}, None), _species("O2", {"O": 2}, None)],
        )
        assert counts["nasa9Skipped"] == 5 and counts["nasa9Species"] == 6
        assert records["7782-44-7"].nasa9 == ["O2"]
        assert not issues

    def test_formula_without_record(self, make_record):
        _, issues, _ = _attach([], [_species("OH", {"O": 1, "H": 1}, 37300.0)])
        assert issues["OH"]["issue"] == "nasa9NoRecord" and issues["OH"]["formula"] == "HO"


class TestSpeciesAdapters:
    def test_nasa7_h298_and_phase(self):
        low = Nasa7Coeffs(5.14987613, -1.36709788e-2, 4.91800599e-5, -4.84743026e-8, 1.66693956e-11,
                          -1.02466476e4, -4.64130376)
        ch4 = Nasa7Species("CH4", "", "G", 16.04, 200.0, 3500.0, Nasa7Equation(1000.0, low, low), {"C": 1, "H": 4})
        hot = Nasa7Species("AL(L)", "", "C", 26.98, 933.6, 6000.0, Nasa7Equation(1000.0, low, low), {"Al": 1})
        sp, liquid = nasa7_species({"CH4": ch4, "AL(L)": hot})
        assert sp.phase == "gas" and sp.h298 == pytest.approx(-74600, abs=50)
        assert liquid.phase == "liquid" and liquid.h298 is None

    def test_nasa9_h298_and_phase(self):
        coeffs = Nasa9Coeffs(-1.766850998e5, 2.786181020e3, -1.202577850e1, 3.917619290e-2, -3.619054430e-5,
                             2.026853043e-8, -4.976705490e-12, -2.331314360e4, 8.904322750e1)
        eq = Nasa9Equation([Nasa9Range(200.0, 1000.0, 10016.2, coeffs)])
        ch4 = Nasa9Species("CH4", "", "g 8/99", "gas", 16.04, -74600.0, eq, {"C": 1, "H": 4})
        solid = Nasa9Species("Fe(a)", "", "", "condensed", 55.85, 0.0, eq, {"Fe": 1})
        sp, fe = nasa9_species({"CH4": ch4, "Fe(a)": solid})
        assert sp.h298 == pytest.approx(-74600, abs=50)
        assert fe.phase == "solid"


class TestOutput:
    def test_record_fields_and_refs(self, make_record):
        record = make_record("74-82-8", "CH4", ["C", "H"], "methane", "organic")
        record.nasa7, record.nasa9 = ["CH4"], ["CH4"]
        assert record.to_dict()["nasa7"] == ["CH4"] and record.to_dict()["nasa9"] == ["CH4"]
        assert {"NASA7", "NASA9"} <= set(record.refs())

    def test_sources_nasa_block(self, tmp_path, chem):
        block = {"nasa7": {"ref": "NASA7", "dataset": "shared/processed/NASA/nasa7.json", "sources": ["a.dat"]}}
        path = write_compound_sources(tmp_path, chem, GENERATED, nasa=block)
        assert json.loads(path.read_text(encoding="utf-8"))["nasa"] == block

    def test_missing_nasa_dir_is_skipped(self, tmp_path):
        assert _attach_nasa(tmp_path / "missing", MergeResult()) == (None, [], {})
