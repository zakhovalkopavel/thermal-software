"""DraftSystemLister merges draft folders like diagram-review."""

from __future__ import annotations

import json
from pathlib import Path

from phase_diagrams.review.draft_system_lister import DraftSystemLister


def _write(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def test_list_prefers_richer_candidate_over_empty_autofull(tmp_path: Path) -> None:
    work = tmp_path / "work"
    dataset = tmp_path / "dataset"
    _write(
        work / "auto-full" / "cao-mgo-sio2.json",
        {"system": "CaO-MgO-SiO2", "components": ["CaO", "MgO", "SiO2"]},
    )
    _write(
        work / "candidates" / "cao-mgo-sio2.json",
        {
            "system": "CaO-MgO-SiO2",
            "components": ["CaO", "MgO", "SiO2"],
            "boundaryCurves": [{"polyline_wt": [[1, 0, 0], [0, 1, 0]]}],
            "invariantPoints": [{"id": "e1"}],
        },
    )
    _write(
        dataset / "systems" / "mgo-sio2.json",
        {
            "system": "MgO-SiO2",
            "components": ["MgO", "SiO2"],
            "liquidus": [{"points": [[0, 1600]]}],
        },
    )

    rows = DraftSystemLister(work_root=work, dataset_root=dataset).list_systems()
    by_id = {r["id"]: r for r in rows}
    assert set(by_id) == {"cao-mgo-sio2", "mgo-sio2"}
    cao = by_id["cao-mgo-sio2"]
    assert cao["draftSource"] == "candidates"
    assert "auto-full" in cao["availableSources"]
    assert cao["n_boundaries"] == 1
    assert cao["draftPath"].endswith("candidates/cao-mgo-sio2.json")


def test_resolve_honors_preferred_when_nonempty(tmp_path: Path) -> None:
    work = tmp_path / "work"
    dataset = tmp_path / "dataset"
    _write(
        work / "auto-full" / "demo.json",
        {
            "system": "demo",
            "components": ["A", "B", "C"],
            "boundaryCurves": [{"polyline_wt": [[1, 0, 0]]}],
        },
    )
    _write(
        work / "candidates" / "demo.json",
        {
            "system": "demo",
            "components": ["A", "B", "C"],
            "boundaryCurves": [{"polyline_wt": [[1, 0, 0], [0, 1, 0]]}],
        },
    )
    entry = DraftSystemLister(work_root=work, dataset_root=dataset).resolve(
        "demo",
        preferred="auto-full",
    )
    assert entry["draftSource"] == "auto-full"
