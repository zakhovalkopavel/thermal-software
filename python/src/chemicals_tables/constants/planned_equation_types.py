"""
chemicals_tables.constants.planned_equation_types — Types the dataset writes but the backend cannot evaluate yet.

Remove a type from this set when the backend adds it to ``EquationTypeDto``; the type-sync test
enforces this. Specified in docs/services/NEW_EQUATION_TYPES_SPEC.md.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

PLANNED_EQUATION_TYPES: frozenset[str] = frozenset({
    "dipprN114",
    "trcCp",
    "shomate",
    "zabranskySpline",
    "zabranskyQuasiPolynomial",
    "dipprN101",
    "ppds9",
    "ppds10",
    "ppds12",
    "dipprN106",
    "wagner25",
    "sutherland",
    "powerLaw",
})
