"""
chemicals_tables.parsers.tsv_reader — Read a chemicals tab-separated table with a header row.

The CRC constants file has a ``.csv`` name but is tab-separated like the others.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import csv
from pathlib import Path


def read_tsv(path: Path) -> list[tuple[int, dict[str, str]]]:
    """Rows as ``(line, {column: text})``; the header is line 1, so the first row is line 2.

    Cells are stripped; missing trailing cells are ``""``.
    """
    with path.open(encoding="utf-8", newline="") as fh:
        reader = csv.reader(fh, delimiter="\t", quoting=csv.QUOTE_NONE)
        header = [h.strip() for h in next(reader)]
        rows: list[tuple[int, dict[str, str]]] = []
        for line, cells in enumerate(reader, start=2):
            if not any(c.strip() for c in cells):
                continue
            cells = cells + [""] * (len(header) - len(cells))
            rows.append((line, {name: cells[i].strip() for i, name in enumerate(header)}))
    return rows
