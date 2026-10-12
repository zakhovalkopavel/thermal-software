"""
chemical_formula.main_element — Element folder of an inorganic compound.

H is ignored unless nothing else is left, and O too unless only F is left besides it; of the rest,
metals come before non-metals and metalloids, then the least electronegative (Pauling) wins:
Al2O3 → Al, TiO2 → Ti, NH3 and N2H4 → N, H2SO4 → S, CaCO3 → Ca, MgAl2O4 → Mg, HCl → Cl,
CO2 → C, SiC → Si, Mo2B → Mo, H2O → O, OF2 → O, H2 → H.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import math
from typing import Iterable

from chemical_formula.constants.electronegativity import PAULING_ELECTRONEGATIVITY
from chemical_formula.constants.element_groups import NONMETALS
from chemical_formula.formula_elements import ISOTOPES


def main_element(elements: Iterable[str]) -> str:
    """Folder element of a formula's elements (isotope symbols count as their element)."""
    symbols = {ISOTOPES.get(s, s) for s in elements}
    if not symbols:
        raise ValueError("no elements")
    ignored = {"H", "O"} if symbols - {"H", "O", "F"} else {"H"}
    candidates = (symbols - ignored) or symbols
    metals = {s for s in candidates if s not in NONMETALS}
    return min(metals or candidates, key=lambda s: (PAULING_ELECTRONEGATIVITY.get(s, math.inf), s))
