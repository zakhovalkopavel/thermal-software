"""
nasa_thermo.nasa9_range — One temperature interval in a NASA-9 species entry.

Refs: docs/REFERENCES.md  [9] Burcat2005, [23] NASA9
"""
from __future__ import annotations

from dataclasses import dataclass

from nasa_thermo.nasa9_coeffs import Nasa9Coeffs


@dataclass
class Nasa9Range:
    """One temperature interval in a NASA-9 species entry.

    H0 = H°(298.15) − H°(0) [J/mol] — metadata stored for cross-validation only;
    it is NOT part of Nasa9Coeffs and must not be copied into TypeScript compounds.

    Refs: docs/REFERENCES.md  [9] Burcat2005, [23] NASA9
    """

    Tmin: float
    Tmax: float
    H0: float
    coeffs: Nasa9Coeffs

    def to_dict(self) -> dict:
        return {
            "Tmin": self.Tmin,
            "Tmax": self.Tmax,
            "H0": self.H0,
            "coeffs": self.coeffs.to_dict(),
        }

