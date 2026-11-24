"""Close gaps in catalog refNumber only when every citation already names that row."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

_SCRIPT = Path(__file__).resolve().parents[2] / "src" / "scripts" / "normalize_pubchem_ref_numbers.py"
_spec = importlib.util.spec_from_file_location("normalize_pubchem_ref_numbers", _SCRIPT)
assert _spec is not None and _spec.loader is not None
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)
normalize_pubchem_ref_numbers = _module.normalize_pubchem_ref_numbers
NormalizeRefError = _module.NormalizeRefError


def _write(path: Path, rows: list[dict]) -> None:
    path.write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")


def _record(citations: list[dict]) -> dict:
    return {
        "cas": "1-1-1",
        "experimental": [{"values": [{"heading": "Melting Point", "citation": citations}]}],
    }


def test_gaps_close_when_every_citation_matches(tmp_path: Path):
    _write(tmp_path / "pubchem-references.jsonl", [
        {"refCode": "B", "source": "B", "refNumber": 10},
        {"refCode": "A", "source": "A", "refNumber": 1},
        {"refCode": "C", "source": "C", "refNumber": 3},
    ])
    _write(tmp_path / "pubchem-organic.jsonl", [_record([
        {"text": "1", "refCode": "B", "refNumber": 10},
        {"text": "2", "refCode": "C", "refNumber": 3},
    ])])

    assert normalize_pubchem_ref_numbers(tmp_path) == 1
    refs = [json.loads(line) for line in (tmp_path / "pubchem-references.jsonl").read_text().splitlines()]
    assert [(row["refCode"], row["refNumber"]) for row in refs] == [("A", 1), ("B", 2), ("C", 3)]
    record = json.loads((tmp_path / "pubchem-organic.jsonl").read_text())
    numbers = [cite["refNumber"] for cite in record["experimental"][0]["values"][0]["citation"]]
    assert numbers == [2, 3]
    assert normalize_pubchem_ref_numbers(tmp_path) == 0
    assert list(tmp_path.glob("*.prenorm")) == []


def test_a_citation_that_does_not_match_is_left_untouched(tmp_path: Path):
    refs = tmp_path / "pubchem-references.jsonl"
    organic = tmp_path / "pubchem-organic.jsonl"
    _write(refs, [
        {"refCode": "A", "source": "A", "refNumber": 1},
        {"refCode": "B", "source": "B", "refNumber": 5},
    ])
    _write(organic, [_record([
        {"text": "1", "refCode": "A", "refNumber": 1},
        {"text": "gone", "refCode": "Z", "refNumber": 3},
    ])])
    before = (refs.read_text(encoding="utf-8"), organic.read_text(encoding="utf-8"))

    with pytest.raises(NormalizeRefError):
        normalize_pubchem_ref_numbers(tmp_path)

    assert (refs.read_text(encoding="utf-8"), organic.read_text(encoding="utf-8")) == before
