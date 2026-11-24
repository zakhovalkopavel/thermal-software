"""
compound_data.equation_check — Evaluate every dataset equation for the build report.

Flags values that are non-positive or non-finite at ``min``, ``max`` and 298.15 K, and formulas
that cannot be evaluated (τ ≤ 0). Zeros at T ≥ Tc are expected for ``ppds12`` and ``dipprN106``
and are not flagged. Each equation also gets one check point (mid-range, else 298.15 K) that the
backend implementation must reproduce.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md, docs/services/NEW_EQUATION_TYPES_SPEC.md
"""
from __future__ import annotations

import math
from typing import Any, Iterable

from chemicals_tables.equation_eval import evaluate_equation
from chemicals_tables.equation_value import EquationValue
from compound_data.compound_record import CompoundRecord

T_REF = 298.15
_ZERO_AT_TC = {"ppds12", "dipprN106"}


def check_equations(records: Iterable[CompoundRecord]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """``(issues, checks)``: one issue per bad point, one check point per equation."""
    issues: list[dict[str, Any]] = []
    checks: list[dict[str, Any]] = []
    for record in records:
        for prop, phases in sorted(record.equations.items()):
            for phase, values in sorted(phases.items()):
                for index, eq in enumerate(values):
                    where = {"id": record.id, "property": prop, "phase": phase, "index": index,
                             "type": eq.type.value, "ref": eq.ref.value, "line": eq.source.line}
                    issues.extend(_bad_points(eq, where))
                    check_t = (eq.min + eq.max) / 2 if eq.min is not None and eq.max is not None else T_REF
                    try:
                        value = _evaluate(eq, check_t)
                    except (ValueError, ZeroDivisionError, OverflowError) as exc:
                        value = None
                        issues.append({**where, "issue": "notEvaluated", "T": check_t, "error": str(exc)})
                    checks.append({**where, "T": check_t, "value": value if _finite(value) else None})
    return issues, checks


def _bad_points(eq: EquationValue, where: dict[str, Any]) -> list[dict[str, Any]]:
    issues = []
    points = {"min": eq.min, "max": eq.max, "T298": T_REF}
    tc = eq.vars.get("Tc") if isinstance(eq.vars, dict) else None
    if tc is not None and eq.max is not None and eq.max >= tc and eq.type.value in ("dipprN114", "zabranskyQuasiPolynomial"):
        issues.append({**where, "issue": "maxAtOrAboveTc", "max": eq.max, "Tc": tc})
    for name, T in points.items():
        if T is None:
            continue
        try:
            value = _evaluate(eq, T)
        except (ValueError, ZeroDivisionError, OverflowError) as exc:
            issues.append({**where, "issue": "notEvaluated", "at": name, "T": T, "error": str(exc)})
            continue
        clamped = min(max(T, eq.min if eq.min is not None else T), eq.max if eq.max is not None else T)
        if value == 0 and eq.type.value in _ZERO_AT_TC and tc is not None and clamped >= tc:
            continue
        if not _finite(value) or value <= 0:
            issues.append({**where, "issue": "nonPositiveOrNonFinite", "at": name, "T": T,
                           "value": value if _finite(value) else str(value)})
    return issues


def _evaluate(eq: EquationValue, T: float) -> float:
    return evaluate_equation(eq.type.value, T, eq.vars, eq.min, eq.max, eq.k)


def _finite(value: Any) -> bool:
    return isinstance(value, (int, float)) and math.isfinite(value)
