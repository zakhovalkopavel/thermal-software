"""Tests for compound_data.parsers — fixtures are real rows of the chemicals tables."""
from __future__ import annotations

import json

import pytest
from chemicals_fixtures import COMMIT, REPOSITORY, tsv

from chemicals_tables.constants.coefficient_tables import COEFFICIENT_TABLES
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.constants.gas_constant import GAS_CONSTANT
from chemicals_tables.constants.source_tables import SOURCE_TABLES
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.label_variant import label_variant
from chemicals_tables.parsers.coefficient_table import parse_coefficient_table
from chemicals_tables.parsers.crc_molten_density import parse_crc_molten_density
from chemicals_tables.parsers.perry_151 import parse_perry_151
from chemicals_tables.parsers.property_table import parse_property_table
from chemicals_tables.parsers.shomate_json import parse_shomate_json
from chemicals_tables.parsers.vdi_ppds import parse_vdi_ppds
from chemicals_tables.parsers.zabransky import parse_zabransky
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.raw_value import RawValue

PERRY_HEADER = ["Ful CAS", "Formula", "main phase", "subphase", "Constant Term", "+*T term", "/T^2 term",
                "*T^2 term", "Tmin", "Tmax", "%error"]


def _spec(table: str):
    return next(s for s in COEFFICIENT_TABLES if s.table == table)


class TestPerry151:
    @pytest.fixture
    def entries(self, make_source, chem):
        source = make_source({"Perry 2-151": tsv(
            PERRY_HEADER,
            ["39377-45-2", "Al2O3 ", "c", "", 22.08, 0.008971, -522500, "", 273, 1973, 3],
            ["7440-66-6", "Zn ", "c", "", 5.25, 0.0027, "", "", 273, 692, 1],
            ["7446-09-5", "22 SO2 ", "g", "", 7.7, 0.0053, "", -0.00000083, 300, 2500, "2a "],
            ["79-24-3", "Ne ", "g", "", 4.97, "", "", "", "", "", 0],
            ["", "CaO·SiO2 ", "gls", "", 23.16, 0.009672, -487100, "", 273, 973, 1],
        )})
        entries, issues = parse_perry_151(source, chem)
        return entries, issues

    def test_linear_hyperbolic_row(self, entries):
        al2o3 = entries[0][0]
        assert al2o3.cas == "39377-45-2" and al2o3.phase == "solid"
        eq = al2o3.value
        assert eq.type is EquationType.linearHyperbolic
        assert eq.vars == {"a": 22.08, "b": 0.008971, "d": -522500}
        assert (eq.min, eq.max, eq.k) == (273, 1973, 4.184)
        assert eq.source.line == 2 and eq.source.extra["error"] == 3
        assert eq.source.url.endswith("Heat%20Capacity/Perrys%20Table%202-151.tsv#L2")
        assert eq.source.to_ref() == ["Perry8", 2, "perry151"]
        assert eq.to_dict()["error"] == 3 and "variant" not in eq.to_dict()

    def test_row_without_t2_terms_is_linear_hyperbolic_with_zero_d(self, entries):
        zn = entries[0][1].value
        assert zn.type is EquationType.linearHyperbolic
        assert zn.vars == {"a": 5.25, "b": 0.0027, "d": 0}

    def test_t2_term_gives_quadratic_and_footnote_is_stripped(self, entries):
        so2 = entries[0][2]
        assert so2.formula == "SO2" and so2.phase == "gas"
        assert so2.value.type is EquationType.quadratic
        assert so2.value.vars == {"a": 7.7, "b": 0.0053, "c": -0.00000083}
        assert so2.value.source.extra["error"] == "2a"

    def test_row_without_range_is_raw_only(self, entries):
        ne = entries[0][3]
        assert isinstance(ne.value, RawValue)
        assert ne.value.values["a"] == 4.97
        assert [i["issue"] for i in entries[1]] == ["perryNoRange"]

    def test_glass_goes_to_solid(self, entries):
        glass = entries[0][4]
        assert glass.cas is None and glass.phase == "solid"
        assert glass.value.source.extra["variant"] == "glass"


