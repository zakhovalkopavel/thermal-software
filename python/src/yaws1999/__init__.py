"""
yaws1999 — Parse Carl L. Yaws, *Chemical Properties Handbook* (1999) DjVu tables.

OCR engine is **Surya only** (``ddjvu`` render + full-page VLM), same stack as the
NSRDS-NBS 61 eutectic index. Each ``Table X-Y`` becomes its own JSON file under
``shared/processed/yaws1999/``.
"""
from yaws1999.constants import PAGE_OFFSET, PROCESSED_DIR, REPORT_DIR, SOURCE_DJVU
from yaws1999.parse_tables import ParseResult, parse_yaws1999
from yaws1999.table_catalog import TableSpan, build_table_catalog
from yaws1999.writers import resolve_table_path, table_file_name, write_index, write_table

__all__ = [
    "PAGE_OFFSET",
    "PROCESSED_DIR",
    "REPORT_DIR",
    "SOURCE_DJVU",
    "ParseResult",
    "TableSpan",
    "build_table_catalog",
    "parse_yaws1999",
    "resolve_table_path",
    "table_file_name",
    "write_index",
    "write_table",
]
