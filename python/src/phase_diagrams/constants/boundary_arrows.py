"""
phase_diagrams.constants.boundary_arrows — Allowed values of a boundary-curve ``arrows`` entry (one per path segment).

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Ternary curves config
"""
from __future__ import annotations

BOUNDARY_ARROWS: tuple[str, ...] = (">", "<", "<>", "?")
