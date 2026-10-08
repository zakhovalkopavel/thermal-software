"""
Unit tests for the pd-new pieces: system id parsing, figure search, caption display, corner labels, triangle detection, starting files.
"""
from __future__ import annotations

import json

import cv2
import numpy as np
import pytest

from phase_diagrams.builders.new_system_checklist import new_system_checklist
from phase_diagrams.builders.ternary_start_builder import build_ternary_start
from phase_diagrams.builders.ternary_structure_editor import edit_ternary_structure
from phase_diagrams.config.curves_config import CurvesConfig
from phase_diagrams.detection.triangle_detector import detect_triangles
from phase_diagrams.detection.triangle_reading_order import triangle_reading_order
from phase_diagrams.figures.caption_display import display_caption
from phase_diagrams.figures.corner_components import corner_components
from phase_diagrams.figures.figure_finder import find_system_figures
from phase_diagrams.figures.formula_display import display_formula
from phase_diagrams.figures.system_components import system_components

INDEX = [
    {"figure": "Fig. 3.223", "pdfPage": 146, "printedPage": 126,
     "captionStart": "Liquidus surface and the sub-solidus equilibria in the CaO-FeO,-SiO, system as drawn"},
    {"figure": "Fig. 3.226", "pdfPage": 147, "printedPage": 127,
     "captionStart": "Liquidus surface and sub-solidus equilibria (above lower stability limit of the CaO-2Fe,0, phase"},
    {"figure": "Fig. 3.227", "pdfPage": 147, "printedPage": 127,
     "captionStart": "Isothermal section through the Ca0-FeO,-SiO, system in air at 1230 °C"},
    {"figure": "Fig. 3.228", "pdfPage": 149, "printedPage": 129,
     "captionStart": "Oxygen isobars (log pO, atm) over melts in the system CaO-FeO-1 -Fe,0,-SiO, with SiO, levels"},
    {"figure": "Fig. 3.250", "pdfPage": 154, "printedPage": 134,
     "captionStart": "Sub-solidus equilibria in the Ca0-MgO-SiO,, system as evaluated by Osborn, Muan [1]."},
]


@pytest.mark.parametrize("system_id, components", [
    ("cao-feox-sio2", ["CaO", "FeOx", "SiO2"]),
    ("al2o3-na2o-sio2", ["Al2O3", "Na2O", "SiO2"]),
    ("cao-mgo-sio2", ["CaO", "MgO", "SiO2"]),
])
def test_system_id_gives_the_component_formulas(system_id, components):
    assert system_components(system_id) == components


@pytest.mark.parametrize("system_id", ["cao-sio2", "cao-qqo-sio2"])
def test_system_id_that_is_not_a_ternary_of_formulas_is_an_error(system_id):
    with pytest.raises(ValueError):
        system_components(system_id)


def test_figures_are_found_by_component_letters_in_any_order_and_spelling():
    found = find_system_figures(INDEX, ["CaO", "FeOx", "SiO2"])
    assert [e["figure"] for e in found] == ["Fig. 3.223", "Fig. 3.227"]
    assert [e["figure"] for e in find_system_figures(INDEX, ["SiO2", "MgO", "CaO"])] == ["Fig. 3.250"]


def test_four_component_system_is_not_a_ternary_match():
    assert all(e["figure"] != "Fig. 3.228" for e in find_system_figures(INDEX, ["CaO", "FeOx", "SiO2"]))


def test_system_named_only_in_a_reference_to_another_figure_is_not_a_match():
    index = [{"figure": "Fig. 3.264", "captionStart": "Liquidus surface in the CaO-SiO,-TiO, system after DeVries"},
             {"figure": "Fig. 3.353", "captionStart": "Liquidus surface in the system AL,O,-CaO-SiO,-TiO, at 10 and 20 "
                                                      "mass % Al,O, after Ohno, Roues [1]. For the base system "
                                                      "CaO-SiO,-TiO, see Fig. 3.264."}]
    assert [e["figure"] for e in find_system_figures(index, ["CaO", "TiO2", "SiO2"])] == ["Fig. 3.264"]


