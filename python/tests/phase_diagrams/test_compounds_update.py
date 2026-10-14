"""
Unit tests for the compounds.json update of pd-new: compound-data lookup, entry building, compact-layout editing.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from phase_diagrams.compounds.compound_data_lookup import hill_formula, melting_candidates
from phase_diagrams.compounds.compounds_file_editor import add_compound, format_compound, replace_compound
from phase_diagrams.compounds.oxide_compound_builder import (atlas_disagrees, default_compound_id,
                                                             merge_compound_data, new_oxide_compound)
from phase_diagrams.models.melting_candidate import MeltingCandidate

_HERE = Path(__file__).resolve()
_DATASETS = [Path("/app/shared/processed/phase-diagrams"), _HERE.parents[3] / "shared/processed/phase-diagrams"]

FIGURE = {"figure": "Fig. 3.169", "printedPage": 106, "pdfPage": 126}

COMPOUNDS_TEXT = """{
  "title": "Phase catalog",
  "compounds": [
    {
      "id": "lime", "notation": "C", "formula": "CaO", "oxideMoles": { "CaO": 1 },
      "melting": { "behaviour": "congruent", "temperature_C": 2612, "products": null, "status": "extracted",
        "sources": [ { "ref": "slag-atlas-1995", "figure": "Fig. 3.166", "printedPage": 105, "pdfPage": 125, "read": "printed label" } ] }
    }
  ]
}
"""


@pytest.fixture()
def compound_data(tmp_path: Path) -> Path:
    titania = {"entries": {
        "1317-70-0": {"name": "Titanium dioxide", "properties": {"meltingPoint": [
            {"value": 1833.15, "variant": "anatase", "ref": ["CRC95", 281, "crcConstants"]}]}},
        "1317-80-2": {"name": "Titanium dioxide", "properties": {"meltingPoint": [
            {"value": 2185.15, "variant": "rutile", "ref": ["CRC95", 282, "crcConstants"]}]}},
        "13463-67-7": {"name": "titanium dioxide", "properties": {}},
    }}
    lime = {"entries": {"1305-78-8": {"name": "lime", "properties": {"meltingPoint": [
        {"value": 2950.15, "ref": ["CRC95", 166, "crcConstants"]}]}}}}
    (tmp_path / "inorganic").mkdir()
    (tmp_path / "inorganic/TiO2.json").write_text(json.dumps(titania), encoding="utf-8")
    (tmp_path / "inorganic/CaO.json").write_text(json.dumps(lime), encoding="utf-8")
    index = {"byFormula": {"O2Ti": ["1317-70-0", "1317-80-2", "13463-67-7"], "CaO": ["1305-78-8"]},
             "compounds": {cas: {"file": "inorganic/TiO2.json"} for cas in ("1317-70-0", "1317-80-2", "13463-67-7")}
             | {"1305-78-8": {"file": "inorganic/CaO.json"}}}
    (tmp_path / "index.json").write_text(json.dumps(index), encoding="utf-8")
    return tmp_path


@pytest.mark.parametrize("formula, hill", [("TiO2", "O2Ti"), ("Al2O3", "Al2O3"), ("SiO2", "O2Si"), ("CaCO3", "CCaO3")])
def test_hill_formula_orders_elements_as_the_compound_data_index(formula, hill):
    assert hill_formula(formula) == hill


def test_melting_candidates_are_in_celsius_highest_polymorph_first(compound_data):
    candidates = melting_candidates("TiO2", compound_data)
    assert [(c.variant, c.temperature_C) for c in candidates] == [("rutile", 1912), ("anatase", 1560)]
    assert candidates[0].source() == {"ref": "CRC95", "table": "crcConstants", "line": 282,
                                      "read": "meltingPoint 2185.15 K (rutile); compound-data inorganic/TiO2.json, "
                                              "entry 1317-80-2"}
    assert melting_candidates("ZrO2", compound_data) == []


def _candidate(variant: str | None, name: str) -> MeltingCandidate:
    return MeltingCandidate("X", 1000, 1273.15, variant, name, "1-1-1", "CRC95", 1, "crcConstants", "x.json")


def test_default_id_is_the_mineral_variant_else_the_name():
    assert default_compound_id(_candidate("rutile", "Titanium dioxide"), "TiO2") == "rutile"
    assert default_compound_id(_candidate("α", "iron oxide (Fe2O3)"), "Fe2O3") == "iron-oxide"
    assert default_compound_id(None, "ZrO2") == "zro2"


def test_new_oxide_from_compound_data_only_is_extracted_with_the_crc_source(compound_data):
    rutile = melting_candidates("TiO2", compound_data)[0]
    compound = merge_compound_data(new_oxide_compound("rutile", "TiO2", None), rutile)
    assert compound["notation"] == "T" and compound["oxideMoles"] == {"TiO2": 1}
    assert compound["melting"] == {"behaviour": "congruent", "temperature_C": 1912, "products": None,
                                   "status": "extracted", "sources": [rutile.source()]}


def test_atlas_value_within_tolerance_keeps_it_and_adds_the_crc_source(compound_data):
    rutile = melting_candidates("TiO2", compound_data)[0]
    compound = merge_compound_data(new_oxide_compound("rutile", "TiO2", (1905, FIGURE)), rutile)
    assert compound["melting"]["temperature_C"] == 1905
    assert [s["ref"] for s in compound["melting"]["sources"]] == ["slag-atlas-1995", "CRC95"]


def test_atlas_value_beyond_tolerance_needs_a_choice(compound_data):
    rutile = melting_candidates("TiO2", compound_data)[0]
    atlas = new_oxide_compound("rutile", "TiO2", (1870, FIGURE))
    assert atlas_disagrees(atlas, rutile)
    with pytest.raises(ValueError):
        merge_compound_data(atlas, rutile)
    kept = merge_compound_data(atlas, rutile, "atlas")
    assert kept["melting"]["temperature_C"] == 1870 and "compound-data gives TiO2 rutile 1912 °C" in kept["notes"]
    taken = merge_compound_data(atlas, rutile, "compound-data")
    assert taken["melting"]["temperature_C"] == 1912 and taken["melting"]["sources"] == [rutile.source()]
    assert "Slag Atlas (Fig. 3.169) gives 1870 °C" in taken["notes"]
    conflict = merge_compound_data(atlas, rutile, "conflict")
    assert conflict["melting"]["status"] == "conflict" and len(conflict["melting"]["sources"]) == 2


def test_oxide_in_neither_source_is_missing():
    compound = new_oxide_compound("zirconia", "ZrO2", None)
    assert compound["notation"] == "Z"
    assert compound["melting"] == {"behaviour": None, "temperature_C": None, "products": None, "status": "missing",
                                   "sources": []}


def test_added_compound_follows_the_compact_layout_and_the_file_stays_valid(compound_data):
    rutile = melting_candidates("TiO2", compound_data)[0]
    text = add_compound(COMPOUNDS_TEXT, merge_compound_data(new_oxide_compound("rutile", "TiO2", None), rutile))
    assert [c["id"] for c in json.loads(text)["compounds"]] == ["lime", "rutile"]
    assert ('    },\n    {\n      "id": "rutile", "notation": "T", "formula": "TiO2", "oxideMoles": { "TiO2": 1 },\n'
            '      "melting": { "behaviour": "congruent", "temperature_C": 1912, "products": null, "status": "extracted",\n'
            '        "sources": [ { "ref": "CRC95", ') in text
    assert text.endswith("    }\n  ]\n}\n")
    with pytest.raises(ValueError):
        add_compound(text, {"id": "lime"})


def test_replaced_compound_changes_only_its_entry(compound_data):
    lime = json.loads(COMPOUNDS_TEXT)["compounds"][0]
    candidate = melting_candidates("CaO", compound_data)[0]
    assert atlas_disagrees(lime, candidate)
    text = replace_compound(COMPOUNDS_TEXT, merge_compound_data(lime, candidate, "conflict"))
    entry = json.loads(text)["compounds"][0]
    assert entry["melting"]["status"] == "conflict" and [s["ref"] for s in entry["melting"]["sources"]] == [
        "slag-atlas-1995", "CRC95"]
    assert text.startswith('{\n  "title": "Phase catalog",\n  "compounds": [\n    {\n      "id": "lime"')


def test_every_dataset_entry_is_written_back_unchanged():
    dataset = next((p for p in _DATASETS if p.exists()), None)
    if dataset is None:
        pytest.skip("dataset folder not found")
    text = (dataset / "compounds.json").read_text(encoding="utf-8")
    for compound in json.loads(text)["compounds"]:
        assert replace_compound(text, compound) == text, compound["id"]
