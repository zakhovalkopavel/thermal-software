"""Tests for the PubChem client: request URL, throttling levels, pauses on busy answers, stopping on blocks."""
from __future__ import annotations

import pytest
from pubchem_fixtures import AL4C3

from pubchem.pubchem_blocked_error import PubchemBlockedError
from pubchem.pubchem_client import PubchemClient
from pubchem.pubchem_response import PubchemResponse
from pubchem.pubchem_throttle import throttle_level
from pubchem.pubchem_transient_error import PubchemTransientError


def _throttling(count="Green", time_="Green", service="Green"):
    return f"Request Count status: {count} (10%), Request Time status: {time_} (5%), Service status: {service} (23%)"


FOUND = PubchemResponse(200, {"PropertyTable": {"Properties": [AL4C3]}}, _throttling())


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


class TestThrottleLevel:
    def test_worst_status_wins(self):
        assert throttle_level(_throttling()) == "Green"
        assert throttle_level(_throttling(time_="Yellow")) == "Yellow"
        assert throttle_level(_throttling(count="Red", service="Yellow")) == "Red"
        assert throttle_level(_throttling(service="Black")) == "Black"

    def test_missing_header(self):
        assert throttle_level(None) is None
        assert throttle_level("garbage") is None


class TestClient:
    def test_found_and_url(self):
        client, urls, sleeps = _client([FOUND])
        assert client.lookup("1299-86-1").status == "ok"
        assert urls == ["https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/1299-86-1/property/"
                        "MolecularFormula,MolecularWeight,SMILES,InChIKey,IUPACName,Title/JSON"]
        assert sleeps == [] and client.level == "Green"

    def test_404_is_not_found(self):
        client, _, _ = _client([PubchemResponse(404, None, _throttling())])
        assert client.lookup("75-20-7").status == "notFound"

    def test_yellow_and_red_slow_down_green_restores(self):
        client, _, _ = _client([
            PubchemResponse(200, None, _throttling(time_="Yellow")),
            PubchemResponse(200, None, _throttling(count="Red")),
            FOUND,
        ])
        client.lookup("1-1-1")
        assert (client.level, client.delay) == ("Yellow", 1.0)
        client.lookup("2-2-2")
        assert (client.level, client.delay) == ("Red", 5.0)
        client.lookup("1299-86-1")
        assert (client.level, client.delay) == ("Green", 0)

    def test_busy_pauses_then_asks_same_cas_again(self):
        client, urls, sleeps = _client([PubchemResponse(503), PubchemTransientError("timed out"), FOUND],
                                       busy_pause=60)
        assert client.lookup("1299-86-1").status == "ok"
        assert len(set(urls)) == 1 and len(urls) == 3
        assert [s for s in sleeps if s >= 10] == [60, 120]

    def test_retry_after_is_honoured(self):
        client, _, sleeps = _client([PubchemResponse(429, retry_after=17.0), FOUND])
        client.lookup("1299-86-1")
        assert 17.0 in sleeps

    def test_busy_slows_following_requests(self):
        client, _, _ = _client([PubchemResponse(503), PubchemResponse(200)])
        client.lookup("75-20-7")
        assert client.delay == 1.0

    def test_still_busy_stops_the_run(self):
        client, urls, sleeps = _client([PubchemResponse(503)] * 4, busy_pause=60, max_pauses=3)
        with pytest.raises(PubchemBlockedError, match="after 3 pauses"):
            client.lookup("1299-86-1")
        assert len(urls) == 4
        assert [s for s in sleeps if s >= 10] == [60, 120, 240]

    @pytest.mark.parametrize("answer", [
        PubchemResponse(403),
        PubchemResponse(503, None, _throttling(count="Black")),
        PubchemResponse(200, None, _throttling(time_="Black")),
    ])
    def test_block_stops_at_once(self, answer):
        client, urls, sleeps = _client([answer, FOUND])
        with pytest.raises(PubchemBlockedError):
            client.lookup("1299-86-1")
        assert len(urls) == 1 and sleeps == []

    def test_other_client_error_is_not_cached(self):
        client, _, sleeps = _client([PubchemResponse(400)])
        assert client.lookup("bad") is None and sleeps == []
