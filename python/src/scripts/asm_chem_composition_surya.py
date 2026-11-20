#!/usr/bin/env python3
"""Surya OCR (page-ocr) for selected ASM chem-composition gap pages."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

from metal_data.asm_chem_composition import default_pdf_path, default_report_dir


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
    parser.add_argument(
        "--selections",
        type=Path,
        default=None,
        help="gap-page-selections.json (default: report-dir/gap-page-selections.json)",
    )
    parser.add_argument("--dpi", type=int, default=200)
    args = parser.parse_args(argv)

    sel_path = args.selections or (args.report_dir / "gap-page-selections.json")
    selections = json.loads(sel_path.read_text(encoding="utf-8"))
    pages = sorted(
        {
            p
            for s in selections.get("selections", [])
            for p in s.get("pdfPages", [])
        }
    )
    if not pages:
        print("no pages in selections", file=sys.stderr)
        return 1

    surya_dir = args.report_dir / "surya"
    surya_dir.mkdir(parents=True, exist_ok=True)
    renders_dir = args.report_dir / "renders"

    from page_ocr import load_ocr_config, ocr_page_image, prepare_local_predictor, render_page

    cfg = load_ocr_config()
    predictor = None
    if cfg.backend == "local":
        print(f"preparing local predictor engine={cfg.engine} quant={cfg.quant}", flush=True)
        predictor = prepare_local_predictor(cfg)
    else:
        print(f"using PAGE_OCR_BACKEND={cfg.backend} engine={cfg.engine}", flush=True)

    results = []
    for page in pages:
        print(f"OCR pdf page {page}…", flush=True)
        # Prefer cached render if present at matching dpi; else re-render via page-ocr
        cached = renders_dir / f"page-{page:02d}.png"
        if cached.is_file() and args.dpi == 150:
            from PIL import Image

            image = np.array(Image.open(cached).convert("L"))
        else:
            image = np.array(render_page(args.pdf, page, dpi=args.dpi, cache_dir=surya_dir / "cache"))

        raw_path = surya_dir / f"page-{page:04d}.ocr.json"
        lines = ocr_page_image(
            image,
            config=cfg,
            predictor=predictor,
            raw_dump_path=raw_path,
            dpi=args.dpi,
        )
        text_path = surya_dir / f"page-{page:04d}.txt"
        text_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        results.append({"pdfPage": page, "lines": len(lines), "text": str(text_path), "raw": str(raw_path)})

    summary_path = surya_dir / "summary.json"
    summary_path.write_text(json.dumps({"pages": results}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ocrPages": len(results), "summary": str(summary_path)}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
