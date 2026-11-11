"""Sandbox: local page-ocr one cached page image via page-ocr submodule."""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np
from PIL import Image

from page_ocr import load_ocr_config, ocr_page_image, prepare_local_predictor, render_page
from page_ocr.cpu import apply_cpu_defaults

ROOT = Path("/opt/thermal-software")
LLAMA = ROOT / "tmp/reports/python/phase-diagrams/nbs/llama-cpp/llama-server"
CACHE_PNG = ROOT / "tmp/reports/python/yaws1999/renders/yaws-p37-400dpi.png"
OUT = ROOT / "tmp/reports/python/scratch/source-extract-sandbox/ocr"


def main() -> None:
    os.environ.setdefault("PAGE_OCR_BACKEND", "local")
    os.environ.setdefault("PAGE_OCR_ENGINE", "surya")
    os.environ.setdefault("PAGE_OCR_MODEL", "datalab-to/surya-ocr-2.5-gguf")
    os.environ.setdefault("PAGE_OCR_QUANT", "q8")
    os.environ["LLAMA_CPP_BINARY"] = str(LLAMA.resolve())
    apply_cpu_defaults()

    cfg = load_ocr_config()
    print("config:", cfg.summary())
    print("llama:", os.environ["LLAMA_CPP_BINARY"], "exists=", LLAMA.is_file())

    if CACHE_PNG.is_file():
        image = np.array(Image.open(CACHE_PNG).convert("L"))
        print("image:", CACHE_PNG.name, image.shape)
    else:
        pdf = ROOT / "shared/sources/compound-data/Chemical properties handbook (Yaws 1999).pdf"
        image = render_page(pdf, 37, dpi=200, cache_dir=OUT / "renders", cache_stem="yaws")
        print("rendered page 37:", image.shape)

    OUT.mkdir(parents=True, exist_ok=True)
    predictor = prepare_local_predictor(cfg)
    lines = ocr_page_image(image, config=cfg, predictor=predictor)
    out = OUT / "yaws-p37-lines.txt"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("lines:", len(lines), "->", out)
    for line in lines[:12]:
        print(" ", line[:120])


if __name__ == "__main__":
    main()
