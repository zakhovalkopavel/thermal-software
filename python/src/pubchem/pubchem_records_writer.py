"""
pubchem.pubchem_records_writer — Append records to the PubChem class files and drop superseded lines.

A record is appended as soon as its query is done. Experimental sources are registered into
``pubchem-references.jsonl`` (stable ``refNumber`` 1, 2, 3, …) and citation rows are rewritten with
that index before the compound line is stored.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path
from typing import Iterable, Optional

from pubchem.parsers.pubchem_records import read_pubchem_records
from pubchem.pubchem_record import PubchemRecord
from pubchem.pubchem_references import (
    append_pubchem_references, compact_pubchem_references, pubchem_references_path, register_sources,
)


def append_pubchem_record(path: Path, record: PubchemRecord,
                          references_path: Optional[Path] = None) -> None:
    """Register experimental sources, then append one compound line."""
    refs_path = references_path or pubchem_references_path(path.parent)
    experimental = []
    new_rows: list[dict] = []
    for view in record.experimental:
        needs_register = view.references or any(c.source for p in view.values for c in p.citation)
        if needs_register:
            values, rows = register_sources(refs_path, view.values, view.references)
            experimental.append(replace(view, values=values, references=tuple(rows)))
            new_rows.extend(rows)
            if rows:
                append_pubchem_references(refs_path, rows)
        else:
            experimental.append(view)
    record = replace(record, experimental=tuple(experimental))

    path.parent.mkdir(parents=True, exist_ok=True)
    prefix = "\n" if _ends_inside_a_line(path) else ""
    with path.open("a", encoding="utf-8") as fh:
        fh.write(prefix + json.dumps(record.to_json(), ensure_ascii=False) + "\n")


def compact_pubchem_files(paths: Iterable[Path]) -> int:
    """Rewrite class files that hold superseded lines; compact references without renumbering."""
    paths = [p for p in paths if p.is_file()]
    newest = read_pubchem_records(paths)
    keep: dict[Path, set[int]] = {p: set() for p in paths}
    for _, path, line in newest.values():
        keep[path].add(line)
    dropped = 0
    for path in paths:
        with path.open(encoding="utf-8") as fh:
            total = sum(1 for text in fh if text.strip())
        if total == len(keep[path]):
            continue
        dropped += total - len(keep[path])
        tmp = path.with_suffix(path.suffix + ".tmp")
        with path.open(encoding="utf-8") as src, tmp.open("w", encoding="utf-8") as dst:
            for line, text in enumerate(src, start=1):
                if line in keep[path]:
                    dst.write(text if text.endswith("\n") else text + "\n")
        tmp.replace(path)
    if paths:
        dropped += compact_pubchem_references(pubchem_references_path(paths[0].parent))
    return dropped


def _ends_inside_a_line(path: Path) -> bool:
    if not path.is_file() or path.stat().st_size == 0:
        return False
    with path.open("rb") as fh:
        fh.seek(-1, 2)
        return fh.read(1) != b"\n"
