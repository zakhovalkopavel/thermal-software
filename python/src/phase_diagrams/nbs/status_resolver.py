"""
phase_diagrams.nbs.status_resolver — Status of an atlas invariant from its NBS comparisons.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Status
"""
from __future__ import annotations

from phase_diagrams.models.nbs_comparison import NbsComparison


def resolve_status(comparisons: list[NbsComparison]) -> str:
    """``extracted`` without entries, ``confirmed`` if any entry is within tolerance, else ``conflict``."""
    if not comparisons:
        return "extracted"
    if any(c.within_tolerance for c in comparisons):
        return "confirmed"
    return "conflict"
