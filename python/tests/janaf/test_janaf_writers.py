"""Tests for janaf.writers — compound files, index.json, units.json and sources.json."""
from __future__ import annotations

import json

from janaf.constants.row_definitions import JANAF_ROW_DEFINITIONS
from janaf.constants.units import JANAF_UNITS
from janaf.janaf_classes import JanafClasses
from janaf.janaf_files import janaf_files
from janaf.janaf_row import JanafRow
from janaf.janaf_source import JanafSource
from janaf.janaf_table import JanafTable
from janaf.janaf_transition import JanafTransition
from janaf.writers import write_janaf_index, write_janaf_json, write_janaf_sources, write_janaf_units

COMMIT = "c8ed6be3ba31a61835061091bd3c521270b484ec"
SOURCE = JanafSource(repository="https://github.com/n-takumasa/py-janaf", commit=COMMIT)
GENERATED_AT = "2026-10-12T00:00:00+00:00"
AL2O3 = "inorganic/Al/Al2O3-aluminum-oxide.json"
TIO2 = "inorganic/Ti/TiO2-titanium-oxide.json"


def _table(table_id: str, name: str, formula: str, janaf_formula: str, phase: str = "cr,l") -> JanafTable:
    return JanafTable(
        table_id=table_id,
        name=name,
        formula=formula,
        janaf_formula=janaf_formula,
        phase=phase,
        label=f"{formula}, {name} ({phase})",
        rows=[
            JanafRow(0.0, 0.0, 0.0, None, -8.636, -939.87, -939.87, None),
            JanafRow(2130.0, 79.228, 190.133, 126.276, 136.016, None, None, None, "CRYSTAL <--> LIQUID"),
        ],
        transitions=[JanafTransition(2130.0, "CRYSTAL <--> LIQUID", 5)],
    )


def _tables() -> list[JanafTable]:
    return [
        _table("Al-096", "Aluminum Oxide, Alpha", "Al2O3", "Al2O3", "cr"),
        _table("O-045", "Titanium Oxide", "TiO2", "O2Ti1"),
        _table("Al-101", "Aluminum Oxide", "Al2O3", "Al2O3"),
        _table("Mg-089", "Magnesium Aluminum Oxide", "MgAl2O4", "Al2Mg1O4", "cr"),
        _table("C-061", "Formaldehyde", "CH2O", "C1H2O1", "g"),
    ]


def _classes() -> JanafClasses:
    return JanafClasses({"50-00-0": {"class": "organic", "group": "aldehydes", "hill": "CH2O", "janaf": ["C-061"]}})


def _write(tmp_path) -> list:
    files = janaf_files(_tables(), _classes())
    return files, write_janaf_json(files, tmp_path)


def _read(tmp_path, path: str) -> dict:
    return json.loads((tmp_path / path).read_text())


class TestCompoundFiles:
    def test_paths(self, tmp_path):
        _, written = _write(tmp_path)
        assert [str(p.relative_to(tmp_path)) for p in written] == [
            AL2O3, "inorganic/Mg/MgAl2O4-magnesium-aluminum-oxide.json", TIO2,
            "organic/aldehydes/CH2O-formaldehyde.json",
        ]

    def test_file_holds_every_table_of_the_formula(self, tmp_path):
        _write(tmp_path)
        data = _read(tmp_path, AL2O3)
        assert list(data) == ["class", "group", "displayFormula", "hill", "tables"]
        assert (data["class"], data["group"], data["hill"]) == ("inorganic", "Al", "Al2O3")
        assert _read(tmp_path, TIO2)["displayFormula"] == "TiO2"
        assert list(data["tables"]) == ["Al-096", "Al-101"]

    def test_table_entry(self, tmp_path):
        _write(tmp_path)
        entry = _read(tmp_path, TIO2)["tables"]["O-045"]
        assert list(entry) == ["name", "formula", "janafFormula", "phase", "label", "ref", "rows", "transitions"]
        assert entry["ref"] == ["NISTJANAF", 1, "O-045"]
        assert entry["transitions"] == [{"T": 2130.0, "label": "CRYSTAL <--> LIQUID", "line": 5}]

    def test_null_cells_left_out(self, tmp_path):
        _write(tmp_path)
        rows = _read(tmp_path, TIO2)["tables"]["O-045"]["rows"]
        assert rows[0] == {"T": 0.0, "Cp": 0.0, "S": 0.0, "dH": -8.636, "dfH": -939.87, "dfG": -939.87}
        assert rows[1]["note"] == "CRYSTAL <--> LIQUID"
        assert "dfH" not in rows[1]

    def test_no_nan_or_infinity(self, tmp_path):
        _write(tmp_path)
        text = (tmp_path / AL2O3).read_text()
        assert "NaN" not in text and "Infinity" not in text


