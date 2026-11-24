"""
pubchem.pubchem_client — Ask PubChem PUG REST / PUG View without pushing a busy server.

``answer``: the property request of a ``PubchemQuery`` (``compound/name/{CAS or name}`` or
``compound/fastformula/{Hill}`` with every ``PUBCHEM_PROPERTIES`` field). For a CAS, when
``compound/name`` 404s, CIDs are collected from ``compound/xref/RN``, ``substance/name`` and
``substance/xref/RN``, then properties are asked by CID. ``view``: one section of a compound page,
``GET {PUBCHEM_VIEW_API}/data/compound/{CID}/JSON?heading=…`` (``experimental`` / ``cas_numbers``).
Every request is paced as follows:

  * requests are spaced by ``delay`` (default ``PUBCHEM_DELAY``; PubChem allows 5/s and 400/min);
  * every attempt is logged at INFO with local time, label, HTTP status or error, duration and
    throttle level;
  * ``X-Throttling-Control`` on every answer: Yellow → ≥ 1 s between requests, Red → ≥ 5 s,
    Green → back to ``delay``;
  * HTTP 403 or Black on a client counter (Request Count, Request Time: this client is blocked) →
    ``PubchemBlockedError`` at once (the caller saves and stops);
  * Black on the Service counter (the whole server is overloaded): a 200 / 404 answer is kept and the
    next request waits ``busy_pause`` × ``PUBCHEM_OVERLOADED_PAUSE_MULTIPLIER``; an error answer is
    asked again after that pause;
  * 503 / 429 / other 5xx / network failure → pause ``Retry-After`` or ``busy_pause`` × 1, 2, 4 …
    (at most × ``busy_pause_max_multiplier``) then make the *same* request again;
  * ``on_pause`` (the caller saves what it has) runs before every pause; pauses in a row longer than
    ``max_wait`` in total → ``PubchemBlockedError``.

A refused request is never skipped in favour of the next one. Adapted from
legacy/python_scripts/data_enrichment/pubchem_api_client.py without ``requests`` (not in the image).

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Callable, Optional
from urllib.parse import quote_plus

from pubchem.cas_cids import cids_from_body
from pubchem.constants.pubchem import (
    PUBCHEM_BUSY_PAUSE, PUBCHEM_BUSY_PAUSE_MAX_MULTIPLIER, PUBCHEM_BY_CAS, PUBCHEM_BY_FORMULA,
    PUBCHEM_CAS_HEADING, PUBCHEM_CAS_LOOKUP_STEPS, PUBCHEM_CLIENT_COUNTERS, PUBCHEM_DELAY,
    PUBCHEM_EXPERIMENTAL_HEADING, PUBCHEM_MAX_WAIT, PUBCHEM_OVERLOADED_PAUSE_MULTIPLIER,
    PUBCHEM_SERVICE_COUNTER, PUBCHEM_THROTTLE_DELAYS, PUBCHEM_VIEW_API,
)
from pubchem.pubchem_answer import PubchemAnswer
from pubchem.pubchem_blocked_error import PubchemBlockedError
from pubchem.pubchem_query import PubchemQuery
from pubchem.pubchem_response import PubchemResponse
from pubchem.pubchem_throttle import throttle_level, throttle_statuses
from pubchem.pubchem_transient_error import PubchemTransientError
from pubchem.pubchem_view import PubchemView

logger = logging.getLogger(__name__)

_USER_AGENT = "thermal-software pubchem client (identifier lookups, paced by X-Throttling-Control)"


class PubchemClient:
    """Query → ``PubchemAnswer``; CID + heading → ``PubchemView``.

    ``fetch`` (URL → ``PubchemResponse``, ``PubchemTransientError`` without an answer) and ``sleep``
    can be replaced in tests. ``on_pause`` is called before every busy pause. ``max_wait`` [s] caps the
    pauses in a row (reset by an answer from a server that is not busy).
    """

    def __init__(
        self, fetch: Optional[Callable[[str], PubchemResponse]] = None, delay: float = PUBCHEM_DELAY,
        timeout: float = 30.0, busy_pause: float = PUBCHEM_BUSY_PAUSE,
        busy_pause_max_multiplier: float = PUBCHEM_BUSY_PAUSE_MAX_MULTIPLIER, max_wait: float = PUBCHEM_MAX_WAIT,
        sleep: Callable[[float], None] = time.sleep, on_pause: Optional[Callable[[], None]] = None,
    ) -> None:
        self._fetch = fetch or self._http
        self._base_delay = delay
        self._delay = delay
        self._timeout = timeout
        self._busy_pause = busy_pause
        self._busy_pause_max_multiplier = busy_pause_max_multiplier
        self._max_wait = max_wait
        self._sleep = sleep
        self._on_pause = on_pause
        self._last = 0.0
        self._waited = 0.0
        self._pauses = 0
        self._pending: Optional[tuple[float, str]] = None
        self.level: Optional[str] = None

    @property
    def delay(self) -> float:
        """Current spacing between requests (raised by Yellow / Red / busy answers)."""
        return self._delay

    def answer(self, query: PubchemQuery) -> Optional[PubchemAnswer]:
        """Property answer of ``query`` (a 404 when PubChem knows nothing); None for an unexpected 4xx
        answer (not stored, asked again next run).

        CAS queries try every ``PUBCHEM_CAS_LOOKUP_STEPS`` route before giving up. Raises
        ``PubchemBlockedError`` when PubChem blocks or keeps refusing.
        """
        if query.by == PUBCHEM_BY_CAS:
            return self._answer_cas(query)
        response = self._request(query.request_url, query.text)
        if response is None:
            return None
        via = "compound/fastformula" if query.by == PUBCHEM_BY_FORMULA else "compound/name"
        return PubchemAnswer(_now(), response.status, query.url, response.data,
                             fetched_url=query.request_url, resolved_via=via)

    def _answer_cas(self, query: PubchemQuery) -> Optional[PubchemAnswer]:
        """``compound/name`` first; on 404, union CIDs from the other CAS lookup steps, then properties by CID."""
        primary = self._request(query.request_url, f"{query.text} compound/name")
        if primary is None:
            return None
        if primary.status == 200:
            return PubchemAnswer(_now(), 200, query.url, primary.data,
                                 fetched_url=query.request_url, resolved_via="compound/name")
        if primary.status != 404:
            return PubchemAnswer(_now(), primary.status, query.url, primary.data, fetched_url=query.request_url)

        cids: list[int] = []
        seen: set[int] = set()
        sources: list[str] = []
        for step in PUBCHEM_CAS_LOOKUP_STEPS:
            if step == "compound/name":
                continue
            response = self._request(query.cas_cids_url(step), f"{query.text} {step}")
            if response is None or response.status == 404:
                continue
            if response.status != 200:
                continue
            found = cids_from_body(response.data)
            if not found:
                continue
            sources.append(step)
            for cid in found:
                if cid not in seen:
                    seen.add(cid)
                    cids.append(cid)

        if not cids:
            return PubchemAnswer(_now(), 404, query.url, primary.data,
                                 fetched_url=query.request_url, resolved_via=None)

        prop_url = query.properties_url_for_cids(cids)
        via = "+".join(sources)
        label = f"{query.text} cid/{','.join(str(c) for c in cids)}"
        props = self._request(prop_url, label)
        if props is None:
            return None
        logger.info("[pubchem] %s: resolved via %s → %d CID(s)", query.text, via, len(cids))
        return PubchemAnswer(_now(), props.status, query.url, props.data, fetched_url=prop_url, resolved_via=via)

    def view(self, cid: int, heading: str) -> Optional[PubchemView]:
        """Section ``heading`` of the page of compound ``cid`` (a 404 when the page has none); None for an
        unexpected 4xx answer. Raises ``PubchemBlockedError`` like ``answer``.
        """
        url = f"{PUBCHEM_VIEW_API}/data/compound/{cid}/JSON?heading={quote_plus(heading)}"
        response = self._request(url, f"CID {cid} {heading}")
        if response is None:
            return None
        return PubchemView(cid, _now(), response.status, url, response.data)

    def experimental(self, cid: int) -> Optional[PubchemView]:
        """"Experimental Properties" of compound ``cid``, stored slim (values + separate references)."""
        raw = self.view(cid, PUBCHEM_EXPERIMENTAL_HEADING)
        if raw is None:
            return None
        return PubchemView.from_experimental_response(raw.cid, raw.retrieved, raw.http_status, raw.url, raw.body)

    def cas_numbers(self, cid: int) -> Optional[PubchemView]:
        """"CAS" section of compound ``cid`` (the CAS numbers each source gives)."""
        return self.view(cid, PUBCHEM_CAS_HEADING)

    def _request(self, url: str, label: str) -> Optional[PubchemResponse]:
        """A 200 or 404 answer; None for another 4xx; pauses and asks again while PubChem is busy."""
        while True:
            self._wait()
            response: Optional[PubchemResponse] = None
            overloaded = False
            started = time.monotonic()
            try:
                response = self._fetch(url)
            except PubchemTransientError as exc:
                reason = str(exc)
                self._log_request(label, reason, time.monotonic() - started)
            else:
                reason = f"HTTP {response.status}"
                statuses = throttle_statuses(response.throttling)
                self._adapt(response.throttling)
                self._log_request(label, reason, time.monotonic() - started)
                if response.status == 403 or any(statuses.get(c) == "Black" for c in PUBCHEM_CLIENT_COUNTERS):
                    raise PubchemBlockedError(f"{label}: {reason}, X-Throttling-Control: {response.throttling or '-'}")
                overloaded = statuses.get(PUBCHEM_SERVICE_COUNTER) == "Black"
                if response.status in (200, 404):
                    if overloaded:
                        self._pending = (self._overloaded_pause(), f"{label}: {reason}, PubChem service overloaded")
                    else:
                        self._waited, self._pauses = 0.0, 0
                    return response
                if response.status != 429 and response.status < 500:
                    logger.warning("[pubchem] %s: %s — not cached", label, reason)
                    return None
            self._delay = max(self._delay, PUBCHEM_THROTTLE_DELAYS["Yellow"])
            if response is not None and response.retry_after:
                pause = response.retry_after
            elif overloaded:
                pause = self._overloaded_pause()
            else:
                pause = self._busy_pause * min(2 ** self._pauses, self._busy_pause_max_multiplier)
            self._pause(pause, f"{label}: {reason}, PubChem busy")

    def _log_request(self, label: str, outcome: str, elapsed: float) -> None:
        """One INFO line per attempt: local time, what was asked, outcome, duration, throttle level."""
        stamp = datetime.now().strftime("%H:%M:%S")
        logger.info("[pubchem] %s %s: %s in %.2f s (throttling %s)",
                    stamp, label, outcome, elapsed, self.level or "-")

    def _overloaded_pause(self) -> float:
        return self._busy_pause * PUBCHEM_OVERLOADED_PAUSE_MULTIPLIER

    def _pause(self, seconds: float, why: str) -> None:
        if self._waited + seconds > self._max_wait:
            raise PubchemBlockedError(f"{why}; still busy after {self._waited / 60:.0f} min of pauses in a row "
                                      f"(max wait {self._max_wait / 60:.0f} min)")
        logger.warning("[pubchem] %s — pausing %.0f s before the next request", why, seconds)
        if self._on_pause is not None:
            self._on_pause()
        self._sleep(seconds)
        self._waited += seconds
        self._pauses += 1

    def _adapt(self, header: Optional[str]) -> None:
        level = throttle_level(header)
        if level is None:
            return
        delay = max(self._base_delay, PUBCHEM_THROTTLE_DELAYS.get(level, 0.0))
        if level != self.level:
            logger.info("[pubchem] Throttling %s → %.2f s between requests (%s)", level, delay, header)
        self.level, self._delay = level, delay

    def _wait(self) -> None:
        if self._pending is not None:
            seconds, why = self._pending
            self._pending = None
            self._pause(seconds, why)
        pause = self._last + self._delay - time.monotonic()
        if pause > 0:
            self._sleep(pause)
        self._last = time.monotonic()

    def _http(self, url: str) -> PubchemResponse:
        request = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(request, timeout=self._timeout) as response:
                return PubchemResponse(response.status, json.load(response),
                                       response.headers.get("X-Throttling-Control"))
        except urllib.error.HTTPError as exc:
            headers = exc.headers or {}
            return PubchemResponse(exc.code, _json_body(exc), headers.get("X-Throttling-Control"),
                                   _seconds(headers.get("Retry-After")))
        except (urllib.error.URLError, TimeoutError, ConnectionError) as exc:
            raise PubchemTransientError(str(exc)) from exc


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _json_body(error: urllib.error.HTTPError) -> Optional[dict[str, Any]]:
    try:
        body = json.load(error)
    except (ValueError, OSError):
        return None
    return body if isinstance(body, dict) else None


def _seconds(value: Optional[str]) -> Optional[float]:
    try:
        return float(value) if value else None
    except ValueError:
        return None
