#!/usr/bin/env python3
"""
parse_janaf.py — CLI entry point: convert the NIST-JANAF tables (py-janaf copy) to JSON.

Sources (shared/sources/compound-data/nist-janaf/)
--------------------------------------------------
  py-janaf/data/<ID>.txt — NIST-JANAF tables as distributed by py-janaf
    origin: https://github.com/n-takumasa/py-janaf (src/janaf/data)
  py-janaf/janaf.json    — table index (ID → display label)
  PROVENANCE.txt         — py-janaf repository URL and commit of the download
  nist/<ID>.txt          — original NIST files (https://janaf.nist.gov/tables/<ID>.txt), not parsed

Output (shared/processed/JANAF/)
--------------------------------
  <prefix>.json — tables grouped by JANAF ID prefix (Al.json, O.json, ...);
                  each table has rows, transitions, sourceUrl (py-janaf) and nistUrl
  index.json    — every table with its file, plus byFormula and byElement lookups
                  (written only when all prefixes are parsed)

Implementation
--------------
  janaf.parsers.janaf_table — table parser
  janaf.parsers.provenance  — PROVENANCE.txt reader
  janaf.writers             — JSON serialisation

Spec
----
  docs/scripts/JANAF_PARSER_SPEC.md

Refs
----
  docs/REFERENCES.md  [36] NISTJANAF

Usage
-----
  docker compose run --rm python python src/scripts/parse_janaf.py [--prefixes Al,O]
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

_SOURCE_DIR = Path("shared/sources/compound-data/nist-janaf")


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Parse NIST-JANAF tables (py-janaf copy) into per-prefix JSON files.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument(
        "--data-dir", metavar="DIR", type=Path, default=_SOURCE_DIR / "py-janaf" / "data",
        help="Directory with <ID>.txt tables (default: %(default)s)",
    )
    p.add_argument(
        "--index", metavar="FILE", type=Path, default=_SOURCE_DIR / "py-janaf" / "janaf.json",
        help="py-janaf index file (default: %(default)s)",
    )
    p.add_argument(
        "--provenance", metavar="FILE", type=Path, default=_SOURCE_DIR / "PROVENANCE.txt",
        help="Download provenance with py-janaf repository and commit (default: %(default)s)",
    )
    p.add_argument(
        "--out-dir", metavar="DIR", type=Path, default=Path("shared/processed/JANAF"),
        help="Output directory (default: %(default)s)",
    )
    p.add_argument(
        "--prefixes", metavar="P1,P2,...",
        help="Comma-separated JANAF ID prefixes to write, e.g. Al,O (default: all)",
    )
    p.add_argument(
        "-v", "--verbose", action="store_true",
        help="Show DEBUG-level messages",
    )
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    for path in (args.data_dir, args.index):
        if not path.exists():
            logger.error("Not found: %s", path)
            return 1

    prefixes = None
    if args.prefixes:
        prefixes = {p.strip() for p in args.prefixes.split(",") if p.strip()}

    from janaf.janaf_index import load_janaf_index
    from janaf.parsers.janaf_table import parse_janaf_tables
    from janaf.parsers.provenance import read_janaf_source
    from janaf.writers import write_janaf_index, write_janaf_json

    try:
        index = load_janaf_index(args.index)
        tables = parse_janaf_tables(args.data_dir, index, prefixes)
        if not tables:
            logger.error("No tables parsed (prefixes: %s)", args.prefixes or "all")
            return 1
        source = read_janaf_source(args.provenance)
        written = write_janaf_json(tables, args.out_dir, source)
        if prefixes is None:
            write_janaf_index(tables, args.out_dir, source)
        else:
            logger.info("index.json not updated: --prefixes parses only part of the tables")
    except Exception as exc:
        logger.error("Fatal error processing JANAF tables: %s", exc)
        return 1

    logger.info("%d tables in %d files → %s", len(tables), len(written), args.out_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
