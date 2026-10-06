"""
Unit tests for the image detectors: frame, ticks, tick matching, lines, junctions, stroke filter.
"""
from __future__ import annotations

import numpy as np
import pytest
from PIL import Image, ImageDraw

import pd_helpers
from phase_diagrams.builders.binary_calibrator import calibrate_binary
from phase_diagrams.config.diagram_config import DiagramConfig
from phase_diagrams.detection.frame_detector import detect_frame
from phase_diagrams.detection.horizontal_line_detector import detect_horizontal_lines
from phase_diagrams.detection.ink_mask import ink_mask
from phase_diagrams.detection.junction_locator import locate_junction
from phase_diagrams.detection.stroke_width_filter import stroke_width_filter
from phase_diagrams.detection.tick_detector import detect_ticks
from phase_diagrams.detection.tick_matcher import match_ticks


@pytest.fixture
def mask(binary_image):
    return ink_mask(binary_image)


def test_ink_mask_threshold():
    image = np.array([[0, 127, 128, 255]], dtype=np.uint8)
    assert ink_mask(image).tolist() == [[True, True, False, False]]


def test_detect_frame(mask):
    frame = detect_frame(mask, (50, 50, 1150, 950))
    corners = frame.corners()
    assert corners["topLeft"] == pytest.approx((100, 100), abs=1.0)
    assert corners["bottomRight"] == pytest.approx((1100, 900), abs=1.0)


def test_detect_ticks(mask):
    frame = detect_frame(mask, (50, 50, 1150, 950))
    ticks = detect_ticks(mask, frame)
    assert ticks["bottom"] == pytest.approx([pd_helpers.wt_to_px(w) for w in range(10, 100, 10)], abs=1.0)
    expected_y = [pd_helpers.t_to_py(t) for t in (1800, 1600, 1400, 1200)]
    # the liquidus leaves the left axis at 1800 °C and hides that tick; the right edge keeps it
    assert ticks["left"] == pytest.approx(expected_y[1:], abs=1.0)
    for y in expected_y:
        assert any(abs(candidate - y) <= 1.0 for candidate in ticks["right"])


class TestMatchTicks:
    def test_frame_ends_stand_in_for_outer_ticks(self):
        pixels, residuals = match_ticks([200.0, 300.0, 400.0], [0, 10, 20, 30, 40], frame_ends=(100.0, 500.0))
        assert pixels == pytest.approx([100.0, 200.0, 300.0, 400.0, 500.0])
        assert max(abs(r) for r in residuals) < 1e-6

    def test_minor_ticks_between_values_are_skipped(self):
        candidates = [100.0 + 50.0 * k for k in range(9)]
        pixels, _ = match_ticks(candidates, [0, 10, 20, 30, 40])
        assert pixels == pytest.approx([100.0, 200.0, 300.0, 400.0, 500.0])

    def test_hidden_tick_is_unmatched(self):
        pixels, _ = match_ticks([100.0, 200.0, 400.0], [0, 10, 20, 30])
        assert pixels[2] is None

    def test_anchor_resolves_shift_by_one_tick(self):
        candidates = [100.0, 200.0, 300.0, 400.0]
        shifted, _ = match_ticks(candidates, [10, 20, 30], anchors=[(20, 300.0)])
        assert shifted == pytest.approx([200.0, 300.0, 400.0])


def _calibration(mask):
    config = DiagramConfig.from_dict(pd_helpers.binary_config_dict(), name="test")
    return calibrate_binary(mask, config)


def test_horizontal_line_temperature(mask):
    result = _calibration(mask)
    lines = detect_horizontal_lines(mask, result.frame, result.calibration)
    temperatures = [line.temperature_C for line in lines]
    assert any(abs(t - 1500.0) <= 1.0 for t in temperatures)
    line = next(line for line in lines if abs(line.temperature_C - 1500.0) <= 1.0)
    assert line.x_start == pytest.approx(300, abs=4)
    assert line.x_end == pytest.approx(700, abs=4)


def test_junction_snaps_to_the_curve_end(mask):
    result = _calibration(mask)
    lines = detect_horizontal_lines(mask, result.frame, result.calibration)
    line = next(line for line in lines if abs(line.temperature_C - 1500.0) <= 1.0)
    cal = result.calibration
    pixel = locate_junction(
        mask, (510.0, 495.0), lambda x: line.y_level + cal.bottom_slope * (x - cal.ref_px), line.thickness
    )
    # 5 px = 0.5 wt% on this scale, the label/drawing threshold
    assert pixel[0] == pytest.approx(500.0, abs=5.0)


def test_stroke_width_filter_drops_thin_and_thick_marks():
    image = Image.new("L", (300, 200), 255)
    draw = ImageDraw.Draw(image)
    draw.line([(10, 50), (290, 50)], fill=0, width=5)
    draw.line([(10, 100), (290, 100)], fill=0, width=1)
    draw.rectangle([100, 140, 160, 190], fill=0)
    kept = stroke_width_filter(ink_mask(np.array(image)), (3.5, 9))
    assert kept[50, 150]
    assert not kept[100, 150]
    assert not kept[165 - 2, 130]
