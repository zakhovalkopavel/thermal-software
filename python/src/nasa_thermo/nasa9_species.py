"""
nasa_thermo.nasa9_species — A single species entry from a NASA-9 database file.

Mirrors the TypeScript type in:
  backend/src/common/thermal/type/nasa9-equation.ts

Refs: docs/REFERENCES.md  [9] Burcat2005, [23] NASA9
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from nasa_thermo.nasa9_equation import Nasa9Equation


@dataclass
class Nasa9Species:
    """A single species entry parsed from a NASA-9 database file.

    Refs: docs/REFERENCES.md  [9] Burcat2005, [23] NASA9
    """

    name: str
    comment: str
    refCode: str
    phase: str          # "gas" | "condensed"
    MW: Optional[float]
    Hf298: float        # [J/mol]
    nasa9: Nasa9Equation

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "comment": self.comment,
            "refCode": self.refCode,
            "phase": self.phase,
            "MW": self.MW,
            "Hf298": self.Hf298,
            "nasa9": self.nasa9.to_dict(),
        }

