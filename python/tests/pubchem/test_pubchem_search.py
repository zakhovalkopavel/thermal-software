"""Tests for PubChem searches: query kinds, the formula rule, the CAS of a found compound, search records,
fetching only what a record lacks, the on-demand searcher and the text summary."""
from __future__ import annotations

import json

import pytest
from pubchem_fixtures import AG2S, AL4C3, DAY, RETRIEVED, pubchem_record, search_record, section_body, view

from pubchem.cas_number import is_cas
from pubchem.parsers.formula_compounds import read_formula_compounds
from pubchem.parsers.pubchem_records import read_pubchem_lines, read_pubchem_records
from pubchem.pubchem_answer import PubchemAnswer
from pubchem.pubchem_fetch import fetch_pubchem_record
from pubchem.pubchem_query import PubchemQuery
from pubchem.pubchem_record import PubchemRecord
from pubchem.pubchem_record_summary import experimental_values, record_headline, record_summary
from pubchem.pubchem_records_writer import append_pubchem_record
from pubchem.pubchem_result import PubchemResult
from pubchem.pubchem_searcher import PubchemSearcher
from pubchem.pubchem_view import PubchemView
from pubchem.pubchem_view_text import view_strings

AG2S_ION = {"CID": 9, "MolecularFormula": "Ag2S+2", "Charge": 2}
AG2S_ISOTOPE = {"CID": 10, "MolecularFormula": "Ag2S", "IsotopeAtomCount": 1}
AG2S_DUPLICATE = {"CID": 22981889, "MolecularFormula": "Ag2S", "AnnotationTypeCount": 1, "LiteratureCount": 0}
CAS_BODY = section_body("CAS", ["21548-73-2", "12249-63-7", "21548-73-2"], 166738)
MELTING_BODY = section_body("Melting Point", ["825 °C", "825 °C", "1517 °F"], 166738)


class TestCasNumber:
    @pytest.mark.parametrize("text", ["7647-14-5", "21548-73-2", "12042-68-1"])
    def test_valid(self, text):
        assert is_cas(text)

    @pytest.mark.parametrize("text", ["7647-14-4", "CaO", "1-1-1", "7647145", ""])
    def test_invalid(self, text):
        assert not is_cas(text)


class TestQuery:
    def test_parse_picks_the_kind(self):
        assert PubchemQuery.parse("12042-68-1") == PubchemQuery("12042-68-1", "cas", "12042-68-1")
        assert PubchemQuery.parse("CaAl2O4") == PubchemQuery("formula:Al2CaO4", "formula", "CaAl2O4", "Al2CaO4")
        assert PubchemQuery.parse("2KCN·Zn(CN)2").key == "formula:C4K2N4Zn"
        assert PubchemQuery.parse("Silver  Sulfide") == PubchemQuery("name:silver sulfide", "name", "Silver Sulfide")

    def test_bad_check_digit_is_a_name(self):
        assert PubchemQuery.parse("12042-68-2").by == "name"

    def test_by_overrides_the_guess(self):
        assert PubchemQuery.parse("CaO", "name").key == "name:cao"
        with pytest.raises(ValueError):
            PubchemQuery.parse("silver sulfide", "formula")

    @pytest.mark.parametrize("text", ["K3AlF6·3.5H2O", "Cu0.75Fe2.25O4", "Al2Cl6·1.5ZnCl2"])
    def test_fractional_formula_is_refused(self, text):
        with pytest.raises(ValueError, match="fractional"):
            PubchemQuery.formula(text)

    def test_urls(self):
        assert "/compound/fastformula/Ag2S/property/" in PubchemQuery.formula("Ag2S").url
        assert "/compound/name/silver%20sulfide/property/" in PubchemQuery.name("silver sulfide").url

    def test_from_key_inverts_key(self):
        for query in (PubchemQuery.cas("7647-14-5"), PubchemQuery.formula("Ag2S")):
            assert PubchemQuery.from_key(query.key) == query


