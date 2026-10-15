"""Tests of the isotherm field order, side labels, the corner rule, the long-axis reading angle and the
isotherm comparison with a semi-manual system file."""
from __future__ import annotations

import numpy as np

from phase_diagrams.builders.isotherm_detector import _cornered, _stretch_bounds
from phase_diagrams.builders.isotherm_field_order import field_order_chains
from phase_diagrams.builders.isotherm_side_labels import side_label_pieces
from phase_diagrams.figures.rotated_label_reader import _long_axis
from phase_diagrams.models.detected_isotherm import DetectedIsotherm
from phase_diagrams.models.isotherm_detection import IsothermDetection
from phase_diagrams.models.line_scale import LineScale
from phase_diagrams.models.page_word import PageWord
from phase_diagrams.models.ternary_calibration import TernaryCalibration
from phase_diagrams.output.auto_extraction_report import compare_auto_system

CALIBRATION = TernaryCalibration(["A", "B", "C"], {"C": (300.0, 40.0), "A": (40.0, 490.0), "B": (560.0, 490.0)})


def _horizontal(y: float, x0: float = 20.0, x1: float = 180.0) -> np.ndarray:
    return np.array([(x, y) for x in np.arange(x0, x1 + 1.0)], float)


def _vertical(x: float, y0: float = 0.0, y1: float = 100.0) -> np.ndarray:
    return np.array([(x, y) for y in np.arange(y0, y1 + 1.0)], float)


def _draw(mask: np.ndarray, pixels: np.ndarray) -> None:
    for x, y in pixels.round().astype(int):
        mask[y, x] = True


def test_field_order_lists_parallel_lines_in_order_and_cuts_at_a_missed_line():
    stop = np.zeros((200, 200), bool)
    stop[[0, -1], :] = stop[:, [0, -1]] = True
    pieces = [_horizontal(y) for y in (90.0, 50.0, 110.0, 70.0, 180.0)]
    chains = field_order_chains(pieces, [12, 10, 13, 11, 14], stop)
    assert chains == [[10, 11, 12, 13]]


def test_a_leader_crossing_a_nearer_line_labels_the_line_it_reaches():
    mask = np.zeros((120, 200), bool)
    near, far, other = _vertical(60.0), _vertical(40.0), _vertical(150.0)
    for line in (near, far, other):
        _draw(mask, line)
    mask[50, 40:96] = True
    word = PageWord("1400", 90.0, (100, 40, 130, 60))
    assert side_label_pieces([(1400.0, word)], [near, far, other], mask, LineScale()) == [(1, 1400.0, word)]
    mask[50, 40:60] = False
    assert side_label_pieces([(1400.0, word)], [near, far, other], mask) == [(0, 1400.0, word)]


def test_a_line_running_into_the_word_is_labelled_by_it_before_any_leader():
    mask = np.zeros((120, 200), bool)
    through, far = _horizontal(50.0, 60.0, 110.0), _vertical(40.0)
    for line in (through, far):
        _draw(mask, line)
    mask[45, 40:100] = True
    word = PageWord("1200", 90.0, (100, 40, 130, 60))
    assert side_label_pieces([(1200.0, word)], [far, through], mask) == [(1, 1200.0, word)]


def test_two_straight_arms_with_a_turn_are_a_corner_but_an_arc_is_not():
    arm = np.array([(x, 100.0) for x in range(0, 61)], float)
    turn = np.array([(60.0 + t * 0.7, 100.0 - t * 0.7) for t in range(1, 61)], float)
    assert _cornered(np.vstack([arm, turn]), LineScale())
    angles = np.linspace(0.0, np.pi / 3.0, 120)
    arc = np.column_stack([200.0 * np.sin(angles), 200.0 * (1.0 - np.cos(angles))])
    assert not _cornered(arc, LineScale())


def test_stretch_bounds_between_the_known_points_around_an_arc():
    known = [("a", 0.0, 1470.0), ("b", 50.0, None), ("c", 120.0, 1590.0), ("d", None, 1600.0)]
    assert _stretch_bounds(known, 30.0) is None
    assert _stretch_bounds([known[0], known[2]], 30.0) == (1470.0, 1590.0)
    assert _stretch_bounds([known[0], known[2]], 130.0) is None


def test_long_axis_of_an_elongated_label_and_none_for_a_round_one():
    glyphs = np.zeros((80, 80), bool)
    for t in np.linspace(-30.0, 30.0, 200):
        x, y = 40.0 + t * np.cos(np.radians(30.0)), 40.0 + t * np.sin(np.radians(30.0))
        glyphs[int(round(y)) - 2:int(round(y)) + 3, int(round(x)) - 2:int(round(x)) + 3] = True
    angle = _long_axis(glyphs)
    assert angle is not None and min(abs(angle - 30.0), abs(angle + 150.0)) < 2.0
    square = np.zeros((40, 40), bool)
    square[10:30, 10:30] = True
    assert _long_axis(square) is None


def test_comparison_lists_each_semi_manual_isotherm_and_the_extra_pieces():
    def wt(a: float, b: float) -> dict:
        return {"A": a, "B": b, "C": 100.0 - a - b}

    found = [wt(40.0, b) for b in np.linspace(20.0, 40.0, 11)]
    missed = [wt(a, 10.0) for a in np.linspace(20.0, 40.0, 11)]
    reference = {"components": ["A", "B", "C"], "phases": ["alpha"], "invariantPoints": [], "boundaryCurves": [],
                 "isotherms": [{"field": "alpha", "temperature_C": 1200.0, "polyline_wt": found},
                               {"field": "alpha", "temperature_C": 1300.0, "polyline_wt": missed}]}
    auto = {"components": ["A", "B", "C"], "phases": ["alpha"], "invariantPoints": [], "boundaryCurves": []}
    on = DetectedIsotherm("alpha", [tuple(CALIBRATION.to_page(list(w.values()))) for w in found],
                          temperature_C=1200.0, source="label")
    extra = DetectedIsotherm("alpha", [tuple(CALIBRATION.to_page(list(wt(10.0, b).values()))) for b in (20.0, 40.0)])
    lines = compare_auto_system(auto, reference, CALIBRATION, detection=IsothermDetection([on, extra]))
    assert ("Isotherms: 2 semi-manual; 1 same °C, 0 other °C, 0 no °C, 1 not found; "
            "1 automatic pieces on no semi-manual isotherm.") in lines
    assert any(line.startswith("- D2 alpha ?") for line in lines)
