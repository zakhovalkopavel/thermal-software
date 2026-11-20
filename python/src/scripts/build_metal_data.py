#!/usr/bin/env python3
"""
build_metal_data.py — synthesize per-alloy JSON from ASM / related raw tables.

Sources
-------
  shared/sources/metal-data/raw-tables/*.json

Output
------
  shared/processed/metal-data/alloys/{group}/{family}/<id>.json
  shared/processed/metal-data/index.json
  shared/processed/metal-data/units.json
  shared/processed/metal-data/sources.json

Report
------
  tmp/reports/python/metal-data/report.json
  tmp/reports/python/metal-data/donor-fill.json

Spec
----
  docs/scripts/METAL_DATA_SPEC.md

Usage
-----
  docker compose run --rm python python src/scripts/build_metal_data.py
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

from metal_data.builder import build_metal_data
from metal_data.pure_metals import join_into_compound_data, write_join_source


def _repo_root() -> Path:
    # /app in container; repo root on host when run via PYTHONPATH=src
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "shared").is_dir() and (parent / "python").is_dir():
            return parent
        if (parent / "shared").is_dir() and parent.name == "app":
            # container layout: /app/{src,shared,...} — shared may be mounted at /app/shared
            return parent
    return Path("/app")


def _default_report_dir(root: Path) -> Path:
    # Compose mounts ./tmp/reports/python → /app/reports
    if root.name == "app" or (root / "reports").is_dir():
        return root / "reports" / "metal-data"
    return root / "tmp/reports/python/metal-data"


def main(argv: list[str] | None = None) -> int:
    root = _repo_root()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--raw-dir",
        type=Path,
        default=root / "shared/sources/metal-data/raw-tables",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=root / "shared/processed/metal-data",
    )
    parser.add_argument(
        "--report-dir",
        type=Path,
        default=_default_report_dir(root),
    )
    parser.add_argument(
        "--compound-dir",
        type=Path,
        default=root / "shared/processed/compound-data",
        help="compound-data root for Abu-Eishah pure-metal λ join",
    )
    parser.add_argument(
        "--skip-pure-join",
        action="store_true",
        help="skip joining Abu-Eishah correlations into compound-data",
    )
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s %(message)s",
    )

    if not args.raw_dir.is_dir():
        logging.error("raw dir not found: %s", args.raw_dir)
        return 1

    summary = build_metal_data(args.raw_dir, args.out_dir, args.report_dir)
    logging.info(
        "wrote %s alloys (%s donor fills) → %s",
        summary["alloyCount"],
        summary["donorFills"],
        args.out_dir,
    )

    join_source = root / "shared/sources/metal-data/metal-conductivity-abu-eishah.json"
    if root.name == "app":
        join_source = Path("/app/shared/sources/metal-data/metal-conductivity-abu-eishah.json")
    summary["abuEishahSource"] = write_join_source(args.raw_dir, join_source)

    if not args.skip_pure_join and args.compound_dir.is_dir():
        summary["pureMetalJoin"] = join_into_compound_data(args.raw_dir, args.compound_dir)
        logging.info(
            "joined Abu-Eishah rows into compound-data: %s",
            summary["pureMetalJoin"],
        )

    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
