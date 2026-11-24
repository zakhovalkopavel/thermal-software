#!/usr/bin/env python3
"""
pubchem_search.py — CLI entry point: search PubChem for a few compounds on demand (a new phase-diagram
compound, a compound the compound data lacks) and keep the answers with the other PubChem records.

Input
-----
  queries (arguments or --query-file) — a CAS number, a formula or a name each; the kind is guessed
                                        (valid CAS → CAS, formula chemical_formula reads → formula, else
                                        name) unless --by is given. A query file has one query per line;
                                        "#" starts a comment (shared/sources/pubchem-queries.txt: 551
                                        formulas without a compound-data record)
  PubChem PUG REST / PUG View          — the requests of the fetch step (property answer, "CAS" section of
                                        the chosen compound, "Experimental Properties")

Output
------
  stdout — per query: status, CID, CAS, title, formula, molecular weight (candidates when not ok),
           the melting / boiling point, density and decomposition strings of the chosen compound and its
           PubChem URL
  shared/sources/compound-data/pubchem/pubchem-<class>.jsonl — the records (class from --class, else from
           the found formula), so the fetch step skips them and the next build reads them

A stored complete record is shown without asking PubChem (--refresh asks again). A formula search picks
the neutral compound with that exact formula, the best-annotated one of several (see PubchemResult);
name searches follow PubChem's synonyms and may land on another compound, so check the formula.

Modules
-------
  pubchem.pubchem_searcher       — PubchemSearcher (stored records, fetch, append, compact)
  pubchem.pubchem_query          — PubchemQuery.parse
  pubchem.pubchem_record_summary — record_summary
  pubchem.pubchem_client         — PubchemClient (pacing, throttling, pauses)

Spec
----
  docs/scripts/PUBCHEM_SPEC.md

Usage
-----
  make pubchem-search Q="CaAl2O4"
  make pubchem-search Q="'Ca3SiO5' '12042-68-1' 'tricalcium silicate'"
  make pubchem-search QUERY_FILE=shared/sources/pubchem-queries.txt
  docker compose run --rm python python src/scripts/pubchem_search.py CaAl2O4 --by formula --refresh
"""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROGRESS_EVERY = 50


def _build_parser() -> argparse.ArgumentParser:
    from pubchem.constants.pubchem import (
        PUBCHEM_BUSY_PAUSE, PUBCHEM_BY_CAS, PUBCHEM_BY_FORMULA, PUBCHEM_BY_NAME, PUBCHEM_CAS_CLASSES,
        PUBCHEM_DELAY, PUBCHEM_DIR, PUBCHEM_MAX_WAIT,
    )

    p = argparse.ArgumentParser(
        description="Search PubChem by formula, name or CAS and keep the answers with the PubChem records.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("queries", metavar="QUERY", nargs="*", help="CAS number, formula or name")
    p.add_argument("--query-file", metavar="FILE", type=Path, help="More queries, one per line (# starts a comment)")
    p.add_argument("--by", choices=(PUBCHEM_BY_CAS, PUBCHEM_BY_FORMULA, PUBCHEM_BY_NAME),
                   help="Kind of every query (default: guessed per query)")
    p.add_argument("--class", dest="compound_class", choices=PUBCHEM_CAS_CLASSES,
                   help="Class file to store the records in (default: class of the found formula)")
    p.add_argument("--out-dir", metavar="DIR", type=Path, default=Path(PUBCHEM_DIR),
                   help="Folder of the pubchem-<class>.jsonl files (default: %(default)s)")
    p.add_argument("--no-experimental", action="store_true", help="Do not fetch experimental properties")
    p.add_argument("--refresh", action="store_true", help="Ask PubChem again even when a record is stored")
    p.add_argument("--delay", metavar="S", type=float, default=PUBCHEM_DELAY,
                   help="Seconds between requests (default: %(default)s, PUBCHEM_DELAY)")
    p.add_argument("--busy-pause", metavar="S", type=float, default=PUBCHEM_BUSY_PAUSE,
                   help="First pause in seconds when PubChem is busy (default: %(default)s, PUBCHEM_BUSY_PAUSE)")
    p.add_argument("--max-wait", metavar="MIN", type=float, default=PUBCHEM_MAX_WAIT / 60,
                   help="Stop when pauses in a row exceed MIN minutes in total (default: %(default)s)")
    p.add_argument("-v", "--verbose", action="store_true", help="Show DEBUG-level messages")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    from pubchem.pubchem_blocked_error import PubchemBlockedError
    from pubchem.pubchem_client import PubchemClient
    from pubchem.pubchem_record_summary import record_summary
    from pubchem.pubchem_searcher import PubchemSearcher

    queries = list(args.queries)
    if args.query_file is not None:
        if not args.query_file.is_file():
            logger.error("Not found: %s", args.query_file)
            return 1
        lines = args.query_file.read_text(encoding="utf-8").splitlines()
        queries += [q for q in (s.split("#", 1)[0].strip() for s in lines) if q]
    if not queries:
        logger.error("Nothing to search: give queries or --query-file")
        return 1

    client = PubchemClient(delay=args.delay, busy_pause=args.busy_pause, max_wait=args.max_wait * 60)
    searcher = PubchemSearcher(args.out_dir, client, experimental=not args.no_experimental)
    code = 0
    try:
        for i, text in enumerate(queries, start=1):
            if len(queries) > PROGRESS_EVERY and i % PROGRESS_EVERY == 0:
                logger.info("[pubchem] %d / %d queries, %d stored this run", i, len(queries), searcher.requested)
            try:
                record = searcher.search(text, args.by, args.compound_class, args.refresh)
            except ValueError as exc:
                logger.error("[pubchem] %s: %s", text, exc)
                code = 1
                continue
            if record is None:
                logger.error("[pubchem] %s: PubChem refused the request", text)
                code = 1
                continue
            print("\n".join(record_summary(record)))
    except KeyboardInterrupt:
        logger.warning("[pubchem] Interrupted")
        code = 130
    except PubchemBlockedError as exc:
        logger.error("[pubchem] Stopped, PubChem refuses requests: %s", exc)
        code = 2
    finally:
        if searcher.requested:
            searcher.compact()
            logger.info("[pubchem] %d records stored in %s", searcher.requested, args.out_dir)
    return code


if __name__ == "__main__":
    sys.exit(main())
