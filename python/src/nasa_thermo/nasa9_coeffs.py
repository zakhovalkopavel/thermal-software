"""
nasa_thermo.nasa9_coeffs — Nine polynomial coefficients for one NASA-9 temperature interval.

Refs: docs/REFERENCES.md  [9] Burcat2005, [23] NASA9
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Nasa9Coeffs:
    """Nine coefficients for one NASA-9 temperature interval.

    a1–a7:  polynomial coefficients
    a8:     integration constant b1 (encodes Hf°)
    a9:     integration constant b2 (encodes S°)

    Refs: docs/REFERENCES.md  [9] Burcat2005, [23] NASA9
    """

    a1: float
    a2: float
    a3: float
    a4: float
    a5: float
    a6: float
    a7: float
    a8: float
    a9: float

    def to_dict(self) -> dict:
        return {
            "a1": self.a1, "a2": self.a2, "a3": self.a3,
            "a4": self.a4, "a5": self.a5, "a6": self.a6,
            "a7": self.a7, "a8": self.a8, "a9": self.a9,
        }

