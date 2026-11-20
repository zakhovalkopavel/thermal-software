#!/usr/bin/env python3
"""Tesseract inventory of ASM chem-composition PDF vs metal-data raw-tables."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from metal_data.asm_chem_composition import (
    build_inventory,
    default_pdf_path,
    default_report_dir,
    select_gap_ranges,
)


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
    parser.add_argument("--pdf", type=Path, default=default_pdf_path(root))
    parser.add_argument("--report-dir", type=Path, default=default_report_dir(root))
    parser.add_argument("--dpi", type=int, default=150)
    parser.add_argument("--skip-tesseract", action="store_true")
    args = parser.parse_args(argv)

    if not args.pdf.is_file():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 1

    inv = build_inventory(
        args.pdf,
        args.report_dir,
        dpi=args.dpi,
        use_tesseract=not args.skip_tesseract,
    )
    gaps = select_gap_ranges(inv)
    gap_path = args.report_dir / "gap-page-selections.json"
    gap_path.write_text(json.dumps(gaps, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    needed = [t for t in inv["tables"] if t.get("neededForGap")]
    matched = [t for t in inv["tables"] if t.get("matchedRawFile")]
    print(
        json.dumps(
            {
                "pages": inv["pageCount"],
                "compositionTables": len(inv["tables"]),
                "alreadyMatched": len(matched),
                "neededForGap": len(needed),
                "selections": gaps["selections"],
                "inventory": str(args.report_dir / "table-inventory.json"),
                "gapSelections": str(gap_path),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
