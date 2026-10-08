"""
phase_diagrams.nbs.composition_converter — mol% ↔ wt% with molar masses from the formulas.
"""
from __future__ import annotations

from phase_diagrams.figures.formula_molar_mass import formula_molar_mass


def convert_composition(values: dict[str, float], to: str, digits: int | None = 1) -> dict[str, float]:
    """Convert a composition between ``"mol"`` and ``"wt"`` (percent, normalized to 100).

    Raises KeyError for an oxide without a molar mass (``FeOx``, unknown element).
    """
    if to not in ("mol", "wt"):
        raise ValueError("to must be 'mol' or 'wt'")
    masses = {k: formula_molar_mass(k) for k in values}
    missing = [k for k, m in masses.items() if m is None]
    if missing:
        raise KeyError(f"no molar mass for {', '.join(missing)}")
    if to == "wt":
        parts = {k: v * masses[k] for k, v in values.items()}
    else:
        parts = {k: v / masses[k] for k, v in values.items()}
    total = sum(parts.values())
    if total <= 0:
        raise ValueError("composition sums to zero")
    out = {k: 100.0 * v / total for k, v in parts.items()}
    if digits is None:
        return out
    return {k: round(v, digits) for k, v in out.items()}
