"""
nasa_thermo.nasa9_equation — NASA-9 multi-range polynomial equation.

Refs: docs/REFERENCES.md  [9] Burcat2005, [23] NASA9
"""
from __future__ import annotations

from dataclasses import dataclass, field

from nasa_thermo.nasa9_range import Nasa9Range


@dataclass
class Nasa9Equation:
    """NASA-9 equation: N ordered temperature ranges (Tmax[i] = Tmin[i+1]).

    Mirrors the TypeScript type in:
      backend/src/common/thermal/type/nasa9-equation.ts

    Refs: docs/REFERENCES.md  [9] Burcat2005, [23] NASA9
    """

    ranges: list[Nasa9Range] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {"ranges": [r.to_dict() for r in self.ranges]}

