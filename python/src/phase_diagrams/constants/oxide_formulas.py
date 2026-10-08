"""
phase_diagrams.constants.oxide_formulas — Oxide formulas recognised in caption text, in order of preference.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § New ternary system
"""
from __future__ import annotations

OXIDE_FORMULAS: tuple[str, ...] = (
    "CaO", "MgO", "SiO2", "Al2O3", "Na2O", "K2O", "Li2O", "BaO", "SrO",
    "FeO", "Fe2O3", "Fe3O4", "MnO", "Mn2O3", "Mn3O4", "MnO2", "TiO2", "Ti2O3",
    "Cr2O3", "P2O5", "B2O3", "ZrO2", "PbO", "ZnO", "NiO", "CoO", "CuO", "Cu2O",
    "V2O5", "Nb2O5", "CeO2", "La2O3", "Y2O3", "SnO2", "WO3", "MoO3", "SO3", "CO2", "CaF2",
)
