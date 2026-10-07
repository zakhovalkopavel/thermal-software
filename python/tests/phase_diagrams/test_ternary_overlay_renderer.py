"""Tests for phase_diagrams.rendering.ternary_overlay_renderer."""
import numpy as np

from phase_diagrams.models.traced_curve import TracedCurve
from phase_diagrams.rendering.ternary_overlay_renderer import render_ternary_overlay

_CORNERS = [(300.0, 100.0), (100.0, 450.0), (500.0, 450.0)]


def _render(curves, fields):
    image = np.full((600, 600), 255, np.uint8)
    return render_ternary_overlay(image, (100, 100, 500, 450), curves, fields, _CORNERS, margin=20)


def _pixel(rendered, page_point):
    x0, y0 = (int(v) for v in rendered.info["pageOrigin"].split(","))
    return rendered.getpixel((page_point[0] - x0, page_point[1] - y0))


def test_fields_split_by_a_boundary_get_different_colours():
    boundary = TracedCurve(pixels=[(300.0, 100.0), (300.0, 450.0)], label="b", kind="boundary")
    fields = [
        {"name": "left", "ring": [(300, 100), (100, 450), (300, 450)], "seed": None},
        {"name": "right", "ring": [(300, 100), (300, 450), (500, 450)], "seed": None},
    ]
    rendered, log = _render([boundary], fields)
    assert log == []
    left, right = _pixel(rendered, (250, 400)), _pixel(rendered, (350, 400))
    assert left != right and left != (255, 255, 255) and right != (255, 255, 255)


def test_an_isotherm_does_not_divide_fields():
    isotherm = TracedCurve(pixels=[(300.0, 100.0), (300.0, 450.0)], label="i", kind="isotherm")
    fields = [
        {"name": "left", "ring": [(300, 100), (100, 450), (300, 450)], "seed": None},
        {"name": "right", "ring": [(300, 100), (300, 450), (500, 450)], "seed": None},
    ]
    rendered, log = _render([isotherm], fields)
    assert log == ["field right: same region as left (no dividing line between them); not filled"]
    assert _pixel(rendered, (250, 400)) == _pixel(rendered, (350, 400))


def test_boundaries_and_isotherms_are_drawn_in_different_colours():
    curves = [
        TracedCurve(pixels=[(200.0, 300.0), (400.0, 300.0)], label="b", kind="boundary"),
        TracedCurve(pixels=[(200.0, 400.0), (400.0, 400.0)], label="i", kind="isotherm"),
    ]
    rendered, _ = _render(curves, [])
    boundary, isotherm = _pixel(rendered, (300, 300)), _pixel(rendered, (300, 400))
    assert boundary[2] > 150 > boundary[0]
    assert isotherm[0] > 150 > isotherm[2]


def _reddish(rendered, box):
    x0, y0 = (int(v) for v in rendered.info["pageOrigin"].split(","))
    pixels = np.asarray(rendered)[box[1] - y0:box[3] - y0, box[0] - x0:box[2] - x0].reshape(-1, 3).astype(int)
    return int(((pixels[:, 0] > 150) & (pixels[:, 1] < 120) & (pixels[:, 2] < 120)).sum())


def test_isotherm_temperature_is_written_above_the_curve():
    isotherm = TracedCurve(pixels=[(200.0, 400.0), (400.0, 400.0)], label="i", kind="isotherm", temperature_C=1500)
    rendered, _ = _render([isotherm], [])
    assert _reddish(rendered, (280, 380, 320, 397)) > 10
    assert _reddish(rendered, (280, 403, 320, 420)) == 0


def test_isotherm_temperature_moves_away_from_a_field_name():
    isotherm = TracedCurve(pixels=[(200.0, 400.0), (400.0, 400.0)], label="i", kind="isotherm", temperature_C=1500)
    fields = [{"name": "FIELD", "ring": [(300, 100), (100, 450), (500, 450)], "seed": (300, 390)}]
    rendered, _ = _render([isotherm], fields)
    assert _reddish(rendered, (280, 380, 320, 397)) == 0
    assert _reddish(rendered, (200, 380, 400, 397)) > 10


def test_legend_shows_the_legend_text_and_the_field_its_name():
    fields = [{"name": "Pi", "legend": "Pi: pigeonite (MS-based solution)", "ring": [(300, 100), (100, 450), (500, 450)], "seed": None}]
    short = np.asarray(_render([], [{**fields[0], "legend": "Pi"}])[0])
    full = np.asarray(_render([], fields)[0])
    assert (short[:40, 100:] != full[:40, 100:]).any()
    assert (short[40:] == full[40:]).all()
