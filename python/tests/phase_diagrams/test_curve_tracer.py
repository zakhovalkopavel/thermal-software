"""
Unit tests for trace_path: stroke centring, gap bridging, labels not followed, waypoints.
"""
from __future__ import annotations

import numpy as np
import pytest
from PIL import Image, ImageDraw

from phase_diagrams.tracing.curve_tracer import trace_path
from phase_diagrams.detection.ink_mask import ink_mask


def _mask(draw_fn, size=(220, 160)) -> np.ndarray:
    image = Image.new("L", size, 255)
    draw_fn(ImageDraw.Draw(image))
    return ink_mask(np.array(image))


def test_path_is_centred_on_the_stroke():
    mask = _mask(lambda d: d.rectangle([10, 48, 200, 52], fill=0))
    curve = trace_path(mask, (12, 49), (198, 51))
    rows = [y for x, y in curve.pixels if 20 < x < 190]
    assert np.mean(rows) == pytest.approx(50.0, abs=0.1)
    assert curve.gap_px == 0.0


def test_small_gap_is_bridged_and_reported():
    def draw(d):
        d.rectangle([10, 48, 90, 52], fill=0)
        d.rectangle([101, 48, 200, 52], fill=0)

    curve = trace_path(_mask(draw), (12, 50), (198, 50))
    assert 9.0 <= curve.gap_px <= 12.0
    assert curve.end == pytest.approx((198, 50), abs=1.0)


def test_label_touching_the_curve_is_not_followed():
    def draw(d):
        d.rectangle([10, 98, 200, 102], fill=0)
        d.rectangle([90, 60, 130, 97], fill=0)

    curve = trace_path(_mask(draw), (12, 100), (198, 100))
    assert all(y >= 97 for _, y in curve.pixels)


def test_waypoint_selects_the_branch():
    def draw(d):
        d.line([(10, 80), (110, 30), (210, 80)], fill=0, width=4)
        d.line([(10, 80), (110, 130), (210, 80)], fill=0, width=4)

    mask = _mask(draw)
    upper = trace_path(mask, (12, 79), (208, 79), [(110, 31)])
    lower = trace_path(mask, (12, 79), (208, 79), [(110, 129)])
    assert min(y for _, y in upper.pixels) < 40
    assert max(y for _, y in lower.pixels) > 120


def test_endpoint_outside_the_image_is_an_error():
    mask = _mask(lambda d: d.rectangle([10, 48, 200, 52], fill=0))
    with pytest.raises(ValueError):
        trace_path(mask, (12, 50), (500, 50), margin=0)
