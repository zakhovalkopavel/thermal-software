"""Tests for the build side of PubChem: cache rows → identifiers, sources.json block, missing-cas.txt."""
from __future__ import annotations

import json

from compound_data.pubchem_identifiers import load_pubchem_identifiers, pubchem_identifier
from compound_data.writers import write_compound_sources, write_missing_cas
from pubchem.parsers.cas_list import read_cas_list
from pubchem.pubchem_cache_writer import write_pubchem_cache
from pubchem.pubchem_result import PubchemResult

DAY = "2026-10-12"
AL4C3 = {"CID": 16685054, "MolecularFormula": "C3Al4", "MolecularWeight": "143.96", "SMILES": "[C-4].[Al+3]",
         "InChIKey": "CAVCGVPGBKGDTG-UHFFFAOYSA-N", "IUPACName": "tetraaluminum;methanetetrayl",
         "Title": "Aluminum carbide (Al4C3)"}


class TestIdentifiers:
    def test_ok_row_becomes_identifier(self):
        identifier = pubchem_identifier(PubchemResult.from_properties("1299-86-1", [AL4C3], DAY), 7)
        assert (identifier.formula, identifier.cid, identifier.name) == ("C3Al4", 16685054, "Aluminum carbide (Al4C3)")
        assert identifier.source.to_ref() == [7, "idPubchemRest"]
        assert identifier.source.url == "https://pubchem.ncbi.nlm.nih.gov/compound/16685054"

    def test_charged_row_is_not_an_identifier(self):
        result = PubchemResult.from_properties("22537-22-0", [{"CID": 888, "MolecularFormula": "Mg+2"}], DAY)
        assert pubchem_identifier(result, 2) is None

    def test_only_missing_ok_rows_become_identifiers(self, tmp_path):
        path = tmp_path / "pubchem-cas.tsv"
        write_pubchem_cache(path, [
            PubchemResult.from_properties("1299-86-1", [AL4C3], DAY),
            PubchemResult.from_properties("22537-22-0", [{"CID": 888, "MolecularFormula": "Mg+2"}], DAY),
            PubchemResult.from_properties("75-20-7", [], DAY),
        ])
        found, counts, issues = load_pubchem_identifiers(path, {"1299-86-1", "22537-22-0", "75-20-7", "9999-99-9"})
        assert list(found) == ["1299-86-1"]
        assert counts == {"pubchemCharged": 1, "pubchemNotFetched": 1, "pubchemNotFound": 1, "pubchemOk": 1}
        assert sorted(i["issue"] for i in issues) == ["pubchemCharged", "pubchemNotFound"]

    def test_missing_cache(self, tmp_path):
        found, counts, issues = load_pubchem_identifiers(tmp_path / "none.tsv", {"1299-86-1"})
        assert (found, counts, issues) == ({}, {"pubchemNotFetched": 1}, [])


class TestSources:
    def test_sources_block(self, tmp_path, chem):
        cache = "shared/sources/compound-data/pubchem/pubchem-cas.tsv"
        data = json.loads(write_compound_sources(tmp_path, chem, DAY, None, cache).read_text(encoding="utf-8"))
        assert data["files"]["idPubchemRest"] == {"name": "PubChem REST", "path": cache, "ref": None, "url": None}
        assert data["pubchem"]["compoundUrl"] == "https://pubchem.ncbi.nlm.nih.gov/compound/{cid}"

    def test_no_sources_block_without_cache(self, tmp_path, chem):
        data = json.loads(write_compound_sources(tmp_path, chem, DAY).read_text(encoding="utf-8"))
        assert "pubchem" not in data and "idPubchemRest" not in data["files"]


def test_missing_cas_list_is_read_by_the_pubchem_step(tmp_path):
    path = write_missing_cas(tmp_path / "missing-cas.txt", ["75-20-7", "1299-86-1"], DAY)
    assert path.read_text(encoding="utf-8").startswith("# CAS numbers")
    assert read_cas_list(path) == ["1299-86-1", "75-20-7"]
