"""
phase_diagrams.builders.auto_system_builder — Ternary system whose isotherms are only those found by the isotherm detector.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Isotherm detection
"""
from __future__ import annotations

import copy
import math

from phase_diagrams.models.isotherm_detection import IsothermDetection
from phase_diagrams.models.ternary_calibration import TernaryCalibration

_SAMPLE_PX = 10.0


def build_auto_system(system: dict, detection: IsothermDetection, calibration: TernaryCalibration) -> dict:
    """Copy of ``system`` with ``isotherms`` replaced by the detected pieces that have a temperature:
    ``field``, ``temperature_C``, ``inferred`` (when not read on the line), ``dashed`` and
    ``polyline_wt`` (the piece every ~10 px, 0.01 wt%). Boundaries, invariants and the rest are kept."""
    auto = copy.deepcopy(system)
    components = list(system["components"])
    isotherms = []
    for piece in detection.isotherms:
        if piece.temperature_C is None:
            continue
        entry: dict = {"field": piece.field, "temperature_C": piece.temperature_C}
        if piece.inferred is not None:
            entry["inferred"] = piece.inferred
        if piece.dashed:
            entry["dashed"] = True
        entry["polyline_wt"] = [{c: round(wt[c], 2) for c in components}
                                for wt in (calibration.to_wt(*p) for p in _sampled(piece.pixels))]
        isotherms.append(entry)
    auto["isotherms"] = isotherms
    return auto


def _sampled(pixels: list[tuple[float, float]]) -> list[tuple[float, float]]:
    kept = [pixels[0]]
    for p in pixels[1:-1]:
        if math.dist(p, kept[-1]) >= _SAMPLE_PX:
            kept.append(p)
    return kept + [pixels[-1]] if len(pixels) > 1 else kept
