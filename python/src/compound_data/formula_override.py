"""
compound_data.formula_override — Corrected formula for one CAS number, with its reason.

``formula`` must be parseable (stoichiometry for element counts). ``display_formula`` is the
conventional / structural form when it differs (``AlC`` vs Hill ``CAl``, ``(KCN)2`` vs ``C2K2N2``).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class FormulaOverride:
    """Formula to use instead of the identifier databases' one, and why."""

    formula: str
    reason: str
    display_formula: Optional[str] = None

    def standard(self) -> str:
        """Human-facing formula: conventional when set, else the parseable formula."""
        return self.display_formula or self.formula
