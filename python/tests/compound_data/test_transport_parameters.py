"""Tests for compound_data.parsers.transport_parameters — row lines, SI units, potential tags, pure rows vs pairs."""
from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.transport_value import TransportValue
from compound_data.builder import _resolve_interactions
from compound_data.constants.transport_source import TRANSPORT_FILE, TRANSPORT_TABLES
from compound_data.parsers.transport_parameters import parse_transport_parameters

AIR = "132259-10-0"
N2 = "7727-37-9"
O2 = "7782-44-7"
CH4 = "74-82-8"

TABLES = [
    {"id": "white-table-1-2", "rows": [
        {"gas": "Air", "formula": "Air", "cas": AIR, "T0": 273, "mu0": 1.716e-05, "n": 0.666,
         "powerLawError": {"percent": 4, "Tmin": 210, "Tmax": 1900}, "S": 111,
         "sutherlandRange2Pct": {"Tmin": 170, "Tmax": 1900}},
    ]},
    {"id": "white-table-1-3", "rows": [
        {"gas": "N2", "formula": "N2", "cas": N2, "T0": 273, "k0": 0.0242, "n": 0.74,
         "powerLawError": {"percent": 3, "Tmin": 210, "Tmax": 1200}, "S": 150,
         "sutherlandRange2Pct": {"Tmin": 200, "Tmax": 1200}},
    ]},
    {"id": "white-table-a-6", "rows": [
        {"gas": "Ammonia", "formula": "NH3", "cas": "7664-41-7", "printed": {"T0": 491.6, "mu0": 0.000722, "S": 679},
         "n": 0.981, "si": {"T0": 273.111, "mu0": 9.60265e-06, "S": 377.222}},
        {"gas": "Ethylene", "formula": "C2H4", "cas": "74-85-1", "printed": {"T0": 491.6, "mu0": 0.000675, "S": 225},
         "n": None, "si": {"T0": 273.111, "mu0": 8.97754e-06, "S": 125.0}},
    ]},
    {"id": "white-table-a-7", "rows": [
        {"gas": "N2", "formula": "N2", "cas": N2, "sigma": 3.798, "epsilonToK": 71.4},
    ]},
    {"id": "itean1961-table-3", "rows": [
        {"molecule": "CO", "formula": "CO", "cas": "630-08-0", "sigma": 3.668, "epsilonToK": 93.8, "delta": 0.01,
         "deltaLegible": False, "deltaComputed": 0.0098, "dipoleMoment": 0.112},
    ]},
    {"id": "mamedov2014-table-1", "rows": [
        {"species": "N2", "components": ["N2"], "cas": N2, "epsilonToK": 95.05, "sigma": 3.698},
        {"species": "C6H6–CH4O", "components": ["C6H6", "CH4O"], "cas": None, "epsilonToK": 450.0, "sigma": 4.5},
    ]},
    {"id": "svehla1995-table-1", "rows": [
        {"species": ["N2", "N2"], "cas": [N2, N2], "property": "viscosity", "pdfPage": 12,
         "methods": [
             {"method": "experimental", "TmaxK": 2200, "source": "Stephan, Krauss, and Laesecke 1987"},
             {"method": "correspondingStates", "sigma": 3.652, "epsilonToK": 98.4, "rhoStar": 0.108,
              "V0Star": 53080.0, "source": "Boushehri et al. 1987", "TminK": 2200, "scaledToMatch": True},
         ],
         "matchTemperatureK": 2200, "dataSource": "..."},
        {"species": ["N2", "N2"], "cas": [N2, N2], "property": "conductivity", "pdfPage": 12,
         "methods": [{"method": "experimental", "TmaxK": 2200, "source": "NASA Lewis"}], "dataSource": "..."},
        {"species": ["CH4", "O2"], "cas": [CH4, O2], "property": "diffusion", "pdfPage": 10,
         "methods": [{"method": "exp6", "sigma": 4.229, "epsilonToK": 100, "alpha": 12, "basis": "diffusionData"}],
         "dataSource": "..."},
        {"species": ["e", "N2"], "cas": [None, N2], "property": "viscosity", "pdfPage": 15,
         "methods": [{"method": "theoretical"}], "dataSource": "..."},
    ]},
]


@pytest.fixture
def parsed(tmp_path):
    path = tmp_path / "transport-parameters.json"
    text = json.dumps({"sources": {}, "tables": TABLES}, indent=2, ensure_ascii=False)
    path.write_text(text, encoding="utf-8")
    return parse_transport_parameters(path), text.splitlines()


