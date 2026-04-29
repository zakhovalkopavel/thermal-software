"""
nasa_thermo.nasa7_equation — NASA-7 two-range polynomial equation.

Refs: docs/REFERENCES.md  [8] NASA7
"""
from __future__ import annotations

from dataclasses import dataclass

from nasa_thermo.nasa7_coeffs import Nasa7Coeffs


@dataclass
class Nasa7Equation:
    """NASA-7 equation: two polynomial ranges split at *Tswitch*.

    Refs: docs/REFERENCES.md  [8] NASA7
    """

    Tswitch: float
    low: Nasa7Coeffs
    high: Nasa7Coeffs

    def to_dict(self) -> dict:
        return {
            "Tswitch": self.Tswitch,
            "low": self.low.to_dict(),
            "high": self.high.to_dict(),
        }

