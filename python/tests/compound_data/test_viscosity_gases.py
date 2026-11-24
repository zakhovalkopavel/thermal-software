"""Huber 2019 dilute-gas viscosity tables join as raw viscosity / gas rows."""
from __future__ import annotations

import json
from pathlib import Path

from chemicals_tables.raw_value import RawValue
from compound_data.constants.viscosity_gases_source import VISCOSITY_GASES_FILE, VISCOSITY_GASES_TABLES
from compound_data.parsers.viscosity_gases import parse_viscosity_gases

N2 = "7727-37-9"
H2S = "7783-06-4"


def test_fixture_keeps_non_null_points_only(tmp_path: Path):
    path = tmp_path / "viscosity-gases.json"
    path.write_text(json.dumps({
        "tables": [{
            "id": "huber2019Viscosity",
            "title": "Huber 2019",
            "pressure_Pa": 100000,
            "unit": "Pa s",
            "rows": [{
                "cas": "0000-00-0", "formula": "N2", "name": "Nitrogen",
                "p0": True, "moreAccurate": True, "sourceRefs": [16, 17],
                "line": 42,
                "points": [
                    {"T": 100, "mu": 6.7e-6},
                    {"T": 200, "mu": 1.28e-5},
                    {"T": 300, "mu": None},
                ],
            }],
        }],
    }, indent=2), encoding="utf-8")

    result = parse_viscosity_gases(path)
    assert [t.key for t in result.tables] == ["huber2019Viscosity"]
    assert len(result.entries) == 1 and result.issues == []
    entry = result.entries[0]
    assert (entry.cas, entry.formula, entry.property, entry.phase) == ("0000-00-0", "N2", "viscosity", "gas")
    assert isinstance(entry.value, RawValue)
    assert entry.value.values["points"] == [
        {"T": 100, "mu": 6.7e-6},
        {"T": 200, "mu": 1.28e-5},
    ]
    assert entry.value.values["p0"] is True
    assert entry.value.values["moreAccurate"] is True
    assert entry.value.values["pressure_Pa"] == 100000
    assert "bestEquation" not in entry.value.values
    assert entry.value.to_dict()["ref"] == ["Huber2019", 42, "huber2019Viscosity"]


def test_fixture_row_precision_overrides_defaults(tmp_path: Path):
    path = tmp_path / "viscosity-gases.json"
    path.write_text(json.dumps({
        "tables": [{
            "id": "huber2019Viscosity",
            "title": "Huber 2019",
            "pressure_Pa": 100000,
            "unit": "Pa s",
            "rows": [{
                "cas": N2, "formula": "N2", "name": "Nitrogen",
                "p0": True, "moreAccurate": True, "line": 1,
                "points": [{"T": 300, "mu": 1.78e-5}],
                "bestEquation": {"ref": "Perry8", "type": "dipprN102"},
                "mape_pct": 1.23, "max_abs_pct": 2.34, "nCompared": 1,
            }],
        }],
    }, indent=2), encoding="utf-8")
    entry = parse_viscosity_gases(path).entries[0]
    assert entry.value.values["bestEquation"] == {"ref": "Perry8", "type": "dipprN102"}
    assert entry.value.values["mape_pct"] == 1.23
    assert entry.value.values["max_abs_pct"] == 2.34
    assert entry.value.values["nCompared"] == 1
    assert entry.value.values["points"] == [{"T": 300, "mu": 1.78e-5}]


def test_unknown_table_is_reported(tmp_path: Path):
    path = tmp_path / "viscosity-gases.json"
    path.write_text(json.dumps({"tables": [{"id": "nope", "title": "?", "rows": [{"a": 1}]}]}, indent=2))
    result = parse_viscosity_gases(path)
    assert result.entries == [] and result.tables == []
    assert [i["issue"] for i in result.issues] == ["viscosityGasesUnknownTable"]


def test_committed_file_has_every_mapped_row_without_nulls():
    path = Path("/app") / VISCOSITY_GASES_FILE
    if not path.is_file():
        path = Path(__file__).resolve().parents[3] / VISCOSITY_GASES_FILE
    if not path.is_file():
        raise AssertionError(f"{VISCOSITY_GASES_FILE} not found")
    result = parse_viscosity_gases(path)
    assert {t.key for t in result.tables} == set(VISCOSITY_GASES_TABLES)
    assert len(result.entries) == 35 and result.issues == []
    n2 = next(e for e in result.entries if e.cas == N2)
    assert isinstance(n2.value, RawValue)
    assert all(p["mu"] is not None for p in n2.value.values["points"])
    assert n2.value.values["points"][0] == {"T": 100, "mu": 6.7e-6}
    assert n2.value.values["bestEquation"] == {"ref": "White3", "type": "sutherland"}
    assert n2.value.values["mape_pct"] == 0.61
    assert n2.value.values["max_abs_pct"] == 1.02
    assert n2.value.values["nCompared"] == 6
    h2s = next(e for e in result.entries if e.cas == H2S)
    temps = [p["T"] for p in h2s.value.values["points"]]
    assert temps == [200, 300, 400, 500, 600]
    assert "Air" not in {e.label for e in result.entries}
