"""
phase_diagrams.constants.oxide_molar_mass — Molar masses of the dataset oxides (g/mol).

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Conversion and comparison
"""
from __future__ import annotations

OXIDE_MOLAR_MASS: dict[str, float] = {
    "CaO": 56.077,
    "MgO": 40.304,
    "SiO2": 60.084,
    "Al2O3": 101.961,
    "Na2O": 61.979,
    "K2O": 94.196,
}
