"""
phase_diagrams.builders.isotherm_temperature_solver — Isotherm temperatures from read labels and the order of the lines along boundaries.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Isotherm detection
"""
from __future__ import annotations

import math

_MAX_C = 4000.0


def solve_isotherm_temperatures(
    group_count: int,
    labels: dict[int, float],
    ladders: list[tuple[list[int], float, float]],
    step_C: float,
) -> tuple[list[list[float]], list[int]]:
    """Possible temperatures of each isotherm group (lines continuing across boundaries share a group).

    Every group starts with the multiples of ``step_C`` up to 4000 °C, a group in ``labels`` with
    its read value. A ladder ``(groups, low, high)`` lists the groups crossing one boundary stretch
    between two points of known temperature, in order from the ``low`` end to the ``high`` end
    (the liquidus rises monotonically along the stretch): each lies strictly between ``low`` and
    ``high`` and strictly above the previous one. Ladders are added one at a time, longest first,
    each propagated with the ones already accepted until nothing changes; a ladder that leaves a
    group without any temperature (a line crossing the stretch twice, or one end of a line put on
    the wrong boundary) is rejected.
    Returns the sorted options per group (one = determined) and the indices of the rejected ladders.
    """
    every = [step_C * k for k in range(1, int(_MAX_C // step_C) + 1)]
    domains: list[set[float]] = [{labels[g]} if g in labels else set(every) for g in range(group_count)]
    accepted: list[tuple[list[int], float, float]] = []
    rejected: list[int] = []
    for index in sorted(range(len(ladders)), key=lambda k: -len(ladders[k][0])):
        groups = ladders[index][0]
        if len(set(groups)) != len(groups):
            rejected.append(index)
            continue
        trial = _propagate([set(d) for d in domains], accepted + [ladders[index]])
        if any(not d for d in trial):
            rejected.append(index)
            continue
        accepted.append(ladders[index])
        domains = trial
    return [sorted(d) for d in domains], sorted(rejected)


def _propagate(domains: list[set[float]], ladders: list[tuple[list[int], float, float]]) -> list[set[float]]:
    changed = True
    while changed:
        changed = False
        for groups, low, high in ladders:
            previous = -math.inf
            for g in groups:
                kept = {t for t in domains[g] if low < t < high and t > previous}
                if kept != domains[g]:
                    domains[g], changed = kept, True
                previous = min(kept, default=math.inf)
            following = math.inf
            for g in reversed(groups):
                kept = {t for t in domains[g] if t < following}
                if kept != domains[g]:
                    domains[g], changed = kept, True
                following = max(kept, default=-math.inf)
            if any(not domains[g] for g in groups):
                return domains
    return domains
