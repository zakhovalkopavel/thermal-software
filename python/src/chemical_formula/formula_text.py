"""
chemical_formula.formula_text — Element counts written as a formula in a given element order.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from typing import Iterable


def formula_text(counts: dict[str, float], order: Iterable[str]) -> str:
    """``{"Ti": 1, "O": 2}`` in order ``["Ti", "O"]`` → ``"TiO2"``; a count of 1 is left out, 2.75 stays."""
    return "".join(f"{e}{_count(counts[e])}" for e in order)


def _count(n: float) -> str:
    if n == 1:
        return ""
    if float(n).is_integer():
        return str(int(n))
    return f"{n:g}"
