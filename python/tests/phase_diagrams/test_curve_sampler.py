"""
Unit tests for sample_curve, simplify_polyline and the end-to-end binary build on the synthetic diagram.
"""
from __future__ import annotations

import numpy as np
import pytest
from PIL import Image, ImageDraw

import pd_helpers
from phase_diagrams.builders.binary_calibrator import calibrate_binary
from phase_diagrams.builders.binary_system_builder import build_binary_system
from phase_diagrams.tracing.curve_sampler import sample_curve
from phase_diagrams.config.diagram_config import DiagramConfig
from phase_diagrams.detection.ink_mask import ink_mask
from phase_diagrams.tracing.polyline_simplifier import simplify_polyline

LINE = [(0.0, 2000.0), (10.0, 1900.0), (20.0, 1800.0), (30.0, 1700.0), (40.0, 1600.0)]


def test_endpoints_are_the_printed_values():
    sample = sample_curve(LINE, [0, 10, 20, 30, 40], (0, 2003), (40.0, 1595))
    assert sample.points[0] == [0, 2003]
    assert sample.points[-1] == [40.0, 1595]
    assert [p[0] for p in sample.points] == [0, 10, 20, 30, 40.0]


def test_interior_points_interpolated_and_rounded():
    sample = sample_curve(LINE, [5, 15], (0, 2000), (40, 1600))
    assert sample.points[1:-1] == [[5, 1950], [15, 1850]]


def test_points_near_a_junction_drawn_away_from_its_label_are_dropped():
    sample = sample_curve(LINE, [10, 20, 30, 38, 39], (0, 2000), (40, 1600), end_drawn=41.2, junction_tolerance=1.5)
    assert sample.dropped == [39]
    assert 39 not in [p[0] for p in sample.points]
    assert 38 not in sample.dropped


def test_no_drop_when_drawing_agrees_with_label():
    sample = sample_curve(LINE, [38, 39], (0, 2000), (40, 1600), end_drawn=40.3)
    assert sample.dropped == []


def test_grid_outside_the_traced_range_is_reported():
    sample = sample_curve(LINE[:3], [5, 15, 30], (0, 2000), (40, 1600))
    assert 30 in sample.uncovered


def test_simplify_polyline_keeps_corners_only():
    points = [[0, 0], [1, 0.01], [2, 0], [3, 1], [4, 2]]
    assert simplify_polyline(points, 0.1) == [[0, 0], [2, 0], [4, 2]]


def test_build_binary_system_on_the_synthetic_diagram(binary_image):
    config = DiagramConfig.from_dict(pd_helpers.binary_config_dict(), name="test")
    mask = ink_mask(binary_image)
    result = calibrate_binary(mask, config)
    extraction = build_binary_system(config, binary_image, mask, result, None, {"compounds": []}, (1200, 1000))
    system = extraction.system
    point = system["invariantPoints"][0]
    assert point["liquid_wt"] == {"MgO": 60.0, "SiO2": 40.0}
    assert point["status"] == "extracted"
    left, right = system["liquidus"]
    assert left["points"][0] == [0, 1800]
    assert left["points"][-1] == [40.0, 1500]
    assert right["points"][-1] == [100, 1700]
    for wt, temperature in left["points"][1:-1]:
        assert temperature == pytest.approx(pd_helpers.periclase_liquidus(wt), abs=3)
    for wt, temperature in right["points"][1:-1]:
        assert temperature == pytest.approx(pd_helpers.silica_liquidus(wt), abs=3)
    assert abs(extraction.junctions["ts-1500"][0] - 500.0) <= 5.0


def _build_with_thin_chord(stroke_width):
    image = pd_helpers.draw_binary()
    pil = Image.fromarray(image)
    start = (pd_helpers.wt_to_px(20), pd_helpers.t_to_py(pd_helpers.periclase_liquidus(20)))
    ImageDraw.Draw(pil).line([start, (pd_helpers.wt_to_px(40), pd_helpers.t_to_py(1500))], fill=0, width=1)
    image = np.array(pil)
    data = pd_helpers.binary_config_dict()
    if stroke_width:
        data["strokeWidth_px"] = stroke_width
    config = DiagramConfig.from_dict(data, name="test")
    mask = ink_mask(image)
    result = calibrate_binary(mask, config)
    return build_binary_system(config, image, mask, result, None, {"compounds": []}, (1200, 1000))


def test_thin_shortcut_is_taken_without_the_stroke_filter():
    left = _build_with_thin_chord(None).system["liquidus"][0]["points"]
    t30 = dict((wt, t) for wt, t in left)[30]
    assert abs(t30 - pd_helpers.periclase_liquidus(30)) > 10


def test_stroke_filter_keeps_the_trace_on_the_thick_curve():
    extraction = _build_with_thin_chord([3, 9])
    left = extraction.system["liquidus"][0]["points"]
    for wt, temperature in left[1:-1]:
        assert temperature == pytest.approx(pd_helpers.periclase_liquidus(wt), abs=3)
    assert extraction.system["invariantPoints"][0]["liquid_wt"]["SiO2"] == pytest.approx(40.0, abs=0.5)


def _build_unlabelled(image):
    data = pd_helpers.binary_config_dict()
    data["invariants"][0]["label"]["temperature"] = None
    config = DiagramConfig.from_dict(data, name="test")
    mask = ink_mask(image)
    result = calibrate_binary(mask, config)
    return build_binary_system(config, image, mask, result, None, {"compounds": []}, (1200, 1000))


def test_unprinted_temperature_is_read_from_the_line(binary_image):
    extraction = _build_unlabelled(binary_image)
    point = extraction.system["invariantPoints"][0]
    assert point["temperature_C"] == pytest.approx(1500, abs=2)
    assert point["sources"][0]["temperature"].startswith("not labelled; eutectic line reads")
    assert any(r.kind == "unlabelled" and "temperature" in r.message for r in extraction.review)


def test_unprinted_eutectic_without_a_line_uses_the_lowest_traced_point(binary_image):
    image = binary_image.copy()
    row = int(round(pd_helpers.t_to_py(1500)))
    image[row - 4:row + 5, 290:470] = 255
    image[row - 4:row + 5, 530:710] = 255
    extraction = _build_unlabelled(image)
    point = extraction.system["invariantPoints"][0]
    assert point["temperature_C"] == pytest.approx(1500, abs=5)
    assert point["liquid_wt"]["SiO2"] == pytest.approx(40.0, abs=1.0)
    assert "lowest point of the traced liquidus" in point["sources"][0]["temperature"]
