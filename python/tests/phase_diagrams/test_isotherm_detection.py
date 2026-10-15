"""
Unit tests for the isotherm detector: skeleton branches, branch chaining, the temperature solver, inferred bounds, draft entries, comparison with a config, detection on a synthetic page and the automatic overlay inputs.
"""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw

from phase_diagrams.builders.auto_overlay_curves import auto_overlay_curves
from phase_diagrams.builders.auto_system_builder import build_auto_system
from phase_diagrams.builders.isotherm_detector import detect_isotherms
from phase_diagrams.builders.isotherm_temperature_solver import solve_isotherm_temperatures
from phase_diagrams.detection.skeleton_branches import skeleton_branches
from phase_diagrams.models.detected_isotherm import DetectedIsotherm
from phase_diagrams.models.ternary_calibration import TernaryCalibration
from phase_diagrams.output.isotherm_draft_comparison import compare_isotherm_draft
from phase_diagrams.tracing.branch_chainer import chain_branches
from phase_diagrams.validation.inferred_temperature_check import inferred_temperature_problem

CALIBRATION = TernaryCalibration(["A", "B", "C"], {"C": (300.0, 40.0), "A": (40.0, 490.0), "B": (560.0, 490.0)})


def _plus(size: int = 61) -> np.ndarray:
    sk = np.zeros((size, size), bool)
    sk[size // 2, 5:size - 5] = True
    sk[5:size - 5, size // 2] = True
    return sk


def test_skeleton_branches_split_at_a_crossing_and_keep_a_line_whole():
    branches, junctions = skeleton_branches(_plus())
    assert len(branches) == 4
    assert all((first > 0) != (last > 0) for first, last in junctions)
    line = np.zeros((20, 80), bool)
    line[10, 5:75] = True
    branches, junctions = skeleton_branches(line)
    assert len(branches) == 1 and junctions == [(0, 0)] and len(branches[0]) == 70


def test_skeleton_branches_prune_short_spurs():
    sk = np.zeros((40, 100), bool)
    sk[20, 5:95] = True
    sk[14:20, 50] = True
    branches, _ = skeleton_branches(sk, spur_pixels=8)
    assert len(branches) == 1 and len(branches[0]) >= 88


def test_crossing_lines_continue_through_the_junction():
    branches, junctions = skeleton_branches(_plus())
    empty = np.zeros((61, 61), bool)
    chains = chain_branches(branches, junctions, empty, empty)
    assert len(chains) == 2
    assert {tuple(np.ptp(c.pixels, axis=0) > 30) for c in chains} == {(True, False), (False, True)}


def test_a_label_gap_is_bridged_only_over_text():
    left = np.array([[x, 20] for x in range(5, 60)])
    right = np.array([[x, 20] for x in range(150, 220)])
    text = np.zeros((40, 230), bool)
    barrier = np.zeros((40, 230), bool)
    assert len(chain_branches([left, right], [(0, 0), (0, 0)], text, barrier)) == 2
    text[10:31, 70:140] = True
    chains = chain_branches([left, right], [(0, 0), (0, 0)], text, barrier)
    assert len(chains) == 1 and chains[0].gap_kinds() == {"text"}
    barrier[:, 100] = True
    assert len(chain_branches([left, right], [(0, 0), (0, 0)], text, barrier)) == 2


def test_solver_fixes_a_ladder_with_as_many_steps_as_crossings():
    options, rejected = solve_isotherm_temperatures(3, {}, [([0, 1, 2], 1000.0, 1400.0)], 100.0)
    assert options == [[1100.0], [1200.0], [1300.0]] and rejected == []
    options, _ = solve_isotherm_temperatures(2, {}, [([0, 1], 1000.0, 1400.0)], 100.0)
    assert options == [[1100.0, 1200.0], [1200.0, 1300.0]]


def test_solver_uses_labels_and_rejects_a_contradicting_ladder():
    options, rejected = solve_isotherm_temperatures(2, {1: 1200.0}, [([0, 1], 1000.0, 1400.0)], 100.0)
    assert options == [[1100.0], [1200.0]] and rejected == []
    ladders = [([0, 1], 1000.0, 1300.0), ([1, 0], 1000.0, 1300.0)]
    options, rejected = solve_isotherm_temperatures(2, {}, ladders, 100.0)
    assert rejected == [1] and options == [[1100.0], [1200.0]]


def test_inferred_between_bounds():
    assert inferred_temperature_problem(800, {"between": [740, 867], "step": 100}) is None
    assert "not between" in inferred_temperature_problem(900, {"between": [740, 867], "step": 100})
    assert "whole number" in inferred_temperature_problem(850, {"between": [740, 867], "step": 100})
    assert "exactly one" in inferred_temperature_problem(800, {"between": [740, 867], "from": [900], "step": 100})
    assert "low < high" in inferred_temperature_problem(800, {"between": [867, 740], "step": 100})


def test_config_entry_marks_the_far_side_of_a_label_gap_straight_and_compares_with_the_config():
    pixels = [(float(x), 100.0) for x in range(100, 161, 10)] + [(float(x), 100.0) for x in range(260, 401, 10)]
    piece = DetectedIsotherm(field="alpha", pixels=pixels, straight=[7], temperature_C=1200.0, source="label",
                             evidence=["label '1200' (90)"])
    entry = piece.config_entry((10.0, 0.0))
    assert entry["startPixel"] == [90, 100] and entry["endPixel"] == [390, 100] and entry["new"] is True
    assert [150, 100] in entry["waypoints"] and {"pixel": [250, 100], "straight": True} in entry["waypoints"]
    hand = [{"field": "alpha", "temperature_C": 1200, "startPixel": (100, 102), "endPixel": (400, 102), "waypoints": []},
            {"field": "alpha", "temperature_C": 1300, "startPixel": (100, 200), "endPixel": (400, 200), "waypoints": []}]
    rows, unmatched = compare_isotherm_draft([piece], hand)
    assert rows[0]["pieces"] == [0] and rows[0]["agrees"] and rows[0]["coverage"] > 0.6
    assert rows[1]["pieces"] == [] and unmatched == []


def _wt(a: float, b: float) -> dict:
    return {"A": a, "B": b, "C": 100.0 - a - b}


def _synthetic_page():
    """Three fields meeting at the centre (1000 °C) with boundaries to the edge midpoints (1400 °C);
    one line through alpha and beta crossing their boundary, one labelled line in gamma."""
    third = 100.0 / 3.0
    invariants = [
        {"id": "e", "temperature_C": 1000.0, "liquid_wt": _wt(third, third)},
        {"id": "m-ab", "temperature_C": 1400.0, "liquid_wt": _wt(50.0, 50.0)},
        {"id": "m-bc", "temperature_C": 1400.0, "liquid_wt": _wt(0.0, 50.0)},
        {"id": "m-ca", "temperature_C": 1400.0, "liquid_wt": _wt(50.0, 0.0)},
    ]

    def boundary(fields, end, wt):
        return {"fields": fields, "path": [end, "e"],
                "polyline_wt": [{k: wt[k] + (third - wt[k]) * t for k in wt} for t in np.linspace(0.0, 1.0, 21)]}

    system = {
        "components": ["A", "B", "C"],
        "phases": ["alpha", "beta", "gamma"],
        "invariantPoints": invariants,
        "boundaryCurves": [boundary(["alpha", "beta"], "m-ab", _wt(50.0, 50.0)),
                           boundary(["beta", "gamma"], "m-bc", _wt(0.0, 50.0)),
                           boundary(["gamma", "alpha"], "m-ca", _wt(50.0, 0.0))],
        "isotherms": [],
    }
    image = Image.new("1", (620, 540), 0)
    draw = ImageDraw.Draw(image)
    page = CALIBRATION.to_page
    corners = [page(_wt(100.0, 0.0)), page(_wt(0.0, 100.0)), page(_wt(0.0, 0.0))]
    draw.line([*corners, corners[0]], fill=1, width=5)
    for curve in system["boundaryCurves"]:
        draw.line([page(w) for w in curve["polyline_wt"]], fill=1, width=8)
    alpha = [page(_wt(40.0, b)) for b in np.linspace(20.0, 40.0, 30)]
    beta = [page(_wt(a, 40.0)) for a in np.linspace(40.0, 20.0, 30)]
    draw.line(alpha, fill=1, width=3)
    draw.line(beta, fill=1, width=3)
    gamma = [page(_wt(a, 40.0 - a)) for a in np.linspace(40.0, 0.0, 60)]
    left, right = gamma[:18], gamma[-18:]
    draw.line(left, fill=1, width=3)
    draw.line(right, fill=1, width=3)
    x, y = left[-1][0] + 10, left[-1][1] - 15
    for k in range(4):
        draw.rectangle([x + 19 * k, y, x + 19 * k + 14, y + 28], outline=1, width=3)
    return system, {p["id"]: p for p in invariants}, np.array(image, bool)


def test_detector_finds_the_lines_their_fields_and_temperatures():
    system, invariants, mask = _synthetic_page()
    calls = []

    def reader(glyphs, angle):
        calls.append(glyphs.shape)
        return "1600", 90.0

    result = detect_isotherms(system, mask, CALIBRATION, invariants, (2.0, 6.0), step_C=200.0, read_number=reader)
    by_field = {p.field: p for p in result.isotherms}
    assert set(by_field) == {"alpha", "beta", "gamma"}, result.log
    assert by_field["alpha"].group == by_field["beta"].group
    assert by_field["alpha"].temperature_C == 1200.0 and by_field["alpha"].source == "boundary order"
    assert by_field["alpha"].inferred == {"between": [1000.0, 1400.0], "step": 200.0}
    assert by_field["gamma"].temperature_C == 1600.0 and by_field["gamma"].source == "label"
    assert by_field["gamma"].straight and calls
    entry = by_field["alpha"].config_entry()
    assert inferred_temperature_problem(entry["temperature_C"], entry["inferred"]) is None


def test_auto_system_and_overlay_curves_hold_only_the_detected_isotherms():
    system, invariants, mask = _synthetic_page()
    system["isotherms"] = [{"field": "alpha", "temperature_C": 1300.0, "polyline_wt": [_wt(45.0, 30.0), _wt(45.0, 40.0)]}]
    result = detect_isotherms(system, mask, CALIBRATION, invariants, (2.0, 6.0), step_C=200.0)
    auto = build_auto_system(system, result, CALIBRATION)
    assert {(i["field"], i["temperature_C"]) for i in auto["isotherms"]} == {("alpha", 1200.0), ("beta", 1200.0)}
    assert all(i["inferred"] == {"between": [1000.0, 1400.0], "step": 200.0} for i in auto["isotherms"])
    alpha = next(i for i in auto["isotherms"] if i["field"] == "alpha")
    assert all(abs(wt["A"] - 40.0) < 1.5 for wt in alpha["polyline_wt"][1:-1])
    assert system["isotherms"][0]["temperature_C"] == 1300.0
    curves = auto_overlay_curves(auto, result, CALIBRATION)
    kinds = [(c.kind, c.temperature_C, c.inferred) for c in curves]
    assert kinds.count(("boundary", None, False)) == 3
    assert ("isotherm", 1200.0, True) in kinds and ("isotherm-open", None, False) in kinds


def test_detector_without_a_reader_leaves_the_label_temperature_open():
    system, invariants, mask = _synthetic_page()
    result = detect_isotherms(system, mask, CALIBRATION, invariants, (2.0, 6.0), step_C=200.0)
    gamma = next(p for p in result.isotherms if p.field == "gamma")
    assert gamma.temperature_C is None
    assert any(r.kind == "isotherm-temperature" for r in result.review)
