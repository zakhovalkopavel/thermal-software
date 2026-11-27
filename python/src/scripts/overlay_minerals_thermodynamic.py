#!/usr/bin/env python3
"""Overlay minerals-thermodynamic staging into compound-data (library / debug CLI).

Production path: ``make compound-data-build`` calls this after the chemicals
catalogue write. Prefer that target; this script is for debugging only.

Refs:
  [60] RobieHemingway1995
  [61] HollandPowell2011
  [62] Abdul2023
  [64] Pankratz1982
  [65] Jung2009AlTiO
  [66] Malan2019
  [67] Watanabe2000
  [68] Koroleva2017
  [70] Mao2006
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from thermodynamic_staging.compound_data_overlay import overlay_minerals_thermodynamic
from thermodynamic_staging.paths import out_dir, report_dir, repo_root


def main(argv: list[str] | None = None) -> int:
    root = repo_root()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--staging",
        type=Path,
        default=out_dir(root),
        help="shared/processed/minerals-thermodynamic",
    )
    parser.add_argument(
        "--compound-data",
        type=Path,
        default=root / "shared/processed/compound-data",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--skip-robie",
        action="store_true",
        help="Skip RobieHemingway1995 (already overlaid)",
    )
    args = parser.parse_args(argv)

    if not args.staging.is_dir():
        print(f"missing staging: {args.staging}", file=sys.stderr)
        return 1
    if not args.compound_data.is_dir():
        print(f"missing compound-data: {args.compound_data}", file=sys.stderr)
        return 1

    summary = overlay_minerals_thermodynamic(
        args.staging,
        args.compound_data,
        dry_run=args.dry_run,
        include_robie=not args.skip_robie,
    )
    report = report_dir(root) / "build"
    report.mkdir(parents=True, exist_ok=True)
    out = report / "compound-data-overlay.json"
    out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: summary[k] for k in summary if k != "sources"}, indent=2))
    print("sources:", json.dumps(summary.get("sources"), indent=2))
    print(f"summary → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
