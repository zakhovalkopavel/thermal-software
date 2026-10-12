"""
chemical_formula.constants.element_groups — Element sets used by the classification and formula rules.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

NONMETALS: frozenset[str] = frozenset("""
H D T He B C N O F Ne Si P S Cl Ar Ge As Se Br Kr Sb Te I Xe At Rn
""".split())
"""Non-metals and metalloids; every other element counts as a metal (Mo2B → Mo, PbTe → Pb)."""

HALOGENS: frozenset[str] = frozenset({"F", "Cl", "Br", "I", "At"})

HYDROGENS: tuple[str, ...] = ("H", "D", "T")
"""Hydrogen and its isotope symbols, in citation order."""
