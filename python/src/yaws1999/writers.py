"""
yaws1999.writers — One JSON file per handbook table, plus an index.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from yaws1999.constants import REF_KEY, SOURCE_NAME, SOURCE_YEAR


def table_file_name(table_id: str, engine: str | None = None) -> str:
    """``2-1`` → ``table-2-1.json``; with engine → ``table-2-1.<engine>.json``."""
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
    """Pick the output path for a table JSON.

    Default: ``table-<id>.json`` (may overwrite).
    With ``no_replace``: keep an existing ``table-<id>.json`` and write
    ``table-<id>.<tag>.json`` instead (``tag`` is usually the Surya quant);
    return ``None`` if that file also exists.
    """
    directory = Path(directory)
    primary = directory / table_file_name(table_id)
    if not no_replace:
        return primary
    if not primary.is_file():
        return primary
    alt = directory / table_file_name(table_id, engine=engine)
    if alt.is_file():
        return None
    return alt


def write_table(directory: Path, table: dict[str, Any], path: Path | None = None) -> Path:
    """Write ``table-<id>.json`` (or ``path`` if given); returns the path written."""
    directory.mkdir(parents=True, exist_ok=True)
    target = path if path is not None else directory / table_file_name(str(table["id"]))
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(table, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return target


def write_index(
    directory: Path,
    tables: list[dict[str, Any]],
    source_path: str,
    *,
    merge_existing: bool = False,
) -> Path:
    """Write ``index.json`` listing every parsed table file.

    With ``merge_existing``, keep prior index entries whose ``file`` is not
    superseded by this run (so ``--no-replace`` quant variants stay alongside the primary).
    """
    directory.mkdir(parents=True, exist_ok=True)
    entries = [
        {
            "id": t["id"],
            "title": t.get("title"),
            "file": t.get("_file") or table_file_name(str(t["id"])),
            "engine": t.get("engine"),
            "djvuPages": t.get("djvuPages"),
            "rowCount": len(t.get("rows") or []),
            "unparsedCount": len(t.get("unparsed") or []),
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
    path = directory / "index.json"
    path.write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return path
