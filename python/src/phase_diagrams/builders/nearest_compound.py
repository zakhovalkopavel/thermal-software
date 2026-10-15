"""
phase_diagrams.builders.nearest_compound — The compounds.json entry whose stoichiometric wt% is nearest a composition.

Spec: docs/scripts/phase-diagrams/ALGORITHMS.md § Topology report
"""
from __future__ import annotations

from phase_diagrams.figures.formula_molar_mass import formula_molar_mass

COMPOUND_WT = 1.5


def nearest_compound(wt: list[float], components: list[str], compounds: list[dict],
                     tolerance_wt: float = COMPOUND_WT) -> dict | None:
    """Compound (not a modification) within ``tolerance_wt`` (max oxide difference) of ``wt``, the nearest; None if none.

    Only compounds whose oxides are all ``components`` with a molar mass count.
    """
    best = None
    for compound in compounds:
        moles = compound.get("oxideMoles") or {}
        if compound.get("modificationOf") or not moles or not set(moles) <= set(components) or any(formula_molar_mass(c) is None for c in moles):
            continue
        mass = {c: moles[c] * formula_molar_mass(c) if c in moles else 0.0 for c in components}
        total = sum(mass.values())
        difference = max(abs(mass[c] / total * 100.0 - w) for c, w in zip(components, wt))
        if difference <= tolerance_wt and (best is None or difference < best[0]):
            best = (difference, compound)
    return best[1] if best else None
