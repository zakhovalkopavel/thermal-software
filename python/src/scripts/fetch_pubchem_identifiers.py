#!/usr/bin/env python3
"""
fetch_pubchem_identifiers.py — CLI entry point, second step of the compound data build: look up in
PubChem the CAS numbers the build could not identify and keep the answers in a local cache.

Step 1 (make compound-data-build) is offline and writes the CAS list; this step is slow (PubChem
allows about 4 requests per second) and resumable; the next build reads the cache.

Input
-----
  tmp/reports/python/compound-data/missing-cas.txt — one CAS per line, written by the build
                                            (CAS numbers missing from the chemicals identifier files)
  PubChem PUG REST                        — https://pubchem.ncbi.nlm.nih.gov/rest/pug
                                            compound/name/{CAS}/property/.../JSON

Output
------
  shared/sources/compound-data/pubchem/pubchem-cas.tsv — one row per CAS: status (ok, notFound,
                                            ambiguous, charged), CID, formula, MW, SMILES, InChIKey,
                                            IUPAC name, title, candidates (CID:formula), retrieved date

Already cached CAS numbers are skipped, so an interrupted run continues where it stopped; the cache
is saved every --save-every lookups, before every busy pause and when the run stops. --retry
re-queries cached rows with the given statuses.

Politeness: one request per CAS, spaced by --delay and slowed down when PubChem's
X-Throttling-Control turns Yellow or Red. When PubChem is busy the same CAS is asked again after
growing pauses (PUBCHEM_BUSY_PAUSE × 1, 2, 4); a block (403, Black) or a server still busy after
those pauses stops the run with exit code 2 — the cache is saved, run again later.

Implementation
--------------
  pubchem.parsers.cas_list  — read_cas_list
  pubchem.pubchem_client    — PubchemClient (pacing, throttling, pauses)

Spec
----
  docs/scripts/COMPOUND_DATA_SPEC.md

Usage
-----
  docker compose run --rm python python src/scripts/fetch_pubchem_identifiers.py
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def _build_parser() -> argparse.ArgumentParser:
    from pubchem.constants.pubchem import PUBCHEM_DELAY

    p = argparse.ArgumentParser(
        description="Look up CAS numbers in PubChem and cache the identifiers.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument(
        "--cas-file", metavar="FILE", type=Path, default=Path("reports/compound-data/missing-cas.txt"),
        help="CAS list, one per line (default: %(default)s, i.e. tmp/reports/python/compound-data on the host)",
    )
    p.add_argument(
        "--cache", metavar="FILE", type=Path, default=Path("shared/sources/compound-data/pubchem/pubchem-cas.tsv"),
        help="PubChem identifier cache (default: %(default)s)",
    )
    p.add_argument(
        "--retry", metavar="STATUS", nargs="*", default=[],
        help="Re-query cached rows with these statuses, e.g. --retry notFound ambiguous",
    )
    p.add_argument("--limit", metavar="N", type=int, help="Query at most N CAS numbers")
    p.add_argument("--delay", metavar="S", type=float, default=PUBCHEM_DELAY,
                   help="Seconds between requests (default: %(default)s, PUBCHEM_DELAY)")
    p.add_argument("--save-every", metavar="N", type=int, default=50, help="Save the cache every N lookups")
    p.add_argument("-v", "--verbose", action="store_true", help="Show DEBUG-level messages")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    if not args.cas_file.is_file():
        logger.error("Not found: %s — run make compound-data-build first", args.cas_file)
        return 1

    from pubchem.parsers.cas_list import read_cas_list
    from pubchem.parsers.pubchem_cache import read_pubchem_cache
    from pubchem.pubchem_blocked_error import PubchemBlockedError
    from pubchem.pubchem_cache_writer import write_pubchem_cache
    from pubchem.pubchem_client import PubchemClient

    wanted = read_cas_list(args.cas_file)
    cache = {cas: result for cas, (result, _) in read_pubchem_cache(args.cache).items()}
    todo = [cas for cas in wanted if cas not in cache or cache[cas].status in args.retry]
    if args.limit is not None:
        todo = todo[: args.limit]
    logger.info("[pubchem] %d CAS in %s, %d cached, %d to query (≥ %.0f min)",
                len(wanted), args.cas_file, len(set(wanted) & cache.keys()), len(todo), len(todo) * args.delay / 60)

    def save_before_pause() -> None:
        write_pubchem_cache(args.cache, cache.values())
        logger.info("[pubchem] Cache saved before the pause (%d CAS)", len(cache))

    client = PubchemClient(delay=args.delay, on_pause=save_before_pause)
    code = 0
    try:
        for i, cas in enumerate(todo, start=1):
            result = client.lookup(cas)
            if result is not None:
                cache[cas] = result
                logger.debug("[pubchem] %s → %s %s", cas, result.status, result.formula or "")
            if i % args.save_every == 0:
                write_pubchem_cache(args.cache, cache.values())
                logger.info("[pubchem] %d / %d queried, cache saved (throttling %s, %.2f s between requests)",
                            i, len(todo), client.level or "-", client.delay)
    except KeyboardInterrupt:
        logger.warning("[pubchem] Interrupted — saving the cache")
        code = 130
    except PubchemBlockedError as exc:
        logger.error("[pubchem] Stopped, PubChem refuses requests: %s. Cache saved; run again later "
                     "(already cached CAS numbers are skipped).", exc)
        code = 2
    finally:
        write_pubchem_cache(args.cache, cache.values())

    statuses: dict[str, int] = {}
    for cas in set(wanted) & cache.keys():
        statuses[cache[cas].status] = statuses.get(cache[cas].status, 0) + 1
    logger.info("[pubchem] Cache → %s  %s", args.cache, dict(sorted(statuses.items())))
    return code


if __name__ == "__main__":
    sys.exit(main())
