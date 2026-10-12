"""
janaf.janaf_classes — Class and folder of a JANAF table, from the compound-data index.

The compound-data build matched every JANAF table to a record (chemicals CAS index, else Hill formula)
and classified that record by its structure and the class overrides; ``index.json`` keeps both
(``janaf``, ``class``, ``group``). A table without a record (ions) takes the class of the record with its
neutral Hill formula.

Spec: docs/scripts/JANAF_PARSER_SPEC.md
Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)


class JanafClasses:
    """Table id / Hill formula → (class, group) of the compound-data record."""

    def __init__(self, compounds: Optional[dict[str, dict[str, Any]]] = None) -> None:
        self._by_table: dict[str, tuple[str, str]] = {}
        self._by_hill: dict[str, tuple[str, str]] = {}
        for record_id, entry in sorted((compounds or {}).items()):
            placement = (entry["class"], entry["group"])
            for table_id in entry.get("janaf", []):
                self._by_table.setdefault(table_id, placement)
            self._by_hill.setdefault(entry["hill"], placement)

    @classmethod
    def from_index(cls, path: Optional[Path]) -> "JanafClasses":
        """Read ``shared/processed/compound-data/index.json``; without it the formula rule classifies every table."""
        if path is None or not path.exists():
            logger.warning("No compound-data index (%s): JANAF tables are classified by formula only, "
                           "organic ones go to unclassified", path)
            return cls()
        return cls(json.loads(path.read_text(encoding="utf-8"))["compounds"])

    def lookup(self, table_id: str, neutral_hill: str) -> Optional[tuple[str, str]]:
        """(class, group) of the record listing the table, else of the record with the Hill formula, else None."""
        return self._by_table.get(table_id) or self._by_hill.get(neutral_hill)
