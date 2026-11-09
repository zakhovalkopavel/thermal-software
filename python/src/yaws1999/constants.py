"""
yaws1999.constants — Source path and output layout for Yaws Chemical Properties Handbook (1999).

The DjVu lives under ``shared/sources/compound-data/`` (visible in the python
container). Parsed tables go to ``shared/processed/yaws1999/`` as one JSON file
per handbook table (``table-2-1.json``, …) plus ``index.json``. Default engine
is Surya (``ddjvu`` + OCR); see ``parse_tables.parse_yaws1999``.

Printed page ≈ DjVu page − ``PAGE_OFFSET`` (Table 1-1 starts on DjVu page 10 = printed 1).
"""
from __future__ import annotations

from pathlib import Path

SOURCE_DJVU = Path("shared/sources/compound-data/Chemical properties handbook (Yaws 1999).djvu")
PROCESSED_DIR = Path("shared/processed/yaws1999")
# Container cwd is /app; compose mounts ./tmp/reports/python → /app/reports.
REPORT_DIR = Path("reports/yaws1999")

PAGE_OFFSET = 9
"""DjVu page − printed page for the body tables (Table 1-1 on DjVu 10 = printed 1)."""

REF_KEY = "Yaws1999"
SOURCE_NAME = "Yaws — Chemical Properties Handbook"
SOURCE_YEAR = "1999"
