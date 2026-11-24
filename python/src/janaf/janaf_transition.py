"""
janaf.janaf_transition — Phase transition listed in a NIST-JANAF table.

Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class JanafTransition:
    """Transition row of a JANAF table, e.g. ``2130.0  CRYSTAL <--> LIQUID``.

    ``line`` is the 1-based line of the row in the table file (row URL: ``lineUrl`` of ``sources.json``).

    Refs: docs/REFERENCES.md  [36] NISTJANAF
    """

    T: float
    label: str
    line: Optional[int] = None

    def to_dict(self) -> dict:
        out: dict = {"T": self.T, "label": self.label}
        if self.line is not None:
            out["line"] = self.line
        return out
