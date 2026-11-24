"""Tests for the PubChem client: request URL, throttling levels, pauses on busy answers, stopping on blocks."""
from __future__ import annotations

import pytest
from pubchem_fixtures import AL4C3

from pubchem.constants.pubchem import PUBCHEM_OVERLOADED_PAUSE_MULTIPLIER, PUBCHEM_PROPERTIES
from pubchem.pubchem_blocked_error import PubchemBlockedError
from pubchem.pubchem_client import PubchemClient
from pubchem.pubchem_query import PubchemQuery
from pubchem.pubchem_response import PubchemResponse
from pubchem.pubchem_result import PubchemResult
from pubchem.pubchem_throttle import throttle_level, throttle_statuses
from pubchem.pubchem_transient_error import PubchemTransientError


def _throttling(count="Green", time_="Green", service="Green"):
    return f"Request Count status: {count} (10%), Request Time status: {time_} (5%), Service status: {service} (23%)"


FOUND = PubchemResponse(200, {"PropertyTable": {"Properties": [AL4C3]}}, _throttling())
OVERLOADED_PAUSE = 60 * PUBCHEM_OVERLOADED_PAUSE_MULTIPLIER


def _client(answers, **kwargs):
    """Client over a scripted list of answers; returns (client, requested urls, sleeps)."""
    queue, urls, sleeps = list(answers), [], []

    def fetch(url):
        urls.append(url)
        answer = queue.pop(0)
        if isinstance(answer, Exception):
            raise answer
        return answer

    return PubchemClient(fetch=fetch, delay=0, sleep=sleeps.append, **kwargs), urls, sleeps


def _lookup(client: PubchemClient, cas: str):
    """Result of a CAS query, None when the client gave no answer."""
    query = PubchemQuery.cas(cas)
    answer = client.answer(query)
    return PubchemResult.from_answer(query, answer) if answer is not None else None


class TestThrottleLevel:
    def test_worst_status_wins(self):
        assert throttle_level(_throttling()) == "Green"
        assert throttle_level(_throttling(time_="Yellow")) == "Yellow"
        assert throttle_level(_throttling(count="Red", service="Yellow")) == "Red"
        assert throttle_level(_throttling(service="Black")) == "Black"

    def test_missing_header(self):
        assert throttle_level(None) is None
        assert throttle_level("garbage") is None
        assert throttle_statuses(None) == {}

    def test_statuses_per_counter(self):
        assert throttle_statuses(_throttling(time_="Yellow", service="Black")) == {
            "Request Count": "Green", "Request Time": "Yellow", "Service": "Black"}