class TestFormulaSearch:
    def test_ions_and_isotopes_are_not_candidates(self):
        result = PubchemResult.from_formula_search([AG2S_ION, AG2S_ISOTOPE, AG2S], DAY, "Ag2S")
        assert (result.status, result.cid, result.cas, result.candidates) == ("ok", 166738, None, [])

    def test_best_annotated_of_several_inorganic(self):
        result = PubchemResult.from_formula_search([AG2S_DUPLICATE, AG2S], DAY, "Ag2S")
        assert (result.status, result.cid) == ("ok", 166738)
        assert result.candidates == ["22981889:Ag2S", "166738:Ag2S"]

    def test_equal_rank_is_ambiguous(self):
        result = PubchemResult.from_formula_search([AG2S, {**AG2S, "CID": 2}], DAY, "Ag2S")
        assert result.status == "ambiguous" and result.cid is None

    def test_organic_isomers_are_ambiguous(self):
        props = [{"CID": 702, "MolecularFormula": "C2H6O", "LiteratureCount": 9},
                 {"CID": 8254, "MolecularFormula": "C2H6O", "LiteratureCount": 1}]
        assert PubchemResult.from_formula_search(props, DAY, "C2H6O").status == "ambiguous"

    def test_no_neutral_match_is_not_found(self):
        result = PubchemResult.from_formula_search([AG2S_ION], DAY, "Ag2S")
        assert result.status == "notFound" and result.candidates == ["9:Ag2S+2"]

    def test_cas_is_the_most_cited_on_the_chosen_page(self):
        record = search_record("Ag2S", "inorganic", [AG2S], cas_numbers=(view(166738, CAS_BODY),))
        assert record.result.cas == "21548-73-2"
        other = search_record("Ag2S", "inorganic", [AG2S], cas_numbers=(view(5, CAS_BODY),))
        assert other.result.cas is None

    def test_name_query_takes_the_cas_section_too(self):
        query = PubchemQuery.name("silver sulfide")
        answer = PubchemAnswer(RETRIEVED, 200, query.url, {"PropertyTable": {"Properties": [AG2S]}})
        record = PubchemRecord(query, "inorganic", answer, cas_numbers=(view(166738, CAS_BODY),))
        assert (record.result.status, record.result.cas) == ("ok", "21548-73-2")


class TestSearchRecord:
    def test_json_round_trip(self):
        record = search_record("Ag2S", "inorganic", [AG2S_ION, AG2S], experimental=(view(166738, MELTING_BODY),),
                               cas_numbers=(view(166738, CAS_BODY),))
        data = record.to_json()
        assert list(data) == ["key", "search", "class", "properties", "casNumbers", "experimental"]
        assert data["search"] == {"by": "formula", "text": "Ag2S", "hill": "Ag2S"}
        assert PubchemRecord.from_json(json.loads(json.dumps(data))) == record

    def test_cas_record_has_no_search_fields(self):
        assert list(pubchem_record("1299-86-1", "inorganic", [AL4C3]).to_json()) == [
            "cas", "class", "properties", "experimental"]

    def test_experimental_cids_are_the_formula_matches(self):
        record = search_record("Ag2S", "inorganic", [AG2S_ION, AG2S, AG2S_DUPLICATE])
        assert record.experimental_cids == [166738, 22981889]
        assert record.missing_cas_cid == 166738
        done = search_record("Ag2S", "inorganic", [AG2S], cas_numbers=(view(166738, CAS_BODY),))
        assert done.missing_cas_cid is None


class _Client:
    """Scripted client: answers per query key, views per (cid, kind); records every request."""

    def __init__(self, props: dict[str, list[dict]], views: dict[tuple[int, str], dict] | None = None):
        self.props, self.views, self.requests = props, views or {}, []

    def answer(self, query):
        self.requests.append(("answer", query.key))
        props = self.props[query.key]
        body = {"PropertyTable": {"Properties": props}} if props else {"Fault": {}}
        return PubchemAnswer(RETRIEVED, 200 if props else 404, query.url, body)

    def experimental(self, cid):
        self.requests.append(("experimental", cid))
        body = self.views.get((cid, "experimental"))
        status = 200 if body else 404
        return PubchemView.from_experimental_response(cid, "2026-10-14T10:00:00+00:00", status, f"https://x/{cid}", body)

    def cas_numbers(self, cid):
        self.requests.append(("cas", cid))
        body = self.views.get((cid, "cas"))
        return view(cid, body, 200 if body else 404)


class TestFetch:
    def test_new_formula_query_asks_answer_cas_and_experimental(self):
        client = _Client({"formula:Ag2S": [AG2S]}, {(166738, "cas"): CAS_BODY, (166738, "experimental"): MELTING_BODY})
        record = fetch_pubchem_record(client, PubchemQuery.formula("Ag2S"))
        assert client.requests == [("answer", "formula:Ag2S"), ("cas", 166738), ("experimental", 166738)]
        assert (record.compound_class, record.result.cas) == ("inorganic", "21548-73-2")

    def test_complete_stored_record_asks_nothing(self):
        stored = search_record("Ag2S", "inorganic", [AG2S], experimental=(view(166738, MELTING_BODY),),
                               cas_numbers=(view(166738, CAS_BODY),))
        client = _Client({})
        assert fetch_pubchem_record(client, PubchemQuery.formula("Ag2S"), stored=stored) == stored
        assert client.requests == []

    def test_only_missing_experimental_is_asked(self):
        stored = pubchem_record("1299-86-1", "inorganic", [AL4C3, {**AL4C3, "CID": 1}],
                                experimental=(view(16685054, None, 404),))
        client = _Client({})
        record = fetch_pubchem_record(client, PubchemQuery.cas("1299-86-1"), stored=stored)
        assert client.requests == [("experimental", 1)] and len(record.experimental) == 2

    def test_refresh_and_other_url_ask_again(self):
        stored = pubchem_record("1299-86-1", "inorganic", [AL4C3])
        client = _Client({"1299-86-1": [AL4C3]})
        fetch_pubchem_record(client, PubchemQuery.cas("1299-86-1"), stored=stored, experimental=False, refresh=True)
        moved = PubchemRecord(stored.query, "inorganic", PubchemAnswer(RETRIEVED, 200, "https://old", None))
        fetch_pubchem_record(client, PubchemQuery.cas("1299-86-1"), stored=moved, experimental=False)
        assert client.requests == [("answer", "1299-86-1"), ("answer", "1299-86-1")]

    def test_light_stored_record_is_refused(self):
        data = pubchem_record("1299-86-1", "inorganic", [AL4C3], experimental=(view(16685054, {"Record": {}}),)).to_json()
        with pytest.raises(ValueError):
            fetch_pubchem_record(_Client({}), PubchemQuery.cas("1299-86-1"),
                                 stored=PubchemRecord.from_json(data, experimental=False))

    def test_class_from_the_found_formula(self):
        client = _Client({"formula:C2H6O": [{"CID": 702, "MolecularFormula": "C2H6O"}]})
        record = fetch_pubchem_record(client, PubchemQuery.formula("C2H6O"), experimental=False)
        assert record.compound_class == "organic"
        empty = fetch_pubchem_record(_Client({"name:x": []}), PubchemQuery.name("x"), experimental=False)
        assert empty.compound_class == "unclassified"


