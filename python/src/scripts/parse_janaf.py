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
shared/processed/compound-data/index.json — class and folder of each table's compound-data record
  (run make compound-data-build first; without it organic tables go to organic/unclassified/)

Output (shared/processed/JANAF/, cleared first)
-----------------------------------------------
  inorganic/<Element>/<formula>-<name>.json — tables of one Hill formula in its main-element folder,
                  named with the IUPAC formula
                  (TiO2 → inorganic/Ti/TiO2-titanium-oxide.json, NH3 → inorganic/N/NH3-ammonia.json)
  organic/<family>/<formula>-<name>.json    — organic tables by compound-data family, Hill formula
                  (CH2O → organic/aldehydes/CH2O-formaldehyde.json)
                  each table has rows, transitions and ref [RefKey, line, table ID]
  index.json    — every table with its file, plus byFormula, byElement and byFamily lookups
  units.json    — units of the row columns
  sources.json  — py-janaf repository, commit, license and the URL templates of the refs

Implementation
--------------
  janaf.parsers.janaf_table — table parser
  janaf.parsers.provenance  — PROVENANCE.txt reader
  janaf.janaf_files         — tables → compound files (main element / organic family)
  janaf.writers             — JSON serialisation

Spec
----
  docs/scripts/JANAF_PARSER_SPEC.md

Refs
----
  docs/REFERENCES.md  [36] NISTJANAF

Usage
-----
  docker compose run --rm python python src/scripts/parse_janaf.py
"""

from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

_SOURCE_DIR = Path("shared/sources/compound-data/nist-janaf")


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Parse NIST-JANAF tables (py-janaf copy) into one JSON file per compound.",
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
        "--compound-index", metavar="FILE", type=Path,
        default=Path("shared/processed/compound-data/index.json"),
        help="Compound-data index with the class and folder of each table's record (default: %(default)s)",
    )
    p.add_argument(
        "--out-dir", metavar="DIR", type=Path, default=Path("shared/processed/JANAF"),
        help="Output directory, cleared before writing (default: %(default)s)",
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

    from dataset_layout.clear_dataset_dir import clear_dataset_dir
    from janaf.janaf_classes import JanafClasses
    from janaf.janaf_files import janaf_files
    from janaf.janaf_index import load_janaf_index
    from janaf.parsers.janaf_table import parse_janaf_tables
    from janaf.parsers.provenance import read_janaf_source
    from janaf.writers import write_janaf_index, write_janaf_json, write_janaf_sources, write_janaf_units

    try:
        tables = parse_janaf_tables(args.data_dir, load_janaf_index(args.index))
        if not tables:
            logger.error("No tables parsed from %s", args.data_dir)
            return 1
        source = read_janaf_source(args.provenance)
        files = janaf_files(tables, JanafClasses.from_index(args.compound_index))
        generated_at = datetime.now(timezone.utc).isoformat()
        clear_dataset_dir(args.out_dir)
        written = write_janaf_json(files, args.out_dir)
        write_janaf_index(files, args.out_dir, generated_at)
        write_janaf_units(args.out_dir)
        write_janaf_sources(args.out_dir, source, generated_at)
    except Exception as exc:
        logger.error("Fatal error processing JANAF tables: %s", exc)
        return 1

    logger.info("%d tables in %d compound files → %s", len(tables), len(written), args.out_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
