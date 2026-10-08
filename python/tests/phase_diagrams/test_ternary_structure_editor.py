"""
Unit tests for edit_ternary_structure: moved, renamed and re-dated points, added keys, appended entries, formatting kept.
"""
from __future__ import annotations

import json

import pytest

from phase_diagrams.builders.ternary_structure_editor import edit_ternary_structure
from phase_diagrams.config.curves_config import CurvesConfig

SYSTEM_TEXT = """\
{
  "system": "CaO-MgO-SiO2",
  "components": ["CaO", "MgO", "SiO2"],
  "units": { "temperature_C": "°C", "liquid_wt": "wt%" },
  "digitization": { "calibration": { "SiO2": [500, 100], "CaO": [100, 800], "MgO": [900, 800] } },
  "invariantPoints": [
    { "id": "tt-1300", "temperature_C": 1300, "liquid_wt": { "CaO": 21.4, "MgO": 21.5, "SiO2": 57.1 },
      "sources": [ { "ref": "slag-atlas-1995", "temperature": "printed label", "pixel": [500, 400] } ] },
    { "id": "tt-2", "temperature_C": null, "liquid_wt": { "CaO": 60.7, "MgO": 10.7, "SiO2": 28.6 },
      "sources": [ { "ref": "slag-atlas-1995", "pixel": [300, 600] } ] }
  ],
  "otherAtlasData": {
    "points": [ { "label": 1336, "pixel": [500, 400], "wt": { "CaO": 21.4, "MgO": 21.5, "SiO2": 57.1 } } ]
  },
  "inversions": [
    { "phase": "silica", "change": "cristobalite → tridymite", "temperature_C": null, "source": "dash-dot line" }
  ],
  "boundaryCurves": [
    { "fields": ["silica", "wollastonite"], "path": ["tt-1300", "tt-2"], "polyline_wt": null }
  ],
  "isotherms": [
    { "field": "silica", "temperature_C": 1400, "polyline_wt": null }
  ]
}
"""


def _config(**extra) -> CurvesConfig:
    return CurvesConfig.from_dict({"systemFile": "systems/test.json", "pdfPage": 1, **extra}, name="test")


def test_point_is_moved_renamed_and_redated_with_its_references():
    config = _config(
        nodes={"P•": [300.4, 599.6]},
        edits=[{"path": "invariantPoints.tt-1300", "pixel": "P•",
                "set": {"id": "tt-1379", "temperature_C": 1379, "sources.0.temperature": "printed '1973'"}}],
    )
    text, log = edit_ternary_structure(SYSTEM_TEXT, config)
    point = json.loads(text)["invariantPoints"][0]
    assert point["id"] == "tt-1379" and point["temperature_C"] == 1379
    assert point["liquid_wt"] == json.loads(SYSTEM_TEXT)["invariantPoints"][1]["liquid_wt"]
    assert point["sources"][0] == {"ref": "slag-atlas-1995", "temperature": "printed '1973'", "pixel": [300, 600]}
    assert json.loads(text)["boundaryCurves"][0]["path"] == ["tt-1379", "tt-2"]
    assert any("path id tt-1300 → tt-1379" in line for line in log)


def test_atlas_point_gets_wt_and_pixel_and_missing_keys_are_added():
    config = _config(edits=[
        {"path": "otherAtlasData.points.0", "pixel": [300, 600], "set": {"label": 1338}},
        {"path": "", "set": {"liquidImmiscibility": {"region": "two liquids", "temperature_C": None}}},
        {"path": "invariantPoints.tt-2", "set": {"notes": "moved"}},
    ])
    text, _ = edit_ternary_structure(SYSTEM_TEXT, config)
    data = json.loads(text)
    assert data["otherAtlasData"]["points"][0] == {"label": 1338, "pixel": [300, 600], "wt": {"CaO": 60.7, "MgO": 10.7, "SiO2": 28.6}}
    assert data["liquidImmiscibility"] == {"region": "two liquids", "temperature_C": None}
    assert data["invariantPoints"][1]["notes"] == "moved"
    assert '\n  "liquidImmiscibility": { "region": "two liquids", "temperature_C": null }\n}' in text


def test_new_entries_are_appended_one_per_line_and_the_rest_is_kept():
    config = _config(
        curves=[{"fields": ["silica", "lime"], "path": ["tt-2", "tt-1300"], "new": True, "notes": "added"}],
        isotherms=[{"field": "silica", "temperature_C": 1500, "startPixel": [0, 0], "endPixel": [1, 1], "new": True},
                   {"field": "silica", "temperature_C": 1400, "startPixel": [0, 0], "endPixel": [1, 1]}],
        inversions=[{"phase": "wollastonite", "change": "α → β", "startPixel": [0, 0], "endPixel": [1, 1],
                     "new": True, "source": "arc around CS"}],
    )
    text, _ = edit_ternary_structure(SYSTEM_TEXT, config)
    assert '\n    { "field": "silica", "temperature_C": 1500, "polyline_wt": null }\n' in text
    assert '{ "fields": ["silica", "lime"], "path": ["tt-2", "tt-1300"], "polyline_wt": null, "notes": "added" }' in text
    assert json.loads(text)["inversions"][1] == {"phase": "wollastonite", "change": "α → β", "temperature_C": None, "source": "arc around CS"}
    assert text.startswith(SYSTEM_TEXT[:SYSTEM_TEXT.index('  "inversions"')])


def test_new_entry_that_already_exists_is_an_error():
    config = _config(isotherms=[{"field": "silica", "temperature_C": 1400, "startPixel": [0, 0], "endPixel": [1, 1], "new": True}])
    with pytest.raises(ValueError, match="already exists"):
        edit_ternary_structure(SYSTEM_TEXT, config)


