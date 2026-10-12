"""
compound_data.formula_override — Corrected formula for one CAS number, with its reason.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class FormulaOverride:
    """Formula to use instead of the identifier databases' one, and why."""

    formula: str
    reason: str
