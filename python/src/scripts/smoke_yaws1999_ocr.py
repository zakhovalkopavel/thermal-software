#!/usr/bin/env python3
"""Smoke one Yaws page through the thin yaws1999 → page-ocr adapter.

Default: cached PNG at reports/yaws1999/renders/yaws-p37-400dpi.png.
Override with --page N to render from the DjVu (slower).

  PAGE_OCR_BACKEND=local  make yaws1999-ocr-smoke
  PAGE_OCR_BACKEND=modal  make yaws1999-ocr-smoke
  make yaws1999-ocr-smoke BACKEND=modal QUANT=q8
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

from yaws1999.constants import REPORT_DIR, SOURCE_DJVU
from yaws1999.ocr import (
    apply_cpu_defaults,
    load_ocr_config,
    ocr_page_image,
    ocr_source_page,
    prepare_local_predictor,
)

_DEFAULT_PNG = REPORT_DIR / "renders" / "yaws-p37-400dpi.png"


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    cfg = load_ocr_config(quant_override=args.quant)
    print(f"[smoke] {cfg.summary()}", flush=True)

    predictor = None
    if cfg.backend == "local":
        cpu = apply_cpu_defaults()
        print(f"[smoke] CPU tune parallel={cpu.get('SURYA_INFERENCE_PARALLEL')}", flush=True)
        print(
            f"[smoke] booting local llama/surya ({cfg.quant}) — "
            "can take several minutes; no output file until OCR finishes…",
            flush=True,
        )
        predictor = prepare_local_predictor(cfg)
        print("[smoke] local OCR ready", flush=True)

    if args.page is not None:
        print(f"[smoke] render+OCR DjVu page {args.page}…", flush=True)
        lines = ocr_source_page(
            args.djvu,
            args.page,
            cache_dir=REPORT_DIR / "renders",
            dpi=args.dpi,
            predictor=predictor,
            config=cfg,
        )
        label = f"djvu page {args.page}"
    else:
        png = args.png
        if not png.is_file():
            print(
                f"[smoke] missing {png}\n"
                "  Render once with: make yaws1999-parse TABLE=1-1\n"
                "  or pass --page 37 to render from the DjVu.",
                file=sys.stderr,
            )
            return 2
        image = np.array(Image.open(png).convert("L"))
        print(f"[smoke] image {png} shape={image.shape}", flush=True)
        lines = ocr_page_image(image, config=cfg, predictor=predictor)
        label = png.name

    out = REPORT_DIR / "scratch" / "yaws1999-ocr-smoke.txt"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
    print(f"[smoke] {label}: {len(lines)} lines → {out}", flush=True)
    for line in lines[:20]:
        print(f"  {line[:140]}", flush=True)
    return 0


def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Smoke Yaws OCR via page-ocr adapter.")
    p.add_argument("--png", type=Path, default=_DEFAULT_PNG, help="cached page PNG")
    p.add_argument("--page", type=int, default=None, metavar="N", help="DjVu page (render+OCR)")
    p.add_argument("--djvu", type=Path, default=SOURCE_DJVU)
    p.add_argument("--dpi", type=int, default=400)
    p.add_argument("--quant", choices=("bf16", "q8"), default=None)
    return p


if __name__ == "__main__":
    raise SystemExit(main())
