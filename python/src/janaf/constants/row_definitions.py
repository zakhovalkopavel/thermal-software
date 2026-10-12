"""
janaf.constants.row_definitions — What each JANAF row column holds (the ``$comment`` of ``units.json``).

Standard state p° = 0.1 MPa (1 bar), Tr = 298.15 K (NIST-JANAF 4th ed., introduction).

Spec: docs/scripts/JANAF_PARSER_SPEC.md
Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

JANAF_ROW_DEFINITIONS: dict[str, str] = {
    "T": "temperature",
    "Cp": "standard molar heat capacity at constant pressure, Cp°",
    "S": "standard molar entropy, S°",
    "gef": "Gibbs energy function, -[G° - H°(Tr)]/T",
    "dH": "enthalpy increment, H° - H°(Tr)",
    "dfH": "standard molar enthalpy of formation from the elements in their reference states, ΔfH°",
    "dfG": "standard molar Gibbs energy of formation from the elements in their reference states, ΔfG°",
    "logKf": "decimal logarithm of the equilibrium constant of formation, log Kf",
    "note": "text found in place of dfH, dfG and logKf (e.g. 'CRYSTAL <--> LIQUID', 'TRANSITION'); no unit",
}
