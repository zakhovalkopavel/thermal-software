"""
chemical_formula.compound_class — Organic or inorganic, and the inorganic element folder.

Only carbon compounds can be organic, and elemental carbon (C, C60) is not. Whether a carbon compound
is organic comes from its structure (``organic_bonds.has_organic_bond``: C–H, C–halogen, and without
metals C–C or C–NH bonds or a carbon ring). Without a structure the formula decides: organic when it has no metal and
has H, a halogen or more than one carbon (CH4, CCl4, C2N2; not CO2, CS2, CaCO3, K4Fe(CN)6). Inorganic compounds go to their main
element (``main_element``): Al2O3 → Al, TiO2 → Ti, NH3 → N, NaCl → Na, CaCO3 → Ca, CO2 → C.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from typing import Iterable, Mapping, Optional, Union

from chemical_formula.constants.element_groups import HALOGENS, NONMETALS
from chemical_formula.formula_elements import ISOTOPES
from chemical_formula.main_element import main_element


def classify_compound(
    elements: Union[Mapping[str, float], Iterable[str]], organic: Optional[bool] = None,
) -> tuple[str, Optional[str]]:
    """``("organic", None)`` or ``("inorganic", <main element>)``.

    ``elements`` are element counts or just symbols (then one carbon is assumed by the formula rule).
    ``organic`` is the structure's answer (``has_organic_bond``, or a class override); None uses the formula rule.
    It is ignored for formulas without carbon and for elemental carbon.
    """
    symbols = {ISOTOPES.get(s, s) for s in elements}
    if not symbols:
        raise ValueError("no elements")
    if "C" in symbols and symbols != {"C"}:
        if organic is None:
            carbons = elements.get("C", 0) if isinstance(elements, Mapping) else 1
            organic = not (symbols - NONMETALS) and (bool(symbols & ({"H"} | HALOGENS)) or carbons > 1)
        if organic:
            return "organic", None
    return "inorganic", main_element(symbols)
