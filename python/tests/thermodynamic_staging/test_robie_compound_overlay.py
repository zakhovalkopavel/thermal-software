"""Tests for Robie → compound-data overlay (idempotent, formula match)."""

from __future__ import annotations

import json
from pathlib import Path

from usgs_bulletin_2131.compound_data_overlay import overlay_robie_into_compound_data


def test_overlay_creates_and_is_idempotent(tmp_path: Path) -> None:
    staging = {
        "source": "RobieHemingway1995",
        "phases": {
            "corundum": {
                "phaseId": "corundum",
                "formula": "Al2O3",
                "name": "Corundum",
                "Hf298_kJmol": -1675.7,
                "S298_JmolK": 50.9,
                "Gf298_kJmol": -1582.3,
                "pdfPage": 21,
                "status": "ok",
                "cpRanges": [
                    {
                        "A": {
                            "A1": 161.2,
                            "A2": -0.001352,
                            "A3": -1815000.0,
                            "A4": -1059.0,
                            "A5": 5.381e-07,
                        },
                        "Tmin_K": 298.0,
                        "Tmax_K": 2250.0,
                        "pdfPage": 53,
                    }
                ],
            },
            "partial-only": {
                "phaseId": "partial-only",
                "formula": "ZZZ99",
                "status": "partial",
                "Hf298_kJmol": -1.0,
            },
        },
    }
    staging_path = tmp_path / "phases.json"
    staging_path.write_text(json.dumps(staging), encoding="utf-8")

    cd = tmp_path / "compound-data"
    (cd / "inorganic" / "Al").mkdir(parents=True)
    existing = {
        "class": "inorganic",
        "group": "Al",
        "displayFormula": "Al2O3",
        "hill": "Al2O3",
        "elements": ["Al", "O"],
        "entries": {
            "electrocorundum": {
                "compoundId": "electrocorundum",
                "name": "electrocorundum",
                "synonyms": ["corundum", "aluminum oxide"],
                "properties": {
                    "enthalpyFormation298": [
                        {"value": -1675700, "phase": "solid", "ref": ["CRC95", 1]}
                    ]
                },
                "equations": {},
            }
        },
    }
    (cd / "inorganic" / "Al" / "Al2O3-emery.json").write_text(
        json.dumps(existing, indent=2), encoding="utf-8"
    )
    index = {
        "generatedAt": "test",
        "count": 1,
        "equationTypes": {},
        "compounds": {
            "electrocorundum": {
                "compoundId": "electrocorundum",
                "file": "inorganic/Al/Al2O3-emery.json",
                "hill": "Al2O3",
                "displayFormula": "Al2O3",
                "entry": "electrocorundum",
                "name": "electrocorundum",
                "class": "inorganic",
                "group": "Al",
            }
        },
        "byFormula": {"Al2O3": ["electrocorundum"]},
        "byElement": {},
    }
    (cd / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")

    s1 = overlay_robie_into_compound_data(staging_path, cd)
    assert "inorganic/Al/Al2O3-emery.json" in s1["updatedFiles"]
    data = json.loads((cd / "inorganic" / "Al" / "Al2O3-emery.json").read_text())
    props = data["entries"]["electrocorundum"]["properties"]["enthalpyFormation298"]
    assert any(r.get("ref", [None])[0] == "RobieHemingway1995" for r in props)
    eqs = data["entries"]["electrocorundum"]["equations"]["heatCapacity"]["solid"]["values"]
    assert eqs[0]["type"] == "robieHemingway"

    s2 = overlay_robie_into_compound_data(staging_path, cd)
    assert s2["unchanged"] >= 1
    props2 = json.loads((cd / "inorganic" / "Al" / "Al2O3-emery.json").read_text())[
        "entries"
    ]["electrocorundum"]["properties"]["enthalpyFormation298"]
    robie_count = sum(1 for r in props2 if r.get("ref", [None])[0] == "RobieHemingway1995")
    assert robie_count == 1


def test_overlay_creates_stub_when_missing(tmp_path: Path) -> None:
    staging_dir = tmp_path / "robie-hemingway-1995"
    staging_dir.mkdir()
    (staging_dir / "zircon.json").write_text(
        json.dumps(
            {
                "phaseId": "zircon",
                "formula": "ZrSiO4",
                "name": "Zircon",
                "status": "ok",
                "table298": {
                    "Hf298_kJmol": -1911.6,
                    "S298_JmolK": 84.0,
                    "Gf298_kJmol": -1800.0,
                    "pdfPage": 39,
                },
                "cpRanges": [
                    {
                        "A": {"A1": 1.0, "A2": 2.0, "A3": 3.0, "A4": 4.0, "A5": 5.0},
                        "Tmin_K": 298,
                        "Tmax_K": 1800,
                        "pdfPage": 66,
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    cd = tmp_path / "compound-data"
    cd.mkdir()
    (cd / "index.json").write_text(
        json.dumps(
            {
                "count": 0,
                "equationTypes": {},
                "compounds": {},
                "byFormula": {},
                "byElement": {},
            }
        ),
        encoding="utf-8",
    )
    summary = overlay_robie_into_compound_data(staging_dir, cd)
    assert summary["createdFiles"]
    created = cd / summary["createdFiles"][0]
    assert created.is_file()
    body = json.loads(created.read_text())
    assert "zircon" in str(body["entries"]).lower() or any(
        e.get("compoundId") == "zircon" for e in body["entries"].values()
    )