class TestSources:
    def test_sources(self, tmp_path):
        path = write_janaf_sources(tmp_path, SOURCE, GENERATED_AT)
        assert path == tmp_path / "sources.json"
        assert json.loads(path.read_text()) == {
            "generatedAt": GENERATED_AT,
            "ref": "NISTJANAF",
            "repository": "https://github.com/n-takumasa/py-janaf",
            "sourceCommit": COMMIT,
            "sourceTree": f"https://github.com/n-takumasa/py-janaf/tree/{COMMIT}",
            "license": "0BSD",
            "lineUrl": "{url}#L{line}",
            "tableUrl": f"https://github.com/n-takumasa/py-janaf/blob/{COMMIT}/src/janaf/data/{{id}}.txt",
            "nistUrl": "https://janaf.nist.gov/tables/{id}.html",
        }

    def test_ref_resolves_to_row_url(self, tmp_path):
        sources = json.loads(write_janaf_sources(tmp_path, SOURCE, GENERATED_AT).read_text())
        _write(tmp_path)
        _, line, table_id = _read(tmp_path, TIO2)["tables"]["O-045"]["ref"]
        url = sources["lineUrl"].format(url=sources["tableUrl"].format(id=table_id), line=line)
        assert url == f"https://github.com/n-takumasa/py-janaf/blob/{COMMIT}/src/janaf/data/O-045.txt#L1"

    def test_without_commit_use_main(self, tmp_path):
        source = JanafSource(repository="https://github.com/n-takumasa/py-janaf")
        sources = json.loads(write_janaf_sources(tmp_path, source, GENERATED_AT).read_text())
        assert sources["sourceCommit"] is None
        assert sources["sourceTree"].endswith("/tree/main")
        assert "/blob/main/src/janaf/data/{id}.txt" in sources["tableUrl"]


class TestUnits:
    def test_units(self, tmp_path):
        data = json.loads(write_janaf_units(tmp_path).read_text())
        assert data["rows"] == JANAF_UNITS
        assert data["rows"]["Cp"] == "J/(mol K)" and data["rows"]["dfH"] == "kJ/mol"

    def test_comment_defines_every_row_column(self, tmp_path):
        comment = json.loads(write_janaf_units(tmp_path).read_text())["$comment"]
        assert set(JANAF_ROW_DEFINITIONS) == set(JANAF_UNITS) | {"note"}
        assert "Tr = 298.15 K" in comment[0]
        assert comment[1:] == [f"{column}: {text}" for column, text in JANAF_ROW_DEFINITIONS.items()]
        assert "gef: Gibbs energy function, -[G° - H°(Tr)]/T" in comment


class TestIndex:
    def _index(self, tmp_path) -> dict:
        files = janaf_files(_tables() + [JanafTable("X-001", "No title formula", None, "Si1C1", "g")], _classes())
        path = write_janaf_index(files, tmp_path, GENERATED_AT)
        assert path == tmp_path / "index.json"
        return json.loads(path.read_text())

    def test_entry(self, tmp_path):
        assert self._index(tmp_path)["tables"]["O-045"] == {
            "hill": "O2Ti", "displayFormula": "TiO2", "formula": "TiO2", "janafFormula": "O2Ti1", "name": "Titanium Oxide", "phase": "cr,l",
            "label": "TiO2, Titanium Oxide (cr,l)", "class": "inorganic", "group": "Ti", "file": TIO2,
        }

    def test_null_fields_left_out(self, tmp_path):
        entry = self._index(tmp_path)["tables"]["X-001"]
        assert "formula" not in entry and "label" not in entry
        assert entry["file"] == "inorganic/Si/SiC-no-title-formula.json"

    def test_meta(self, tmp_path):
        data = self._index(tmp_path)
        assert list(data) == ["generatedAt", "count", "tables", "byFormula", "byElement", "byFamily"]
        assert data["count"] == 6
        assert list(data["tables"]) == sorted(data["tables"])

    def test_by_formula_is_hill(self, tmp_path):
        by_formula = self._index(tmp_path)["byFormula"]
        assert by_formula["Al2O3"] == ["Al-096", "Al-101"]
        assert by_formula["O2Ti"] == ["O-045"]

    def test_by_element_and_family(self, tmp_path):
        data = self._index(tmp_path)
        assert data["byElement"]["Ti"] == ["O-045"]
        assert data["byElement"]["Al"] == ["Al-096", "Al-101", "Mg-089"]
        assert list(data["byElement"]) == sorted(data["byElement"])
        assert data["byFamily"] == {"aldehydes": ["C-061"]}

    def test_every_entry_points_into_its_file(self, tmp_path):
        files = janaf_files(_tables(), _classes())
        write_janaf_json(files, tmp_path)
        index = json.loads(write_janaf_index(files, tmp_path, GENERATED_AT).read_text())
        for table_id, entry in index["tables"].items():
            assert table_id in _read(tmp_path, entry["file"])["tables"]
