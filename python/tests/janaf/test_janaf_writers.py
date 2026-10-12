"""Tests for janaf.writers — per-prefix JSON output."""
from __future__ import annotations

import json

from janaf.janaf_row import JanafRow
from janaf.janaf_source import JanafSource
from janaf.janaf_table import JanafTable
from janaf.janaf_transition import JanafTransition
from janaf.writers import JANAF_META, write_janaf_index, write_janaf_json

COMMIT = "c8ed6be3ba31a61835061091bd3c521270b484ec"
SOURCE = JanafSource(repository="https://github.com/n-takumasa/py-janaf", commit=COMMIT)


def _table(table_id: str, formula: str) -> JanafTable:
    return JanafTable(
        table_id=table_id,
        name="Test",
        formula=formula,
        janaf_formula=formula,
        phase="cr,l",
        label=f"{formula}, Test (cr,l)",
        rows=[
            JanafRow(0.0, 0.0, 0.0, None, -8.636, -939.87, -939.87, None),
            JanafRow(2130.0, 79.228, 190.133, 126.276, 136.016, None, None, None, "CRYSTAL <--> LIQUID"),
        ],
        transitions=[JanafTransition(2130.0, "CRYSTAL <--> LIQUID")],
    )


def _tables() -> list[JanafTable]:
    return [_table("Al-096", "Al2O3"), _table("O-045", "TiO2"), _table("Al-101", "Al2O3")]


class TestGrouping:
    def test_one_file_per_prefix(self, tmp_path):
        written = write_janaf_json(_tables(), tmp_path, SOURCE)
        assert [p.name for p in written] == ["Al.json", "O.json"]

    def test_tio2_in_o_json(self, tmp_path):
        write_janaf_json(_tables(), tmp_path, SOURCE)
        data = json.loads((tmp_path / "O.json").read_text())
        assert list(data["tables"]) == ["O-045"]
        assert data["prefix"] == "O"
        assert data["count"] == 1

    def test_order_kept(self, tmp_path):
        write_janaf_json(_tables(), tmp_path, SOURCE)
        data = json.loads((tmp_path / "Al.json").read_text())
        assert list(data["tables"]) == ["Al-096", "Al-101"]
        assert data["count"] == 2


class TestContent:
    def test_meta_and_source(self, tmp_path):
        write_janaf_json(_tables(), tmp_path, SOURCE)
        data = json.loads((tmp_path / "O.json").read_text())
        assert data["ref"] == "NISTJANAF"
        assert "source" not in data and "url" not in data
        assert data["units"] == JANAF_META["units"]
        assert data["repository"] == "https://github.com/n-takumasa/py-janaf"
        assert data["sourceCommit"] == COMMIT
        assert "generatedAt" in data

    def test_links(self, tmp_path):
        write_janaf_json(_tables(), tmp_path, SOURCE)
        entry = json.loads((tmp_path / "O.json").read_text())["tables"]["O-045"]
        assert entry["sourceUrl"] == (
            f"https://github.com/n-takumasa/py-janaf/blob/{COMMIT}/src/janaf/data/O-045.txt"
        )
        assert entry["nistUrl"] == "https://janaf.nist.gov/tables/O-045.html"

    def test_links_without_commit_use_main(self, tmp_path):
        source = JanafSource(repository="https://github.com/n-takumasa/py-janaf")
        write_janaf_json(_tables(), tmp_path, source)
        data = json.loads((tmp_path / "O.json").read_text())
        assert data["sourceCommit"] is None
        assert "/blob/main/src/janaf/data/O-045.txt" in data["tables"]["O-045"]["sourceUrl"]

    def test_table_entry(self, tmp_path):
        write_janaf_json(_tables(), tmp_path, SOURCE)
        entry = json.loads((tmp_path / "O.json").read_text())["tables"]["O-045"]
        assert list(entry) == [
            "id", "name", "formula", "janafFormula", "phase", "label",
            "sourceUrl", "nistUrl", "rows", "transitions",
        ]
        assert entry["transitions"] == [{"T": 2130.0, "label": "CRYSTAL <--> LIQUID"}]
        assert entry["rows"][1]["note"] == "CRYSTAL <--> LIQUID"
        assert entry["rows"][1]["dfH"] is None

    def test_no_nan_or_infinity(self, tmp_path):
        write_janaf_json(_tables(), tmp_path, SOURCE)
        text = (tmp_path / "Al.json").read_text()
        assert "NaN" not in text and "Infinity" not in text
        assert json.loads(text)["tables"]["Al-096"]["rows"][0]["gef"] is None


class TestIndex:
    def _index(self, tmp_path) -> dict:
        tables = _tables() + [
            JanafTable("O-043", "Titanium Oxide, Rutile", "TiO2", "O2Ti1", "cr"),
            JanafTable("Mg-089", "Magnesium Aluminum Oxide", "MgAl2O4", "Al2Mg1O4", "cr"),
            JanafTable("X-001", "No title formula", None, "Si1C1", "g"),
        ]
        path = write_janaf_index(tables, tmp_path, SOURCE)
        assert path == tmp_path / "index.json"
        return json.loads(path.read_text())

    def test_entry_without_transitions(self, tmp_path):
        entry = self._index(tmp_path)["tables"]["O-045"]
        assert entry == {
            "formula": "TiO2",
            "janafFormula": "TiO2",
            "name": "Test",
            "phase": "cr,l",
            "label": "TiO2, Test (cr,l)",
            "file": "O.json",
        }

    def test_meta(self, tmp_path):
        data = self._index(tmp_path)
        assert data["count"] == 6
        assert data["ref"] == "NISTJANAF"
        assert data["repository"] == "https://github.com/n-takumasa/py-janaf"
        assert data["sourceCommit"] == COMMIT
        assert list(data["tables"]) == ["Al-096", "O-045", "Al-101", "O-043", "Mg-089", "X-001"]

    def test_by_formula(self, tmp_path):
        by_formula = self._index(tmp_path)["byFormula"]
        assert by_formula["Al2O3"] == ["Al-096", "Al-101"]
        assert by_formula["TiO2"] == ["O-045", "O-043"]
        assert by_formula["Si1C1"] == ["X-001"]

    def test_by_element(self, tmp_path):
        by_element = self._index(tmp_path)["byElement"]
        assert by_element["Ti"] == ["O-045", "O-043"]
        assert by_element["O"] == ["Al-096", "O-045", "Al-101", "O-043", "Mg-089"]
        assert by_element["Mg"] == ["Mg-089"]
        assert by_element["Al"] == ["Al-096", "Al-101", "Mg-089"]
        assert list(by_element) == sorted(by_element)
