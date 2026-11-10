"""
yaws1999.writers — Dataset + debug JSON files and index.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from yaws1999.constants import REF_KEY, SOURCE_NAME, SOURCE_YEAR
from yaws1999.dataset import dataset_file_name, debug_file_name


def write_json(path: Path, document: dict[str, Any]) -> Path:
    """Write ``document`` as pretty JSON; returns ``path``."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(document, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return path


def resolve_dataset_path(
    directory: Path,
    title: str | None,
    table_id: str,
    tag: str | None = None,
    *,
    no_replace: bool = False,
) -> Path | None:
    """Pick the public dataset path for a table.

    Default: ``<Slug>_(table_<id>).json`` (may overwrite).
    With ``no_replace``: if primary exists, write ``…_(table_<id>).<tag>.json``;
    return ``None`` if that also exists.
    """
    directory = Path(directory)
    primary = directory / dataset_file_name(title, table_id)
    if not no_replace:
        return primary
    if not primary.is_file():
        return primary
    if not tag:
        return None
    stem = primary.name[: -len(".json")]
    alt = directory / f"{stem}.{tag}.json"
    if alt.is_file():
        return None
    return alt


def write_dataset_table(directory: Path, table: dict[str, Any], path: Path | None = None) -> Path:
    """Write the public dataset JSON; returns the path written."""
    directory = Path(directory)
    target = path or (directory / dataset_file_name(table.get("title"), str(table["id"])))
    return write_json(target, table)


def write_debug_table(directory: Path, table: dict[str, Any], path: Path | None = None) -> Path:
    """Write the debug JSON (OCR provenance); returns the path written."""
    directory = Path(directory)
    target = path or (directory / debug_file_name(table.get("title"), str(table["id"])))
    return write_json(target, table)


def write_index(
    directory: Path,
    tables: list[dict[str, Any]],
    source_path: str,
    *,
    merge_existing: bool = False,
) -> Path:
    """Write ``index.json`` listing every parsed table file."""
    directory.mkdir(parents=True, exist_ok=True)
    entries = [
        {
            "id": t["id"],
            "title": t.get("title"),
            "file": t.get("_file") or dataset_file_name(t.get("title"), str(t["id"])),
            "pages": t.get("pages"),
            "rowCount": len(t.get("rows") or []),
        }
        for t in tables
    ]
    if merge_existing:
        index_path = directory / "index.json"
        if index_path.is_file():
            try:
                prior = json.loads(index_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                prior = {}
            written = {e["file"] for e in entries}
            for old in prior.get("tables") or []:
                name = old.get("file")
                if name and name not in written:
                    entries.append(old)
            entries.sort(key=lambda e: (str(e.get("id") or ""), str(e.get("file") or "")))
    index = {
        "source": {
            "refKey": REF_KEY,
            "name": SOURCE_NAME,
            "year": SOURCE_YEAR,
            "path": source_path,
        },
        "tables": entries,
    }
    return write_json(directory / "index.json", index)


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
