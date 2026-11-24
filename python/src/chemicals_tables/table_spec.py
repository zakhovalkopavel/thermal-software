"""
chemicals_tables.table_spec — One source table of the chemicals repository.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from chemicals_tables.property_column import PropertyColumn
from references import RefKey


@dataclass(frozen=True)
class TableSpec:
    """Table name, short file key, repo path, ref and column layout.

    ``key`` is the file key written in every value's ``ref`` tuple and listed in ``sources.json``.
    ``columns`` maps scalar columns to properties; it is empty for tables read by a dedicated
    parser. ``ref`` is ``None`` for the identifier databases.
    """

    name: str
    key: str
    path: str
    ref: Optional[RefKey]
    columns: dict[str, PropertyColumn] = field(default_factory=dict)
    cas_column: str = "CAS"
    label_column: Optional[str] = "Chemical"
    formula_column: Optional[str] = None
