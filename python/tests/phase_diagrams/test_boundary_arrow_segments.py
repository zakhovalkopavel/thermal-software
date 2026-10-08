"""
Unit tests for boundary_arrow_segments and the stored arrows on the node map.
"""
from __future__ import annotations

import numpy as np
import pytest

from phase_diagrams.builders.boundary_arrow_segments import boundary_arrow_segments
from phase_diagrams.models.ternary_calibration import TernaryCalibration
from phase_diagrams.rendering.node_map_renderer import render_node_map

CORNERS = {"SiO2": [500, 100], "CaO": [100, 800], "MgO": [900, 800]}
CALIBRATION = TernaryCalibration(["CaO", "MgO", "SiO2"], {k: (float(v[0]), float(v[1])) for k, v in CORNERS.items()})


def _wt(pixel: tuple[float, float]) -> list[float]:
    return list(CALIBRATION.to_wt(*pixel).values())


def _system(curve: dict) -> dict:
    middle = dict(zip(["CaO", "MgO", "SiO2"], _wt((400.0, 500.0))))
    return {"components": ["CaO", "MgO", "SiO2"], "digitization": {"calibration": CORNERS},
            "invariantPoints": [{"id": "m", "liquid_wt": middle}], "boundaryCurves": [curve]}


def test_polyline_is_cut_at_the_inner_path_point():
    polyline = [_wt(p) for p in ((300.0, 500.0), (350.0, 500.0), (400.0, 500.0), (450.0, 500.0), (500.0, 500.0))]
    pieces = boundary_arrow_segments(_system({"path": ["a", "m", "b"], "arrows": ["<", ">"], "polyline_wt": polyline}))
    assert [arrow for _, arrow in pieces] == ["<", ">"]
    assert pieces[0][0][0] == pytest.approx((300.0, 500.0), abs=0.01)
    assert pieces[0][0][-1] == pytest.approx((400.0, 500.0), abs=0.01)
    assert pieces[1][0][-1] == pytest.approx((500.0, 500.0), abs=0.01)


def test_open_end_adds_a_piece_and_curves_without_arrows_are_skipped():
    polyline = [_wt(p) for p in ((400.0, 500.0), (450.0, 500.0), (500.0, 500.0))]
    assert len(boundary_arrow_segments(_system({"path": ["m"], "arrows": ["?"], "polyline_wt": polyline}))) == 1
    assert boundary_arrow_segments(_system({"path": ["m"], "polyline_wt": polyline})) == []


def test_node_map_draws_the_arrowhead_its_way():
    image = np.full((300, 300), 255, np.uint8)
    pixels = [(100.0, 150.0), (200.0, 150.0)]
    centres = []
    for arrow in (">", "<"):
        tile = np.asarray(render_node_map(image, [], (0, 0, 300, 300), arrows=[(pixels, arrow)])).astype(int)
        magenta = (tile[..., 0] > 200) & (tile[..., 1] < 60) & (tile[..., 2] > 100) & (tile[..., 2] < 180)
        xs = np.nonzero(magenta)[1]
        centres.append(xs.mean() if len(xs) else None)
    assert centres[0] is not None and centres[1] is not None
    assert centres[0] < centres[1]
