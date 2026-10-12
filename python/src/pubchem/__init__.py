"""
pubchem — Polite PubChem PUG REST lookups of CAS numbers with a resumable local cache.

Independent of the compound data build: it reads a CAS list (one per line) and writes the cache
``shared/sources/compound-data/pubchem/pubchem-cas.tsv``; the build reads the cache offline.
Requests are paced by PubChem's ``X-Throttling-Control`` header; a block stops the run.

Sub-modules
-----------
  pubchem.pubchem_client           — PubchemClient (pacing, throttling, pauses)
  pubchem.pubchem_throttle         — throttle_level (worst status of X-Throttling-Control)
  pubchem.pubchem_result           — PubchemResult (ok / notFound / ambiguous / charged, cache row)
  pubchem.pubchem_response         — PubchemResponse (HTTP status, JSON, throttling headers)
  pubchem.pubchem_blocked_error    — PubchemBlockedError (the run must stop)
  pubchem.pubchem_transient_error  — PubchemTransientError (no answer; pause and ask again)
  pubchem.parsers.cas_list         — read_cas_list
  pubchem.parsers.pubchem_cache    — read_pubchem_cache
  pubchem.pubchem_cache_writer     — write_pubchem_cache
  pubchem.constants.pubchem        — endpoints, properties, cache columns, pacing

Spec
----
  docs/scripts/COMPOUND_DATA_SPEC.md
"""

from pubchem.parsers.cas_list        import read_cas_list
from pubchem.parsers.pubchem_cache   import read_pubchem_cache
from pubchem.pubchem_blocked_error   import PubchemBlockedError
from pubchem.pubchem_cache_writer    import write_pubchem_cache
from pubchem.pubchem_client          import PubchemClient
from pubchem.pubchem_result          import PubchemResult

__all__ = [
    "PubchemBlockedError",
    "PubchemClient",
    "PubchemResult",
    "read_cas_list",
    "read_pubchem_cache",
    "write_pubchem_cache",
]
