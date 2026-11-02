"""
compound_data.parsers.book_gas_equations — ``shared/sources/book-gas-equations.json`` → source entries.

Each row is already a backend equation (type, vars, min, max, optional k). The ``line`` field is the
book citation line kept in ``ref: [RefKey, line, fileKey]``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

from chemical_formula.formula_elements import formula_elements
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_entry import SourceEntry
from chemicals_tables.source_link import SourceLink
from chemicals_tables.table_spec import TableSpec
from compound_data.constants.book_gas_source import BOOK_GAS_TABLES

logger = logging.getLogger(__name__)


@dataclass
class BookGasEquations:
    """Parsed entries, report issues and the tables that were read."""

    entries: list[SourceEntry] = field(default_factory=list)
    issues: list[dict[str, Any]] = field(default_factory=list)
    tables: list[TableSpec] = field(default_factory=list)


def parse_book_gas_equations(path: Path) -> BookGasEquations:
    """Read the hand-moved book gas equations."""
    data = json.loads(path.read_text(encoding="utf-8"))
    out = BookGasEquations()
    for table in data.get("tables", []):
        table_id = table.get("id")
        spec = BOOK_GAS_TABLES.get(table_id)
        if spec is None:
            out.issues.append(report_issue("bookGasUnknownTable", table_id, None, None, table.get("title")))
            continue
        out.tables.append(spec)
        for row in table.get("rows", []):
            entry = _row(spec, row)
            if entry is None:
                out.issues.append(report_issue(
                    "bookGasRowSkipped", spec.name, row.get("line"), row.get("cas"), row.get("name") or row.get("formula"),
                ))
                continue
            out.entries.append(entry)
    return out


def _row(spec: TableSpec, row: dict[str, Any]) -> Optional[SourceEntry]:
    try:
        type_ = EquationType(row["type"])
    except (KeyError, ValueError):
        return None
    prop, phase = row.get("property"), row.get("phase")
    vars_ = row.get("vars")
    if not prop or not phase or not isinstance(vars_, dict):
        return None
    formula = _formula(row.get("formula"))
    label = row.get("name") or row.get("formula") or formula
    link = SourceLink(
        table=spec.name, key=spec.key, url="", ref=spec.ref, line=row.get("line"), label=label,
    )
    return SourceEntry(
        cas=row.get("cas"), formula=formula, label=label, property=prop, phase=phase,
        value=EquationValue(
            type=type_, ref=spec.ref, vars=vars_, min=row.get("min"), max=row.get("max"),
            source=link, k=row.get("k"),
        ),
    )


def _formula(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    try:
        formula_elements(text)
    except ValueError:
        return None
    return text
