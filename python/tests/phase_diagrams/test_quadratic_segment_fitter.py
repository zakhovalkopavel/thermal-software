"""Tests for phase_diagrams.tracing.quadratic_segment_fitter."""
import math

import numpy as np
import pytest

from phase_diagrams.tracing.quadratic_segment_fitter import fit_quadratic_segment


def _parabola(control, start=(0.0, 0.0), end=(200.0, 0.0), count=120):
    p0, p1, p2 = (np.asarray(p, float) for p in (start, control, end))
    t = np.linspace(0.0, 1.0, count)[:, None]
    return [tuple(p) for p in (1 - t) ** 2 * p0 + 2 * t * (1 - t) * p1 + t ** 2 * p2]


def test_arc_runs_through_both_ends_and_follows_the_stroke():
    points = fit_quadratic_segment(_parabola((100.0, 80.0)), (0.0, 0.0), (200.0, 0.0))
    assert points[0] == (0.0, 0.0) and points[-1] == (200.0, 0.0)
    assert max(p[1] for p in points) == pytest.approx(40.0, abs=1.0)
    assert all(math.dist(a, b) <= 3.5 for a, b in zip(points, points[1:]))


def test_a_label_on_the_stroke_does_not_bend_the_arc():
    stroke = _parabola((100.0, 80.0))
    label = [(x, 75.0) for x in np.linspace(80.0, 120.0, 30)]
    points = fit_quadratic_segment(stroke[:50] + label + stroke[50:], (0.0, 0.0), (200.0, 0.0))
    assert max(p[1] for p in points) == pytest.approx(40.0, abs=1.5)


def test_arc_never_turns_back_along_the_chord():
    stroke = [(x, 30.0) for x in np.linspace(0.0, 300.0, 80)] + [(300.0, y) for y in np.linspace(30.0, 0.0, 20)]
    points = fit_quadratic_segment(stroke, (0.0, 0.0), (200.0, 0.0))
    xs = [p[0] for p in points]
    assert all(b >= a - 1e-9 for a, b in zip(xs, xs[1:]))


def test_arc_has_no_inflection():
    stroke = [(x, 20.0 * math.sin(x / 200.0 * 2 * math.pi)) for x in np.linspace(0.0, 200.0, 100)]
    points = np.asarray(fit_quadratic_segment(stroke, (0.0, 0.0), (200.0, 0.0)))
    steps = np.diff(points, axis=0)
    turn = steps[:-1, 0] * steps[1:, 1] - steps[:-1, 1] * steps[1:, 0]
    assert (turn >= -1e-9).all() or (turn <= 1e-9).all()
