"""
compound_data.constants.formula_overrides — Formulas corrected by CAS, each with a cited reason.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [37] CRC95
"""
from __future__ import annotations

from compound_data.formula_override import FormulaOverride

FORMULA_OVERRIDES: dict[str, FormulaOverride] = {
    "12004-39-6": FormulaOverride(
        formula="Al2TiO5",
        reason=(
            'CRC name "Aluminum titanate" and pubchem synonym "al2tio5"; '
            "pubchem's own formula Al2O7Ti2 is a different stoichiometry"
        ),
    ),
}
