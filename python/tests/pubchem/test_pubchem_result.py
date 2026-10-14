"""Tests for PubChem answer statuses of CAS queries, the class files (one record per key) and the CAS list."""
from __future__ import annotations

import json

from pubchem_fixtures import AL4C3, DAY, pubchem_record, view

from pubchem.parsers.cas_list import read_cas_list
from pubchem.parsers.compound_classes import read_compound_classes
from pubchem.parsers.pubchem_records import iter_pubchem_records, read_pubchem_records
from pubchem.pubchem_answer import PubchemAnswer
from pubchem.pubchem_paths import pubchem_files
from pubchem.pubchem_record import PubchemRecord
from pubchem.pubchem_records_writer import append_pubchem_record, compact_pubchem_files
from pubchem.pubchem_result import PubchemResult

EXPERIMENTAL = view(16685054, {"Record": {"RecordNumber": 16685054}})


class TestPubchemResult:
    def test_single_compound(self):
        result = PubchemResult.from_properties("1299-86-1", [AL4C3], DAY)
        assert (result.status, result.cid, result.formula, result.mw) == ("ok", 16685054, "C3Al4", 143.96)
        assert result.title == "Aluminum carbide (Al4C3)" and result.candidates == []
        assert result.name == "Aluminum carbide (Al4C3)"

    def test_not_found(self):
        assert PubchemResult.from_properties("75-20-7", [], DAY).status == "notFound"

    def test_same_formula_takes_first(self):
        result = PubchemResult.from_properties("1299-86-1", [AL4C3, {**AL4C3, "CID": 1}], DAY)
        assert result.status == "ok" and result.cid == 16685054
        assert result.candidates == ["16685054:C3Al4", "1:C3Al4"]

    def test_different_formulas_are_ambiguous(self):
        result = PubchemResult.from_properties("1-1-1", [AL4C3, {"CID": 2, "MolecularFormula": "Al2O3"}], DAY)
        assert result.status == "ambiguous" and result.cid is None
        assert result.candidates == ["16685054:C3Al4", "2:Al2O3"]

    def test_ion_is_charged(self):
        result = PubchemResult.from_properties("22537-22-0", [{"CID": 888, "MolecularFormula": "Mg+2"}], DAY)
        assert result.status == "charged"

    def test_neutral_compound_preferred_over_ion(self):
        props = [{"CID": 888, "MolecularFormula": "Mg+2"}, {"CID": 5462224, "MolecularFormula": "Mg"}]
        result = PubchemResult.from_properties("7439-95-4", props, DAY)
        assert (result.status, result.cid) == ("ok", 5462224)

    def test_name_falls_back_to_iupac(self):
        result = PubchemResult.from_properties("1299-86-1", [{**AL4C3, "Title": ""}], DAY)
        assert result.name == "tetraaluminum;methanetetrayl"

    def test_from_answer_keeps_the_answer_and_the_day(self):
        record = pubchem_record("1299-86-1", "inorganic", [AL4C3])
        result = record.result
        assert (result.status, result.cid, result.retrieved) == ("ok", 16685054, "2026-10-14")
        assert result.answer is record.answer


class TestRecord:
    def test_json_round_trip(self):
        record = pubchem_record("1299-86-1", "inorganic", [AL4C3, {**AL4C3, "CID": 1}], experimental=(EXPERIMENTAL,))
        data = record.to_json()
        assert list(data) == ["cas", "class", "properties", "experimental"]
        assert data["properties"]["httpStatus"] == 200 and "cas" not in data["properties"]
        assert PubchemRecord.from_json(json.loads(json.dumps(data))) == record

    def test_without_experimental_bodies(self):
        data = pubchem_record("1299-86-1", "inorganic", [AL4C3], experimental=(EXPERIMENTAL,)).to_json()
        light = PubchemRecord.from_json(data, experimental=False)
        assert [(e.cid, e.http_status, e.body) for e in light.experimental] == [(16685054, 200, None)]

    def test_missing_cids(self):
        record = pubchem_record("1299-86-1", "inorganic", [AL4C3, {**AL4C3, "CID": 1}], experimental=(EXPERIMENTAL,))
        assert record.missing_cids == [1]
        assert pubchem_record("75-20-7", "organic", []).missing_cids == []

    def test_cids_of_every_compound(self):
        body = {"PropertyTable": {"Properties": [AL4C3, {**AL4C3, "CID": 1}]}}
        assert PubchemAnswer(DAY, 200, "https://x", body).cids == [16685054, 1]
        assert PubchemAnswer(DAY, 404, "https://x", {"Fault": {}}).cids == []


