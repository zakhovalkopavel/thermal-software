"""
chemicals_tables.constants.equation_type — Equation type names written into the dataset.

The first block mirrors ``EquationTypeDto`` in backend/src/common/thermal/dto/equation-type.dto.ts.
The second block are planned types (docs/services/NEW_EQUATION_TYPES_SPEC.md), also listed in
``PLANNED_EQUATION_TYPES`` until the backend implements them.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from enum import StrEnum


class EquationType(StrEnum):
    """Backend equation types, existing and planned."""

    linear                      = "linear"
    quadratic                   = "quadratic"
    cubic                       = "cubic"
    quartic                     = "quartic"
    linearHyperbolic            = "linearHyperbolic"
    linearHyperbolicLogarithmic = "linearHyperbolicLogarithmic"
    alyLee                      = "alyLee"
    dipprN102                   = "dipprN102"
    nasa7                       = "nasa7"
    nasa9                       = "nasa9"

    dipprN114                   = "dipprN114"
    trcCp                       = "trcCp"
    shomate                     = "shomate"
    zabranskySpline             = "zabranskySpline"
    zabranskyQuasiPolynomial    = "zabranskyQuasiPolynomial"
    dipprN101                   = "dipprN101"
    ppds9                       = "ppds9"
    ppds10                      = "ppds10"
    ppds12                      = "ppds12"
    dipprN106                   = "dipprN106"
    wagner25                    = "wagner25"
