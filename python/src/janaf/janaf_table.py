"""
janaf.janaf_table — One NIST-JANAF table (one species in one phase set).

Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from janaf.janaf_row import JanafRow
from janaf.janaf_transition import JanafTransition


@dataclass
class JanafTable:
    """One JANAF table, identified by its NIST ID (e.g. ``O-045``).

    ``formula`` is the conventional formula from the table title (``TiO2``);
    ``janaf_formula`` is the JANAF formula from the header (``O2Ti1``).

    Refs: docs/REFERENCES.md  [36] NISTJANAF
    """

    table_id: str
    name: str
    formula: Optional[str]
    janaf_formula: str
    phase: Optional[str]
    label: Optional[str] = None
    rows: list[JanafRow] = field(default_factory=list)
    transitions: list[JanafTransition] = field(default_factory=list)

    @property
    def prefix(self) -> str:
        """JANAF ID prefix (``Al`` for ``Al-096``, ``O`` for ``O-045``)."""
        return self.table_id.rsplit("-", 1)[0]

    def to_dict(self) -> dict:
        return {
            "id": self.table_id,
            "name": self.name,
            "formula": self.formula,
            "janafFormula": self.janaf_formula,
            "phase": self.phase,
            "label": self.label,
            "rows": [row.to_dict() for row in self.rows],
            "transitions": [t.to_dict() for t in self.transitions],
        }
