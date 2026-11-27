#!/usr/bin/env python3
"""Build RobieHemingway1995 per-phase staging JSON (no compact phases.json).

Refs:
  [60] RobieHemingway1995

Reads tmp OCR ``page-NNNN.txt`` only; writes under processed:
  - …/robie-hemingway-1995/<phaseId>.json

Clears prior ``*.json`` and legacy ``compounds/`` / ``phases.json`` before rewrite.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from usgs_bulletin_2131.parse_tables import build_robie_dataset
from usgs_bulletin_2131.paths import default_report_dir
from usgs_bulletin_2131.write_compound_files import clear_robie_staging_dir, write_compound_files


def _repo_root() -> Path:
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "shared").is_dir() and (
            (parent / "python").is_dir() or parent.name == "app"
        ):
            return parent
    return Path("/app")


def _staging_dir(root: Path) -> Path:
    out = root / "shared" / "processed" / "minerals-thermodynamic" / "robie-hemingway-1995"
    if not (root / "shared").is_dir() and (root / "reports").is_dir():
        out = Path("/app/shared/processed/minerals-thermodynamic/robie-hemingway-1995")
    return out


def main() -> int:
    root = _repo_root()
    report = default_report_dir(root)
    ocr_dir = report / "ocr"
    if not ocr_dir.is_dir():
        print(f"OCR dir missing: {ocr_dir}", file=sys.stderr)
        return 1
    data = build_robie_dataset(ocr_dir)
    staging = _staging_dir(root)
    clear_robie_staging_dir(staging)
    compound_summary = write_compound_files(data["phases"], staging)

    reject_dir = report / "build"
    reject_dir.mkdir(parents=True, exist_ok=True)
    (reject_dir / "summary.json").write_text(
        json.dumps(
            {
                "nPhases": data["nPhases"],
                "statuses": {k: v.get("status") for k, v in data["phases"].items()},
                "withHighT": compound_summary.get("withHighT"),
                "stagingDir": str(staging),
                "layout": "per-phase JSON at staging root (no phases.json)",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "nPhases": data["nPhases"],
                "stagingDir": str(staging),
                "compounds": compound_summary,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
