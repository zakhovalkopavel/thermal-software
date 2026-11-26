#!/usr/bin/env python3
"""Overlay RobieHemingway1995 staging into shared/processed/compound-data.

Refs:
  [60] RobieHemingway1995
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from usgs_bulletin_2131.compound_data_overlay import overlay_robie_into_compound_data
from usgs_bulletin_2131.paths import default_report_dir


def _repo_root() -> Path:
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "shared").is_dir() and (
            (parent / "python").is_dir() or parent.name == "app"
        ):
            return parent
    return Path("/app")


def main(argv: list[str] | None = None) -> int:
    root = _repo_root()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--staging",
        type=Path,
        default=root / "shared/processed/minerals-thermodynamic/robie-hemingway-1995",
        help="Robie staging dir (<phaseId>.json) or legacy phases.json",
    )
    parser.add_argument(
        "--compound-data",
        type=Path,
        default=root / "shared/processed/compound-data",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    if not (args.staging.is_dir() or args.staging.is_file()):
        print(f"missing staging: {args.staging}", file=sys.stderr)
        return 1
    if not args.compound_data.is_dir():
        print(f"missing compound-data: {args.compound_data}", file=sys.stderr)
        return 1

    summary = overlay_robie_into_compound_data(
        args.staging,
        args.compound_data,
        dry_run=args.dry_run,
    )
    report = default_report_dir(root) / "build"
    report.mkdir(parents=True, exist_ok=True)
    out = report / "compound-data-overlay.json"
    out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    print(f"summary → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