@pytest.mark.parametrize("formula, shown", [("SiO2", "SiO₂"), ("FeOx", "FeOₓ"), ("2CaO·SiO2", "2CaO·SiO₂"), ("CaO", "CaO")])
def test_formula_digits_become_subscripts_but_coefficients_stay(formula, shown):
    assert display_formula(formula) == shown


def test_caption_shows_the_system_and_compounds_with_subscripts_and_ends_at_a_whole_word():
    caption = INDEX[2]["captionStart"] + " with the ternary compound 7Ca0'2Si0,,14Fe,0,, as determined recently by Mod"
    assert display_caption(caption, ["CaO", "FeOx", "SiO2"]) == (
        "Isothermal section through the CaO-FeOₓ-SiO₂ system in air at 1230 °C with the ternary compound "
        "7CaO·2SiO₂·14Fe₂O₃, as determined recently by …")


def test_caption_formulas_outside_the_system_keep_their_hyphens_and_charges_become_superscripts():
    caption = "melts in the system CaO-FeO-Fe,0,-SiO, and CaO-2Fe,0, phase with Fe2+ and Al,O, at"
    assert display_caption(caption, ["CaO", "FeOx", "SiO2"]) == (
        "melts in the system CaO-FeO-Fe₂O₃-SiO₂ and CaO-2Fe₂O₃ phase with Fe²⁺ and Al₂O₃ …")
    assert display_caption("the system AL,O,-CaO-SiO,-TiO, at", ["CaO", "TiO2", "SiO2"]) == (
        "the system Al₂O₃-CaO-SiO₂-TiO₂ …")


def test_corner_labels_with_misread_letters_name_the_components():
    texts = {"top": "Si0,\n1723", "left": "Q\nCad -\n~2570", "right": "109\nFe703\n1566"}
    assert corner_components(texts, ["CaO", "FeOx", "SiO2"]) == {"top": "SiO2", "left": "CaO", "right": "FeOx"}


def test_two_named_corners_give_the_third_its_remaining_component():
    texts = {"top": "SIO9", "left": "Na70", "right": ""}
    assert corner_components(texts, ["Al2O3", "Na2O", "SiO2"]) == {"top": "SiO2", "left": "Na2O", "right": "Al2O3"}


def test_one_named_corner_is_not_enough():
    assert corner_components({"top": "Si0,", "left": "fo", "right": "1566"}, ["CaO", "FeOx", "SiO2"]) is None


def _page_with_triangles() -> np.ndarray:
    page = np.zeros((1400, 1200), np.uint8)
    for top, side in (((600.0, 100.0), 900.0), ((300.0, 1050.0), 280.0)):
        height = side * np.sqrt(3) / 2
        corners = [top, (top[0] - side / 2, top[1] + height), (top[0] + side / 2, top[1] + height)]
        for p, q in ((0, 1), (1, 2), (2, 0)):
            cv2.line(page, tuple(round(v) for v in corners[p]), tuple(round(v) for v in corners[q]), 1, 4)
    cv2.line(page, (50, 1300), (1150, 1300), 1, 4)
    return page.astype(bool)


def test_triangles_are_found_largest_first_with_corners_from_the_edge_fits():
    triangles = detect_triangles(_page_with_triangles())
    assert len(triangles) == 2
    top, left, right = triangles[0]
    height = 900 * np.sqrt(3) / 2
    assert np.allclose(top, (600, 100), atol=2)
    assert np.allclose(left, (150, 100 + height), atol=2)
    assert np.allclose(right, (1050, 100 + height), atol=2)
    assert np.allclose(triangles[1][0], (300, 1050), atol=2)


def test_reading_order_reads_the_left_column_before_a_slightly_higher_right_one():
    left_top = ((799.0, 447.0), (205.0, 1482.0), (1389.0, 1486.0))
    left_bottom = ((800.0, 2036.0), (204.0, 3056.0), (1391.0, 3061.0))
    right_top = ((2208.0, 407.0), (1627.0, 1424.0), (2796.0, 1429.0))
    assert triangle_reading_order([right_top, left_bottom, left_top], 3306) == [left_top, left_bottom, right_top]


