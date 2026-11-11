"""
phase_diagrams.rendering.pdf_renderer — Thin adapter over ``page_ocr.render``.

PDF / DjVu / raster → grey page image.
"""
from __future__ import annotations

from page_ocr.render import render_page

__all__ = ["render_page"]
