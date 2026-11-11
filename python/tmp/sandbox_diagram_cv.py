"""Sandbox: run generic diagram CV from source_extract + page_ocr render."""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw

from page_ocr.render import render_page
from source_extract.diagrams.detection.frame_detector import detect_frame
from source_extract.diagrams.detection.ink_mask import ink_mask
from source_extract.diagrams.detection.tick_detector import detect_ticks


def main() -> None:
    img = Image.new("L", (400, 300), 255)
    draw = ImageDraw.Draw(img)
    draw.rectangle([40, 30, 360, 270], outline=0, width=3)
    for x in range(40, 361, 40):
        draw.line([(x, 270), (x, 278)], fill=0, width=2)
    for y in range(30, 271, 40):
        draw.line([(32, y), (40, y)], fill=0, width=2)
    arr = np.array(img)
    mask = ink_mask(arr)
    frame = detect_frame(mask, search_box=(0, 0, mask.shape[1], mask.shape[0]))
    ticks = detect_ticks(mask, frame)
    print("source_extract.diagrams CV ok")
    print("ink_pixels:", int(mask.sum()), "frame:", frame, "tick_sides:", list(ticks))

    pdf = "/opt/thermal-software/shared/sources/compound-data/Molten Salts: Eutectic Data (NSRDS-NBS 61, 1978).pdf"
    cache = "/opt/thermal-software/tmp/reports/python/scratch/source-extract-sandbox/renders"
    page = render_page(pdf, 5, dpi=150, cache_dir=cache, cache_stem="nbs")
    print("page_ocr.render PDF page5:", page.shape, page.dtype)


if __name__ == "__main__":
    main()