def test_reading_order_reads_a_triangle_across_both_columns_on_its_own():
    wide = ((1844.0, 328.0), (747.0, 2264.0), (2944.0, 2272.0))
    left_below = ((953.0, 3065.0), (369.0, 4071.0), (1532.0, 4073.0))
    assert triangle_reading_order([left_below, wide], 3306) == [wide, left_below]


COMPOUNDS = [
    {"id": "silica", "formula": "SiO2", "oxideMoles": {"SiO2": 1}},
    {"id": "corundum", "formula": "Al2O3", "oxideMoles": {"Al2O3": 1}},
    {"id": "mullite", "formula": "3Al2O3·2SiO2", "oxideMoles": {"Al2O3": 3, "SiO2": 2}},
    {"id": "hematite", "formula": "Fe2O3", "oxideMoles": {"Fe2O3": 1}},
    {"id": "lime", "formula": "CaO", "oxideMoles": {"CaO": 1}},
]


def test_checklist_lists_molar_masses_known_phases_and_missing_single_oxide_phases():
    lines = new_system_checklist(["Al2O3", "TiO2", "SiO2"], COMPOUNDS)
    assert lines[0] == "molar masses: Al2O3 101.961 g/mol, TiO2 79.866 g/mol, SiO2 60.084 g/mol"
    assert lines[1] == "phases in compounds.json: silica (SiO2), corundum (Al2O3), mullite (3Al2O3·2SiO2)"
    assert len(lines) == 3 and lines[2].startswith("missing in compounds.json: a TiO2 phase")


def test_checklist_counts_iron_oxide_phases_for_feox_which_has_no_molar_mass():
    lines = new_system_checklist(["CaO", "FeOx", "SiO2"], COMPOUNDS)
    assert "FeOx none (no fixed formula)" in lines[0]
    assert lines[1] == "phases in compounds.json: silica (SiO2), hematite (Fe2O3), lime (CaO)"
    assert len(lines) == 2


def _start(line_px: float = 4.0) -> tuple[str, str]:
    figure = {"figure": "Fig. 3.226", "pdfPage": 147, "printedPage": 127}
    corners = {"top": (500.0, 100.0), "left": (100.0, 800.0), "right": (900.0, 800.0)}
    return build_ternary_start("cao-feox-sio2", ["CaO", "FeOx", "SiO2"], figure, corners,
                               {"top": "SiO2", "left": "CaO", "right": "FeOx"}, (3306, 4673), line_px)


def test_starting_file_has_the_calibration_and_source_and_no_data():
    system_text, config_text = _start()
    system, config = json.loads(system_text), json.loads(config_text)
    assert system["digitization"]["calibration"] == {"SiO2": [500, 100], "CaO": [100, 800], "FeOx": [900, 800]}
    assert system["source"] == {"ref": "slag-atlas-1995", "figure": "Fig. 3.226", "diagram": None,
                                "printedPage": 127, "pdfPage": 147, "caption": None}
    assert all(system[key] == [] for key in ("phases", "invariantPoints", "boundaryCurves", "isotherms", "inversions"))
    assert config["systemFile"] == "systems/cao-feox-sio2.json" and config["pdfPage"] == 147
    assert config["strokeWidth_px"] == [5.0, 16.5] and config["isothermStrokeWidth_px"] == [2.0, 6.0]


def test_first_entries_of_the_empty_arrays_go_one_per_line():
    system_text, _ = _start()
    config = CurvesConfig.from_dict({
        "systemFile": "systems/cao-feox-sio2.json", "pdfPage": 147,
        "isotherms": [{"field": "silica", "temperature_C": 1700, "startPixel": [0, 0], "endPixel": [1, 1], "new": True},
                      {"field": "silica", "temperature_C": 1600, "startPixel": [0, 0], "endPixel": [1, 1], "new": True}],
    }, name="test")
    text, _ = edit_ternary_structure(system_text, config)
    assert ('  "isotherms": [\n'
            '    { "field": "silica", "temperature_C": 1700, "polyline_wt": null },\n'
            '    { "field": "silica", "temperature_C": 1600, "polyline_wt": null }\n'
            '  ],') in text
    assert [i["temperature_C"] for i in json.loads(text)["isotherms"]] == [1700, 1600]
