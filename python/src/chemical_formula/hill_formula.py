"""
chemical_formula.hill_formula — Hill notation of element counts.

With carbon: C, then H, then the rest alphabetically. Without carbon: all alphabetically.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from chemical_formula.formula_text import formula_text


def hill_formula(counts: dict[str, float]) -> str:
    """``{"Al": 2, "O": 3}`` → ``"Al2O3"``; ``{"O": 1, "C": 2, "H": 6}`` → ``"C2H6O"``."""
    if "C" in counts:
        order = ["C"] + (["H"] if "H" in counts else []) + sorted(e for e in counts if e not in ("C", "H"))
    else:
        order = sorted(counts)
    return formula_text(counts, order)
