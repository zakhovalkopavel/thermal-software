"""
pubchem.pubchem_records_writer — Append records to the PubChem class files and drop superseded lines.

A record is appended as soon as its query is done: the files grow to hundreds of MB, too big to rewrite
after every lookup. ``compact_pubchem_files`` (end of a fetch run) keeps only the newest line per query
key over all files, with the rule of ``read_pubchem_records``.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from pubchem.parsers.pubchem_records import read_pubchem_records
from pubchem.pubchem_record import PubchemRecord


def append_pubchem_record(path: Path, record: PubchemRecord) -> None:
    """One line per call, written in one piece; a line cut off by an interrupted run is closed first."""
    path.parent.mkdir(parents=True, exist_ok=True)
    prefix = "\n" if _ends_inside_a_line(path) else ""
    with path.open("a", encoding="utf-8") as fh:
        fh.write(prefix + json.dumps(record.to_json(), ensure_ascii=False) + "\n")


def compact_pubchem_files(paths: Iterable[Path]) -> int:
    """Rewrite the files that hold superseded or unreadable lines; returns the number of lines dropped."""
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
    return dropped


def _ends_inside_a_line(path: Path) -> bool:
    if not path.is_file() or path.stat().st_size == 0:
        return False
    with path.open("rb") as fh:
        fh.seek(-1, 2)
        return fh.read(1) != b"\n"
