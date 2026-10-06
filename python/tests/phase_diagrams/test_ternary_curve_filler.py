"""
Unit tests for fill_ternary_curves: only polyline_wt changes, formatting kept, rollback on mismatch.
"""
from __future__ import annotations

import json

import numpy as np
import pytest
from PIL import Image, ImageDraw

from phase_diagrams.config.config_loader import load_config
from phase_diagrams.config.curves_config import CurvesConfig
from phase_diagrams.detection.ink_mask import ink_mask
from phase_diagrams.builders.ternary_curve_filler import fill_ternary_curves

SYSTEM_TEXT = """\
{
  "system": "CaO-MgO-SiO2",
  "components": ["CaO", "MgO", "SiO2"],
  "units": { "temperature_C": "°C", "liquid_wt": "wt%" },
  "digitization": { "calibration": { "SiO2": [500, 100], "CaO": [100, 800], "MgO": [900, 800] } },
  "invariantPoints": [
    { "id": "tt-1", "liquid_wt": { "CaO": 21.4, "MgO": 21.5, "SiO2": 57.1 },
      "sources": [ { "ref": "slag-atlas-1995", "pixel": [500, 400] } ] },
    { "id": "tt-2", "liquid_wt": { "CaO": 60.7, "MgO": 10.7, "SiO2": 28.6 },
      "sources": [ { "ref": "slag-atlas-1995", "pixel": [300, 600] } ] }
  ],
  "boundaryCurves": [
    { "fields": ["silica", "wollastonite"], "path": ["tt-1", "tt-2"], "polyline_wt": null },
    { "fields": ["silica", "diopside"], "path": ["tt-2", "tt-1"], "polyline_wt": null },
    { "fields": ["silica", "lime"], "path": ["tt-1"], "polyline_wt": null }
  ],
  "isotherms": [
    { "field": "silica", "temperature_C": 1400, "polyline_wt": null }
  ]
}
"""


def _mask(isotherm_width: int = 5) -> np.ndarray:
    image = Image.new("L", (1000, 900), 255)
    draw = ImageDraw.Draw(image)
    draw.line([(500, 400), (300, 600)], fill=0, width=5)
    draw.line([(600, 500), (700, 600)], fill=0, width=isotherm_width)
    return ink_mask(np.array(image))


def _invariants(text: str) -> dict:
    return {p["id"]: p for p in json.loads(text)["invariantPoints"]}


def _config(curves=None, isotherms=None, **extra) -> CurvesConfig:
    return CurvesConfig.from_dict(
        {
            "systemFile": "systems/test.json",
            "pdfPage": 1,
            "curves": curves if curves is not None else [{"fields": ["silica", "wollastonite"], "path": ["tt-1", "tt-2"]}],
            "isotherms": isotherms if isotherms is not None else [
                {"field": "silica", "temperature_C": 1400, "startPixel": [600, 500], "endPixel": [700, 600]}
            ],
            **extra,
        },
        name="test",
    )


def test_only_matched_polylines_change():
    fill = fill_ternary_curves(SYSTEM_TEXT, _config(), _mask(), _invariants(SYSTEM_TEXT))
    before, after = json.loads(SYSTEM_TEXT), json.loads(fill.text)
    curve = after["boundaryCurves"][0]["polyline_wt"]
    assert curve[0] == [21.4, 21.5, 57.1]
    assert curve[-1] == [60.7, 10.7, 28.6]
    assert len(curve) == 2
    assert after["boundaryCurves"][1]["polyline_wt"] is None
    isotherm = np.array(after["isotherms"][0]["polyline_wt"])
    start, end = isotherm[0], isotherm[-1]
    direction = (end - start) / np.linalg.norm(end - start)
    offsets = [np.linalg.norm((p - start) - np.dot(p - start, direction) * direction) for p in isotherm]
    assert max(offsets) <= 0.3
    for key in ("boundaryCurves", "isotherms"):
        for entry in after[key]:
            entry["polyline_wt"] = None
    del after["units"]["polyline_wt"]
    assert after == before
    assert fill.filled == 2


def test_formatting_outside_the_polylines_is_kept():
    fill = fill_ternary_curves(SYSTEM_TEXT, _config(isotherms=[]), _mask(), _invariants(SYSTEM_TEXT))
    polyline = json.dumps(json.loads(fill.text)["boundaryCurves"][0]["polyline_wt"])
    restored = fill.text.replace(polyline, "null", 1).replace(', "polyline_wt": "[wt% CaO, wt% MgO, wt% SiO2]"', "", 1)
    assert restored == SYSTEM_TEXT


def test_points_sum_to_100():
    fill = fill_ternary_curves(SYSTEM_TEXT, _config(), _mask(), _invariants(SYSTEM_TEXT))
    for point in json.loads(fill.text)["isotherms"][0]["polyline_wt"]:
        assert sum(point) == pytest.approx(100.0, abs=1e-9)


