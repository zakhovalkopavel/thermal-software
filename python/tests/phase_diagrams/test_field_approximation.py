"""
Unit tests for contour_segments and build_field_approximation: field regions, surfaces through the isotherms, contours and point values.
"""
from __future__ import annotations

import math

import numpy as np
import pytest

from phase_diagrams.builders.field_temperature_builder import build_field_approximation
from phase_diagrams.models.ternary_calibration import TernaryCalibration
from phase_diagrams.tracing.contour_segments import contour_segments

CALIBRATION = TernaryCalibration(["A", "B", "C"], {"C": (300.0, 40.0), "A": (40.0, 490.0), "B": (560.0, 490.0)})


def test_contour_of_a_plane_is_a_straight_line_and_nan_cells_are_skipped():
    grid = np.tile(np.arange(6, dtype=float), (5, 1))
    grid[0, 0] = np.nan
    segments = contour_segments(grid, 2.5, (100.0, 200.0), 10.0)
    assert len(segments) == 4
    assert all(s[0] == pytest.approx(125.0) and s[2] == pytest.approx(125.0) for s in segments)
    assert {round(min(s[1], s[3])) for s in segments} == {200, 210, 220, 230}
    assert len(contour_segments(grid, 0.5, (0.0, 0.0), 1.0)) == 3


def _isotherm(field: str, rich: str, other: str, share: float, temperature: float) -> dict:
    """Line of constant ``rich`` = ``share`` wt% (> 50) from edge to edge, all inside the field of ``rich``."""
    return {"field": field, "temperature_C": temperature,
            "polyline_wt": [{rich: share, other: o, "C": 100.0 - share - o} for o in np.linspace(0.0, 100.0 - share, 9)]}


def _system() -> tuple[dict, dict]:
    """Two fields split by the A = B line, T = 1000 + 10·(richer of A and B) in both."""
    boundary = [{"A": a, "B": a, "C": 100.0 - 2 * a} for a in np.linspace(50.0, 0.0, 11)]
    invariants = [
        {"id": "e-1", "phases": ["alpha", "beta"], "temperature_C": 1500.0, "liquid_wt": {"A": 50.0, "B": 50.0, "C": 0.0}},
        {"id": "e-2", "phases": ["alpha", "beta"], "temperature_C": 1000.0, "liquid_wt": {"A": 0.0, "B": 0.0, "C": 100.0}},
    ]
    system = {
        "components": ["A", "B", "C"],
        "phases": ["alpha", "beta"],
        "invariantPoints": invariants,
        "boundaryCurves": [{"fields": ["alpha", "beta"], "path": ["e-1", "e-2"], "polyline_wt": boundary}],
        "isotherms": [_isotherm("alpha", "A", "B", s, 1000 + 10 * s) for s in (60.0, 70.0, 80.0)]
                     + [_isotherm("beta", "B", "A", s, 1000 + 10 * s) for s in (60.0, 70.0, 80.0)],
    }
    return system, {p["id"]: p for p in invariants}


def test_fields_are_split_by_the_boundary_and_take_the_phase_of_their_isotherms():
    system, invariants = _system()
    approx = build_field_approximation(system, CALIBRATION, invariants)
    x0, y0 = approx.origin
    a_side = CALIBRATION.to_page({"A": 70.0, "B": 10.0, "C": 20.0})
    b_side = CALIBRATION.to_page({"A": 10.0, "B": 70.0, "C": 20.0})
    assert approx.phases[approx.labels[round(a_side[1]) - y0, round(a_side[0]) - x0] - 1] == "alpha"
    assert approx.phases[approx.labels[round(b_side[1]) - y0, round(b_side[0]) - x0] - 1] == "beta"


def test_surface_reproduces_a_linear_field_its_isotherms_and_the_printed_points():
    system, invariants = _system()
    approx = build_field_approximation(system, CALIBRATION, invariants)
    assert set(approx.fits) == {"alpha", "beta"}
    assert all(rms < 2.0 for _, rms, _ in approx.fits.values())
    start = np.array(CALIBRATION.to_page({"A": 70.0, "B": 0.0, "C": 30.0}))
    end = np.array(CALIBRATION.to_page({"A": 70.0, "B": 30.0, "C": 0.0}))
    direction = (end - start) / np.linalg.norm(end - start)
    segments = next(seg for phase, t, seg in approx.isotherms if phase == "alpha" and t == 1700.0)
    assert segments
    for x0, y0, x1, y1 in segments:
        for point in ((x0, y0), (x1, y1)):
            offset = np.array(point) - start
            assert abs(offset[0] * direction[1] - offset[1] * direction[0]) < 3.0
    e1 = next(p for p in approx.points if p.label == "e-1")
    assert e1.approx["alpha"] == pytest.approx(1500.0, abs=10.0) and e1.approx["beta"] == pytest.approx(1500.0, abs=10.0)


def test_contours_stay_inside_the_hull_of_the_control_points():
    system, invariants = _system()
    approx = build_field_approximation(system, CALIBRATION, invariants)
    corner = CALIBRATION.to_page({"A": 100.0, "B": 0.0, "C": 0.0})
    near_isotherm = math.dist(corner, CALIBRATION.to_page({"A": 80.0, "B": 0.0, "C": 20.0}))
    for phase, _, segments in approx.isotherms:
        for x0, y0, x1, y1 in segments:
            assert math.dist(corner, (x0, y0)) >= near_isotherm - 3.0


def test_phase_without_enough_control_points_has_no_surface():
    system, invariants = _system()
    system["isotherms"] = [i for i in system["isotherms"] if i["field"] == "alpha"]
    for point in system["invariantPoints"]:
        point["temperature_C"] = None
    approx = build_field_approximation(system, CALIBRATION, invariants)
    assert "alpha" in approx.fits and "beta" not in approx.fits
    assert any(line.startswith("beta: 0 control points") for line in approx.log)
