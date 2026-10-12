"""
chemicals_tables.constants.planned_equation_types — Types the dataset writes but the backend cannot evaluate yet.

Add a type here when the dataset starts writing it before the backend adds it to ``EquationTypeDto``,
and remove it once the backend implements it; the type-sync test enforces this. Planned types are
specified in docs/services/NEW_EQUATION_TYPES_SPEC.md. Currently empty: every written type is implemented.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

PLANNED_EQUATION_TYPES: frozenset[str] = frozenset()
