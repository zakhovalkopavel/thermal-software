"""Tests for PubChem answer statuses, the identifier cache file and the CAS list."""
from __future__ import annotations

from pubchem_fixtures import AL4C3, DAY

from pubchem.parsers.cas_list import read_cas_list
from pubchem.parsers.pubchem_cache import read_pubchem_cache
from pubchem.pubchem_cache_writer import write_pubchem_cache
from pubchem.pubchem_result import PubchemResult


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


class TestCache:
    def test_round_trip_sorted_by_cas(self, tmp_path):
        path = tmp_path / "pubchem" / "pubchem-cas.tsv"
        results = [
            PubchemResult.from_properties("75-20-7", [], DAY),
            PubchemResult.from_properties("1299-86-1", [AL4C3, {**AL4C3, "CID": 1}], DAY),
        ]
        write_pubchem_cache(path, results)
        lines = path.read_text(encoding="utf-8").splitlines()
        assert lines[0].startswith("CAS\tstatus\tCID")
        cache = read_pubchem_cache(path)
        assert [(cas, line) for cas, (_, line) in cache.items()] == [("1299-86-1", 2), ("75-20-7", 3)]
        assert cache["1299-86-1"][0] == results[1]
        assert cache["75-20-7"][0] == results[0]

    def test_missing_cache_is_empty(self, tmp_path):
        assert read_pubchem_cache(tmp_path / "none.tsv") == {}


def test_cas_list_skips_comments_blanks_and_duplicates(tmp_path):
    path = tmp_path / "missing-cas.txt"
    path.write_text("# header\n1299-86-1\n\n75-20-7  # comment\n1299-86-1\n", encoding="utf-8")
    assert read_cas_list(path) == ["1299-86-1", "75-20-7"]
