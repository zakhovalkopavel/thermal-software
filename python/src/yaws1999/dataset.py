"""
yaws1999.dataset — Thin adapter over ``source_extract.tables``.

Applies Yaws column schemas, ``PAGE_OFFSET`` / ``REF_KEY``, and maps DjVu
provenance fields (``djvuPages`` / ``djvuPage``) to the library's generic
``sourcePages`` / ``sourcePage`` (and back for debug JSON).
"""
from __future__ import annotations

from typing import Any

from source_extract.tables.columns import (
    align_values,
    attach_column_units,
    coalesce_header_labels,
    column_keys,
    columns_from_header,
    expand_row as _expand_row,
    header_tokens,
    parse_equation_units,
)
from source_extract.tables.dataset import (
    pages_from_parsed as _pages_from_parsed,
    shape_columns as _shape_columns_generic,
    to_dataset_table as _to_dataset_table,
    to_debug_table as _to_debug_table,
)
from source_extract.tables.naming import dataset_file_name, debug_file_name, title_slug

from yaws1999.column_schemas import schema_for
from yaws1999.constants import PAGE_OFFSET, REF_KEY

__all__ = [
    "align_values",
    "attach_column_units",
    "coalesce_header_labels",
    "column_keys",
    "columns_from_header",
    "dataset_file_name",
    "debug_file_name",
    "expand_row",
    "header_tokens",
    "parse_equation_units",
    "title_slug",
    "to_dataset_table",
    "to_debug_table",
]


def _with_source_pages(parsed: dict[str, Any]) -> dict[str, Any]:
    """Copy ``parsed`` with DjVu page fields mapped to generic source page keys."""
    out = dict(parsed)
    if out.get("sourcePages") is None and out.get("djvuPages") is not None:
        out["sourcePages"] = out["djvuPages"]
    rows = []
    for row in out.get("rows") or []:
        mapped = dict(row)
        if mapped.get("sourcePage") is None and mapped.get("djvuPage") is not None:
            mapped["sourcePage"] = mapped["djvuPage"]
        rows.append(mapped)
    out["rows"] = rows
    return out


def _shape_columns(parsed: dict[str, Any]) -> list[dict[str, str | None]]:
    fixed = schema_for(parsed.get("id"))
    if fixed is not None:
        return fixed
    return _shape_columns_generic(parsed)


def expand_row(
    row: dict[str, Any],
    columns: list[dict[str, str | None]] | list[str],
    *,
    keep_debug: bool = False,
) -> dict[str, Any]:
    """Map a parser row onto named columns; debug keeps Yaws ``djvuPage``."""
    mapped = dict(row)
    if mapped.get("sourcePage") is None and mapped.get("djvuPage") is not None:
        mapped["sourcePage"] = mapped["djvuPage"]
    out = _expand_row(mapped, columns, keep_debug=keep_debug)
    if keep_debug and "sourcePage" in out:
        out["djvuPage"] = out.pop("sourcePage")
    return out


def to_dataset_table(parsed: dict[str, Any]) -> dict[str, Any]:
    """Public processed-table document (no OCR provenance)."""
    prepared = _with_source_pages(parsed)
    prepared["columns"] = _shape_columns(prepared)
    return _to_dataset_table(
        prepared,
        default_ref_key=REF_KEY,
        page_offset=PAGE_OFFSET,
    )


def to_debug_table(parsed: dict[str, Any]) -> dict[str, Any]:
    """Debug document: dataset fields + OCR provenance; Yaws ``djvu*`` keys."""
    prepared = _with_source_pages(parsed)
    prepared["columns"] = _shape_columns(prepared)
    doc = _to_debug_table(prepared, default_ref_key=REF_KEY)
    if doc.get("sourcePages") is not None:
        doc["djvuPages"] = doc.pop("sourcePages")
    elif parsed.get("djvuPages") is not None:
        doc["djvuPages"] = parsed["djvuPages"]
    for row in doc.get("rows") or []:
        if "sourcePage" in row:
            row["djvuPage"] = row.pop("sourcePage")
    return doc
