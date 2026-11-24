"""
compound_data.class_override — Compound class for one CAS number, with its reason.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ClassOverride:
    """Class (``organic`` / ``inorganic``) to use instead of the bond rule, and why."""

    compound_class: str
    reason: str
