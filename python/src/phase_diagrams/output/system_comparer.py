"""
phase_diagrams.output.system_comparer — Compare a candidate system file with the dataset file.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Candidates, comparison and promotion
"""
from __future__ import annotations

import json

import numpy as np

from phase_diagrams.constants.comparison_tolerance import COMPARISON_TOLERANCE
from phase_diagrams.models.system_comparison import SystemComparison

_INVARIANT_KEYS = ("type", "reaction", "phases", "temperature_C", "liquid_wt", "secondLiquid_wt", "status")


def compare_systems(old: dict, new: dict) -> SystemComparison:
    """Invariants must be identical (values, status, NBS sources); curves within ±3 °C and ±0.2 wt%.

    A curve point is within tolerance when the new curve passes through the box
    ±0.2 wt% × ±3 °C around it. Ternary ``polyline_wt`` changes are listed as notes.
    """
    result = SystemComparison()
    _compare_invariants(old.get("invariantPoints", []), new.get("invariantPoints", []), result)
    _compare_liquidus(old.get("liquidus", []), new.get("liquidus", []), result)
    if "liquidImmiscibility" in old or "liquidImmiscibility" in new:
        dome_old = (old.get("liquidImmiscibility") or {}).get("boundary", [])
        dome_new = (new.get("liquidImmiscibility") or {}).get("boundary", [])
        outside = _outside_box(dome_old, dome_new)
        if outside:
            result.differences.append(f"miscibility dome: {len(outside)} points outside the box, e.g. {outside[:3]}")
        branches_old = (old.get("liquidImmiscibility") or {}).get("polylines_wt")
        branches_new = (new.get("liquidImmiscibility") or {}).get("polylines_wt")
        if branches_old != branches_new:
            action = "filled" if branches_old is None else "replaced"
            result.notes.append(f"liquidImmiscibility: {len(branches_new or [])} branches {action}")
    for key in ("boundaryCurves", "isotherms", "inversions"):
        _compare_polylines(key, old.get(key, []), new.get(key, []), result)
    return result


def _compare_invariants(old: list[dict], new: list[dict], result: SystemComparison) -> None:
    old_ids, new_ids = [p["id"] for p in old], [p["id"] for p in new]
    if old_ids != new_ids:
        result.differences.append(f"invariant ids: {old_ids} → {new_ids}")
    new_by_id = {p["id"]: p for p in new}
    for a in old:
        b = new_by_id.get(a["id"])
        if b is None:
            continue
        for key in _INVARIANT_KEYS:
            if a.get(key) != b.get(key):
                result.differences.append(f"{a['id']}.{key}: {json.dumps(a.get(key))} → {json.dumps(b.get(key))}")
        if a.get("sources", [])[1:] != b.get("sources", [])[1:]:
            result.differences.append(f"{a['id']}: NBS sources differ")
        if a.get("sources", [])[:1] != b.get("sources", [])[:1]:
            result.notes.append(f"{a['id']}: atlas source text or pixel changed")


def _compare_liquidus(old: list[dict], new: list[dict], result: SystemComparison) -> None:
    def key(branch: dict) -> tuple:
        return branch["phase"], branch["from"], branch["to"]

    if [key(b) for b in old] != [key(b) for b in new]:
        result.differences.append(f"liquidus branches: {[key(b) for b in old]} → {[key(b) for b in new]}")
        return
    for a, b in zip(old, new):
        outside = _outside_box(a["points"], b["points"])
        if outside:
            result.differences.append(
                f"liquidus {a['phase']} {a['from']} → {a['to']}: {len(outside)} points outside the box, e.g. {outside[:3]}"
            )


def _compare_polylines(key: str, old: list[dict], new: list[dict], result: SystemComparison) -> None:
    if len(old) != len(new):
        result.differences.append(f"{key}: {len(old)} → {len(new)} entries")
        return
    filled = changed = 0
    for a, b in zip(old, new):
        if a.get("polyline_wt") == b.get("polyline_wt"):
            continue
        if a.get("polyline_wt") is None:
            filled += 1
        else:
            changed += 1
    if filled or changed:
        result.notes.append(f"{key}: {filled} polylines filled, {changed} replaced")


def _outside_box(old_points: list, new_points: list) -> list:
    if not new_points:
        return [list(p) for p in old_points]
    tolerance_wt = COMPARISON_TOLERANCE["composition_wt"]
    tolerance_c = COMPARISON_TOLERANCE["temperature_C"]
    w = np.array([p[0] for p in new_points], float)
    t = np.array([p[1] for p in new_points], float)
    outside = []
    for wt, temperature in old_points:
        window = np.linspace(wt - tolerance_wt, wt + tolerance_wt, 41)
        window = window[(window >= w.min()) & (window <= w.max())]
        if len(window) == 0 or np.min(np.abs(np.interp(window, w, t) - temperature)) > tolerance_c:
            outside.append([wt, temperature])
    return outside