class TestPerry151Variant:
    @pytest.mark.parametrize("main_phase, subphase, variant", [
        ("c", "quartz, α ", "quartz, α"),
        ("c", "", None),
        ("gls", "orthoclase ", "glass, orthoclase"),
    ])
    def test_variant(self, make_source, chem, main_phase, subphase, variant):
        source = make_source({"Perry 2-151": tsv(
            PERRY_HEADER, ["14808-60-7", "SiO2 ", main_phase, subphase, 10.87, 0.008712, -241200, "", 273, 848, 1],
        )})
        entries, _ = parse_perry_151(source, chem)
        assert entries[0].value.source.extra["variant"] == variant


class TestPerry151MnORow:
    def test_mno_is_quadratic(self, make_source, chem):
        source = make_source({"Perry 2-151": tsv(
            PERRY_HEADER, ["1344-43-0", "MnO ", "c", "", 7.43, 0.01038, "", -0.00000362, 273, 1923, " "],
        )})
        entries, _ = parse_perry_151(source, chem)
        assert entries[0].value.type is EquationType.quadratic
        assert entries[0].value.vars == {"a": 7.43, "b": 0.01038, "c": -0.00000362}
        assert entries[0].value.source.extra["error"] is None


class TestCrcMoltenDensity:
    def test_linear_with_raw(self, make_source, chem):
        source = make_source({"CRC molten densities": tsv(
            ["CAS", "Chemical", "MW", "rho", "k", "Tm", "Tmax"],
            ["497-19-8", "Sodium carbonate", 105.989, 1972, 0.448, 1129.15, 1277.15],
        )})
        eq = parse_crc_molten_density(source, chem)[0].value
        assert eq.type is EquationType.linear
        assert eq.vars == {"a": pytest.approx(1972 + 0.448 * 1129.15), "b": -0.448}
        assert (eq.min, eq.max) == (1129.15, 1277.15)
        assert eq.raw == {"rho0": 1972, "k": 0.448, "Tm": 1129.15, "Tmax": 1277.15}


class TestCoefficientTables:
    def test_c3h8_rows_reproduce_backend_vars(self, make_source, chem):
        header = ["CAS", "Chemical", "C1", "C2", "C3", "C4", "Tmin", "Tmax"]
        source = make_source({
            "Perry 2-312": tsv(header, ["74-98-6", "Propane ", "4.9054E-08", 0.90125, 0, 0, 85.47, 1000]),
            "Perry 2-314": tsv(header, ["74-98-6", "Propane ", -1.12, 0.10972, -9834.6, -7535800, 231.11, 1000]),
        })
        visc, _ = parse_coefficient_table(source, _spec("Perry 2-312"), chem)
        cond, _ = parse_coefficient_table(source, _spec("Perry 2-314"), chem)
        assert visc[0].value.type is EquationType.dipprN102 and visc[0].phase == "gas"
        assert visc[0].value.vars == {"c1": 4.9054e-8, "c2": 0.90125, "c3": 0, "c4": 0}
        assert cond[0].value.vars == {"c1": -1.12, "c2": 0.10972, "c3": -9834.6, "c4": -7535800}
        assert visc[0].value.k is None

    def test_poling_quartic_and_scalars(self, make_source, chem):
        source = make_source({"Poling databank": tsv(
            ["CAS", "Chemical", "Tmin", "Tmax", "a0", "a1", "a2", "a3", "a4", "Cpg", "Cpl"],
            ["56-23-5", "tetrachloromethane ", 200, 1000, 2.518, 0.041882, -0.0000716, "5.739E-008", "-1.756E-011",
             83.43, 131.6],
            ["7440-37-1", "argon ", "", "", "", "", "", "", "", 20.79, ""],
        )})
        entries, issues = parse_coefficient_table(source, _spec("Poling databank"), chem)
        equations = [e for e in entries if isinstance(e.value, EquationValue)]
        scalars = [e for e in entries if isinstance(e.value, PropertyValue)]
        assert len(equations) == 1 and equations[0].value.k == GAS_CONSTANT
        assert equations[0].value.vars["a"] == 2.518 and equations[0].value.vars["e"] == -1.756e-11
        assert {(s.cas, s.value.phase, s.value.value) for s in scalars} == {
            ("56-23-5", "gas", 83.43), ("56-23-5", "liquid", 131.6), ("7440-37-1", "gas", 20.79)}
        assert issues == []

    def test_dippr_114_takes_tc_from_yaws(self, make_source, chem):
        source = make_source({
            "Perry 2-153 DIPPR 114": tsv(
                ["CAS", "Name", "A", "B", "C", "D", "E", "Tmin", "Tmax"],
                ["7664-41-7", "Ammonia", 61.289, 80925, 799.4, -2651, 0, 203.15, 401.15],
                ["584-03-2", "1,2-Butanediol", 55.136, 314200, 280.19, 1413.9, 0, 220, 670],
            ),
            "Yaws critical properties": tsv(
                ["CAS", "Chemical", "Tc", "Pc", "Vc", "omega"],
                ["7664-41-7", "ammonia", 405.65, 11280000, 0.0000725, 0.25],
            ),
        })
        yaws = parse_property_table(source, SOURCE_TABLES["Yaws critical properties"], chem)
        tc = {e.cas: (e.value.value, e.value.source) for e in yaws if e.property == "criticalTemperature"}
        entries, issues = parse_coefficient_table(source, _spec("Perry 2-153 DIPPR 114"), chem, tc)
        eq = entries[0].value
        assert eq.type is EquationType.dipprN114 and eq.k == 1e-3
        assert eq.vars == {"Tc": 405.65, "c1": 61.289, "c2": 80925, "c3": 799.4, "c4": -2651}
        assert eq.source.extra["tcRef"].table == "Yaws critical properties"
        assert eq.to_dict()["tcRef"] == ["Yaws2014", 2, "yawsCritical"]
        assert [i["issue"] for i in issues] == ["missingTc"]


