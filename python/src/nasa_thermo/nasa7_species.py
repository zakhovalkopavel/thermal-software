"""
nasa_thermo.nasa7_species — A single species entry from a NASA-7 database file.

Mirrors the TypeScript type in:
  backend/src/common/thermal/type/nasa7-equation.ts

Refs: docs/REFERENCES.md  [8] NASA7
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from nasa_thermo.nasa7_equation import Nasa7Equation


@dataclass
class Nasa7Species:
    """A single species entry parsed from a NASA-7 database file.

    Refs: docs/REFERENCES.md  [8] NASA7
    """

    name: str
    comment: str
    phase: str          # "G" | "S" | "L"
    MW: Optional[float]
    Tmin: Optional[float]
    Tmax: Optional[float]
    nasa7: Nasa7Equation

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "comment": self.comment,
            "phase": self.phase,
            "MW": self.MW,
            "Tmin": self.Tmin,
            "Tmax": self.Tmax,
            "nasa7": self.nasa7.to_dict(),
        }