class TestSearcher:
    def test_search_stores_once_and_reuses(self, tmp_path):
        client = _Client({"formula:Ag2S": [AG2S]}, {(166738, "cas"): CAS_BODY, (166738, "experimental"): MELTING_BODY})
        searcher = PubchemSearcher(tmp_path, client)
        record = searcher.search("Ag2S")
        assert (record.result.cas, searcher.requested) == ("21548-73-2", 1)
        again = PubchemSearcher(tmp_path, client)
        assert again.search("Ag2S") == record and again.requested == 0
        assert len(client.requests) == 3
        assert read_pubchem_records(searcher.files.values())["formula:Ag2S"][1] == searcher.files["inorganic"]

    def test_stored_record_has_experimental_values(self, tmp_path):
        client = _Client({"formula:Ag2S": [AG2S]}, {(166738, "experimental"): MELTING_BODY})
        PubchemSearcher(tmp_path, client).search("Ag2S")
        stored = PubchemSearcher(tmp_path, _Client({})).stored("formula:Ag2S")
        assert stored.experimental[0].body is None
        cites = stored.experimental[0].values[0].citation
        assert [c.text for c in cites] == ["825 °C", "825 °C", "1517 °F"]
        assert [(c.values[0].number, c.values[0].unit) for c in cites] == [
            (825.0, "°C"), (825.0, "°C"), (1517.0, "°F"),
        ]


class TestText:
    def test_view_strings_under_a_heading(self):
        assert view_strings(MELTING_BODY, "Melting Point") == ["825 °C", "825 °C", "1517 °F"]
        assert view_strings(MELTING_BODY, "Density") == []
        assert view_strings(None) == []

    def test_numbers_with_units(self):
        body = {"Record": {"Section": [{"TOCHeading": "Density", "Information": [
            {"Value": {"Number": [7.23], "Unit": "g/cm³"}}]}]}}
        assert view_strings(body, "Density") == ["7.23 g/cm³"]

    def test_summary(self):
        record = search_record("Ag2S", "inorganic", [AG2S], experimental=(view(166738, MELTING_BODY),),
                               cas_numbers=(view(166738, CAS_BODY),))
        assert experimental_values(record, "Melting Point") == ["825 °C", "1517 °F"]
        assert record_headline(record) == ("formula:Ag2S → ok  CID 166738  CAS 21548-73-2  Silver sulfide  Ag2S  "
                                           "247.8 g/mol")
        assert record_summary(record)[1:] == ["  Melting Point: 825 °C | 1517 °F",
                                              "  https://pubchem.ncbi.nlm.nih.gov/compound/166738"]

    def test_headline_lists_candidates_when_not_ok(self):
        record = search_record("Ag2S", "inorganic", [AG2S, {**AG2S, "CID": 2}])
        assert record_headline(record).endswith("candidates 166738:Ag2S, 2:Ag2S")


def test_read_pubchem_lines_gives_full_records(tmp_path):
    path = tmp_path / "pubchem-inorganic.jsonl"
    first = pubchem_record("1299-86-1", "inorganic", [AL4C3], experimental=(view(16685054, {"Record": {}}),))
    second = search_record("Ag2S", "inorganic", [AG2S])
    append_pubchem_record(path, first)
    append_pubchem_record(path, second)
    assert read_pubchem_lines([(path, 2), (path, 1)]) == {(path, 1): first, (path, 2): second}


def test_formula_compounds_of_the_index(tmp_path):
    path = tmp_path / "index.json"
    path.write_text(json.dumps({"compounds": {
        "7647-14-5": {"hill": "ClNa", "class": "inorganic"},
        "formula:Ag2S": {"hill": "Ag2S", "class": "inorganic"},
        "formula:C2H6O": {"hill": "C2H6O", "class": "organic"},
    }}), encoding="utf-8")
    assert read_formula_compounds(path) == {"Ag2S": "inorganic", "C2H6O": "organic"}
