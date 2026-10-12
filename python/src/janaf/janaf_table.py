"""
janaf.janaf_table — One NIST-JANAF table (one species in one phase set).

Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from janaf.janaf_row import JanafRow
from janaf.janaf_transition import JanafTransition
from references import RefKey

TITLE_LINE = 1


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

    @property
    def ref(self) -> list:
        """``[RefKey, line, file]`` of the title line; the file key is the table ID (``sources.json`` → ``tableUrl``)."""
        return [RefKey.NISTJANAF.value, TITLE_LINE, self.table_id]

    def to_dict(self) -> dict:
        """Table entry keyed by ``table_id`` in the compound file; null and empty fields are left out."""
        out = {
            "name": self.name,
            "formula": self.formula,
            "janafFormula": self.janaf_formula,
            "phase": self.phase,
            "label": self.label,
            "ref": self.ref,
            "rows": [row.to_dict() for row in self.rows],
            "transitions": [t.to_dict() for t in self.transitions],
        }
        return {key: value for key, value in out.items() if value not in (None, [])}