class TestShomate:
    def test_water_ranges_and_key_line(self, make_source, chem):
        data = {
            "7732-18-5": [
                None,
                [[298.0, 500.0, -203.606, 1.52329, -0.003196413, 2.474455e-06, 3855326.0]],
                [[1700.0, 6000.0, 41.96426, 0.008622053, -1.49978e-06, 9.8119e-11, -11157640.0],
                 [500.0, 1700.0, 30.092, 0.006832514, 6.793435e-06, -2.53448e-09, 82139.0]],
            ],
        }
        source = make_source({"WebBook Shomate": json.dumps(data, indent=1)})
        entries = {e.phase: e.value for e in parse_shomate_json(source, chem)}
        gas = entries["gas"]
        assert [r["Tmin"] for r in gas.vars["ranges"]] == [500.0, 1700.0]
        assert (gas.min, gas.max) == (500.0, 6000.0)
        assert (entries["liquid"].min, entries["liquid"].max) == (298.0, 500.0)
        assert "solid" not in entries
        assert gas.source.line == 2
        assert gas.source.url.endswith("webbook_shomate_coefficients.json#L2")


ZAB_HEADER = ["CASRN", "Name", "Data Type", "Uncertainty", "Tmin", "Tmax", "A1-spline", "A2-spline", "A3-spline",
              "A4-spline", "A1-quasi", "A2-quasi", "A3-quasi", "A4-quasi", "A5-quasi", "A6-quasi", "Tc"]


