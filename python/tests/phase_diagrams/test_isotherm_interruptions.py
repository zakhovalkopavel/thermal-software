"""Tests of the isotherm detector helpers for lines interrupted by text and other lines (page words as text,
end hooks, ends along a boundary, joins by prolongation, ends carried on through text)."""
from __future__ import annotations

import numpy as np
import pytest

from phase_diagrams.builders.isotherm_detector import (
    _join_prolongations,
    _meeting_angle,
    _prolong_through_text,
    _real_words,
    _without_hooks,
)
from phase_diagrams.models.branch_chain import BranchChain
from phase_diagrams.models.detected_isotherm import DetectedIsotherm
from phase_diagrams.models.line_scale import LineScale
from phase_diagrams.models.page_word import PageWord

SYSTEM = {"boundaryCurves": [{"fields": ["alpha", "beta"]}]}


def _vertical(x: float, y0: float, y1: float) -> np.ndarray:
    step = 1.0 if y1 >= y0 else -1.0
    return np.array([(x, y) for y in np.arange(y0, y1 + step, step)], float)


def _piece(field: str, points: np.ndarray) -> DetectedIsotherm:
    return DetectedIsotherm(field=field, pixels=[tuple(map(float, p)) for p in points])


def test_page_words_are_text_only_when_confident_with_two_characters_and_of_text_height():
    words = [PageWord(t, 90.0, (0, 0, 40, 20)) for t in ("Corundum", "Mullite", "1104")]
    words += [PageWord("Albite", 40.0, (0, 0, 40, 20)), PageWord("N", 95.0, (0, 0, 10, 20)),
              PageWord("AWN.", 85.0, (0, 0, 40, 77))]
    assert [w.text for w in _real_words(words)] == ["Corundum", "Mullite", "1104"]


def test_a_hook_at_the_end_of_a_line_is_trimmed():
    line = _vertical(50.0, 0.0, 100.0)
    hook = np.array([(50.0 - k, 100.0) for k in range(1, 13)], float)
    chain = BranchChain(np.vstack([line, hook]), [], ink_px=112.0)
    trimmed = _without_hooks(chain, LineScale())
    assert trimmed.pixels[-1][0] >= 48.0 and len(trimmed.pixels) < len(chain.pixels)
    assert trimmed.ink_px < chain.ink_px
    assert len(_without_hooks(BranchChain(line, [], ink_px=100.0), LineScale()).pixels) == len(line)


def test_meeting_angle_tells_a_line_along_a_boundary_from_one_crossing_it():
    boundary = np.array([(0.0, 0.0), (100.0, 100.0)])
    assert _meeting_angle(boundary, np.array([50.0, 50.0]), np.array([1.0, 1.05]), 10.0) < 12.0
    assert _meeting_angle(boundary, np.array([50.0, 50.0]), np.array([0.0, 1.0]), 10.0) == pytest.approx(45.0, abs=0.5)


def test_two_pieces_of_one_field_on_one_line_are_joined_across_the_gap():
    upper, lower = _vertical(50.0, 0.0, 100.0), _vertical(51.0, 160.0, 260.0)
    pieces = [_piece("alpha", upper), _piece("alpha", lower), _piece("alpha", _vertical(90.0, 160.0, 260.0))]
    ends = [[(p[0], None, "free", None), (p[-1], None, "label", None)] for p in (upper, lower)]
    ends.append([(np.array([90.0, 160.0]), None, "label", None), (np.array([90.0, 260.0]), None, "free", None)])
    points = [upper, lower, _vertical(90.0, 160.0, 260.0)]
    labels: list[list] = [[], [(1500.0, "label")], []]
    joined = _join_prolongations(pieces, ends, labels, points, np.zeros((300, 120), bool), np.zeros(2), LineScale())
    assert joined == 1 and len(pieces) == 2
    assert pieces[0].pixels[0] == (50.0, 0.0) and pieces[0].pixels[-1] == (51.0, 260.0)
    assert pieces[0].straight == [len(upper)] and labels[0] == [(1500.0, "label")]


def test_pieces_with_different_labels_or_across_a_boundary_are_not_joined():
    upper, lower = _vertical(50.0, 0.0, 100.0), _vertical(50.0, 160.0, 260.0)
    for labels, barrier_row in (([[(1400.0, "a")], [(1500.0, "b")]], None), ([[], []], 130)):
        pieces = [_piece("alpha", upper), _piece("alpha", lower)]
        ends = [[(p[0], None, "free", None), (p[-1], None, "label", None)] for p in (upper, lower)]
        barrier = np.zeros((300, 120), bool)
        if barrier_row is not None:
            barrier[barrier_row, :] = True
        assert _join_prolongations(pieces, ends, labels, [upper, lower], barrier, np.zeros(2), LineScale()) == 0


def test_a_line_end_at_text_is_carried_on_to_the_hidden_boundary_where_the_next_field_goes_on():
    boundary = (0, None, np.array([(0.0, 150.0), (200.0, 150.0)]))
    upper, lower = _vertical(50.0, 0.0, 100.0), _vertical(52.0, 151.0, 260.0)
    pieces = [_piece("alpha", upper), _piece("beta", lower)]
    ends = [[(upper[0], None, "free", None), (upper[-1], None, "label", None)],
            [(np.array([52.0, 150.0]), None, "boundary", 0), (lower[-1], None, "free", None)]]
    assert _prolong_through_text(pieces, ends, [upper, lower], [boundary], np.zeros(2), SYSTEM, LineScale()) == 1
    assert ends[0][1][2] == "boundary" and ends[0][1][3] == 0
    assert pieces[0].pixels[-1] == pytest.approx((50.0, 150.0))
    assert pieces[0].ends[1] == "boundary alpha/beta" and pieces[0].straight == [len(pieces[0].pixels) - 1]


def test_a_line_end_at_text_is_not_carried_on_without_a_line_beyond_the_boundary():
    boundary = (0, None, np.array([(0.0, 150.0), (200.0, 150.0)]))
    upper, aside = _vertical(50.0, 0.0, 100.0), _vertical(150.0, 151.0, 260.0)
    pieces = [_piece("alpha", upper), _piece("beta", aside)]
    ends = [[(upper[0], None, "free", None), (upper[-1], None, "label", None)],
            [(np.array([150.0, 150.0]), None, "boundary", 0), (aside[-1], None, "free", None)]]
    assert _prolong_through_text(pieces, ends, [upper, aside], [boundary], np.zeros(2), SYSTEM, LineScale()) == 0
    assert ends[0][1][2] == "label"
