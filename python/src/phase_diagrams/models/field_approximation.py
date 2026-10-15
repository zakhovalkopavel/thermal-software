"""
phase_diagrams.models.field_approximation — Liquidus temperature surfaces of the primary fields of a ternary.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Field temperature approximation
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from phase_diagrams.models.temperature_point import TemperaturePoint


@dataclass
class FieldApproximation:
    """Field regions, fitted surfaces and what the overlay draws from them (page pixels).

    ``labels`` covers the page window starting at ``origin``: 0 outside every field,
    ``k`` for ``phases[k - 1]``. ``fits`` maps a phase with a surface to
    ``(control points, RMS, max |residual|)`` in °C. ``isotherms`` holds, per phase and
    isotherm temperature of that field, the approximated isotherm as line segments
    ``(x0, y0, x1, y1)``. ``points`` are the printed temperature points with the
    approximated values of their adjacent fields.
    """

    origin: tuple[int, int]
    labels: np.ndarray
    phases: list[str]
    fits: dict[str, tuple[int, float, float]] = field(default_factory=dict)
    isotherms: list[tuple[str, float, list[tuple[float, float, float, float]]]] = field(default_factory=list)
    points: list[TemperaturePoint] = field(default_factory=list)
    log: list[str] = field(default_factory=list)
