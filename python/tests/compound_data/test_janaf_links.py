"""Tests for compound_data.janaf_links — JANAF table ids attached by Hill formula."""
from __future__ import annotations

import json

import pytest

from compound_data.builder import _attach_janaf
from compound_data.compound_record import CompoundRecord
from compound_data.janaf_links import attach_janaf
from compound_data.merger import MergeResult
from compound_data.parsers.janaf_cas_index import read_janaf_cas_index
from compound_data.writers import write_compound_sources
from janaf.janaf_source import JanafSource
from janaf.janaf_table import JanafTable

JANAF_REPOSITORY = "https://github.com/n-takumasa/py-janaf"
JANAF_COMMIT = "c8ed6be3ba31a61835061091bd3c521270b484ec"


def _record(id_, hill, elements, compound_class="inorganic", group=None):
    return CompoundRecord(id=id_, cas=None if id_.startswith("formula:") else id_, formula=hill, hill=hill,
                          display_formula=hill, elements=elements, compound_class=compound_class, group=group or elements[0])


def _table(table_id, janaf_formula, formula, name="", phase="g"):
    return JanafTable(table_id=table_id, name=name, formula=formula, janaf_formula=janaf_formula, phase=phase,
                      label=f"{formula}, {name} ({phase})")


@pytest.fixture
def linked():
    records = {
        "1344-28-1": _record("1344-28-1", "Al2O3", ["Al", "O"]),
        "39377-45-2": _record("39377-45-2", "Al2O3", ["Al", "O"]),
        "13463-67-7": _record("13463-67-7", "O2Ti", ["O", "Ti"], group="O"),
        "7429-90-5": _record("7429-90-5", "Al", ["Al"]),
    }
    tables = [
        _table("Al-096", "Al2O3", "Al2O3", "Aluminum Oxide, Alpha", "cr"),
        _table("Al-101", "Al2O3", "Al2O3", "Aluminum Oxide", "l"),
        _table("O-045", "O2Ti1", "TiO2", "Titanium Oxide", "cr,l"),
        _table("Al-001", "Al1", "Al", "Aluminum", "ref"),
        _table("Al-014", "Al1Cl1", "AlCl", "Aluminum Chloride"),
        _table("Al-006", "Al1+", "Al+", "Aluminum, Ion"),
        _table("D-007", "D2O1", "D2O", "Water-d2"),
        _table("Al-008", "Al1B1O2", "AlBO2", "Aluminum Borate"),
        _table("Al-084", "Al2Br6", None, "Aluminum Bromide ((AlBr3)2)"),
    ]
    cas_index = {
        ("Al2O3", "cr", "Aluminum Oxide, Alpha"): ("1344-28-1", 40),
        ("AlBO2", "g", "Aluminum Borate"): ("61279-70-7", 8),
        ("Al2Br6", "g", "Aluminum Bromide"): ("18898-34-4", 85),
        ("BH4K", "cr", "Potassium Tetrahydroborate"): ("13762-51-1", 6),
    }
    records["61279-70-7"] = _record("61279-70-7", "AlBH2O2", ["Al", "B", "H", "O"])
    issues = attach_janaf(records, tables, cas_index)
    return records, issues


def _kinds(issues):
    return [i["issue"] for i in issues]


class TestAttach:
    def test_matches_by_hill(self, linked):
        records, _ = linked
        assert records["13463-67-7"].janaf == ["O-045"]
        assert records["7429-90-5"].janaf == ["Al-001"]

    def test_cas_match_goes_to_that_record_only(self, linked):
        records, _ = linked
        assert records["1344-28-1"].janaf == ["Al-096", "Al-101"]
        assert records["39377-45-2"].janaf == ["Al-101"]

    def test_formula_fallback_goes_to_every_record(self, linked):
        _, issues = linked
        shared = next(i for i in issues if i["issue"] == "janafSharedFormula")
        assert shared["formula"] == "Al2O3" and shared["ids"] == ["1344-28-1", "39377-45-2"]
        assert shared["tables"] == ["Al-101"]

    def test_cas_with_other_formula_is_reported_and_not_used(self, linked):
        records, issues = linked
        assert records["61279-70-7"].janaf == []
        mismatch = next(i for i in issues if i["issue"] == "janafCasFormulaMismatch")
        assert (mismatch["tableId"], mismatch["cas"], mismatch["recordHill"]) == ("Al-008", "61279-70-7", "AlBH2O2")
        assert records["formula:AlBO2"].janaf == ["Al-008"] and records["formula:AlBO2"].cas is None

    def test_unmatched_formula_creates_record(self, linked):
        records, issues = linked
        alcl = records["formula:AlCl"]
        assert alcl.janaf == ["Al-014"]
        assert (alcl.formula, alcl.hill, alcl.name, alcl.group) == ("AlCl", "AlCl", "Aluminum Chloride", "Al")
        assert alcl.cas is None and alcl.compound_class == "inorganic"
        assert any(i["issue"] == "janafRecordCreated" and i["id"] == "formula:AlCl" for i in issues)

    def test_created_record_takes_csv_cas(self, linked):
        records, _ = linked
        al2br6 = records["18898-34-4"]
        assert al2br6.cas == "18898-34-4" and al2br6.janaf == ["Al-084"] and al2br6.formula == "Al2Br6"

    def test_unused_csv_rows_are_reported(self, linked):
        _, issues = linked
        unmatched = [i for i in issues if i["issue"] == "janafCasRowUnmatched"]
        assert [(i["cas"], i["line"]) for i in unmatched] == [("13762-51-1", 6)]

    def test_ions_and_deuterium_are_skipped(self, linked):
        records, issues = linked
        kinds = {i["tableId"]: i["issue"] for i in issues if i["issue"] in ("janafIon", "janafIsotope")}
        assert kinds == {"Al-006": "janafIon", "D-007": "janafIsotope"}
        assert not any("Al-006" in r.janaf or "D-007" in r.janaf for r in records.values())
        assert "formula:H2O" not in records

    def test_record_output(self, linked):
        records, _ = linked
        out = records["13463-67-7"].to_dict()
        assert out["janaf"] == ["O-045"]
        assert records["13463-67-7"].refs() == ["NISTJANAF"]
        assert "janaf" not in _record("7440-37-1", "Ar", ["Ar"]).to_dict()


