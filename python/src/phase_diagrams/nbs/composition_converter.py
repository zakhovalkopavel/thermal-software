"""
phase_diagrams.nbs.composition_converter — mol% ↔ wt% with OXIDE_MOLAR_MASS.
"""
from __future__ import annotations

from phase_diagrams.constants.oxide_molar_mass import OXIDE_MOLAR_MASS


def convert_composition(values: dict[str, float], to: str, digits: int | None = 1) -> dict[str, float]:
    """Convert a composition between ``"mol"`` and ``"wt"`` (percent, normalized to 100).

    Raises KeyError for an oxide without a molar mass.
    """
    if to not in ("mol", "wt"):
        raise ValueError("to must be 'mol' or 'wt'")
    masses = {k: OXIDE_MOLAR_MASS[k] for k in values}
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
