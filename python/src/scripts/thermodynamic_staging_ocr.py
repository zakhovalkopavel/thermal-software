#!/usr/bin/env python3
"""OCR selected pages from a thermochemical staging PDF via page-ocr (Modal/local).

Refs:
  [63] Mao2005
  [64] Pankratz1982
  [65] Jung2009AlTiO

Writes under ``--report-dir``:
  page-selections.json
  ocr/page-NNNN.txt
  ocr/page-NNNN.ocr.json
  ocr/page-NNNN.pdftotext.txt
  ocr/summary.json
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np


def _repo_root() -> Path:
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "shared").is_dir() and (
            (parent / "python").is_dir() or parent.name == "app"
        ):
            return parent
    return Path("/app")


def _dump_pdftotext(pdf: Path, page: int, out_path: Path) -> None:
    result = subprocess.run(
        [
            "pdftotext",
            "-layout",
            "-f",
            str(page),
            "-l",
            str(page),
            str(pdf),
            "-",
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    out_path.write_text(result.stdout, encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--report-dir", type=Path, required=True)
    parser.add_argument("--source-id", required=True, help="Coverage / summary id")
    parser.add_argument("--ref", required=True, help="RefKey name string")
    parser.add_argument(
        "--page",
        type=int,
        action="append",
        default=[],
        help="PDF page to OCR (repeatable)",
    )
    parser.add_argument(
        "--selections",
        type=Path,
        default=None,
        help="Optional page-selections.json; used when --page omitted",
    )
    parser.add_argument("--dpi", type=int, default=300)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--quant", default=None)
    args = parser.parse_args(argv)

    if not args.pdf.is_file():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 1

    pages = sorted(set(args.page))
    sel_path = args.selections or (args.report_dir / "page-selections.json")
    if not pages and sel_path.is_file():
        sel = json.loads(sel_path.read_text(encoding="utf-8"))
        pages = sorted({int(p) for p in sel.get("pdfPages") or []})
    if not pages:
        print("no pages to OCR (pass --page or selections)", file=sys.stderr)
        return 1

    args.report_dir.mkdir(parents=True, exist_ok=True)
    if not sel_path.is_file():
        sel_path.write_text(
            json.dumps(
                {
                    "sourceId": args.source_id,
                    "ref": args.ref,
                    "pdf": str(args.pdf),
                    "pdfPages": pages,
                    "note": "Priority pages for calculable staging extract",
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )

    ocr_dir = args.report_dir / "ocr"
    ocr_dir.mkdir(parents=True, exist_ok=True)

    from page_ocr import load_ocr_config, ocr_page_image, prepare_local_predictor, render_page

    cfg = load_ocr_config(quant_override=args.quant)
    predictor = None
    if cfg.backend == "local":
        print(
            f"preparing local predictor engine={cfg.engine} quant={cfg.quant}",
            flush=True,
        )
        predictor = prepare_local_predictor(cfg)
    else:
        print(
            f"using PAGE_OCR_BACKEND={cfg.backend} engine={cfg.engine} quant={cfg.quant}",
            flush=True,
        )

    results: list[dict] = []
    for page in pages:
        text_path = ocr_dir / f"page-{page:04d}.txt"
        raw_path = ocr_dir / f"page-{page:04d}.ocr.json"
        layer_path = ocr_dir / f"page-{page:04d}.pdftotext.txt"

        if text_path.is_file() and not args.force:
            print(f"skip pdf page {page} (exists; use --force)", flush=True)
            results.append(
                {
                    "pdfPage": page,
                    "skipped": True,
                    "text": str(text_path),
                }
            )
            continue

        print(f"OCR pdf page {page}…", flush=True)
        image = np.array(
            render_page(
                args.pdf,
                page,
                dpi=args.dpi,
                cache_dir=ocr_dir / "cache",
            )
        )
        lines = ocr_page_image(
            image,
            config=cfg,
            predictor=predictor,
            raw_dump_path=raw_path,
            dpi=args.dpi,
        )
        text_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        _dump_pdftotext(args.pdf, page, layer_path)
        results.append(
            {
                "pdfPage": page,
                "skipped": False,
                "lines": len(lines),
                "text": str(text_path),
            }
        )

    summary = {
        "sourceId": args.source_id,
        "ref": args.ref,
        "backend": cfg.backend,
        "engine": cfg.engine,
        "quant": cfg.quant,
        "dpi": args.dpi,
        "pdf": str(args.pdf),
        "pages": results,
    }
    summary_path = ocr_dir / "summary.json"
    summary_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "ocrPages": len(results),
                "ran": sum(1 for r in results if not r.get("skipped")),
                "skipped": sum(1 for r in results if r.get("skipped")),
                "summary": str(summary_path),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