def test_refill_replaces_existing_polyline():
    first = fill_ternary_curves(SYSTEM_TEXT, _config(isotherms=[]), _mask(), _invariants(SYSTEM_TEXT))
    second = fill_ternary_curves(first.text, _config(isotherms=[]), _mask(), _invariants(SYSTEM_TEXT))
    assert second.text == first.text


def test_unmatched_curve_is_an_error():
    config = _config(curves=[{"fields": ["silica", "lime"], "path": ["tt-1", "tt-2"]}], isotherms=[])
    with pytest.raises(ValueError, match="no boundary curve"):
        fill_ternary_curves(SYSTEM_TEXT, config, _mask(), _invariants(SYSTEM_TEXT))


def test_rollback_when_other_keys_would_change():
    text = SYSTEM_TEXT.replace(
        '"path": ["tt-1", "tt-2"], "polyline_wt": null', '"path": ["tt-1", "tt-2"]'
    )
    with pytest.raises(ValueError, match="changed more than polyline_wt"):
        fill_ternary_curves(text, _config(isotherms=[]), _mask(), _invariants(text))


def test_missing_units_entry_is_added():
    fill = fill_ternary_curves(SYSTEM_TEXT, _config(isotherms=[]), _mask(), _invariants(SYSTEM_TEXT))
    assert fill.units_missing
    assert json.loads(fill.text)["units"]["polyline_wt"] == "[wt% CaO, wt% MgO, wt% SiO2]"
    again = fill_ternary_curves(fill.text, _config(isotherms=[]), _mask(), _invariants(SYSTEM_TEXT))
    assert not again.units_missing
    assert again.text == fill.text


def test_open_end_continues_past_the_last_path_point():
    config = _config(curves=[{"fields": ["silica", "lime"], "path": ["tt-1"], "endPixel": [400, 500]}], isotherms=[])
    fill = fill_ternary_curves(SYSTEM_TEXT, config, _mask(), _invariants(SYSTEM_TEXT))
    polyline = json.loads(fill.text)["boundaryCurves"][2]["polyline_wt"]
    assert polyline[0] == [21.4, 21.5, 57.1]
    assert polyline[-1] == pytest.approx([41.1, 16.1, 42.9], abs=0.3)


def test_points_drawn_at_the_same_pixel_are_joined_directly():
    invariants = _invariants(SYSTEM_TEXT)
    invariants["tt-2"]["sources"][0]["pixel"] = [501, 400]
    fill = fill_ternary_curves(SYSTEM_TEXT, _config(isotherms=[]), _mask(), invariants)
    assert json.loads(fill.text)["boundaryCurves"][0]["polyline_wt"] == [[21.4, 21.5, 57.1], [60.7, 10.7, 28.6]]
    assert fill.curves == []


def test_isotherm_stroke_width_keeps_thin_isotherms():
    thin = _mask(isotherm_width=2)
    default = fill_ternary_curves(SYSTEM_TEXT, _config(curves=[]), thin, _invariants(SYSTEM_TEXT))
    narrow = fill_ternary_curves(SYSTEM_TEXT, _config(curves=[], isothermStrokeWidth_px=[1, 3]), thin, _invariants(SYSTEM_TEXT))
    assert [item.kind for item in default.review] == ["trace-gap"]
    assert narrow.review == []


def test_straight_waypoint_bridges_a_hidden_stroke_instead_of_following_a_label():
    image = Image.new("L", (1000, 900), 255)
    draw = ImageDraw.Draw(image)
    draw.line([(400, 500), (300, 600)], fill=0, width=5)
    draw.line([(500, 400), (500, 500), (400, 500)], fill=0, width=5)
    mask = ink_mask(np.array(image))
    traced = fill_ternary_curves(SYSTEM_TEXT, _config(isotherms=[]), mask, _invariants(SYSTEM_TEXT))
    straight = _config(
        curves=[{"fields": ["silica", "wollastonite"], "path": ["tt-1", "tt-2"],
                 "waypoints": [{"pixel": [400, 500], "straight": True}]}],
        isotherms=[],
    )
    bridged = fill_ternary_curves(SYSTEM_TEXT, straight, mask, _invariants(SYSTEM_TEXT))
    assert len(json.loads(traced.text)["boundaryCurves"][0]["polyline_wt"]) > 2
    assert json.loads(bridged.text)["boundaryCurves"][0]["polyline_wt"] == [[21.4, 21.5, 57.1], [60.7, 10.7, 28.6]]
    assert bridged.review == []
    assert any("straight step (500, 400)→(400, 500)" in line for line in bridged.log)


def test_unlabelled_field_is_allowed():
    text = SYSTEM_TEXT.replace('["silica", "wollastonite"]', '["silica", null]')
    config = _config(curves=[{"fields": ["silica", None], "path": ["tt-1", "tt-2"]}], isotherms=[])
    fill = fill_ternary_curves(text, config, _mask(), _invariants(text))
    assert fill.filled == 1
    assert any(line.startswith("silica/? tt-1→tt-2") for line in fill.log)


