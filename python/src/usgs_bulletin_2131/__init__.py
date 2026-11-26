"""USGS Bulletin 2131 (Robie & Hemingway, 1995) staging OCR / dataset helpers.

Refs:
  [60] RobieHemingway1995
"""

from __future__ import annotations

from usgs_bulletin_2131.paths import default_pdf_path, default_report_dir
from usgs_bulletin_2131.page_selections import default_page_selections

__all__ = [
    "default_pdf_path",
    "default_report_dir",
    "default_page_selections",
]