def _line(lines: list[str], marker: str) -> int:
    """1-based line of the ``{`` opening the row whose first field is ``marker``."""
    return next(i for i, line in enumerate(lines, 1) if line.strip() == marker) - 1


def _by_key(result, key):
    return [e for e in result.entries if e.value.source.key == key]


class TestTables:
    def test_tables_and_counts(self, parsed):
        result, _ = parsed
        assert [t.key for t in result.tables] == [TRANSPORT_TABLES[t["id"]].key for t in TABLES]
        assert len(result.entries) == 21
        assert len(result.interactions) == 2

    def test_unknown_table_is_reported(self, tmp_path):
        path = tmp_path / "t.json"
        path.write_text(json.dumps({"tables": [{"id": "nope", "title": "?", "rows": [{"a": 1}]}]}, indent=2))
        result = parse_transport_parameters(path)
        assert result.entries == [] and result.tables == []
        assert [i["issue"] for i in result.issues] == ["transportUnknownTable"]

    def test_row_lines_match_rows(self, parsed):
        result, lines = parsed
        air = _by_key(result, "white12")[0]
        assert air.value.source.line == _line(lines, '"gas": "Air",')
        assert lines[air.value.source.line - 1].strip() == "{"
        nh3 = _by_key(result, "whiteA6")[0]
        assert nh3.value.source.line == _line(lines, '"gas": "Ammonia",')


class TestWhite:
    def test_power_law_and_sutherland(self, parsed):
        result, _ = parsed
        power, sutherland = _by_key(result, "white12")
        assert (power.cas, power.formula, power.label, power.property, power.phase) == \
            (AIR, None, "Air", "viscosity", "gas")
        assert isinstance(power.value, EquationValue)
        assert power.value.to_dict() == {
            "type": "powerLaw", "ref": ["White3", power.value.source.line, "white12"],
            "vars": {"y0": 1.716e-05, "T0": 273, "n": 0.666}, "min": 210, "max": 1900, "error": 4,
            "originalRef": "NBS1955",
        }
        assert sutherland.value.type == EquationType.sutherland
        assert sutherland.value.vars == {"y0": 1.716e-05, "T0": 273, "S": 111}
        assert (sutherland.value.min, sutherland.value.max) == (170, 1900)
        assert sutherland.value.source.extra["error"] == 2

    def test_conductivity_table(self, parsed):
        result, _ = parsed
        power, sutherland = _by_key(result, "white13")
        assert power.property == sutherland.property == "thermalConductivity"
        assert power.value.vars["y0"] == 0.0242
        assert "originalRef" not in power.value.to_dict()

    def test_a6_uses_si_columns_without_range(self, parsed):
        result, _ = parsed
        nh3_power, nh3_sutherland, c2h4 = _by_key(result, "whiteA6")
        assert nh3_power.value.vars == {"y0": 9.60265e-06, "T0": 273.111, "n": 0.981}
        assert nh3_sutherland.value.vars == {"y0": 9.60265e-06, "T0": 273.111, "S": 377.222}
        assert (nh3_power.value.min, nh3_power.value.max) == (None, None)
        assert (c2h4.cas, c2h4.value.type) == ("74-85-1", EquationType.sutherland)

    def test_a7_lennard_jones_in_si(self, parsed):
        result, _ = parsed
        sigma, eps = _by_key(result, "whiteA7")
        assert (sigma.property, sigma.value.value) == ("collisionDiameter", 3.798e-10)
        assert (eps.property, eps.value.value) == ("epsilonToKb", 71.4)
        assert sigma.value.to_dict()["potential"] == "lennardJones"
        assert sigma.value.to_dict()["originalRef"] == "Svehla1962"


class TestPotentials:
    def test_stockmayer(self, parsed):
        result, _ = parsed
        values = {e.property: e.value for e in _by_key(result, "itean1961T3")}
        assert set(values) == {"collisionDiameter", "epsilonToKb", "stockmayerDelta", "dipoleMoment"}
        assert values["collisionDiameter"].value == 3.668e-10
        assert values["stockmayerDelta"].value == 0.01
        assert values["dipoleMoment"].value == pytest.approx(0.112 * 3.33564e-30, rel=1e-12)
        assert all(v.to_dict()["potential"] == "stockmayer" for v in values.values())
        assert values["epsilonToKb"].ref.value == "Itean1961"

    def test_mamedov_second_virial_and_mixtures(self, parsed):
        result, _ = parsed
        sigma, eps = _by_key(result, "mamedov2014T1")
        assert (sigma.cas, sigma.formula, sigma.value.value) == (N2, "N2", 3.698e-10)
        assert eps.value.to_dict() == {"value": 95.05, "potential": "lennardJones", "basis": "secondVirial",
                                       "ref": ["Mamedov2014", eps.value.source.line, "mamedov2014T1"]}
        assert [(i["issue"], i["label"]) for i in result.issues] == [("transportMixtureSkipped", "C6H6–CH4O")]


