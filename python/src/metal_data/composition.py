"""Normalize alloy chemical compositions to midpoint wt% vectors.

Donor ranking uses ElMD (Element Mover’s Distance) on Fe-balanced atomic fractions.

Refs:
  [59] Hargreaves2020ElMD — Chem. Mater. 32 (2020) 10610–10620.
"""

from __future__ import annotations

import re
from typing import Any, Optional

from ElMD import ElMD
from references import RefKey

_ELEMENT = re.compile(r"^([A-Z][a-z]?)(?:_max|_min)?$")
_PCT = re.compile(r"^\s*(-?\d+(?:\.\d+)?)\s*%?\s*$")

# Atomic masses (u) for common steel / alloy elements — wt% → mole fraction for ElMD.
ATOMIC_MASS_U: dict[str, float] = {
    "H": 1.008,
    "B": 10.81,
    "C": 12.011,
    "N": 14.007,
    "O": 15.999,
    "Al": 26.982,
    "Si": 28.085,
    "P": 30.974,
    "S": 32.06,
    "Ti": 47.867,
    "V": 50.942,
    "Cr": 51.996,
    "Mn": 54.938,
    "Fe": 55.845,
    "Co": 58.933,
    "Ni": 58.693,
    "Cu": 63.546,
    "As": 74.922,
    "Nb": 92.906,
    "Mo": 95.95,
    "Sn": 118.71,
    "W": 183.84,
    "Pb": 207.2,
}

ELMD_METRIC = "mod_petti"
_FE_BALANCE_THRESHOLD_WT = 99.5

assert RefKey.Hargreaves2020ElMD.value == "Hargreaves2020ElMD"


def _mid(lo: float, hi: float) -> float:
    return (lo + hi) / 2.0


def _parse_scalar(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        s = value.strip().lower()
        if s in {"bal", "balance", "rem", "remainder", "—", "-", ""}:
            return None  # resolved later
        m = _PCT.match(s.replace(",", "."))
        if m:
            return float(m.group(1))
    if isinstance(value, dict):
        if "min" in value or "max" in value:
            lo = float(value.get("min", value.get("max", 0)) or 0)
            hi = float(value.get("max", value.get("min", 0)) or 0)
            return _mid(lo, hi)
        if "value" in value:
            return _parse_scalar(value["value"])
    return None


def _element_key(raw: str) -> Optional[str]:
    s = raw.strip()
    # P_max / S_max → P / S
    s = re.sub(r"_(max|min)$", "", s, flags=re.I)
    if s.lower() in {"other", "others", "bal", "balance", "rem"}:
        return None
    m = _ELEMENT.match(s)
    if m:
        return m.group(1)
    # oxides like Y2O3 kept as-is
    if re.match(r"^[A-Za-z0-9]+$", s):
        return s
    return None


def normalize_composition(raw: Any) -> dict[str, float]:
    """Return wt% map (midpoints). Resolve a single ``bal`` to 100 − sum."""
    if not raw or not isinstance(raw, dict):
        return {}
    out: dict[str, float] = {}
    bal_key: Optional[str] = None
    for k, v in raw.items():
        if isinstance(v, str) and v.strip().lower() in {"bal", "balance", "rem", "remainder"}:
            ek = _element_key(k) or k
            bal_key = ek
            continue
        ek = _element_key(str(k))
        if ek is None:
            continue
        val = _parse_scalar(v)
        if val is None:
            continue
        out[ek] = val
    if bal_key is not None:
        out[bal_key] = max(0.0, 100.0 - sum(out.values()))
    return out


def composition_l1(a: dict[str, float], b: dict[str, float]) -> float:
    """L1 distance on the union of element keys (missing → 0). Kept for diagnostics."""
    keys = set(a) | set(b)
    if not keys:
        return float("inf")
    return sum(abs(a.get(k, 0.0) - b.get(k, 0.0)) for k in keys)


def with_iron_balance(comp_wt: dict[str, float]) -> dict[str, float]:
    """Copy wt% map; add Fe remainder when Fe is omitted and sum < 99.5 wt%."""
    out = {k: float(v) for k, v in comp_wt.items() if float(v) > 0.0}
    total = sum(out.values())
    if "Fe" not in out and total < _FE_BALANCE_THRESHOLD_WT:
        out["Fe"] = max(0.0, 100.0 - total)
    return out


def wt_percent_to_elmd_formula(comp_wt: dict[str, float]) -> str:
    """Build an ElMD formula string from wt% (Fe-balanced, atomic fractions)."""
    balanced = with_iron_balance(comp_wt)
    moles: dict[str, float] = {}
    for el, wt in balanced.items():
        mass = ATOMIC_MASS_U.get(el)
        if mass is None or wt <= 0.0:
            continue
        moles[el] = wt / mass
    total = sum(moles.values())
    if total <= 0.0:
        return "Fe"
    # Largest mole fraction first — ElMD parser accepts decimal stoichiometry.
    parts = [
        f"{el}{moles[el] / total:.8g}"
        for el in sorted(moles, key=lambda e: -moles[e])
    ]
    return "".join(parts)


def composition_elmd(
    a: dict[str, float],
    b: dict[str, float],
    *,
    metric: str = ELMD_METRIC,
) -> float:
    """ElMD between two wt% compositions (Fe balance + mod_petti by default)."""
    if not a and not b:
        return float("inf")
    fa = wt_percent_to_elmd_formula(a)
    fb = wt_percent_to_elmd_formula(b)
    try:
        return float(ElMD(fa, metric=metric).elmd(fb))
    except Exception:
        # Fall back to equal-weight L1 if a formula cannot be parsed.
        return composition_l1(a, b)
