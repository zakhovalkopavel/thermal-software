"""Tests for the build side of PubChem: class files → identifiers, CAS of records without one, sources.json
block, missing-cas.txt."""
from __future__ import annotations

import json

from compound_data.constants.pubchem_source import PUBCHEM_TABLES
from compound_data.compound_record import CompoundRecord
from compound_data.pubchem_formula_links import attach_pubchem_formulas
from compound_data.pubchem_identifiers import load_pubchem_identifiers, pubchem_identifier
from compound_data.pubchem_sources import read_pubchem_sources
from compound_data.writers import write_compound_sources, write_missing_cas
from pubchem.parsers.cas_list import read_cas_list
from pubchem.pubchem_answer import PubchemAnswer
from pubchem.pubchem_paths import pubchem_files
from pubchem.pubchem_query import PubchemQuery
from pubchem.pubchem_record import PubchemRecord
from pubchem.pubchem_records_writer import append_pubchem_record
from pubchem.pubchem_result import PubchemResult
from pubchem.pubchem_view import PubchemView

DAY = "2026-10-12"
RETRIEVED = "2026-10-14T09:30:00+00:00"
AL4C3 = {"CID": 16685054, "MolecularFormula": "C3Al4", "MolecularWeight": "143.96", "SMILES": "[C-4].[Al+3]",
         "InChIKey": "CAVCGVPGBKGDTG-UHFFFAOYSA-N", "IUPACName": "tetraaluminum;methanetetrayl",
         "Title": "Aluminum carbide (Al4C3)"}
AG2S = {"CID": 166738, "MolecularFormula": "Ag2S", "Title": "Silver sulfide"}
INORGANIC = PUBCHEM_TABLES["inorganic"]


def _answer(query: PubchemQuery, props: list[dict]) -> PubchemAnswer:
    body = {"PropertyTable": {"Properties": props}} if props else {"Fault": {"Code": "PUGREST.NotFound"}}
    return PubchemAnswer(RETRIEVED, 200 if props else 404, query.url, body)


def _record(cas: str, compound_class: str, props: list[dict]) -> PubchemRecord:
    query = PubchemQuery.cas(cas)
    return PubchemRecord(query, compound_class, _answer(query, props))


def _search(formula: str, props: list[dict], cas: str | None) -> PubchemRecord:
    query = PubchemQuery.formula(formula)
    body = {"Record": {"Section": [{"TOCHeading": "CAS", "Information": [
        {"Value": {"StringWithMarkup": [{"String": cas}]}}]}]}} if cas else None
    views = (PubchemView(props[0]["CID"], RETRIEVED, 200 if cas else 404, "https://x", body),) if props else ()
    return PubchemRecord(query, "inorganic", _answer(query, props), cas_numbers=views)


def _no_cas_record(hill: str, cas: str | None = None, other_cas: list[str] | None = None) -> CompoundRecord:
    record_id = cas or f"formula:{hill}"
    return CompoundRecord(record_id, cas, hill, hill, hill, [], "inorganic", "Ag", other_cas=other_cas or [])


class TestIdentifiers:
    def test_table_keys_per_class(self):
        assert {cls: t.key for cls, t in PUBCHEM_TABLES.items()} == {
            "inorganic": "idPubchemRestInorganic", "organic": "idPubchemRestOrganic",
            "unclassified": "idPubchemRestUnclassified"}
        assert INORGANIC.path == "shared/sources/compound-data/pubchem/pubchem-inorganic.jsonl"

    def test_ok_record_becomes_identifier(self):
        identifier = pubchem_identifier(PubchemResult.from_properties("1299-86-1", [AL4C3], DAY), 7, INORGANIC)
        assert (identifier.formula, identifier.cid, identifier.name) == ("C3Al4", 16685054, "Aluminum carbide (Al4C3)")
        assert identifier.source.to_ref() == [7, "idPubchemRestInorganic"]
        assert identifier.source.url == "https://pubchem.ncbi.nlm.nih.gov/compound/16685054"

    def test_charged_record_is_not_an_identifier(self):
        result = PubchemResult.from_properties("22537-22-0", [{"CID": 888, "MolecularFormula": "Mg+2"}], DAY)
        assert pubchem_identifier(result, 2, INORGANIC) is None

    def test_only_missing_ok_records_become_identifiers(self, tmp_path):
        files = pubchem_files(tmp_path)
        append_pubchem_record(files["organic"], _record("75-20-7", "organic", []))
        append_pubchem_record(files["inorganic"], _record("22537-22-0", "inorganic",
                                                          [{"CID": 888, "MolecularFormula": "Mg+2"}]))
        append_pubchem_record(files["inorganic"], _record("1299-86-1", "inorganic", [AL4C3]))
        sources = read_pubchem_sources(tmp_path)
        found, counts, issues = load_pubchem_identifiers(sources, {"1299-86-1", "22537-22-0", "75-20-7", "9999-99-9"})
        tables = list(sources.tables.values())
        assert list(found) == ["1299-86-1"]
        assert found["1299-86-1"].source.to_ref() == [2, "idPubchemRestInorganic"]
        assert counts == {"pubchemCharged": 1, "pubchemNotFetched": 1, "pubchemNotFound": 1, "pubchemOk": 1}
        assert sorted((i["issue"], i["table"]) for i in issues) == [
            ("pubchemCharged", "PubChem REST (inorganic)"), ("pubchemNotFound", "PubChem REST (organic)")]
        assert [(t.key, t.path) for t in tables] == [
            ("idPubchemRestInorganic", str(files["inorganic"])), ("idPubchemRestOrganic", str(files["organic"]))]

    def test_no_files(self, tmp_path):
        sources = read_pubchem_sources(tmp_path / "none")
        assert load_pubchem_identifiers(sources, {"1299-86-1"}) == ({}, {"pubchemNotFetched": 1}, [])
        assert sources.tables == {}