class TestJanafFormula:
    def test_decimal_count_is_not_an_adduct(self):
        records: dict[str, CompoundRecord] = {}
        issues = attach_janaf(records, [_table("Mo-011", "Mo1O2.750", "MoO2.750", "Molybdenum Oxide", "cr")])
        assert records["formula:MoO2.75"].janaf == ["Mo-011"]
        assert records["formula:MoO2.75"].elements == ["Mo", "O"]
        assert [i["issue"] for i in issues] == ["janafRecordCreated"]

    def test_unknown_symbol_is_reported(self):
        records: dict[str, CompoundRecord] = {}
        issues = attach_janaf(records, [_table("X-001", "Xx1", "Xx")])
        assert records == {} and [i["issue"] for i in issues] == ["janafFormulaNotParsed"]


class TestBuilderJanaf:
    def test_reads_janaf_copy(self, tmp_path):
        data = tmp_path / "py-janaf" / "data"
        data.mkdir(parents=True)
        (data / "O-045.txt").write_text(
            "Titanium Oxide (TiO2)\tO2Ti1(cr,l)\n"
            "T(K)\tCp\tS\t-[G-H(Tr)]/T\tH-H(Tr)\tdelta-f H\tdelta-f G\tlog Kf\n"
            "298.15\t55.103\t50.292\t50.292\t0.\t-944.747\t-889.406\t155.821\n",
            encoding="utf-8",
        )
        (tmp_path / "py-janaf" / "janaf.json").write_text(
            json.dumps({"display": ["O2Ti, Titanium Oxide (cr,l)"], "index": ["O-045"]}), encoding="utf-8",
        )
        (tmp_path / "PROVENANCE.txt").write_text(
            f"py-janaf: {JANAF_REPOSITORY}.git\nref: main  commit: {JANAF_COMMIT}\n", encoding="utf-8",
        )
        csv_path = tmp_path / "janaf_tables_index.csv"
        csv_path.write_text(
            'CAS Number,Formula,Name,State\n13463-67-7,O2Ti,Titanium Oxide,"cr,l"\n', encoding="utf-8",
        )
        merge = MergeResult(records={
            "13463-67-7": _record("13463-67-7", "O2Ti", ["O", "Ti"], group="O"),
            "1317-80-2": _record("1317-80-2", "O2Ti", ["O", "Ti"], group="O"),
        })
        source, issues, counts = _attach_janaf(tmp_path, csv_path, merge)
        assert source == JanafSource(JANAF_REPOSITORY, JANAF_COMMIT)
        assert merge.records["13463-67-7"].janaf == ["O-045"]
        assert merge.records["1317-80-2"].janaf == []
        assert issues == [] and counts == {"janafTables": 1, "janafCasRows": 1, "janafRecords": 1}

    def test_missing_copy_is_skipped(self, tmp_path):
        merge = MergeResult()
        assert _attach_janaf(tmp_path / "missing", tmp_path / "missing.csv", merge) == (None, [], {})


class TestJanafCasIndex:
    def test_rows_keyed_by_formula_state_name(self, tmp_path):
        path = tmp_path / "janaf_tables_index.csv"
        path.write_text(
            "CAS Number,Formula,Name,State\n"
            '1344-28-1,Al2O3,"Aluminum Oxide, Alpha",cr\n'
            "bad,AlCl,Aluminum Chloride,g\n"
            "17702-41-9,H14B10,Decaborane,cr\n"
            "14903-36-7,Al+,\"Aluminum, Ion\",g\n"
            "7789-20-0,D2O,Water-D,g\n",
            encoding="utf-8",
        )
        assert read_janaf_cas_index(path) == {
            ("Al2O3", "cr", "Aluminum Oxide, Alpha"): ("1344-28-1", 2),
            ("B10H14", "cr", "Decaborane"): ("17702-41-9", 4),
        }


class TestSourcesJanaf:
    def test_janaf_block(self, tmp_path, chem):
        path = write_compound_sources(tmp_path, chem, "2026-10-12T00:00:00+00:00",
                                      JanafSource(JANAF_REPOSITORY, JANAF_COMMIT))
        janaf = json.loads(path.read_text(encoding="utf-8"))["janaf"]
        assert janaf == {
            "ref": "NISTJANAF",
            "repository": JANAF_REPOSITORY,
            "sourceCommit": JANAF_COMMIT,
            "dataset": "shared/processed/JANAF/index.json",
            "tableUrl": f"{JANAF_REPOSITORY}/blob/{JANAF_COMMIT}/src/janaf/data/{{id}}.txt",
            "nistUrl": "https://janaf.nist.gov/tables/{id}.html",
        }

    def test_no_janaf_block_without_source(self, tmp_path, chem):
        path = write_compound_sources(tmp_path, chem, "2026-10-12T00:00:00+00:00")
        assert "janaf" not in json.loads(path.read_text(encoding="utf-8"))