class TestSvehla:
    def test_pure_rows_become_transport_values(self, parsed):
        result, _ = parsed
        transport = [e for e in result.entries if isinstance(e.value, TransportValue)]
        assert [(e.cas, e.property) for e in transport] == [(N2, "viscosity"), (N2, "thermalConductivity")]
        viscosity = transport[0].value.to_dict()
        assert viscosity["matchTemperatureK"] == 2200
        assert viscosity["methods"][1] == {
            "method": "correspondingStates", "sigma": 3.652e-10, "epsilonToKb": 98.4, "rhoStar": 0.108,
            "V0Star": 53080.0, "source": "Boushehri et al. 1987", "TminK": 2200, "scaledToMatch": True,
        }
        assert viscosity["ref"][0::2] == ["Svehla1995", "svehla1995T1"]
        assert "matchTemperatureK" not in transport[1].value.to_dict()

    def test_potential_parameters_become_properties(self, parsed):
        result, _ = parsed
        values = {e.property: e.value for e in _by_key(result, "svehla1995T1") if isinstance(e.value, PropertyValue)}
        assert set(values) == {"collisionDiameter", "epsilonToKb", "rhoStar", "V0Star"}
        assert values["collisionDiameter"].to_dict() == {
            "value": 3.652e-10, "potential": "correspondingStates", "citation": "Boushehri et al. 1987",
            "TminK": 2200, "ref": values["collisionDiameter"].to_dict()["ref"],
        }

    def test_pairs_become_interactions(self, parsed):
        result, _ = parsed
        diffusion, electron = result.interactions
        assert diffusion["species"] == ["CH4", "O2"] and diffusion["cas"] == [CH4, O2]
        assert diffusion["property"] == "diffusion"
        assert diffusion["methods"] == [{"method": "exp6", "sigma": 4.229e-10, "epsilonToKb": 100, "alpha": 12,
                                         "basis": "diffusionData"}]
        assert diffusion["ref"][0::2] == ["Svehla1995", "svehla1995T1"]
        assert (electron["species"], electron["cas"], electron["property"]) == (["e", "N2"], [None, N2], "viscosity")


class TestResolveInteractions:
    def test_ids_by_cas_and_other_cas(self):
        records = {
            CH4: SimpleNamespace(id=CH4, cas=CH4, other_cas=[]),
            N2: SimpleNamespace(id=N2, cas=N2, other_cas=["12345-67-8"]),
        }
        rows = [
            {"species": ["CH4", "O2"], "cas": [CH4, O2], "property": "diffusion", "methods": [],
             "ref": ["Svehla1995", 70, "svehla1995T1"]},
            {"species": ["e", "N2"], "cas": [None, "12345-67-8"], "property": "viscosity", "methods": [],
             "ref": ["Svehla1995", 80, "svehla1995T1"]},
        ]
        resolved, issues = _resolve_interactions(rows, records)
        assert [r["ids"] for r in resolved] == [[CH4, None], [None, N2]]
        assert list(resolved[0])[:3] == ["species", "ids", "cas"]
        assert [(i["issue"], i["cas"], i["label"], i["line"]) for i in issues] == [
            ("transportInteractionNoRecord", O2, "O2", 70),
        ]


class TestSourceFile:
    """The committed file: every table known, every row located, every CAS valid."""

    @pytest.fixture(scope="class")
    def source(self):
        path = Path("/app") / TRANSPORT_FILE
        if not path.is_file():
            path = Path(__file__).resolve().parents[3] / TRANSPORT_FILE
        if not path.is_file():
            pytest.skip(f"{TRANSPORT_FILE} not found")
        return parse_transport_parameters(path)

    def test_all_tables_parse(self, source):
        assert {t.key for t in source.tables} == {t.key for t in TRANSPORT_TABLES.values()}
        assert {i["issue"] for i in source.issues} <= {"transportMixtureSkipped"}

    def test_cas_check_digits(self, source):
        cas = {e.cas for e in source.entries if e.cas} | {c for i in source.interactions for c in i["cas"] if c}
        for number in cas:
            digits = number.replace("-", "")
            check = sum(int(d) * w for w, d in enumerate(reversed(digits[:-1]), 1)) % 10
            assert check == int(digits[-1]), number
