"""
compound_data.pubchem_sources — The PubChem class files as the build reads them, once for all PubChem steps.

The newest record per query key (CAS, ``formula:<Hill>``) without the experimental bodies, and the
``idPubchemRest<Class>`` table of each file (``sources.json`` key, ``[line, key]`` refs).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path

from chemicals_tables.table_spec import TableSpec
from compound_data.constants.pubchem_source import PUBCHEM_TABLES
from pubchem.parsers.pubchem_records import read_pubchem_records
from pubchem.pubchem_paths import pubchem_files
from pubchem.pubchem_record import PubchemRecord

logger = logging.getLogger(__name__)


@dataclass
class PubchemSources:
    """``records``: key → (record, file, 1-based line); ``tables``: file → its table."""

    records: dict[str, tuple[PubchemRecord, Path, int]] = field(default_factory=dict)
    tables: dict[Path, TableSpec] = field(default_factory=dict)

    def find(self, key: str) -> tuple[PubchemRecord, TableSpec, int] | None:
        """(record, table, line) of ``key``, or None when it was not fetched."""
        if key not in self.records:
            return None
        record, path, line = self.records[key]
        return record, self.tables[path], line


def read_pubchem_sources(pubchem_dir: Path) -> PubchemSources:
    """Every class file under ``pubchem_dir``; empty with a warning when there is none."""
    files = {cls: path for cls, path in pubchem_files(pubchem_dir).items() if path.is_file()}
    if not files:
        logger.warning("[pubchem] No pubchem-<class>.jsonl in %s — run make compound-data-pubchem", pubchem_dir)
        return PubchemSources()
    tables = {path: _table(cls, path) for cls, path in files.items()}
    return PubchemSources(read_pubchem_records(files.values()), tables)


def _table(cls: str, path: Path) -> TableSpec:
    spec = PUBCHEM_TABLES[cls]
    return TableSpec(spec.name, spec.key, str(path), None, label_column=None)