class TestFormulaLinks:
    def _sources(self, tmp_path, *records):
        path = pubchem_files(tmp_path)["inorganic"]
        for record in records:
            append_pubchem_record(path, record)
        return read_pubchem_sources(tmp_path)

    def test_ok_search_adds_cas_and_cid_and_keeps_the_key(self, tmp_path):
        record = _no_cas_record("Ag2S")
        issues, counts = attach_pubchem_formulas([record], self._sources(tmp_path, _search("Ag2S", [AG2S], "21548-73-2")))
        assert (record.id, record.cas, record.pubchem_cas, record.pubchem_cid) == (
            "formula:Ag2S", None, "21548-73-2", 166738)
        assert record.pubchem_cas_source.to_ref() == [1, "idPubchemRestInorganic"]
        assert (issues, counts) == ([], {"pubchemFormulaCas": 1})
        entry = record.to_dict()
        assert (entry["cas"], entry["casRef"], entry["pubchemCid"]) == ("21548-73-2", [1, "idPubchemRestInorganic"], 166738)

    def test_cas_of_another_record_is_reported(self, tmp_path):
        record, other = _no_cas_record("Ag2S"), _no_cas_record("Ag2S", "1-1-1", other_cas=["21548-73-2"])
        issues, counts = attach_pubchem_formulas([record, other],
                                                 self._sources(tmp_path, _search("Ag2S", [AG2S], "21548-73-2")))
        assert record.pubchem_cas is None and counts == {"pubchemCasExists": 1}
        assert (issues[0]["issue"], issues[0]["cas"], issues[0]["record"], issues[0]["recordFormula"]) == (
            "pubchemCasExists", "formula:Ag2S", "1-1-1", "Ag2S")

    def test_not_ok_and_not_fetched(self, tmp_path):
        records = [_no_cas_record("Ag2S"), _no_cas_record("CuS")]
        issues, counts = attach_pubchem_formulas(records, self._sources(tmp_path, _search("Ag2S", [], None)))
        assert counts == {"pubchemFormulaNotFetched": 1, "pubchemFormulaSearchNotFound": 1}
        assert [i["issue"] for i in issues] == ["pubchemFormulaSearchNotFound"]

    def test_found_compound_without_cas_gives_the_cid(self, tmp_path):
        record = _no_cas_record("Ag2S")
        _, counts = attach_pubchem_formulas([record], self._sources(tmp_path, _search("Ag2S", [AG2S], None)))
        assert (record.pubchem_cas, record.pubchem_cid, counts) == (None, 166738, {"pubchemFormulaCidOnly": 1})


class TestSources:
    def test_sources_block(self, tmp_path, chem):
        organic = PUBCHEM_TABLES["organic"]
        path = write_compound_sources(tmp_path, chem, DAY, None, [INORGANIC, organic])
        data = json.loads(path.read_text(encoding="utf-8"))
        assert data["files"]["idPubchemRestInorganic"] == {
            "name": "PubChem REST (inorganic)", "path": INORGANIC.path, "ref": None, "url": None}
        assert data["files"]["idPubchemRestOrganic"]["path"] == organic.path
        assert data["pubchem"]["cache"] == "shared/sources/compound-data/pubchem"
        assert data["pubchem"]["compoundUrl"] == "https://pubchem.ncbi.nlm.nih.gov/compound/{cid}"
        assert data["pubchem"]["references"] == "shared/sources/compound-data/pubchem/pubchem-references.jsonl"
        assert data["pubchem"]["ref"] == "pubchem{refNumber}"
        assert "refNumber 151" in data["pubchem"]["refNote"]

    def test_no_sources_block_without_files(self, tmp_path, chem):
        data = json.loads(write_compound_sources(tmp_path, chem, DAY).read_text(encoding="utf-8"))
        assert "pubchem" not in data and not any(k.startswith("idPubchemRest") for k in data["files"])


def test_missing_cas_list_is_read_by_the_pubchem_step(tmp_path):
    path = write_missing_cas(tmp_path / "missing-cas.txt", ["75-20-7", "1299-86-1"], DAY)
    assert path.read_text(encoding="utf-8").startswith("# CAS numbers")
    assert read_cas_list(path) == ["1299-86-1", "75-20-7"]
