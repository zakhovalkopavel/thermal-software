#!/usr/bin/env python3
"""List USGS 2131 PDF pages in selections that are not OCR'd yet.

Refs:
  [60] RobieHemingway1995

Prints space-separated PDF page numbers (for ``make usgs2131-ocr PAGE="…"``).
Existing ``page-NNNN.txt`` dumps are skipped. Use ``--json`` for a full report.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from usgs_bulletin_2131.page_selections import (
    default_page_selections,
    existing_ocr_pages,
    missing_ocr_pages,
)
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
        "--report-dir",
        type=Path,
        default=default_report_dir(root),
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print JSON summary instead of a PAGE= string",
    )
    parser.add_argument(
        "--write-selections",
        action="store_true",
        help="Refresh report-dir/page-selections.json to full-bulletin scope",
    )
    args = parser.parse_args(argv)

    selections = default_page_selections()
    if args.write_selections:
        sel_path = args.report_dir / "page-selections.json"
        sel_path.parent.mkdir(parents=True, exist_ok=True)
        sel_path.write_text(json.dumps(selections, indent=2) + "\n", encoding="utf-8")

    ocr_dir = args.report_dir / "ocr"
    missing = missing_ocr_pages(ocr_dir, selections)
    have = existing_ocr_pages(ocr_dir)
    if args.json:
        print(
            json.dumps(
                {
                    "have": len(have),
                    "missing": len(missing),
                    "missingPages": missing,
                    "pageArg": " ".join(str(p) for p in missing),
                },
                indent=2,
            )
        )
    else:
        print(" ".join(str(p) for p in missing))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
