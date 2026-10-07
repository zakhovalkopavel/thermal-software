"""
Unit tests for the node map: skeleton, junctions, rings, dash ends, label boxes, ticks, node labels in the curves config.
"""
from __future__ import annotations

import json
import math

import numpy as np
import pytest
from PIL import Image, ImageDraw, ImageFont

from phase_diagrams.builders.node_map_builder import build_node_map
from phase_diagrams.config.config_loader import load_config
from phase_diagrams.config.curves_config import CurvesConfig
from phase_diagrams.detection.dash_end_detector import detect_dash_ends
from phase_diagrams.detection.ink_mask import ink_mask
from phase_diagrams.detection.junction_detector import detect_junctions
from phase_diagrams.detection.ring_detector import detect_rings
from phase_diagrams.detection.skeletonizer import skeletonize
from phase_diagrams.detection.text_detector import detect_text_boxes


def _mask(draw_fn, size=(400, 400)) -> np.ndarray:
    image = Image.new("L", size, 255)
    draw_fn(ImageDraw.Draw(image))
    return ink_mask(np.array(image))


def test_skeleton_is_one_pixel_wide():
    mask = _mask(lambda d: d.line([(50, 200), (350, 200)], fill=0, width=9))
    skeleton = skeletonize(mask)
    columns = skeleton[:, 100:300].sum(axis=0)
    assert columns.min() == 1 and columns.max() == 1


def test_crossing_and_t_junction_are_found_text_is_ignored():
    def draw(d):
        d.line([(50, 200), (350, 200)], fill=0, width=9)
        d.line([(200, 50), (200, 350)], fill=0, width=5)
        d.line([(300, 200), (300, 80)], fill=0, width=3)
        d.text((80, 80), "1600", fill=0)
    junctions = detect_junctions(_mask(draw))
    assert len(junctions) == 2
    assert any(math.dist(j, (200, 200)) < 6 for j in junctions)
    assert any(math.dist(j, (300, 200)) < 6 for j in junctions)


def test_arrowhead_on_a_line_is_not_a_junction():
    def draw(d):
        d.line([(50, 200), (350, 200)], fill=0, width=7)
        d.polygon([(220, 200), (190, 188), (190, 212)], fill=0)
    assert detect_junctions(_mask(draw)) == []


def test_ring_on_a_line_is_found_letters_are_not():
    def draw(d):
        d.line([(50, 200), (350, 200)], fill=0, width=5)
        d.ellipse([190, 190, 210, 210], fill=255, outline=0, width=3)
        d.ellipse([80, 80, 96, 96], fill=255, outline=0, width=3)
        d.ellipse([100, 80, 116, 96], fill=255, outline=0, width=3)
    rings = detect_rings(_mask(draw))
    assert len(rings) == 1
    assert math.dist(rings[0][:2], (200, 200)) < 2


def test_dashed_line_end_meets_solid_and_heavy_dashed_lines():
    def draw(d):
        d.line([(300, 20), (300, 380)], fill=0, width=4)
        for x in range(150, 280, 22):
            d.line([(x, 100), (x + 14, 100)], fill=0, width=6)
        for y in range(20, 380, 46):
            d.line([(100, y), (100, y + 36)], fill=0, width=9)
        for x in range(122, 200, 22):
            d.line([(x, 250), (x + 14, 250)], fill=0, width=6)
    hits = detect_dash_ends(_mask(draw))
    assert any(math.dist(h, (300, 100)) < 4 for h in hits)
    assert any(math.dist(h, (100, 250)) < 6 for h in hits)
    assert not any(140 < h[0] < 290 for h in hits)


def test_node_map_labels_invariants_edges_and_junctions():
    system = {
        "components": ["A", "B", "C"],
        "digitization": {"calibration": {"C": [300, 40], "A": [40, 490], "B": [560, 490]}},
        "invariantPoints": [{"id": "t-1", "sources": [{"ref": "slag-atlas-1995", "pixel": [300, 330]}]}],
    }

    def draw(d):
        d.polygon([(300, 40), (40, 490), (560, 490)], outline=0, width=4)
        d.line([(300, 330), (300, 490)], fill=0, width=6)
        d.line([(300, 330), (170, 265)], fill=0, width=6)
        d.line([(300, 330), (430, 265)], fill=0, width=6)
    nodes = build_node_map(system, _mask(draw, (600, 520)))
    kinds = {n.kind for n in nodes}
    assert {"invariant", "edge"} <= kinds
    invariant = next(n for n in nodes if n.kind == "invariant")
    assert invariant.invariant == "t-1" and invariant.label == "I1"
    assert sum(invariant.wt) == pytest.approx(100.0)
    corners = {n.invariant: n for n in nodes if n.kind == "corner"}
    assert set(corners) == {"A", "B", "C"} and corners["C"].label == "V1"
    assert corners["A"].wt[0] == pytest.approx(100.0)
    assert not any(n.kind != "corner" and math.dist(n.pixel, corners["A"].pixel) <= 12 for n in nodes)
    assert not any(n.kind == "junction" and math.dist(n.pixel, (300, 330)) < 12 for n in nodes)
    assert sum(1 for n in nodes if n.kind == "edge") >= 3


def test_labels_are_boxed_dashes_are_not():
    def draw(d):
        d.text((100, 100), "2200", fill=0, font=ImageFont.load_default(size=30))
        for x in range(100, 300, 22):
            d.line([(x, 300), (x + 14, 300)], fill=0, width=6)
    boxes = detect_text_boxes(_mask(draw))
    assert boxes and all(95 <= b[0] and b[2] <= 190 and 95 <= b[1] and b[3] <= 145 for b in boxes)


def test_dash_end_snaps_to_the_edge_and_bare_tick_is_dropped():
    system = {
        "components": ["A", "B", "C"],
        "digitization": {"calibration": {"C": [300, 40], "A": [40, 490], "B": [560, 490]}},
        "invariantPoints": [],
    }

    def draw(d):
        d.polygon([(300, 40), (40, 490), (560, 490)], outline=0, width=3)
        d.line([(300, 474), (300, 506)], fill=0, width=3)
        for y in range(300, 470, 22):
            d.line([(200, y), (200, y + 14)], fill=0, width=6)
    nodes = build_node_map(system, _mask(draw, (600, 520)))
    assert not any(n.kind == "edge" and math.dist(n.pixel, (300, 490)) < 15 for n in nodes)
    end = next(n for n in nodes if n.kind == "dash-end" and math.dist(n.pixel, (200, 490)) < 4)
    assert end.label.startswith("D") and abs(end.wt[2]) < 0.5


def test_config_pixels_may_be_node_labels(tmp_path):
    data = {"systemFile": "systems/test.json", "pdfPage": 1, "nodes": {"A1": [10, 20], "A2": [30, 40]},
            "isotherms": [{"field": "silica", "temperature_C": 1400, "startPixel": "A1", "endPixel": [50, 60],
                           "waypoints": ["A2", {"pixel": "A1", "straight": True}]}]}
    config = CurvesConfig.from_dict(data)
    isotherm = config.isotherms[0]
    assert isotherm["startPixel"] == (10.0, 20.0)
    assert [w["pixel"] for w in isotherm["waypoints"]] == [(30.0, 40.0), (10.0, 20.0)]
    path = tmp_path / "test.curves.config.json"
    data["isotherms"][0]["endPixel"] = "A9"
    path.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(ValueError, match="unknown node label 'A9'"):
        load_config(path)
