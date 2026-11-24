"""Tests for compound_data.coolprop_links — CoolProp fluid names attached by CAS."""
from __future__ import annotations

import json
from pathlib import Path

from compound_data.builder import _attach_coolprop
from compound_data.compound_record import CompoundRecord
from compound_data.coolprop_links import CoolpropFluid, attach_coolprop, load_coolprop_fluids
from compound_data.merger import MergeResult
from compound_data.writers import write_compound_sources
from references import RefKey

GENERATED = "2026-11-18T00:00:00+00:00"


def _record(cas: str, hill: str, name: str, elements: list[str] | None = None) -> CompoundRecord:
    elements = elements or [hill]
    return CompoundRecord(
        id=cas, cas=cas, formula=hill, hill=hill, display_formula=hill,
        elements=elements, compound_class="inorganic", group=elements[0], name=name,
    )


def test_attach_by_cas():
    argon = _record("7440-37-1", "Ar", "argon", ["Ar"])
    nitrogen = _record("7727-37-9", "N2", "nitrogen", ["N"])
    records = {r.id: r for r in (argon, nitrogen)}
    fluids = [
        CoolpropFluid("Argon", "7440-37-1", "Argon.json"),
        CoolpropFluid("Nitrogen", "7727-37-9", "Nitrogen.json"),
        CoolpropFluid("Xenon", "7440-63-3", "Xenon.json"),
    ]
    issues, counts = attach_coolprop(records, fluids)
    assert argon.coolprop == ["Argon"]
    assert nitrogen.coolprop == ["Nitrogen"]
    assert counts["coolpropLinked"] == 2
    assert counts["coolpropRecords"] == 2
    assert counts["coolpropNoRecord"] == 1
    assert any(i["issue"] == "coolpropNoRecord" and i["label"] == "Xenon" for i in issues)


def test_labelled_sibling_skipped_when_plain_exists():
    plain = _record("7732-18-5", "H2O", "water", ["H", "O"])
    labelled = _record("7789-20-0", "H2O", "water-d2", ["H", "O"])
    labelled.cas = plain.cas
    records = {plain.id: plain, labelled.id: labelled}
    issues, counts = attach_coolprop(
        records, [CoolpropFluid("Water", "7732-18-5", "Water.json")],
    )
    assert plain.coolprop == ["Water"]
    assert labelled.coolprop == []
    assert counts["coolpropLinked"] == 1
    assert not issues


def test_load_and_builder_block(tmp_path: Path, chem):
    fluid = {"INFO": {"NAME": "Argon", "CAS": "7440-37-1"}, "EOS": []}
    fluids_dir = tmp_path / "fluids"
    fluids_dir.mkdir()
    (fluids_dir / "Argon.json").write_text(json.dumps(fluid), encoding="utf-8")
    loaded = load_coolprop_fluids(fluids_dir)
    assert loaded == [CoolpropFluid("Argon", "7440-37-1", str(fluids_dir / "Argon.json"))]

    merge = MergeResult()
    merge.records = {"7440-37-1": _record("7440-37-1", "Ar", "argon", ["Ar"])}
    block, issues, counts = _attach_coolprop(fluids_dir, merge)
    assert block["ref"] == RefKey.CoolProp.value
    assert counts["coolpropLinked"] == 1
    assert not issues
    path = write_compound_sources(tmp_path, chem, GENERATED, coolprop=block)
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["coolprop"]["ref"] == "CoolProp"
