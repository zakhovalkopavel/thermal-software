"""
pubchem.pubchem_references — Rateable sources list for PubChem experimental values.

Each line is one source with a stable ``refNumber`` (1, 2, 3, …; gaps stay), a unique
informative ``refCode`` (work + edition/year; ``-2``, ``-3``, … when stems collide), and ``source``
(name / citation without page). Lines are ordered by ``refCode``. Optional ``url``, ISBN, etc.
No page — one source covers many values.

Compound properties store ``citation`` rows with that ``refNumber`` / ``refCode`` and optional
``refPage``.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import json
import logging
from dataclasses import replace
from pathlib import Path
from typing import Any, Iterable

from pubchem.constants.pubchem import PUBCHEM_REFERENCES_FILE
from pubchem.experimental_value import ExperimentalCitation, ExperimentalProperty
from pubchem.parsers.experimental_properties import normalize_source

logger = logging.getLogger(__name__)

# Fields that belong on values / are not part of the catalog row.
_DROP_FROM_CATALOG = frozenset({"page", "refPage", "citation"})


def pubchem_references_path(directory: Path) -> Path:
    return directory / PUBCHEM_REFERENCES_FILE


def register_sources(
    path: Path, properties: Iterable[ExperimentalProperty], pending: Iterable[dict[str, Any]],
) -> tuple[tuple[ExperimentalProperty, ...], list[dict[str, Any]]]:
    """Assign catalog ``refNumber`` / final ``refCode``; return updated properties and rows to append."""
    by_code, by_text, next_number = _catalog(path)
    new_rows: list[dict[str, Any]] = []
    for pending_row in pending:
        source = pending_row.get("source")
        if not isinstance(source, str) or not source.strip():
            continue
        text_key = normalize_source(source)
        if text_key in by_text:
            continue
        stem = str(pending_row.get("refCode") or "Lit")
        code = _allocate_code(stem, by_code)
        row = {k: v for k, v in pending_row.items() if v is not None and k not in _DROP_FROM_CATALOG}
        row["refCode"] = code
        row["refNumber"] = next_number
        row["source"] = source
        next_number += 1
        by_code[code] = row
        by_text[text_key] = row
        new_rows.append(row)

    updated: list[ExperimentalProperty] = []
    for prop in properties:
        citations: list[ExperimentalCitation] = []
        for cite in prop.citation:
            if not cite.source:
                citations.append(replace(cite, source=None))
                continue
            row = by_text.get(normalize_source(cite.source))
            if row is None:
                citations.append(replace(cite, source=None))
                continue
            citations.append(replace(
                cite,
                ref_code=row["refCode"],
                ref_number=int(row["refNumber"]),
                source=None,
            ))
        updated.append(replace(prop, citation=tuple(citations)))
    return tuple(updated), new_rows


def append_pubchem_references(path: Path, rows: Iterable[dict[str, Any]]) -> int:
    """Add source rows and keep the file ordered by ``refCode``. Returns how many were written."""
    rows = list(rows)
    if not rows:
        return 0
    path.parent.mkdir(parents=True, exist_ok=True)
    _write_rows(path, _read_rows(path) + rows)
    return len(rows)


def read_pubchem_references(path: Path) -> dict[str, dict[str, Any]]:
    """Rows keyed by ``refCode``; ``refNumber`` is filled from the file or from line order."""
    by_code, _, _ = _catalog(path)
    return by_code


def ref_code_order(row: dict[str, Any]) -> str:
    """Sort key for the references file."""
    return str(row.get("refCode") or "")


def compact_pubchem_references(path: Path) -> int:
    """Keep one line per ``refCode``, ordered by ``refCode``. ``refNumber`` stays as stored."""
    if not path.is_file():
        return 0
    by_code, _, _ = _catalog(path)
    current = _read_rows(path)
    ordered = sorted(by_code.values(), key=ref_code_order)
    same_order = [row.get("refCode") for row in current] == [row.get("refCode") for row in ordered]
    if len(current) == len(ordered) and same_order:
        return 0
    _write_rows(path, ordered)
    return len(current) - len(ordered)


def _catalog(path: Path) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]], int]:
    """``by_code``, ``by_source_text``, next ``refNumber``."""
    by_code: dict[str, dict[str, Any]] = {}
    by_text: dict[str, dict[str, Any]] = {}
    if not path.is_file():
        return by_code, by_text, 1
    sequential = 0
    with path.open(encoding="utf-8") as fh:
        for line, text in enumerate(fh, start=1):
            text = text.strip()
            if not text:
                continue
            try:
                row = json.loads(text)
                if not isinstance(row, dict) or not row.get("refCode"):
                    raise ValueError("missing refCode")
            except (ValueError, TypeError):
                logger.warning("[pubchem] %s:%d: unreadable reference line skipped", path, line)
                continue
            sequential += 1
            if "refNumber" not in row:
                row = {**row, "refNumber": sequential}
            code = str(row["refCode"])
            by_code[code] = row
            source = row.get("source")
            if isinstance(source, str) and source.strip():
                by_text[normalize_source(source)] = row
    next_number = max((int(r["refNumber"]) for r in by_code.values()), default=0) + 1
    return by_code, by_text, next_number


def _allocate_code(stem: str, by_code: dict[str, dict[str, Any]]) -> str:
    if stem not in by_code:
        return stem
    index = 2
    while f"{stem}-{index}" in by_code:
        index += 1
    return f"{stem}-{index}"


def _read_rows(path: Path) -> list[dict[str, Any]]:
    if not path.is_file():
        return []
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as fh:
        for text in fh:
            text = text.strip()
            if text:
                rows.append(json.loads(text))
    return rows


def _write_rows(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as fh:
        for row in sorted(rows, key=ref_code_order):
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")
    tmp.replace(path)
