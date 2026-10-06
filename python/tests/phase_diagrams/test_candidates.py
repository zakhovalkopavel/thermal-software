"""
Unit tests for the candidate comparison and the validation of a candidate before promotion.
"""
from __future__ import annotations

import copy
import json

import pd_helpers
from phase_diagrams.output.system_comparer import compare_systems
from phase_diagrams.validation.candidate_validator import validate_with_candidate

BINARY = "systems/mgo-sio2.json"
TERNARY = "systems/ternary.json"


def _binary() -> dict:
    return pd_helpers.valid_dataset()[BINARY]


def test_identical_files_are_within_tolerance():
    comparison = compare_systems(_binary(), _binary())
    assert comparison.within_tolerance
    assert comparison.lines() == ["identical within tolerance"]


def test_liquidus_shift_inside_the_box_passes_and_outside_fails():
    small, large = _binary(), _binary()
    small["liquidus"][0]["points"][1] = [20, 2402]
    large["liquidus"][0]["points"][1] = [20, 2410]
    assert compare_systems(_binary(), small).within_tolerance
    comparison = compare_systems(_binary(), large)
    assert not comparison.within_tolerance
    assert "liquidus periclase" in comparison.differences[0]


def test_invariant_value_and_nbs_source_changes_are_differences():
    new = _binary()
    new["invariantPoints"][0]["temperature_C"] = 1851
    new["invariantPoints"][0]["sources"][1]["entry"] = 2
    differences = compare_systems(_binary(), new).differences
    assert "ms-1850.temperature_C: 1850 → 1851" in differences
    assert "ms-1850: NBS sources differ" in differences


def test_atlas_pixel_change_is_only_a_note():
    new = _binary()
    new["invariantPoints"][0]["sources"][0]["pixel"] = [3, 4]
    comparison = compare_systems(_binary(), new)
    assert comparison.within_tolerance
    assert comparison.notes == ["ms-1850: atlas source text or pixel changed"]


def test_filled_ternary_polylines_are_notes():
    old = pd_helpers.valid_dataset()[TERNARY]
    old["boundaryCurves"][0]["polyline_wt"] = None
    new = copy.deepcopy(old)
    new["boundaryCurves"][0]["polyline_wt"] = [[1, 2], [3, 4]]
    comparison = compare_systems(old, new)
    assert comparison.within_tolerance
    assert comparison.notes == ["boundaryCurves: 1 polylines filled, 0 replaced"]


def test_candidate_with_an_error_is_reported_and_dataset_untouched(dataset_factory):
    dataset = dataset_factory()
    before = (dataset / BINARY).read_text(encoding="utf-8")
    broken = _binary()
    broken["invariantPoints"][0]["liquid_wt"]["SiO2"] = 30.0
    issues = validate_with_candidate(dataset, BINARY, json.dumps(broken))
    assert {(i.code, i.level) for i in issues} >= {("PD002", "error")}
    assert (dataset / BINARY).read_text(encoding="utf-8") == before


def test_valid_new_candidate_passes(dataset_factory):
    dataset = dataset_factory()
    new_system = _binary()
    new_system["invariantPoints"][0]["id"] = "ms-new"
    new_system["liquidus"][0]["to"] = "ms-new"
    issues = validate_with_candidate(dataset, "systems/mgo-sio2-copy.json", json.dumps(new_system))
    assert [i for i in issues if i.level == "error"] == []
    assert not (dataset / "systems/mgo-sio2-copy.json").exists()