class TestClient:
    def test_found_and_url(self):
        client, urls, sleeps = _client([FOUND])
        query = PubchemQuery.cas("1299-86-1")
        assert _lookup(client, "1299-86-1").status == "ok"
        assert urls == [query.request_url]
        assert query.url.startswith(query.request_url + "#lookup=")
        assert len(PUBCHEM_PROPERTIES) == 16 and {"InChI", "ConnectivitySMILES", "XLogP", "IsotopeAtomCount"} <= set(PUBCHEM_PROPERTIES)
        assert sleeps == [] and client.level == "Green"

    def test_cas_falls_back_to_xref_and_substance(self):
        not_found = PubchemResponse(404, {"Fault": {"Code": "PUGREST.NotFound"}})
        xref = PubchemResponse(200, {"IdentifierList": {"CID": [176530417]}})
        substance = PubchemResponse(200, {"InformationList": {"Information": [
            {"SID": 1}, {"SID": 2, "CID": [176530417]},
        ]}})
        props = PubchemResponse(200, {"PropertyTable": {"Properties": [
            {"CID": 176530417, "MolecularFormula": "Br2CaH-", "Title": "Calcium;hydride;dibromide"},
        ]}})
        client, urls, _ = _client([not_found, xref, substance, substance, props])
        answer = client.answer(PubchemQuery.cas("10024-43-8"))
        assert answer is not None and answer.http_status == 200
        assert answer.resolved_via == "compound/xref/RN+substance/name+substance/xref/RN"
        assert answer.cids == [176530417]
        assert "xref/RN/10024-43-8/cids" in urls[1]
        assert urls[-1] == PubchemQuery.cas("10024-43-8").properties_url_for_cids([176530417])
        assert answer.url == PubchemQuery.cas("10024-43-8").url

    def test_cas_still_not_found_after_all_routes(self):
        empty = PubchemResponse(404, {"Fault": {"Code": "PUGREST.NotFound"}})
        client, urls, _ = _client([empty, empty, empty, empty])
        answer = client.answer(PubchemQuery.cas("75-20-7"))
        assert answer is not None and answer.http_status == 404 and answer.resolved_via is None
        assert len(urls) == 4

    def test_each_attempt_is_logged(self, caplog):
        client, _, _ = _client([PubchemResponse(503), FOUND], busy_pause=60)
        with caplog.at_level("INFO"):
            assert _lookup(client, "1299-86-1").status == "ok"
        lines = [r.getMessage() for r in caplog.records if "throttling" in r.getMessage() and " in " in r.getMessage()]
        assert len(lines) == 2
        assert "HTTP 503" in lines[0] and "1299-86-1" in lines[0]
        assert "HTTP 200" in lines[1] and "throttling Green" in lines[1]

    def test_full_answer_is_attached(self):
        client, urls, _ = _client([FOUND])
        query = PubchemQuery.cas("1299-86-1")
        answer = client.answer(query)
        assert (answer.http_status, answer.url, answer.body) == (200, query.url, FOUND.data)
        assert answer.fetched_url == urls[0] and answer.resolved_via == "compound/name"
        assert answer.retrieved.endswith("+00:00")

    def test_experimental_properties_of_a_cid(self):
        section = {
            "Record": {
                "RecordNumber": 16685054,
                "Reference": [{"ReferenceNumber": 1, "SourceName": "CAMEO Chemicals", "SourceID": "8234",
                               "Name": "x", "Description": "d", "ANID": 1}],
                "Section": [{"TOCHeading": "Experimental Properties", "Section": [
                    {"TOCHeading": "Melting Point", "Information": [
                        {"ReferenceNumber": 1, "Value": {"StringWithMarkup": [{"String": "825 °C"}]}}]}]}],
            },
        }
        client, urls, _ = _client([PubchemResponse(200, section, _throttling())])
        answer = client.experimental(16685054)
        assert urls == ["https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/16685054/JSON"
                        "?heading=Experimental+Properties"]
        assert (answer.cid, answer.http_status, answer.url, answer.body) == (16685054, 200, urls[0], None)
        assert answer.values[0].heading == "Melting Point"
        assert answer.values[0].citation[0].text == "825 °C"
        assert answer.values[0].citation[0].values[0].number == 825
        assert answer.values[0].citation[0].values[0].unit == "°C"
        assert answer.values[0].citation[0].ref_code == "CAMEO-8234"
        assert answer.references[0]["refCode"] == "CAMEO-8234"
        assert "page" not in answer.references[0]

    def test_cas_section_of_a_cid(self):
        client, urls, _ = _client([PubchemResponse(200, {"Record": {}}, _throttling())])
        assert client.cas_numbers(166738).cid == 166738
        assert urls == ["https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/166738/JSON?heading=CAS"]

    def test_formula_query_url(self):
        client, urls, _ = _client([FOUND])
        client.answer(PubchemQuery.formula("Ag2S"))
        assert urls[0].startswith("https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastformula/Ag2S/property/")

    def test_experimental_404_is_kept_and_busy_pauses(self):
        fault = {"Fault": {"Code": "PUGVIEW.NotFound"}}
        client, urls, sleeps = _client([PubchemResponse(503), PubchemResponse(404, fault)], busy_pause=60)
        answer = client.experimental(1)
        assert (answer.http_status, answer.body, answer.values) == (404, None, ())
        assert len(urls) == 2 and [s for s in sleeps if s >= 10] == [60]

    def test_404_is_not_found(self):
        fault = {"Fault": {"Code": "PUGREST.NotFound", "Message": "No CID found"}}
        empty = PubchemResponse(404, fault, _throttling())
        client, urls, _ = _client([empty, empty, empty, empty])
        result = _lookup(client, "75-20-7")
        assert result.status == "notFound"
        assert (result.answer.http_status, result.answer.body) == (404, fault)
        assert len(urls) == 4

    def test_yellow_and_red_slow_down_green_restores(self):
        client, _, _ = _client([
            PubchemResponse(200, None, _throttling(time_="Yellow")),
            PubchemResponse(200, None, _throttling(count="Red")),
            FOUND,
        ])
        _lookup(client, "1-1-1")
        assert (client.level, client.delay) == ("Yellow", 1.0)
        _lookup(client, "2-2-2")
        assert (client.level, client.delay) == ("Red", 5.0)
        _lookup(client, "1299-86-1")
        assert (client.level, client.delay) == ("Green", 0)

    def test_busy_pauses_then_asks_same_cas_again(self):
        client, urls, sleeps = _client([PubchemResponse(503), PubchemTransientError("timed out"), FOUND],
                                       busy_pause=60)
        assert _lookup(client, "1299-86-1").status == "ok"
        assert len(set(urls)) == 1 and len(urls) == 3
        assert [s for s in sleeps if s >= 10] == [60, 120]

    def test_on_pause_runs_before_every_pause(self):
        events = []
        answers = [PubchemResponse(429), PubchemResponse(503), FOUND]
        client = PubchemClient(fetch=lambda url: answers.pop(0), delay=0, busy_pause=60,
                               sleep=lambda s: events.append(s) if s >= 10 else None,
                               on_pause=lambda: events.append("save"))
        assert _lookup(client, "1299-86-1").status == "ok"
        assert events == ["save", 60, "save", 120]

    def test_block_does_not_pause(self):
        events = []
        client, _, _ = _client([PubchemResponse(403)], on_pause=lambda: events.append("save"))
        with pytest.raises(PubchemBlockedError):
            _lookup(client, "1299-86-1")
        assert events == []

    def test_retry_after_is_honoured(self):
        client, _, sleeps = _client([PubchemResponse(429, retry_after=17.0), FOUND])
        _lookup(client, "1299-86-1")
        assert 17.0 in sleeps

    def test_busy_slows_following_requests(self):
        client, _, _ = _client([PubchemResponse(503), PubchemResponse(200)])
        _lookup(client, "75-20-7")
        assert client.delay == 1.0

    def test_still_busy_after_max_wait_stops_the_run(self):
        client, urls, sleeps = _client([PubchemResponse(503)] * 4, busy_pause=60, max_wait=420)
        with pytest.raises(PubchemBlockedError, match="after 7 min of pauses"):
            _lookup(client, "1299-86-1")
        assert len(urls) == 4
        assert [s for s in sleeps if s >= 10] == [60, 120, 240]

    def test_answer_from_a_server_not_busy_resets_the_wait(self):
        client, _, sleeps = _client([PubchemResponse(503), FOUND, PubchemResponse(503), FOUND],
                                    busy_pause=60, max_wait=100)
        _lookup(client, "1299-86-1")
        _lookup(client, "1299-86-1")
        assert [s for s in sleeps if s >= 10] == [60, 60]

    def test_busy_pause_growth_is_capped(self):
        client, _, sleeps = _client([PubchemResponse(503)] * 5 + [FOUND], busy_pause=60,
                                    busy_pause_max_multiplier=4)
        assert _lookup(client, "1299-86-1").status == "ok"
        assert [s for s in sleeps if s >= 10] == [60, 120, 240, 240, 240]

    def test_service_overloaded_answer_is_kept_and_next_request_waits(self):
        events = []
        empty = PubchemResponse(404)
        answers = [PubchemResponse(404, None, _throttling(service="Black")), empty, empty, empty, FOUND]
        client = PubchemClient(fetch=lambda url: answers.pop(0), delay=0, busy_pause=60,
                               sleep=lambda s: events.append(s) if s >= 10 else None,
                               on_pause=lambda: events.append("save"))
        assert _lookup(client, "54251-09-1").status == "notFound"
        assert events == ["save", OVERLOADED_PAUSE]
        assert _lookup(client, "1299-86-1").status == "ok"
        assert events == ["save", OVERLOADED_PAUSE]

    def test_service_overloaded_error_is_asked_again_after_the_overloaded_pause(self):
        client, urls, sleeps = _client([PubchemResponse(503, None, _throttling(service="Black")), FOUND],
                                       busy_pause=60)
        assert _lookup(client, "1299-86-1").status == "ok"
        assert len(urls) == 2 and [s for s in sleeps if s >= 10] == [OVERLOADED_PAUSE]

    def test_service_overloaded_counts_towards_max_wait(self):
        overloaded = PubchemResponse(200, None, _throttling(service="Black"))
        client, urls, _ = _client([overloaded] * 3, busy_pause=60, max_wait=OVERLOADED_PAUSE * 1.5)
        _lookup(client, "1-1-1")
        _lookup(client, "2-2-2")
        with pytest.raises(PubchemBlockedError, match="max wait"):
            _lookup(client, "3-3-3")
        assert len(urls) == 2

    @pytest.mark.parametrize("answer", [
        PubchemResponse(403),
        PubchemResponse(503, None, _throttling(count="Black")),
        PubchemResponse(200, None, _throttling(time_="Black")),
    ])
    def test_block_stops_at_once(self, answer):
        client, urls, sleeps = _client([answer, FOUND])
        with pytest.raises(PubchemBlockedError):
            _lookup(client, "1299-86-1")
        assert len(urls) == 1 and sleeps == []

    def test_other_client_error_is_not_cached(self):
        client, _, sleeps = _client([PubchemResponse(400)])
        assert _lookup(client, "bad") is None and sleeps == []
