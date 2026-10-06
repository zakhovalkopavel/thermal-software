"""
Unit tests for validate_dataset: one passing fixture dataset and one failing fixture per rule.
"""
from __future__ import annotations

import pytest

from phase_diagrams.validation.dataset_validator import validate_dataset

BINARY = "systems/mgo-sio2.json"
TERNARY = "systems/ternary.json"


def _point(data):
    return data[BINARY]["invariantPoints"][0]


def _codes(path):
    return {(issue.code, issue.level) for issue in validate_dataset(path)}


def test_valid_dataset_has_no_issues(dataset_factory):
    assert validate_dataset(dataset_factory()) == []


def _broken_json(data):
    data["systems/broken.json"] = "{ not json"


def _bad_sum(data):
    _point(data)["liquid_wt"]["SiO2"] = 38.5


def _duplicate_id(data):
    data[TERNARY]["invariantPoints"] = [dict(_point(data))]


def _unknown_phase(data):
    data[BINARY]["phases"].append("unobtainium")


def _liquidus_end(data):
    data[BINARY]["liquidus"][0]["points"][-1] = [38.0, 1849]


def _liquidus_order(data):
    data[BINARY]["liquidus"][0]["points"] = [[0, 2822], [30, 2400], [20, 2300], [38.0, 1850]]


def _unknown_status(data):
    _point(data)["status"] = "guessed"


def _confirmed_without_match(data):
    _point(data)["sources"][1]["reported"]["temperature_C"] = 1900


def _conflict_with_match(data):
    _point(data)["status"] = "conflict"


def _unlisted_figure(data):
    _point(data)["sources"][0]["figure"] = "Fig. 3.999"


def _missing_pixel(data):
    del _point(data)["sources"][0]["pixel"]


def _recalled(data):
    _point(data)["sources"].append({"ref": "recalled"})


def _unknown_path_id(data):
    data[TERNARY]["boundaryCurves"][0]["path"] = ["ms-1850", "xx-1"]


def _null_polyline(data):
    data[TERNARY]["boundaryCurves"][0]["polyline_wt"] = None


def _page_mapping(data):
    _point(data)["sources"][1]["pdfPage"] = 117


@pytest.mark.parametrize(
    "modify, code, level",
    [
        (_broken_json, "PD001", "error"),
        (_bad_sum, "PD002", "error"),
        (_duplicate_id, "PD003", "error"),
        (_unknown_phase, "PD004", "error"),
        (_liquidus_end, "PD005", "error"),
        (_liquidus_order, "PD005", "error"),
        (_unknown_status, "PD006", "error"),
        (_confirmed_without_match, "PD007", "error"),
        (_conflict_with_match, "PD007", "error"),
        (_unlisted_figure, "PD008", "error"),
        (_missing_pixel, "PD009", "warning"),
        (_recalled, "PD010", "warning"),
        (_unknown_path_id, "PD011", "error"),
        (_null_polyline, "PD012", "warning"),
        (_page_mapping, "PD013", "error"),
    ],
)
def test_rule(dataset_factory, modify, code, level):
    assert (code, level) in _codes(dataset_factory(modify))


def _compound_end(composition):
    def modify(data):
        data[BINARY]["liquidus"].append(
            {"phase": "forsterite", "from": "ms-1850", "to": "forsterite melting point", "status": "extracted",
             "points": [[38.0, 1850], [composition, 1890]]}
        )

    return modify


def test_compound_end_member_at_stoichiometry_is_valid(dataset_factory):
    assert validate_dataset(dataset_factory(_compound_end(42.7))) == []


def test_compound_end_member_off_stoichiometry_is_an_error(dataset_factory):
    assert ("PD005", "error") in _codes(dataset_factory(_compound_end(43.0)))


def test_conflict_between_two_atlas_sources_is_allowed(dataset_factory):
    def atlas_conflict(data):
        point = _point(data)
        point["status"] = "conflict"
        point["sources"] = [point["sources"][0], dict(point["sources"][0])]

    assert not [i for i in validate_dataset(dataset_factory(atlas_conflict)) if i.code == "PD007"]
