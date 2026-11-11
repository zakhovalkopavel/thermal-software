"""Run inside thermal-python: local page-ocr on one cached Yaws page."""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np
from PIL import Image

from page_ocr import load_ocr_config, ocr_page_image, prepare_local_predictor
from page_ocr.cpu import apply_cpu_defaults

ROOT = Path("/app")
HOST_REPORTS = Path("/app/reports")
CACHE_PNG = HOST_REPORTS / "yaws1999/renders/yaws-p37-400dpi.png"
OUT = HOST_REPORTS / "scratch/source-extract-sandbox/ocr"


def main() -> None:
    os.environ.setdefault("PAGE_OCR_BACKEND", "local")
    os.environ.setdefault("PAGE_OCR_ENGINE", "surya")
    os.environ.setdefault("PAGE_OCR_MODEL", "datalab-to/surya-ocr-2.5-gguf")
    os.environ.setdefault("PAGE_OCR_QUANT", os.environ.get("PAGE_OCR_QUANT", "q8"))
    apply_cpu_defaults()
    cfg = load_ocr_config()
    print("config:", cfg.summary())
    print("LLAMA_CPP_BINARY=", os.environ.get("LLAMA_CPP_BINARY"))

    if not CACHE_PNG.is_file():
        raise SystemExit(f"missing render cache: {CACHE_PNG}")
    image = np.array(Image.open(CACHE_PNG).convert("L"))
    print("image:", CACHE_PNG, image.shape)

    OUT.mkdir(parents=True, exist_ok=True)
    predictor = prepare_local_predictor(cfg)
    lines = ocr_page_image(image, config=cfg, predictor=predictor)
    out = OUT / "yaws-p37-lines.txt"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("lines:", len(lines), "->", out)
    for line in lines[:15]:
        print(" ", line[:140])


if __name__ == "__main__":
    main()
