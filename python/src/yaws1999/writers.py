"""
yaws1999.writers — Thin adapter over ``source_extract.tables.export``.

Injects Yaws ``REF_KEY`` / ``SOURCE_NAME`` / ``SOURCE_YEAR`` into the index.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from source_extract.tables.export import (
    load_table,
    resolve_dataset_path,
    write_dataset_table as _write_dataset_table,
    write_debug_table as _write_debug_table,
    write_index as _write_index,
    write_json,
)
from source_extract.tables.naming import dataset_file_name, debug_file_name

from yaws1999.constants import REF_KEY, SOURCE_NAME, SOURCE_YEAR

__all__ = [
    "dataset_file_name",
    "debug_file_name",
    "load_table",
    "resolve_dataset_path",
    "resolve_table_path",
    "table_file_name",
    "write_dataset_table",
    "write_debug_table",
    "write_index",
    "write_json",
    "write_table",
]


def write_dataset_table(directory: Path, table: dict[str, Any], path: Path | None = None) -> Path:
    """Write the public dataset JSON; returns the path written."""
    return _write_dataset_table(directory, table, path=path)


def write_debug_table(directory: Path, table: dict[str, Any], path: Path | None = None) -> Path:
    """Write the debug JSON (OCR provenance); returns the path written."""
    return _write_debug_table(directory, table, path=path)


def write_index(
    directory: Path,
    tables: list[dict[str, Any]],
    source_path: str,
    *,
    merge_existing: bool = False,
) -> Path:
    """Write ``index.json`` listing every parsed table file (Yaws source metadata)."""
    return _write_index(
        directory,
        tables,
        source_path,
        ref_key=REF_KEY,
        source_name=SOURCE_NAME,
        source_year=SOURCE_YEAR,
        merge_existing=merge_existing,
    )


# Back-compat aliases used by older tests / imports.
def table_file_name(table_id: str, engine: str | None = None) -> str:
    """Deprecated: prefer ``dataset_file_name(title, table_id)``."""
    if engine:
        return f"table-{table_id}.{engine}.json"
    return f"table-{table_id}.json"


def resolve_table_path(
    directory: Path,
    table_id: str,
    engine: str,
    *,
    no_replace: bool = False,
) -> Path | None:
    """Deprecated wrapper around ``resolve_dataset_path`` without a title."""
    return resolve_dataset_path(
        directory, None, table_id, tag=engine, no_replace=no_replace,
    )


def write_table(directory: Path, table: dict[str, Any], path: Path | None = None) -> Path:
    """Deprecated: writes whatever document is passed (use write_dataset_table)."""
    return write_dataset_table(directory, table, path=path)
