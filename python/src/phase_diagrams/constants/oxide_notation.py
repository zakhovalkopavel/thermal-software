"""
phase_diagrams.constants.oxide_notation — Oxide letters of the cement notation used in compounds.json (CaO → C).

Spec: docs/scripts/phase-diagrams/WORKFLOW.md § New ternary system
"""
from __future__ import annotations

OXIDE_NOTATION: dict[str, str] = {
    "CaO": "C", "Al2O3": "A", "SiO2": "S", "MgO": "M", "Na2O": "N", "K2O": "K",
    "TiO2": "T", "Fe2O3": "F", "ZrO2": "Z",
}
