"""Tests for phase_diagrams.tracing.divider_follower."""
import numpy as np

from phase_diagrams.tracing.divider_follower import follow_divider

_LINE = [(float(x), 0.0) for x in np.linspace(0.0, 100.0, 34)]


def test_isotherm_running_along_a_divider_gets_its_points():
    stroke = [(float(x), 1.0) for x in range(20, 81)]
    part = follow_divider((20.0, 3.0), (80.0, -2.0), stroke, [_LINE])
    assert part[0] == (20.0, 0.0) and part[-1] == (80.0, 0.0)
    assert all(p[1] == 0.0 for p in part)
    assert [p[0] for p in part] == sorted(p[0] for p in part)


def test_direction_follows_the_track():
    part = follow_divider((80.0, 0.0), (20.0, 0.0), [], [_LINE])
    assert part[0] == (80.0, 0.0) and part[-1] == (20.0, 0.0)
    assert [p[0] for p in part] == sorted((p[0] for p in part), reverse=True)


def test_points_on_the_divider_give_the_divider_whatever_the_stroke():
    stroke = [(float(x), 0.02 * (x - 20) * (80 - x)) for x in range(20, 81)]
    part = follow_divider((20.0, 2.0), (80.0, 0.0), stroke, [_LINE])
    assert part is not None and all(p[1] == 0.0 for p in part)


def test_curve_near_but_not_on_the_divider_is_copied_only_when_it_runs_along_it():
    arc = [(float(x), 8.0 + 0.02 * (x - 20) * (80 - x)) for x in range(20, 81)]
    along = [(float(x), 1.0) for x in range(20, 81)]
    assert follow_divider((20.0, 8.0), (80.0, 8.0), arc, [_LINE]) is None
    assert follow_divider((20.0, 8.0), (80.0, 8.0), along, [_LINE]) is not None


def test_points_away_from_the_divider_are_not_copied():
    assert follow_divider((20.0, 15.0), (80.0, 0.0), [], [_LINE]) is None
