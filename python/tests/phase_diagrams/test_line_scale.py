"""
Unit tests for the pixel scale: LineScale, line width measurement, scaled detectors, lineWidth_px config.
"""
from __future__ import annotations

import json

import numpy as np
import pytest
from PIL import Image, ImageDraw

from phase_diagrams.config.config_loader import load_config
from phase_diagrams.detection.dash_mask import dash_mask
from phase_diagrams.detection.line_width_meter import measure_line_scale
from phase_diagrams.models.line_scale import LineScale


def _lines(width: int, size: int = 600) -> np.ndarray:
    image = Image.new("1", (size, size), 0)
    draw = ImageDraw.Draw(image)
    for k in range(5):
        draw.line([(40, 60 + 100 * k), (size - 40, 60 + 100 * k)], fill=1, width=width)
        draw.line([(80 + 100 * k, 40), (80 + 100 * k, size - 40)], fill=1, width=width)
    return np.array(image, bool)


def test_reference_scale_keeps_pixel_values():
    scale = LineScale()
    assert scale.factor == 1.0
    assert (scale.length(2.5), scale.count(15), scale.area(30)) == (2.5, 15, 30)


def test_factor_is_rounded_to_quarters_so_pages_of_one_source_share_it():
    assert LineScale(4.02).factor == LineScale(4.5).factor == 1.0
    assert LineScale(3.2).factor == 0.75
    assert LineScale(6.4).factor == 1.5
    assert LineScale(0.1).factor == 0.25
    assert LineScale(8.5).count(15) == 30 and LineScale(8.5).area(30) == 120


def test_measured_line_width_follows_the_stroke_width():
    assert measure_line_scale(_lines(4)).line_px == pytest.approx(4.0, abs=0.4)
    assert measure_line_scale(_lines(8)).line_px == pytest.approx(8.0, abs=0.6)
    assert measure_line_scale(_lines(8)).source == "measured"


def test_empty_mask_gives_the_reference_scale():
    assert measure_line_scale(np.zeros((50, 50), bool)) == LineScale()


def test_dash_sizes_scale_with_the_line_width():
    image = Image.new("1", (300, 100), 0)
    ImageDraw.Draw(image).line([(50, 50), (140, 50)], fill=1, width=8)
    mask = np.array(image, bool)
    assert not dash_mask(mask).any()
    assert dash_mask(mask, scale=LineScale(8.5)).any()


def _write_config(tmp_path, **extra) -> object:
    path = tmp_path / "test.curves.config.json"
    path.write_text(json.dumps({"systemFile": "systems/test.json", "pdfPage": 1, **extra}), encoding="utf-8")
    return path


def test_line_width_from_the_config(tmp_path):
    assert load_config(_write_config(tmp_path, lineWidth_px=6)).line_width_px == 6.0
    assert load_config(_write_config(tmp_path)).line_width_px is None


@pytest.mark.parametrize("value", [0, -2, "4", True])
def test_invalid_line_width_is_a_config_error(tmp_path, value):
    with pytest.raises(ValueError, match="lineWidth_px must be a number > 0"):
        load_config(_write_config(tmp_path, lineWidth_px=value))