def test_second_piece_of_an_isotherm_in_the_same_field_is_appended_as_part_2():
    config = _config(isotherms=[{"field": "silica", "temperature_C": 1400, "startPixel": [0, 0], "endPixel": [1, 1]},
                                {"field": "silica", "temperature_C": 1400, "part": 2, "startPixel": [0, 0], "endPixel": [1, 1], "new": True}])
    text, _ = edit_ternary_structure(SYSTEM_TEXT, config)
    assert json.loads(text)["isotherms"] == [{"field": "silica", "temperature_C": 1400, "polyline_wt": None},
                                             {"field": "silica", "temperature_C": 1400, "part": 2, "polyline_wt": None}]


def test_new_unlabelled_isotherm_keeps_its_inferred_temperature():
    config = _config(isotherms=[{"field": "silica", "temperature_C": 1300, "startPixel": [0, 0], "endPixel": [1, 1], "new": True,
                                 "inferred": {"from": [1200, 1400], "step": 100}}])
    text, _ = edit_ternary_structure(SYSTEM_TEXT, config)
    assert json.loads(text)["isotherms"][1] == {"field": "silica", "temperature_C": 1300,
                                                "inferred": {"from": [1200, 1400], "step": 100}, "polyline_wt": None}


def test_new_invariant_gets_the_composition_at_its_pixel_and_an_atlas_source():
    config = _config(invariants=[{"id": "tt-x", "type": "ternary", "reaction": "peritectic", "phases": ["silica", "lime", "wollastonite"],
                                  "temperature_C": None, "pixel": [300.4, 599.6], "composition": "line fits crossed",
                                  "new": True, "notes": "hidden by a label"}])
    text, log = edit_ternary_structure(SYSTEM_TEXT, config)
    point = json.loads(text)["invariantPoints"][2]
    assert point == {"id": "tt-x", "type": "ternary", "reaction": "peritectic", "phases": ["silica", "lime", "wollastonite"],
                     "temperature_C": None, "liquid_wt": {"CaO": 60.7, "MgO": 10.7, "SiO2": 28.6}, "status": "extracted",
                     "sources": [{"ref": "slag-atlas-1995", "temperature": "not printed", "composition": "line fits crossed",
                                  "pixel": [300, 600]}],
                     "notes": "hidden by a label"}
    assert '\n    { "id": "tt-x", ' in text
    assert any("new invariant: tt-x" in line for line in log)


@pytest.mark.parametrize("entry, message", [
    ({"id": "tt-2", "type": "ternary", "phases": [], "pixel": [0, 0], "new": True}, "already exists"),
    ({"id": "tt-y", "type": "ternary", "phases": [], "pixel": [0, 0]}, "only appended"),
])
def test_invariant_entry_errors(entry, message):
    with pytest.raises(ValueError, match=message):
        edit_ternary_structure(SYSTEM_TEXT, _config(invariants=[entry]))


@pytest.mark.parametrize("temperature, inferred", [
    (1350, {"from": [1200, 1400], "step": 100}),
    (1500, {"from": [1200, 1400], "step": 100}),
    (1400, {"from": [1400], "step": 100}),
    (1300, {"from": [], "step": 100}),
    (1300, {"from": [1400], "step": 0}),
])
def test_inferred_temperature_off_the_steps_is_a_config_error(temperature, inferred):
    with pytest.raises(ValueError, match="isotherm silica"):
        _config(isotherms=[{"field": "silica", "temperature_C": temperature, "startPixel": [0, 0], "endPixel": [1, 1],
                            "inferred": inferred}])


def test_node_labels_in_written_text_become_invariant_ids_or_pixels():
    config = _config(
        nodes={"X7": [300, 600], "D12•": [410.5, 520], "X9": [500.6, 401]},
        edits=[{"path": "invariantPoints.tt-2", "pixel": "X9", "set": {"id": "tt-3", "notes": "moved to X9 (from X7)"}}],
        isotherms=[{"field": "silica", "temperature_C": 1500, "startPixel": [0, 0], "endPixel": [1, 1], "new": True,
                    "notes": "from X7 past the dash D12• to X9; C2S and C3MS2 stay"}],
    )
    text, log = edit_ternary_structure(SYSTEM_TEXT, config)
    data = json.loads(text)
    assert data["invariantPoints"][1]["notes"] == "moved to tt-3 (from [300, 600])"
    assert data["isotherms"][1]["notes"] == "from [300, 600] past the dash [410.5, 520] to tt-3; C2S and C3MS2 stay"
    assert any("node labels X9 → tt-3, X7 → [300, 600]" in line for line in log)
    assert any("node labels X7 → [300, 600], D12• → [410.5, 520], X9 → tt-3" in line for line in log)


def test_node_label_missing_from_the_nodes_is_an_error():
    config = _config(isotherms=[{"field": "silica", "temperature_C": 1500, "startPixel": [0, 0], "endPixel": [1, 1],
                                 "new": True, "notes": "printed at I9"}])
    with pytest.raises(ValueError, match="node label 'I9' is not in the config nodes"):
        edit_ternary_structure(SYSTEM_TEXT, config)


def test_unknown_path_is_an_error():
    with pytest.raises(ValueError, match="no element 'tt-9'"):
        edit_ternary_structure(SYSTEM_TEXT, _config(edits=[{"path": "invariantPoints.tt-9", "set": {"notes": "x"}}]))


def test_no_edits_leaves_the_text_unchanged():
    text, log = edit_ternary_structure(SYSTEM_TEXT, _config())
    assert text == SYSTEM_TEXT and log == []
