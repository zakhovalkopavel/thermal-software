#!/usr/bin/env python3
"""
rebuild_yaws1999.py — Rebuild dataset/debug JSON from page text dumps (no OCR).

Reads ``reports/yaws1999/pages/page-NNNN.txt`` (or legacy ``pages/``),
parses rows, writes slug-named dataset JSON under ``shared/processed/yaws1999/tables/``
and a debug copy under ``reports/yaws1999/debug/``.

Usage
-----
  make yaws1999-rebuild
  make yaws1999-rebuild TABLE=1-1
  docker compose run --rm python \\
    python src/scripts/rebuild_yaws1999.py --table 2-2
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from yaws1999.constants import PROCESSED_DIR, REPORT_DIR, SOURCE_DJVU
from yaws1999.parse_tables import rebuild_yaws1999


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        result = rebuild_yaws1999(
            djvu=args.djvu,
            out_dir=args.out_dir,
            report_dir=None if args.no_report else args.report_dir,
            tables=args.table or None,
            first_page=args.first,
            last_page=args.last,
            progress=lambda msg: print(f"[yaws1999-rebuild] {msg}", flush=True),
        )
    except FileNotFoundError as exc:
        print(f"[yaws1999-rebuild] error: {exc}", file=sys.stderr)
        return 2
    except ValueError as exc:
        print(f"[yaws1999-rebuild] error: {exc}", file=sys.stderr)
        return 2
    n_rows = sum(len(t.get("rows") or []) for t in result.tables)
    print(
        f"[yaws1999-rebuild] done: {len(result.tables)} table(s), {n_rows} rows "
        f"in {result.elapsed_s:.0f}s → {args.out_dir}",
        flush=True,
    )
    return 0


def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Rebuild Yaws 1999 dataset JSON from page text dumps (no OCR).",
    )
    p.add_argument("--djvu", type=Path, default=SOURCE_DJVU, help=f"source DjVu (default: {SOURCE_DJVU})")
    p.add_argument("--out-dir", type=Path, default=PROCESSED_DIR, help=f"dataset output (default: {PROCESSED_DIR})")
    p.add_argument("--report-dir", type=Path, default=REPORT_DIR, help=f"page dumps + debug (default: {REPORT_DIR})")
    p.add_argument("--no-report", action="store_true", help="do not write debug JSON")
    p.add_argument("--table", action="append", metavar="ID", help="rebuild only this table id (repeatable)")
    p.add_argument("--first", type=int, default=None, metavar="N", help="first DjVu page for catalog scan")
    p.add_argument("--last", type=int, default=None, metavar="N", help="last DjVu page for catalog scan")
    return p


if __name__ == "__main__":
    raise SystemExit(main())