class TestZabransky:
    @pytest.fixture
    def parsed(self, make_source, chem):
        source = make_source({"Zabransky": tsv(
            ZAB_HEADER,
            ["None", "Pentaethoxyuranium ", "sat", "III", 257.5, 400, 233.039, -160.56, 46.6049, -4.31516,
             0, 0, 0, 0, 0, 0, ""],
            ["56-81-5", "1,2,3-Propanetriol", "p", "V", 293.1, 382.7, 0, 0, 0, 0, 18.719, 1.18708, 5.59442,
             73.7947, 0, 0, 800],
            ["100-41-4 ", "Ethylbenzene ", "sat", "I", 178.2, 320, 2.44043, -8.48637, 3.63852, -0.343091,
             0, 0, 0, 0, 0, 0, ""],
            ["100-41-4 ", "Ethylbenzene ", "sat", "IV", 320, 550, 13.5882, 1.65377, 0.46973, -0.0130088,
             0, 0, 0, 0, 0, 0, ""],
            ["702-79-4 ", "1,3-Dimethyl ", "p", "III", 251.3, 650, 7.18537, 7.50663, 0.19597, -0.0111761,
             0, 0, 0, 0, 0, 0, ""],
            ["702-79-4", "1,3-Dimethyl ", "p", "IV", 300, 650, -27.7796, 30.4061, -4.62286, 0.316275,
             0, 0, 0, 0, 0, 0, ""],
        )})
        return parse_zabransky(source, chem)

    def test_spline_rows_are_chained(self, parsed):
        entries, _ = parsed
        eb = [e.value for e in entries if e.cas == "100-41-4"]
        assert len(eb) == 1 and eb[0].type is EquationType.zabranskySpline
        assert [(r["Tmin"], r["Tmax"]) for r in eb[0].vars["ranges"]] == [(178.2, 320), (320, 550)]
        assert eb[0].source.line == 4
        assert eb[0].source.extra["uncertainty"] == ["I", "IV"]
        assert eb[0].source.extra["dataType"] == "sat" and eb[0].k == GAS_CONSTANT

    def test_quasi_polynomial_row(self, parsed):
        entries, _ = parsed
        glycerol = next(e.value for e in entries if e.cas == "56-81-5")
        assert glycerol.type is EquationType.zabranskyQuasiPolynomial
        assert glycerol.vars == {"Tc": 800, "a1": 18.719, "a2": 1.18708, "a3": 5.59442, "a4": 73.7947,
                                 "a5": 0, "a6": 0}

    def test_none_cas_is_reported_and_unkeyed(self, parsed):
        entries, issues = parsed
        assert any(e.cas is None and e.label == "Pentaethoxyuranium" for e in entries)
        assert "zabranskyNoCas" in {i["issue"] for i in issues}

    def test_overlapping_alternatives_split(self, parsed):
        entries, issues = parsed
        assert len([e for e in entries if e.cas == "702-79-4"]) == 2
        assert "zabranskySplineSplit" in {i["issue"] for i in issues}


class TestVdiPpds:
    @pytest.fixture
    def entries(self, make_source, chem):
        abcde = ["CAS", "Chemical", "A", "B", "C", "D", "E"]
        source = make_source({
            "VDI gas viscosity": tsv(abcde, ["64-17-5", "Ethanol", -0.0000006394, 0.000000036445,
                                             -0.000000000017984, 0.0000000000000128, "-4.13E-018"]),
            "VDI gas thermal conductivity": tsv(abcde),
            "VDI liquid thermal conductivity": tsv(abcde, ["64-17-5", "Ethanol", 0.2467, -0.0002636, 0, 0, 0]),
            "VDI liquid viscosity": tsv(
                ["CAS", "Chemical", "Formula", "A", "B", "C", "D", "E"],
                ["64-17-5", "Ethanol", "C2H6O", 6.16832, -0.00125, 740.323, 90.778, 0.00000038],
                ["999-99-9", "Nothing", "X", 1, 1, 1, 1, 1],
            ),
            "VDI liquid density": tsv(["CAS", "Chemical", "MW", "Tc", "rhoc", "A", "B", "C", "D"]),
            "VDI enthalpy of vaporization": tsv(["CAS", "Chemical", "MW", "Tc", "A", "B", "C", "D", "E"]),
            "VDI surface tension": tsv(
                ["CAS", "Chemical", "Tm", "Tc", "A", "B", "C", "D", "E"],
                ["50-00-0", "Formaldehyde", 181.15, 408.05, 0.15579, 1.32552, 0, 0, 0],
                ["64-17-5", "Ethanol", 159.05, 513.9, 0.06165, 2.37635, -3.15086, 1.98424, -0.15806],
            ),
            "VDI vapor pressure": tsv(
                ["CAS", "Chemical", "Tm", "Tc", "Pc", "A", "B", "C", "D"],
                ["64-17-5", "Ethanol", 159.05, 513.9, 6148000, -8.33803, 0.0872, -3.30575, -0.26001],
            ),
        })
        return parse_vdi_ppds(source, chem)

    def _get(self, entries, prop, phase, cas="64-17-5"):
        return next(e.value for e in entries if e.property == prop and e.phase == phase and e.cas == cas)

    def test_liquid_range_from_surface_tension_row(self, entries):
        visc = self._get(entries[0], "viscosity", "liquid")
        assert visc.type is EquationType.ppds9
        assert (visc.min, visc.max) == (159.05, 513.9)
        range_ref = visc.source.extra["rangeRef"]
        assert range_ref.table == "VDI surface tension" and range_ref.line == 3
        assert range_ref.url.endswith("VDI%20PPDS%20surface%20tensions.tsv#L3")
        assert visc.to_dict()["rangeRef"] == ["VDI2010", 3, "vdiSurfaceTension"]

    def test_gas_has_null_range(self, entries):
        gas = self._get(entries[0], "viscosity", "gas")
        assert gas.type is EquationType.quartic
        assert (gas.min, gas.max) == (None, None)
        assert "rangeRef" not in gas.to_dict()

    def test_liquid_without_tm_tc_row_is_reported(self, entries):
        lonely = self._get(entries[0], "viscosity", "liquid", "999-99-9")
        assert (lonely.min, lonely.max) == (None, None)
        assert "vdiLiquidNoRange" in {i["issue"] for i in entries[1]}

    def test_own_range_and_vars(self, entries):
        sigma = self._get(entries[0], "surfaceTension", "liquid")
        assert sigma.type is EquationType.dipprN106
        assert sigma.vars == {"Tc": 513.9, "c1": 0.06165, "c2": 2.37635, "c3": -3.15086, "c4": 1.98424,
                              "c5": -0.15806}
        psat = self._get(entries[0], "vaporPressure", "liquid")
        assert psat.type is EquationType.wagner25 and psat.vars["Pc"] == 6148000
        assert (psat.min, psat.max) == (159.05, 513.9)


