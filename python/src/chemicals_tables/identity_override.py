"""
chemicals_tables.identity_override — CAS and formula for one source row that has neither, with its reason.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class IdentityOverride:
    """Identity of a row the parsers cannot resolve (pseudo-CAS, CAS ``None``), and why.

    ``variant`` is written next to the value's ``ref``; ``smiles`` is used when no identifier
    database has the compound (organic family).
    """

    formula: str
    reason: str
    cas: Optional[str] = None
    variant: Optional[str] = None
    smiles: Optional[str] = None
