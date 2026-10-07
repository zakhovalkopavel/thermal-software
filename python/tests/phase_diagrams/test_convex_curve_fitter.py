"""Tests for phase_diagrams.tracing.convex_curve_fitter."""
import math

import numpy as np

from phase_diagrams.tracing.convex_curve_fitter import fit_convex_curve


def _turns(points) -> np.ndarray:
    steps = np.diff(np.asarray(points), axis=0)
    return steps[:-1, 0] * steps[1:, 1] - steps[:-1, 1] * steps[1:, 0]


def _distance(point, curve) -> float:
    return min(math.dist(point, p) for p in curve)


def test_points_on_a_parabola_give_degree_2():
    track = [(x, 0.004 * (x - 100.0) ** 2) for x in (0.0, 60.0, 140.0, 200.0)]
    curve, degree, offset = fit_convex_curve([], track)
    assert degree == 2 and offset <= 2.5
    assert curve[0] == track[0] and curve[-1] == track[-1]


def test_asymmetric_arc_passes_through_its_track_points_with_higher_degree():
    control = np.array([(0.0, 0.0), (5.0, 90.0), (40.0, 110.0), (200.0, 100.0)])

    def cubic(t):
        return tuple(((1 - t) ** 3) * control[0] + 3 * t * (1 - t) ** 2 * control[1] + 3 * t ** 2 * (1 - t) * control[2] + t ** 3 * control[3])

    track = [cubic(t) for t in (0.0, 0.3, 0.6, 1.0)]
    stroke = [cubic(t) for t in np.linspace(0.0, 1.0, 150)]
    curve, degree, offset = fit_convex_curve(stroke, track)
    assert degree in (3, 4) and offset <= 2.5
    turns = _turns(curve)
    assert (turns <= 1e-9).all() or (turns >= -1e-9).all()


def test_s_shaped_track_gets_no_inflection_and_reports_the_offset():
    track = [(0.0, 0.0), (50.0, 30.0), (150.0, -30.0), (200.0, 0.0)]
    curve, _, offset = fit_convex_curve([], track)
    turns = _turns(curve)
    assert (turns <= 1e-6).all() or (turns >= -1e-6).all()
    assert offset > 2.5
    assert abs(offset - max(_distance(p, curve) for p in track[1:-1])) < 1.0


def test_equal_ends_give_a_closed_loop():
    track = [(0.0, 0.0), (50.0, -40.0), (100.0, 0.0), (50.0, 40.0), (0.0, 0.0)]
    curve, _, _ = fit_convex_curve([], track)
    assert curve[0] == curve[-1] == (0.0, 0.0)
    assert max(p[0] for p in curve) > 50.0
