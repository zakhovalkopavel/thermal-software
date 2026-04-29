"""
nasa_thermo.nasa7_coeffs — Seven polynomial coefficients for one NASA-7 temperature range.

Refs: docs/REFERENCES.md  [8] NASA7
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Nasa7Coeffs:
    """Seven polynomial coefficients for one temperature range (NASA-7).

    Refs: docs/REFERENCES.md  [8] NASA7
    """

    a1: float
    a2: float
    a3: float
    a4: float
    a5: float
    a6: float
    a7: float

    def to_dict(self) -> dict:
        return {
            "a1": self.a1,
            "a2": self.a2,
            "a3": self.a3,
            "a4": self.a4,
            "a5": self.a5,
            "a6": self.a6,
            "a7": self.a7,
        }

