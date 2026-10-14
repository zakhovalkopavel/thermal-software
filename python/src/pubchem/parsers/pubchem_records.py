"""
pubchem.parsers.pubchem_records — Read the PubChem class files (JSON Lines, one record per query key).

Records are appended as they are fetched, so a key fetched again has an older line too (in the same
file, or in another one when its class changed) until the fetch step removes it; the newest
``properties.retrieved`` wins, then the later line. A line cut off by an interrupted run is skipped.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Iterable, Iterator

from pubchem.pubchem_record import PubchemRecord

logger = logging.getLogger(__name__)


def iter_pubchem_records(path: Path, experimental: bool = True) -> Iterator[tuple[PubchemRecord, int]]:
    """(record, 1-based line) in file order; nothing when the file does not exist.

    ``experimental=False`` drops the experimental bodies (the build and the fetch planning need only
    which CIDs are done), which keeps a few hundred MB of files out of memory.
    """
    if not path.is_file():
        return
    with path.open(encoding="utf-8") as fh:
        for line, text in enumerate(fh, start=1):
            if not text.strip():
                continue
            try:
                yield PubchemRecord.from_json(json.loads(text), experimental), line
            except (ValueError, KeyError, TypeError):
                logger.warning("[pubchem] %s:%d: unreadable line skipped", path, line)


def read_pubchem_lines(locations: Iterable[tuple[Path, int]]) -> dict[tuple[Path, int], PubchemRecord]:
    """Full records (experimental bodies included) at the given (file, line) places; one pass per file."""
    wanted: dict[Path, set[int]] = {}
    for path, line in locations:
        wanted.setdefault(path, set()).add(line)
    found: dict[tuple[Path, int], PubchemRecord] = {}
    for path, lines in wanted.items():
        last = max(lines)
        with path.open(encoding="utf-8") as fh:
            for line, text in enumerate(fh, start=1):
                if line in lines:
                    found[(path, line)] = PubchemRecord.from_json(json.loads(text))
                if line >= last:
                    break
    return found


def read_pubchem_records(
    paths: Iterable[Path], experimental: bool = False,
) -> dict[str, tuple[PubchemRecord, Path, int]]:
    """Key (CAS, ``formula:<Hill>``, ``name:<name>``) → (newest record, its file, its 1-based line) over all ``paths``."""
    found: dict[str, tuple[PubchemRecord, Path, int]] = {}
    for path in paths:
        for record, line in iter_pubchem_records(path, experimental):
            old = found.get(record.key)
            if old is None or record.answer.retrieved >= old[0].answer.retrieved:
                found[record.key] = (record, path, line)
    return found
