"""
yaws1999.writers — Thin adapter over ``source_extract.tables.export``.

Injects Yaws ``REF_KEY`` / ``SOURCE_NAME`` / ``SOURCE_YEAR`` into the index.
Public table JSON lives under ``<processed>/tables/``; ``index.json`` stays at
the processed root.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from source_extract.tables.export import (
    load_table,
    resolve_dataset_path as _resolve_dataset_path,
    write_dataset_table as _write_dataset_table,
    write_debug_table as _write_debug_table,
    write_index as _write_index,
    write_json,
)
from source_extract.tables.naming import dataset_file_name, debug_file_name

from yaws1999.constants import REF_KEY, SOURCE_NAME, SOURCE_YEAR

__all__ = [
    "TABLES_SUBDIR",
    "dataset_file_name",
    "debug_file_name",
    "load_table",
    "migrate_root_tables",
    "purge_legacy_short_table_files",
    "resolve_dataset_path",
    "resolve_table_path",
    "table_file_name",
    "tables_directory",
    "write_dataset_table",
    "write_debug_table",
    "write_index",
    "write_json",
    "write_table",
]

TABLES_SUBDIR = "tables"
_TABLE_JSON = re.compile(r"(?:_\(table_\d+-\d+\)|\Atable-\d+-\d+)", re.I)
_SHORT_TABLE_JSON = re.compile(r"^table-(\d+-\d+)(?:\..+)?\.json$", re.I)
_SLUG_TABLE_JSON = re.compile(r"_\(table_(\d+-\d+)\)(?:\..+)?\.json$", re.I)


def tables_directory(processed_root: Path | str) -> Path:
    """``<processed>/tables`` for final handbook table JSON."""
    return Path(processed_root) / TABLES_SUBDIR


def resolve_dataset_path(
    directory: Path | str,
    title: str | None,
    table_id: str,
    tag: str | None = None,
    *,
    no_replace: bool = False,
) -> Path | None:
    """Resolve path under ``<directory>/tables/``."""
    return _resolve_dataset_path(
        tables_directory(directory),
        title,
        table_id,
        tag=tag,
        no_replace=no_replace,
    )


def write_dataset_table(
    directory: Path,
    table: dict[str, Any],
    path: Path | None = None,
) -> Path:
    """Write the public dataset JSON under ``tables/``; returns the path written."""
    return _write_dataset_table(tables_directory(directory), table, path=path)


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
    # Prefer paths relative to the processed root (``tables/…``).
    normalized: list[dict[str, Any]] = []
    root = Path(directory)
    for table in tables:
        item = dict(table)
        file_name = item.get("_file")
        if not file_name:
            name = dataset_file_name(item.get("title"), str(item["id"]))
            item["_file"] = f"{TABLES_SUBDIR}/{name}"
        elif not str(file_name).replace("\\", "/").startswith(f"{TABLES_SUBDIR}/"):
            item["_file"] = f"{TABLES_SUBDIR}/{Path(str(file_name)).name}"
        normalized.append(item)
    return _write_index(
        root,
        normalized,
        source_path,
        ref_key=REF_KEY,
        source_name=SOURCE_NAME,
        source_year=SOURCE_YEAR,
        merge_existing=merge_existing,
    )


def migrate_root_tables(processed_root: Path | str) -> list[tuple[Path, Path]]:
    """Move legacy root-level ``*(table_*).json`` into ``tables/``; fix index paths."""
    root = Path(processed_root)
    dest_dir = tables_directory(root)
    dest_dir.mkdir(parents=True, exist_ok=True)
    moves: list[tuple[Path, Path]] = []
    for src in sorted(root.iterdir()):
        if not src.is_file() or src.suffix != ".json":
            continue
        if src.name == "index.json":
            continue
        if not _TABLE_JSON.search(src.name):
            continue
        dest = dest_dir / src.name
        if dest.resolve() == src.resolve():
            continue
        if dest.is_file():
            src.unlink(missing_ok=True)
            moves.append((src, dest))
            continue
        src.replace(dest)
        moves.append((src, dest))

    index_path = root / "index.json"
    if index_path.is_file():
        try:
            index = json.loads(index_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            index = {}
        changed = False
        for entry in index.get("tables") or []:
            name = entry.get("file")
            if not name:
                continue
            rel = str(name).replace("\\", "/")
            if not rel.startswith(f"{TABLES_SUBDIR}/"):
                entry["file"] = f"{TABLES_SUBDIR}/{Path(rel).name}"
                changed = True
        if changed:
            write_json(index_path, index)
    return moves


def purge_legacy_short_table_files(processed_root: Path | str) -> list[Path]:
    """Remove ``tables/table-X-Y.json`` when a slug ``*_(table_X-Y).json`` exists.

    Also drops short variants such as ``table-1-1.text.json``. Processed keeps
    only the slug-named final for each table id.
    """
    root = Path(processed_root)
    tables_dir = tables_directory(root)
    if not tables_dir.is_dir():
        return []

    slug_ids: set[str] = set()
    for path in tables_dir.glob("*.json"):
        match = _SLUG_TABLE_JSON.search(path.name)
        if match:
            slug_ids.add(match.group(1))

    removed: list[Path] = []
    for path in sorted(tables_dir.glob("table-*.json")):
        match = _SHORT_TABLE_JSON.match(path.name)
        if not match:
            continue
        table_id = match.group(1)
        if table_id not in slug_ids:
            continue
        path.unlink(missing_ok=True)
        removed.append(path)

    if not removed:
        return removed

    index_path = root / "index.json"
    if index_path.is_file():
        try:
            index = json.loads(index_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return removed
        removed_names = {p.name for p in removed}
        tables = list(index.get("tables") or [])
        filtered = []
        changed = False
        for entry in tables:
            name = Path(str(entry.get("file") or "")).name
            if name in removed_names:
                changed = True
                continue
            filtered.append(entry)
        if changed:
            index["tables"] = filtered
            write_json(index_path, index)
    return removed


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
