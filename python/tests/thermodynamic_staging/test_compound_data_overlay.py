"""Tests for multi-source minerals-thermodynamic → compound-data overlay."""

from __future__ import annotations

import json
from pathlib import Path

from thermodynamic_staging.compound_data_overlay import overlay_minerals_thermodynamic
from thermodynamic_staging.compound_data_phase_map import map_phase_to_patches


def test_map_koroleva_and_hp_scalars() -> None:
    k = map_phase_to_patches(
        "Li2SiO3",
        {
            "formula": "Li2SiO3",
            "Hf298_kJmol": -1640.49,
            "S298_JmolK": 81.52,
            "status": "ok",
            "ref": "Koroleva2017",
            "table": 1,
        },
        source_ref="Koroleva2017",
        convention="formation_298",
    )
    assert abs(k["properties"]["enthalpyFormation298"][0]["value"] + 1_640_490) < 1
    assert abs(k["properties"]["entropy298"][0]["value"] - 81.52) < 1e-6

    hp = map_phase_to_patches(
        "fo",
        {
            "formula": "Mg2SiO4",
            "H_Jmol": -2172500.0,
            "S0_JmolK": 95.1,
            "V0_Jbar": 4.366,
            "cp": {"c1": 233.3, "c2": 0.001494},
            "status": "ok",
            "ref": "HollandPowell2011",
        },
        source_ref="HollandPowell2011",
        convention="HSC",
    )
    assert abs(hp["properties"]["enthalpyFormation298"][0]["value"] + 2_172_500) < 1
    assert any(r["property"] == "hollandPowellV0" for r in hp["raw"])
    assert any(r["property"] == "heatCapacity" for r in hp["raw"])


def test_overlay_staging_sources_into_tmp_compound_data(tmp_path: Path) -> None:
    staging = tmp_path / "minerals-thermodynamic"
    (staging / "koroleva-2017").mkdir(parents=True)
    (staging / "koroleva-2017" / "phases.json").write_text(
        json.dumps(
            {
                "source": "Koroleva2017",
                "ref": "Koroleva2017",
                "convention": "formation_298",
                "nPhases": 1,
                "phases": {
                    "Li2SiO3": {
                        "formula": "Li2SiO3",
                        "Hf298_kJmol": -1640.49,
                        "S298_JmolK": 81.52,
                        "status": "ok",
                        "ref": "Koroleva2017",
                        "table": 1,
                    }
                },
                "regressions": {
                    "silicate_S298": {
                        "equation": 6,
                        "coeffs": {"SiO2": 43.153},
                        "ref": "Koroleva2017",
                    }
                },
            }
        ),
        encoding="utf-8",
    )
    (staging / "jung-2009").mkdir()
    (staging / "jung-2009" / "phases.json").write_text(
        json.dumps(
            {
                "source": "Jung2009AlTiO",
                "ref": "Jung2009AlTiO",
                "convention": "formation_298",
                "phases": {
                    "tialite": {
                        "formula": "Al2TiO5",
                        "Hf298_Jmol": -2577174.0,
                        "S298_JmolK": 128.448,
                        "status": "ok",
                        "ref": "Jung2009AlTiO",
                    },
                    "liquid_MQM": {
                        "formula": "AlO1.5-TiO1.5-TiO2",
                        "model": "modified_quasichemical",
                        "parameters": {"binaries": {}},
                        "status": "ok",
                        "ref": "Jung2009AlTiO",
                    },
                },
            }
        ),
        encoding="utf-8",
    )

    cd = tmp_path / "compound-data"
    (cd / "inorganic" / "Li").mkdir(parents=True)
    index = {
        "generatedAt": "test",
        "count": 0,
        "equationTypes": {},
        "compounds": {},
        "byFormula": {},
        "byElement": {},
    }
    (cd / "index.json").write_text(json.dumps(index), encoding="utf-8")

    summary = overlay_minerals_thermodynamic(
        staging, cd, dry_run=False, include_robie=False
    )
    assert summary["okPhases"] >= 3
    # Convention: ``<displayFormula>-<name-slug>.json`` (see compound_file_name).
    assert "inorganic/Li/Li2SiO3.json" in summary["createdFiles"]
    assert "inorganic/Ti/Al2TiO5-tialite.json" in summary["createdFiles"]
    assert not any(
        m in f
        for f in summary["createdFiles"]
        for m in ("-malan-2019-", "-jung-2009-", "-holland-powell-ds633-")
    )
    assert "inorganic/Si/SiO2-silicate-and-borate-regressions.json" in summary["createdFiles"]

    # Idempotent
    summary2 = overlay_minerals_thermodynamic(
        staging, cd, dry_run=False, include_robie=False
    )
    assert summary2["createdFiles"] == []
    assert summary2.get("purgedLegacyStubs") == []
