"""Hand-moved book gas equations are kept when the source file is read."""
from __future__ import annotations

import json
from pathlib import Path

from chemicals_tables.constants.equation_type import EquationType
from compound_data.constants.book_gas_source import BOOK_GAS_FILE, BOOK_GAS_TABLES
from compound_data.parsers.book_gas_equations import parse_book_gas_equations

CO2 = "124-38-9"
N2 = "7727-37-9"


def test_fixture_keeps_perry7_dippr_n107(tmp_path: Path):
    path = tmp_path / "book-gas.json"
    path.write_text(json.dumps({
        "tables": [{
            "id": "perry7Gas",
            "title": "Perry 7",
            "rows": [{
                "cas": CO2, "formula": "CO2", "name": "carbon dioxide",
                "property": "heatCapacity", "phase": "gas", "type": "dipprN107",
                "vars": {"c1": 29370.0, "c2": 34540.0, "c3": 1428.0, "c4": 26400.0, "c5": 588},
                "min": 50, "max": 5000, "k": 0.001, "line": 223,
            }],
        }],
    }, indent=2), encoding="utf-8")

    result = parse_book_gas_equations(path)
    assert [t.key for t in result.tables] == ["perry7Gas"]
    assert len(result.entries) == 1 and result.issues == []
    entry = result.entries[0]
    assert (entry.cas, entry.formula, entry.property, entry.phase) == (CO2, "CO2", "heatCapacity", "gas")
    assert entry.value.type == EquationType.dipprN107
    assert entry.value.k == 0.001
    assert entry.value.to_dict()["ref"] == ["Perry7", 223, "perry7Gas"]


def test_unknown_table_is_reported(tmp_path: Path):
    path = tmp_path / "book-gas.json"
    path.write_text(json.dumps({"tables": [{"id": "nope", "title": "?", "rows": [{"a": 1}]}]}, indent=2))
    result = parse_book_gas_equations(path)
    assert result.entries == [] and result.tables == []
    assert [i["issue"] for i in result.issues] == ["bookGasUnknownTable"]


def test_committed_file_keeps_every_hand_moved_table():
    path = Path("/app") / BOOK_GAS_FILE
    if not path.is_file():
        path = Path(__file__).resolve().parents[3] / BOOK_GAS_FILE
    if not path.is_file():
        raise AssertionError(f"{BOOK_GAS_FILE} not found")
    result = parse_book_gas_equations(path)
    assert {t.key for t in result.tables} == set(BOOK_GAS_TABLES)
    assert len(result.entries) == 64 and result.issues == []
    co2 = [e for e in result.entries if e.cas == CO2 and e.value.type == EquationType.dipprN107]
    assert len(co2) == 1 and co2[0].value.k == 0.001
    n2 = [e for e in result.entries if e.cas == N2 and e.value.source.key == "szargutGas"]
    assert n2 and n2[0].value.type == EquationType.linear
