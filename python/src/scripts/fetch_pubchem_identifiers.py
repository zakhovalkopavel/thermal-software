#!/usr/bin/env python3
"""
fetch_pubchem_identifiers.py — CLI entry point, second step of the compound data build: look up in
PubChem the CAS numbers the build could not identify, search the records without a CAS by formula,
and keep everything PubChem gives in local files.

Step 1 (make compound-data-build) is offline and writes the CAS list; this step is slow (PubChem
allows about 4 requests per second) and resumable; the next build reads the files.

Input
-----
  tmp/reports/python/compound-data/missing-cas.txt — one CAS per line, written by the build
                                            (CAS numbers missing from the chemicals identifier files)
  shared/processed/compound-data/index.json — class of every CAS (decides the output file) and the
                                            records without a CAS (formula:…, searched by Hill formula)
  PubChem PUG REST                        — compound/name/{CAS}/property/<PUBCHEM_PROPERTIES>/JSON,
                                            compound/fastformula/{Hill}/property/…/JSON
  PubChem PUG View                        — data/compound/{CID}/JSON?heading=Experimental+Properties,
                                            …?heading=CAS (CAS of the compound a formula search chose)

Output
------
  shared/sources/compound-data/pubchem/pubchem-<class>.jsonl — inorganic, organic, unclassified (CAS
                                            the index does not know); one JSON line per query: the
                                            property answer (every compound with every
                                            PUBCHEM_PROPERTIES field, or PubChem's Fault), the PUG View
                                            "Experimental Properties" of its compounds (melting and
                                            boiling point, density, decomposition … with references)
                                            and, for a formula search, the "CAS" section

A query is appended to the file of its class as soon as its requests are done, so an interrupted run
loses at most the query in progress. Queries already stored (newest line over all three files) are
skipped unless their answer was made with another property list, their status is in --retry, or
experimental properties of a CID (unless --no-experimental) or the CAS section of a found compound
are missing (then only those are fetched). At the end of a run the superseded lines are dropped.
Progress is logged every --chunk-size queries, followed by a --chunk-pause seconds pause.

Selection: --all-cas adds every CAS of the compound data (index.json) to the list; the records without
a CAS (162, keyed formula:…) are searched by formula unless --no-formulas; --class keeps only queries of
the given classes: inorganic, organic, or unclassified (CAS the index does not know, i.e. unresolved
rows without a formula, e.g. calcium carbide 75-20-7).

Politeness: requests spaced by --delay and slowed down when PubChem's X-Throttling-Control turns
Yellow or Red. When PubChem is busy (503, 429, 5xx) the same request is made again after growing
pauses (--busy-pause × 1, 2, 4, at most × PUBCHEM_BUSY_PAUSE_MAX_MULTIPLIER); when its Service status
is Black (server overloaded) the next request waits --busy-pause × PUBCHEM_OVERLOADED_PAUSE_MULTIPLIER.
A block (403, Black on Request Count or Request Time) or pauses in a row longer than --max-wait stop
the run with exit code 2 — run again later.

Implementation
--------------
  pubchem.parsers.cas_list          — read_cas_list
  pubchem.parsers.compound_classes  — read_compound_classes
  pubchem.parsers.formula_compounds — read_formula_compounds
  pubchem.parsers.pubchem_records   — read_pubchem_records, read_pubchem_lines
  pubchem.pubchem_query             — PubchemQuery (CAS / formula)
  pubchem.pubchem_fetch             — fetch_pubchem_record (asks only what a record lacks)
  pubchem.pubchem_client            — PubchemClient (pacing, throttling, pauses)
  pubchem.pubchem_records_writer    — append_pubchem_record, compact_pubchem_files

Spec
----
  docs/scripts/PUBCHEM_SPEC.md

Usage
-----
  docker compose run --rm python python src/scripts/fetch_pubchem_identifiers.py
  docker compose run --rm python python src/scripts/fetch_pubchem_identifiers.py --class inorganic unclassified
  docker compose run --rm python python src/scripts/fetch_pubchem_identifiers.py --all-cas --class organic
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from collections import Counter
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def _build_parser() -> argparse.ArgumentParser:
    from pubchem.constants.pubchem import (
        PUBCHEM_BUSY_PAUSE, PUBCHEM_CAS_CLASSES, PUBCHEM_CHUNK_PAUSE, PUBCHEM_CHUNK_SIZE, PUBCHEM_DELAY,
        PUBCHEM_DIR, PUBCHEM_MAX_WAIT,
    )

    p = argparse.ArgumentParser(
        description="Look up CAS numbers (and records without a CAS, by formula) in PubChem and keep every "
                    "answer in one file per compound class.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument(
        "--cas-file", metavar="FILE", type=Path, default=Path("reports/compound-data/missing-cas.txt"),
        help="CAS list, one per line (default: %(default)s, i.e. tmp/reports/python/compound-data on the host)",
    )
    p.add_argument(
        "--out-dir", metavar="DIR", type=Path, default=Path(PUBCHEM_DIR),
        help="Folder of the pubchem-<class>.jsonl files (default: %(default)s)",
    )
    p.add_argument("--no-experimental", action="store_true",
                   help="Do not fetch experimental properties (one request per query)")
    p.add_argument(
        "--index", metavar="FILE", type=Path, default=Path("shared/processed/compound-data/index.json"),
        help="Compound data index: class of every CAS, records without a CAS (default: %(default)s)",
    )
    p.add_argument(
        "--class", dest="classes", metavar="CLASS", nargs="+", choices=PUBCHEM_CAS_CLASSES,
        help=f"Query only CAS numbers and formulas of these classes ({', '.join(PUBCHEM_CAS_CLASSES)})",
    )
    p.add_argument("--all-cas", action="store_true",
                   help="Query every CAS of the compound data, not only the --cas-file list")
    p.add_argument("--no-formulas", action="store_true",
                   help="Do not search the compound-data records without a CAS by their formula")
    p.add_argument(
        "--retry", metavar="STATUS", nargs="*", default=[],
        help="Re-query stored CAS numbers and formulas with these statuses, e.g. --retry notFound ambiguous",
    )
    p.add_argument("--limit", metavar="N", type=int, help="Query at most N CAS numbers and formulas")
    p.add_argument("--delay", metavar="S", type=float, default=PUBCHEM_DELAY,
                   help="Seconds between requests (default: %(default)s, PUBCHEM_DELAY)")
    p.add_argument("--busy-pause", metavar="S", type=float, default=PUBCHEM_BUSY_PAUSE,
                   help="First pause in seconds when PubChem is busy (default: %(default)s, PUBCHEM_BUSY_PAUSE)")
    p.add_argument("--max-wait", metavar="MIN", type=float, default=PUBCHEM_MAX_WAIT / 60,
                   help="Stop when pauses in a row exceed MIN minutes in total "
                        "(default: %(default)s, PUBCHEM_MAX_WAIT)")
    p.add_argument("--chunk-size", metavar="N", type=int, default=PUBCHEM_CHUNK_SIZE,
                   help="Queries per chunk; progress is logged after each (default: %(default)s, "
                        "PUBCHEM_CHUNK_SIZE)")
    p.add_argument("--chunk-pause", metavar="S", type=float, default=PUBCHEM_CHUNK_PAUSE,
                   help="Seconds to pause between chunks (default: %(default)s, PUBCHEM_CHUNK_PAUSE)")
    p.add_argument("-v", "--verbose", action="store_true", help="Show DEBUG-level messages")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    if args.chunk_size < 1:
        logger.error("--chunk-size must be at least 1")
        return 1
    for path in (args.cas_file, args.index):
        if not path.is_file():
            logger.error("Not found: %s — run make compound-data-build first", path)
            return 1

    from pubchem.constants.pubchem import PUBCHEM_BY_CAS, PUBCHEM_UNCLASSIFIED
    from pubchem.parsers.cas_list import read_cas_list
    from pubchem.parsers.compound_classes import read_compound_classes
    from pubchem.parsers.formula_compounds import read_formula_compounds
    from pubchem.parsers.pubchem_records import read_pubchem_lines, read_pubchem_records
    from pubchem.pubchem_blocked_error import PubchemBlockedError
    from pubchem.pubchem_client import PubchemClient
    from pubchem.pubchem_fetch import fetch_pubchem_record
    from pubchem.pubchem_paths import pubchem_files
    from pubchem.pubchem_query import PubchemQuery
    from pubchem.pubchem_records_writer import append_pubchem_record, compact_pubchem_files

    classes = read_compound_classes(args.index)
    wanted = read_cas_list(args.cas_file)
    source = str(args.cas_file)
    if args.all_cas:
        listed = set(wanted)
        wanted += [cas for cas in sorted(classes) if cas not in listed]
        source = f"{args.cas_file} + {args.index}"
    queries = [(PubchemQuery.cas(cas), classes.get(cas, PUBCHEM_UNCLASSIFIED)) for cas in wanted]
    if not args.no_formulas:
        skipped = []
        for hill, cls in sorted(read_formula_compounds(args.index).items()):
            try:
                queries.append((PubchemQuery.formula(hill), cls))
            except ValueError:
                skipped.append(hill)
        if skipped:
            logger.info("[pubchem] Not searchable (fractional formula): %s", ", ".join(skipped))
        source += " + records without CAS (by formula)"
    if args.classes:
        queries = [(q, cls) for q, cls in queries if cls in args.classes]
        source = f"{source}, class {' + '.join(args.classes)}"

    files = pubchem_files(args.out_dir)
    stored = read_pubchem_records(files.values())
    experimental = not args.no_experimental

    def refresh(query: PubchemQuery) -> bool:
        record = stored.get(query.key)
        return record is not None and record[0].result.status in args.retry

    def needs_answer(query: PubchemQuery) -> bool:
        record = stored.get(query.key)
        return record is None or record[0].answer.url != query.url or refresh(query)

    def needs_more(query: PubchemQuery) -> bool:
        record = stored[query.key][0]
        return (experimental and bool(record.missing_cids)) or record.missing_cas_cid is not None

    todo = [(q, cls) for q, cls in queries if needs_answer(q) or needs_more(q)]
    if args.limit is not None:
        todo = todo[: args.limit]
    answers = sum(1 for q, _ in todo if needs_answer(q))
    searches = sum(1 for q, _ in todo if needs_answer(q) and q.by != PUBCHEM_BY_CAS)
    known_cids = sum(len(stored[q.key][0].missing_cids) for q, _ in todo if not needs_answer(q)) if experimental else 0
    requests = answers * (2 if experimental else 1) + searches + known_cids
    logger.info("[pubchem] %d queries from %s, %d stored; %d to ask (%d by formula), %d known CIDs without "
                "experimental properties (≥ %.0f min)", len(queries), source,
                sum(1 for q, _ in queries if q.key in stored), answers, searches, known_cids,
                (requests * args.delay + max(len(todo) - 1, 0) // args.chunk_size * args.chunk_pause) / 60)

    reused = read_pubchem_lines(stored[q.key][1:] for q, _ in todo if not needs_answer(q))
    client = PubchemClient(delay=args.delay, busy_pause=args.busy_pause, max_wait=args.max_wait * 60)
    code = 0
    try:
        for i, (query, compound_class) in enumerate(todo, start=1):
            previous = reused.get(stored[query.key][1:]) if query.key in stored else None
            record = fetch_pubchem_record(client, query, compound_class, previous, experimental, refresh(query))
            if record is not None:
                logger.debug("[pubchem] %s → %s %s", query.key, record.result.status, record.result.formula or "")
                append_pubchem_record(files[record.compound_class], record)
                stored[query.key] = (record, files[record.compound_class], 0)
            if i % args.chunk_size == 0:
                logger.info("[pubchem] %d / %d queried (throttling %s, %.2f s between requests)",
                            i, len(todo), client.level or "-", client.delay)
                if args.chunk_pause > 0 and i < len(todo):
                    logger.info("[pubchem] Pausing %.0f s between chunks", args.chunk_pause)
                    time.sleep(args.chunk_pause)
    except KeyboardInterrupt:
        logger.warning("[pubchem] Interrupted")
        code = 130
    except PubchemBlockedError as exc:
        logger.error("[pubchem] Stopped, PubChem refuses requests: %s. Everything fetched so far is stored; "
                     "run again later (stored queries are skipped).", exc)
        code = 2
    finally:
        dropped = compact_pubchem_files(files.values())
        if dropped:
            logger.info("[pubchem] %d superseded lines dropped", dropped)

    for compound_class, path in files.items():
        records = [r for r, _, _ in stored.values() if r.compound_class == compound_class]
        if records:
            statuses = Counter(r.result.status for r in records)
            searched = sum(1 for r in records if r.query.by != PUBCHEM_BY_CAS)
            logger.info("[pubchem] %s → %s  %d records (%d by formula or name) %s, %d CIDs with experimental "
                        "properties", compound_class, path, len(records), searched, dict(sorted(statuses.items())),
                        sum(len(r.experimental) for r in records))
    return code


if __name__ == "__main__":
    sys.exit(main())