def _edge_isotherm(start_x: int) -> tuple[CurvesConfig, np.ndarray]:
    image = Image.new("L", (1000, 900), 255)
    ImageDraw.Draw(image).line([(start_x, 450), (450, 450)], fill=0, width=5)
    isotherm = {"field": "silica", "temperature_C": 1400, "startPixel": [start_x, 450], "endPixel": [450, 450]}
    return _config(curves=[], isotherms=[isotherm]), ink_mask(np.array(image))


def test_point_just_outside_an_edge_is_set_to_zero():
    config, mask = _edge_isotherm(298)
    fill = fill_ternary_curves(SYSTEM_TEXT, config, mask, _invariants(SYSTEM_TEXT))
    first = json.loads(fill.text)["isotherms"][0]["polyline_wt"][0]
    assert first[1] == 0.0
    assert sum(first) == pytest.approx(100.0, abs=1e-9)
    assert any("outside the triangle set to 0" in line for line in fill.log)


def test_point_far_outside_the_triangle_is_an_error():
    config, mask = _edge_isotherm(270)
    with pytest.raises(ValueError, match="outside the triangle"):
        fill_ternary_curves(SYSTEM_TEXT, config, mask, _invariants(SYSTEM_TEXT))


INVERSIONS_TEXT = SYSTEM_TEXT.replace(
    '  "boundaryCurves": [',
    '  "inversions": [\n'
    '    { "phase": "silica", "change": "a → b", "temperature_C": 1470 },\n'
    '    { "phase": "silica", "change": "b → c", "temperature_C": null,\n'
    '      "points": [ { "temperature_C": 900, "pixel": [600, 500] } ] }\n'
    '  ],\n'
    '  "boundaryCurves": [',
)
INVERSION = {"phase": "silica", "change": "b → c", "startPixel": [600, 500], "endPixel": [700, 600]}


def test_inversion_polyline_is_appended_to_the_matched_entry():
    config = _config(curves=[], isotherms=[], inversions=[INVERSION])
    fill = fill_ternary_curves(INVERSIONS_TEXT, config, _mask(), _invariants(INVERSIONS_TEXT))
    after = json.loads(fill.text)
    assert "polyline_wt" not in after["inversions"][0]
    polyline = after["inversions"][1]["polyline_wt"]
    assert len(polyline) >= 2
    restored = (fill.text.replace(f', "polyline_wt": {json.dumps(polyline)}', "", 1)
                .replace(', "polyline_wt": "[wt% CaO, wt% MgO, wt% SiO2]"', "", 1))
    assert restored == INVERSIONS_TEXT
    again = fill_ternary_curves(fill.text, config, _mask(), _invariants(INVERSIONS_TEXT))
    assert again.text == fill.text


def test_unmatched_inversion_is_an_error():
    config = _config(curves=[], isotherms=[], inversions=[{**INVERSION, "change": "c → d"}])
    with pytest.raises(ValueError, match="no inversion silica 'c → d'"):
        fill_ternary_curves(INVERSIONS_TEXT, config, _mask(), _invariants(INVERSIONS_TEXT))


IMMISCIBILITY_TEXT = SYSTEM_TEXT.replace(
    '  "boundaryCurves": [',
    '  "liquidImmiscibility": {\n'
    '    "region": "Two liquids", "edgeLimits_wt": { "MgO-rich": { "MgO": 30.8 } },\n'
    '    "notes": "test"\n'
    '  },\n'
    '  "boundaryCurves": [',
)
BRANCH = {"startPixel": [600, 500], "endPixel": [700, 600]}


def test_immiscibility_branches_are_appended_to_the_object():
    config = _config(curves=[], isotherms=[], liquidImmiscibility=[BRANCH, BRANCH])
    fill = fill_ternary_curves(IMMISCIBILITY_TEXT, config, _mask(), _invariants(IMMISCIBILITY_TEXT))
    branches = json.loads(fill.text)["liquidImmiscibility"]["polylines_wt"]
    assert len(branches) == 2 and len(branches[0]) >= 2
    assert fill.filled == 2
    restored = (fill.text.replace(f', "polylines_wt": {json.dumps(branches)}', "", 1)
                .replace(', "polyline_wt": "[wt% CaO, wt% MgO, wt% SiO2]"', "", 1))
    assert restored == IMMISCIBILITY_TEXT
    again = fill_ternary_curves(fill.text, config, _mask(), _invariants(IMMISCIBILITY_TEXT))
    assert again.text == fill.text


def test_immiscibility_branches_without_system_object_are_an_error():
    config = _config(curves=[], isotherms=[], liquidImmiscibility=[BRANCH])
    with pytest.raises(ValueError, match="no liquidImmiscibility object"):
        fill_ternary_curves(SYSTEM_TEXT, config, _mask(), _invariants(SYSTEM_TEXT))


def test_single_point_path_without_end_pixel_is_a_config_error(tmp_path):
    path = tmp_path / "test.curves.config.json"
    path.write_text(json.dumps({"systemFile": "systems/test.json", "pdfPage": 1,
                                "curves": [{"fields": ["silica", "lime"], "path": ["tt-1"]}]}), encoding="utf-8")
    with pytest.raises(ValueError, match="single-point path needs endPixel"):
        load_config(path)