class TestPropertyTable:
    def test_crc_standard_per_phase(self, make_source, chem):
        header = ["CAS", "Chemical", "Hfs", "Gfs", "S0s", "Cps", "Hfl", "Gfl", "S0l", "Cpl", "Hfg", "Gfg", "S0g",
                  "Cpg"]
        source = make_source({"CRC standard thermodynamic": tsv(
            header, ["1344-28-1", "Aluminum oxide (α)", -1675700, -1582300, 50.9, 79, "", "", "", "", "", "", "",
                     ""],
        )})
        entries = parse_property_table(source, SOURCE_TABLES["CRC standard thermodynamic"], chem)
        hf = next(e for e in entries if e.property == "enthalpyFormation298")
        assert hf.value.value == -1675700 and hf.value.phase == "solid"
        assert hf.label == "Aluminum oxide (α)"
        assert hf.value.source.url == (
            f"{REPOSITORY}/blob/{COMMIT}/chemicals/Heat%20Capacity/"
            "CRC%20Standard%20Thermodynamic%20Properties%20of%20Chemical%20Substances.tsv#L2"
        )
        assert hf.value.to_dict() == {
            "value": -1675700, "phase": "solid", "variant": "α", "ref": ["CRC95", 2, "crcStdThermo"],
        }
        assert len(entries) == 4

    def test_lennard_jones_tables(self, make_source, chem):
        source = make_source({
            "Poling Lennard-Jones": tsv(["CAS", "Formula", "Name", "molecular_diameter", "Stockmayer"],
                                        ["74-82-8", "CH4", "methane", 3.758, 148.6]),
            "Magalhaes Lennard-Jones": tsv(["CAS", "Chemical", "molecular_diameter", "Stockmayer"],
                                           ["74-82-8", "methane", 3.58484, 167.15]),
        })
        poling = parse_property_table(source, SOURCE_TABLES["Poling Lennard-Jones"], chem)
        sigma = next(e for e in poling if e.property == "collisionDiameter")
        assert sigma.value.value == 3.758e-10
        assert (sigma.formula, sigma.label) == ("CH4", "methane")
        assert sigma.value.to_dict() == {"value": 3.758e-10, "ref": ["Poling5", 2, "polingLJ"]}
        magalhaes = parse_property_table(source, SOURCE_TABLES["Magalhaes Lennard-Jones"], chem)
        eps = next(e for e in magalhaes if e.property == "epsilonToKb")
        assert eps.value.to_dict() == {"value": 167.15, "ref": ["Magalhaes2013", 2, "magalhaesLJ"]}
        assert next(e for e in magalhaes if e.property == "collisionDiameter").value.value == 3.58484e-10


class TestLabelVariant:
    @pytest.mark.parametrize("label, variant", [
        ("Aluminum oxide (α)", "α"),
        ("Sulfur (monoclinic)", "monoclinic"),
        ("Iron(III) oxide", None),
        ("Iron(III) chloride (hexahydrate)", "hexahydrate"),
        ("Ethanol", None),
        (None, None),
    ])
    def test_trailing_group(self, label, variant):
        assert label_variant(label) == variant