class TestClassFiles:
    def test_one_file_per_class(self, tmp_path):
        assert {cls: p.name for cls, p in pubchem_files(tmp_path).items()} == {
            "inorganic": "pubchem-inorganic.jsonl", "organic": "pubchem-organic.jsonl",
            "unclassified": "pubchem-unclassified.jsonl"}

    def test_appended_lines_read_back_and_cut_line_skipped(self, tmp_path):
        path = tmp_path / "pubchem" / "pubchem-inorganic.jsonl"
        first = pubchem_record("1299-86-1", "inorganic", [AL4C3])
        second = pubchem_record("75-20-7", "inorganic", [])
        append_pubchem_record(path, first)
        with path.open("a", encoding="utf-8") as fh:
            fh.write('{"cas": "2-2-2", "cla')
        append_pubchem_record(path, second)
        assert list(iter_pubchem_records(path)) == [(first, 1), (second, 3)]

    def test_missing_file_is_empty(self, tmp_path):
        assert list(iter_pubchem_records(tmp_path / "none.jsonl")) == []
        assert read_pubchem_records([tmp_path / "none.jsonl"]) == {}

    def test_newest_record_wins_over_files(self, tmp_path):
        files = pubchem_files(tmp_path)
        old = pubchem_record("1299-86-1", "unclassified", [], "2026-10-13T08:00:00+00:00")
        new = pubchem_record("1299-86-1", "inorganic", [AL4C3], "2026-10-14T08:00:00+00:00")
        append_pubchem_record(files["inorganic"], new)
        append_pubchem_record(files["unclassified"], old)
        record, path, line = read_pubchem_records(files.values())["1299-86-1"]
        assert (record, path, line) == (new, files["inorganic"], 1)

    def test_later_line_wins_a_tie(self, tmp_path):
        path = tmp_path / "pubchem-organic.jsonl"
        append_pubchem_record(path, pubchem_record("75-20-7", "organic", []))
        append_pubchem_record(path, pubchem_record("75-20-7", "organic", [AL4C3]))
        record, _, line = read_pubchem_records([path])["75-20-7"]
        assert (record.result.status, line) == ("ok", 2)

    def test_compact_keeps_only_the_newest_line_per_cas(self, tmp_path):
        files = pubchem_files(tmp_path)
        append_pubchem_record(files["unclassified"], pubchem_record("1299-86-1", "unclassified", [],
                                                                    "2026-10-13T08:00:00+00:00"))
        append_pubchem_record(files["organic"], pubchem_record("64-17-5", "organic", []))
        append_pubchem_record(files["inorganic"], pubchem_record("1299-86-1", "inorganic", [AL4C3]))
        with files["organic"].open("a", encoding="utf-8") as fh:
            fh.write('{"cas": "2-2-2", "cla')
        assert compact_pubchem_files(files.values()) == 2
        assert files["unclassified"].read_text(encoding="utf-8") == ""
        assert [r.key for r, _ in iter_pubchem_records(files["organic"])] == ["64-17-5"]
        assert files["organic"].read_text(encoding="utf-8").endswith("\n")
        assert [r.key for r, _ in iter_pubchem_records(files["inorganic"])] == ["1299-86-1"]
        assert compact_pubchem_files(files.values()) == 0


def test_compound_classes_include_other_cas_and_skip_formula_keys(tmp_path):
    path = tmp_path / "index.json"
    path.write_text(json.dumps({
        "compounds": {"1330-43-4": {"class": "inorganic"}, "64-17-5": {"class": "organic"},
                      "formula:Ag2S": {"class": "inorganic"}},
        "byOtherCas": {"1039387-27-3": "1330-43-4", "1-1-1": "9-9-9"},
    }), encoding="utf-8")
    assert read_compound_classes(path) == {
        "1330-43-4": "inorganic", "64-17-5": "organic", "1039387-27-3": "inorganic"}


def test_cas_list_skips_comments_blanks_and_duplicates(tmp_path):
    path = tmp_path / "missing-cas.txt"
    path.write_text("# header\n1299-86-1\n\n75-20-7  # comment\n1299-86-1\n", encoding="utf-8")
    assert read_cas_list(path) == ["1299-86-1", "75-20-7"]
