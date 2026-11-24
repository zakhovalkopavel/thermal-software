"""Tests for name-based compoundId assignment."""
from __future__ import annotations

from compound_data.compound_id import assign_compound_ids, compound_id_stem, name_to_slug
from compound_data.compound_record import CompoundRecord


def _record(record_id: str, name: str | None, cas: str | None = None, hill: str = "X") -> CompoundRecord:
    return CompoundRecord(
        id=record_id,
        cas=cas if cas is not None else (None if record_id.startswith("formula:") else record_id),
        formula=hill,
        hill=hill,
        display_formula=hill,
        elements=[hill],
        compound_class="inorganic",
        group=hill,
        name=name,
    )


def test_name_to_slug_replaces_spaces():
    assert name_to_slug("carbon dioxide") == "carbon_dioxide"
    assert name_to_slug("  Tungsten  Oxide ") == "Tungsten_Oxide"


def test_unique_name_is_unsuffixed():
    records = [_record("7727-37-9", "nitrogen"), _record("7732-18-5", "water")]
    mapping = assign_compound_ids(records)
    assert mapping == {"7727-37-9": "nitrogen", "7732-18-5": "water"}
    assert records[0].compound_id == "nitrogen"


def test_duplicate_names_get_numeric_suffix():
    records = [
        _record("7440-44-0", "Carbon", cas="7440-44-0", hill="C"),
        _record("7782-42-5", "Carbon", cas="7782-42-5", hill="C"),
        _record("formula:C3", "Carbon", cas=None, hill="C3"),
    ]
    mapping = assign_compound_ids(records)
    assert mapping["7440-44-0"] == "Carbon_1"
    assert mapping["7782-42-5"] == "Carbon_2"
    assert mapping["formula:C3"] == "Carbon_3"


def test_stem_falls_back_to_formula_when_name_missing():
    record = _record("formula:Ne", None, cas=None, hill="Ne")
    assert compound_id_stem(record) == "Ne"
