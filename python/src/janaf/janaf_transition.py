"""
janaf.janaf_transition — Phase transition listed in a NIST-JANAF table.

Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class JanafTransition:
    """Transition row of a JANAF table, e.g. ``2130.0  CRYSTAL <--> LIQUID``.

    Refs: docs/REFERENCES.md  [36] NISTJANAF
    """

    T: float
    label: str

    def to_dict(self) -> dict:
        return {"T": self.T, "label": self.label}
