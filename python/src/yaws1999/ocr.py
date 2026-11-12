"""yaws1999.ocr — OCR one handbook source page via the page-ocr submodule.

Engine / backend selection is entirely ``PAGE_OCR_*`` inside ``page-ocr``.
This adapter only supplies the source path, page number, and cache dirs.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np

from page_ocr.backend import ocr_page_image, prepare_local_predictor
from page_ocr.config import OcrConfig, load_ocr_config, modal_tokens_present
from page_ocr.cpu import apply_cpu_defaults
from page_ocr.render import render_page

_DPI = 400

__all__ = [
    "OcrConfig",
    "apply_cpu_defaults",
    "load_ocr_config",
    "modal_tokens_present",
    "ocr_page_image",
    "ocr_source_page",
    "prepare_local_predictor",
    "render_page",
]


def ocr_source_page(
    source_path: Path | str,
    page: int,
    *,
    cache_dir: Path | str | None = None,
    dpi: int = _DPI,
    cache_stem: str = "yaws",
    predictor: object | None = None,
    config: OcrConfig | None = None,
    modal_dump_path: Path | str | None = None,
) -> list[str]:
    """Render one source page (PDF / DjVu / image) and OCR it via page-ocr."""
    image = render_page(
        source_path,
        page,
        dpi=dpi,
        cache_dir=cache_dir,
        cache_stem=cache_stem,
    )
    return ocr_page_image(
        image,
        config=config,
        predictor=predictor,
        modal_dump_path=modal_dump_path,
    )
