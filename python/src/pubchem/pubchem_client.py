"""
pubchem.pubchem_client — Look up CAS numbers in PubChem PUG REST without pushing a busy server.

``GET {PUBCHEM_API}/compound/name/{CAS}/property/<PUBCHEM_PROPERTIES>/JSON``: PubChem resolves a CAS
through its synonyms, so one CAS can give several compounds. One request per CAS, paced as follows:

  * requests are spaced by ``delay`` (default ``PUBCHEM_DELAY``; PubChem allows 5/s and 400/min);
  * ``X-Throttling-Control`` on every answer: Yellow → ≥ 1 s between requests, Red → ≥ 5 s,
    Green → back to ``delay``;
  * Black or HTTP 403 → ``PubchemBlockedError`` at once (the caller saves and stops);
  * 503 / 429 / other 5xx / network failure → ``on_pause`` (the caller saves what it has), pause
    ``Retry-After`` or ``busy_pause`` × 1, 2, 4 … then ask for the *same* CAS again; still refused after
    ``max_pauses`` pauses → ``PubchemBlockedError``.

A refused CAS is never skipped in favour of the next one. Adapted from
legacy/python_scripts/data_enrichment/pubchem_api_client.py without ``requests`` (not in the image).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Callable, Optional
from urllib.parse import quote

from pubchem.constants.pubchem import (
    PUBCHEM_API, PUBCHEM_BUSY_PAUSE, PUBCHEM_DELAY, PUBCHEM_MAX_PAUSES, PUBCHEM_PROPERTIES,
    PUBCHEM_THROTTLE_DELAYS,
)
from pubchem.pubchem_blocked_error import PubchemBlockedError
from pubchem.pubchem_response import PubchemResponse
from pubchem.pubchem_result import PubchemResult
from pubchem.pubchem_throttle import throttle_level
from pubchem.pubchem_transient_error import PubchemTransientError

logger = logging.getLogger(__name__)

_USER_AGENT = "thermal-software pubchem client (CAS identifier lookups, paced by X-Throttling-Control)"


class PubchemClient:
    """CAS → ``PubchemResult``.

    ``fetch`` (URL → ``PubchemResponse``, ``PubchemTransientError`` without an answer) and ``sleep``
    can be replaced in tests. ``on_pause`` is called before every busy pause.
    """

    def __init__(
        self, fetch: Optional[Callable[[str], PubchemResponse]] = None, delay: float = PUBCHEM_DELAY,
        timeout: float = 30.0, busy_pause: float = PUBCHEM_BUSY_PAUSE, max_pauses: int = PUBCHEM_MAX_PAUSES,
        sleep: Callable[[float], None] = time.sleep, on_pause: Optional[Callable[[], None]] = None,
    ) -> None:
        self._fetch = fetch or self._http
        self._base_delay = delay
        self._delay = delay
        self._timeout = timeout
        self._busy_pause = busy_pause
        self._max_pauses = max_pauses
        self._sleep = sleep
        self._on_pause = on_pause
        self._last = 0.0
        self.level: Optional[str] = None

    @property
    def delay(self) -> float:
        """Current spacing between requests (raised by Yellow / Red / busy answers)."""
        return self._delay

    def lookup(self, cas: str) -> Optional[PubchemResult]:
        """Result for ``cas``; None for an unexpected 4xx answer (not cached, asked again next run).

        Raises ``PubchemBlockedError`` when PubChem blocks or keeps refusing.
        """
        url = f"{PUBCHEM_API}/compound/name/{quote(cas)}/property/{','.join(PUBCHEM_PROPERTIES)}/JSON"
        for pause_no in range(self._max_pauses + 1):
            self._wait()
            response: Optional[PubchemResponse] = None
            try:
                response = self._fetch(url)
            except PubchemTransientError as exc:
                reason = str(exc)
            else:
                reason = f"HTTP {response.status}"
                self._adapt(response.throttling)
                if response.status == 403 or self.level == "Black":
                    raise PubchemBlockedError(f"{cas}: {reason}, X-Throttling-Control: {response.throttling or '-'}")
                if response.status in (200, 404):
                    retrieved = datetime.now(timezone.utc).date().isoformat()
                    properties = (response.data or {}).get("PropertyTable", {}).get("Properties", [])
                    return PubchemResult.from_properties(cas, properties, retrieved)
                if response.status != 429 and response.status < 500:
                    logger.warning("[pubchem] %s: %s — not cached", cas, reason)
                    return None
            self._delay = max(self._delay, PUBCHEM_THROTTLE_DELAYS["Yellow"])
            if pause_no == self._max_pauses:
                break
            pause = response.retry_after if response and response.retry_after else self._busy_pause * 2 ** pause_no
            logger.warning("[pubchem] %s: %s — PubChem busy, pausing %.0f s before asking again", cas, reason, pause)
            if self._on_pause is not None:
                self._on_pause()
            self._sleep(pause)
        raise PubchemBlockedError(f"{cas}: {reason} after {self._max_pauses} pauses")

    def _adapt(self, header: Optional[str]) -> None:
        level = throttle_level(header)
        if level is None:
            return
        delay = max(self._base_delay, PUBCHEM_THROTTLE_DELAYS.get(level, 0.0))
        if level != self.level:
            logger.info("[pubchem] Throttling %s → %.2f s between requests (%s)", level, delay, header)
        self.level, self._delay = level, delay

    def _wait(self) -> None:
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
            return PubchemResponse(exc.code, None, headers.get("X-Throttling-Control"),
                                   _seconds(headers.get("Retry-After")))
        except (urllib.error.URLError, TimeoutError, ConnectionError) as exc:
            raise PubchemTransientError(str(exc)) from exc


def _seconds(value: Optional[str]) -> Optional[float]:
    try:
        return float(value) if value else None
    except ValueError:
        return None
