#!/usr/bin/env python3
"""
parse_yaws1999.py — CLI: Yaws Chemical Properties Handbook (1999) DjVu → dataset JSON.

OCR each page via page-ocr, parse rows, write slug-named dataset JSON plus a debug copy.

Output
------
  shared/processed/yaws1999/tables/<Slug>_(table_<id>).json
  shared/processed/yaws1999/index.json
  reports/yaws1999/pages/page-NNNN.txt
  reports/yaws1999/debug/<Slug>_(table_<id>).json
  reports/yaws1999/renders/

To rebuild JSON from dumps without OCR, use ``rebuild_yaws1999.py`` /
``make yaws1999-rebuild``.

Usage
-----
  make yaws1999-parse TABLE=1-1
  make yaws1999-parse TABLE=1-1 PAGE=37 FORCE=1
  make yaws1999-parse TABLE=2-2 FORCE=1
  docker compose run --rm python python src/scripts/parse_yaws1999.py --table 2-2
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from yaws1999.constants import PROCESSED_DIR, REPORT_DIR, SOURCE_DJVU
from yaws1999.parse_tables import parse_yaws1999


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        result = parse_yaws1999(
            djvu=args.djvu,
            out_dir=args.out_dir,
            report_dir=None if args.no_report else args.report_dir,
            tables=args.table or None,
            pages=args.page or None,
            first_page=args.first,
            last_page=args.last,
            force=args.force,
            quant=args.quant,
            dpi=args.dpi,
            no_replace=args.no_replace,
            progress=lambda msg: print(f"[yaws1999] {msg}", flush=True),
        )
    except FileNotFoundError as exc:
        missing = exc.filename or str(exc)
        if "/" not in missing and not missing.endswith(".djvu"):
            print(
                f"[yaws1999] error: command not found: {missing}\n"
                f"  Rebuild the python image so it includes djvulibre-bin "
                f"(ddjvu/djvutxt/djvudump), e.g. docker compose build python",
                file=sys.stderr,
            )
        else:
            print(
                f"[yaws1999] error: file not found: {missing}\n"
                f"  (container mounts ./shared — keep the DjVu under shared/sources/)",
                file=sys.stderr,
            )
        return 2
    except ValueError as exc:
        print(f"[yaws1999] error: {exc}", file=sys.stderr)
        return 2
    n_rows = sum(len(t.get("rows") or []) for t in result.tables)
    n_pages = len(result.pages)
    skipped = f", {len(result.skipped)} skipped" if result.skipped else ""
    pages_bit = f", {n_pages} freeform page(s)" if n_pages else ""
    print(
        f"[yaws1999] done: {len(result.tables)} table file(s), {n_rows} rows"
        f"{pages_bit}{skipped} in {result.elapsed_s:.0f}s → {args.out_dir}",
        flush=True,
    )
    return 0


def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Parse Yaws 1999 handbook pages via page-ocr → dataset JSON.",
    )
    p.add_argument("--djvu", type=Path, default=SOURCE_DJVU, help=f"source DjVu (default: {SOURCE_DJVU})")
    p.add_argument("--out-dir", type=Path, default=PROCESSED_DIR, help=f"dataset output (default: {PROCESSED_DIR})")
    p.add_argument("--report-dir", type=Path, default=REPORT_DIR, help=f"page dumps + debug (default: {REPORT_DIR})")
    p.add_argument("--no-report", action="store_true", help="do not write page dumps / debug JSON")
    p.add_argument("--table", action="append", metavar="ID", help="parse only this table id (repeatable)")
    p.add_argument(
        "--page",
        action="append",
        type=int,
        metavar="N",
        help=(
            "OCR/parse this DjVu page (repeatable). Without --table, writes freeform "
            "pages/page-NNNN.json (intros/appendices OK). With --table, limits table OCR."
        ),
    )
    p.add_argument("--first", type=int, default=None, metavar="N", help="first DjVu page to scan for headers")
    p.add_argument("--last", type=int, default=None, metavar="N", help="last DjVu page to scan for headers")
    p.add_argument("--quant", choices=("bf16", "q8"), default="q8", help="OCR quant: q8 (default) or bf16")
    p.add_argument("--dpi", type=int, default=400, metavar="N", help="ddjvu render DPI (default 400)")
    p.add_argument(
        "--no-replace",
        action="store_true",
        help="keep existing dataset file; write .<quant>.json variant instead",
    )
    p.add_argument("--force", action="store_true", help="re-OCR pages even when a dump exists")
    return p


if __name__ == "__main__":
    raise SystemExit(main())
