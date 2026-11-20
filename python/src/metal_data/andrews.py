"""Andrews (1965) empirical Ac1 / Ac3 critical temperatures for steels.

Refs:
  [56] Andrews1965 — Journal of the Iron and Steel Institute 203 (1965) 721–727.
"""

from __future__ import annotations

import math
from typing import Any, Optional

from references import RefKey

# Andrews formulas return °C; store Kelvin in alloy records.
_C_TO_K = 273.15


def andrews_ac1_C(composition: dict[str, float]) -> float:
    """Ac1 (°C) = 723 − 10.7 Mn − 16.9 Ni + 29.1 Si + 16.9 Cr + 290 As + 6.38 W."""
    el = _elements(composition)
    return (
        723.0
        - 10.7 * el["Mn"]
        - 16.9 * el["Ni"]
        + 29.1 * el["Si"]
        + 16.9 * el["Cr"]
        + 290.0 * el["As"]
        + 6.38 * el["W"]
    )


def andrews_ac3_C(composition: dict[str, float]) -> float:
    """Ac3 (°C) = 910 − 203 √C − 15.2 Ni + 44.7 Si + 104 V + 31.5 Mo + 13.1 W."""
    el = _elements(composition)
    c = max(el["C"], 0.0)
    return (
        910.0
        - 203.0 * math.sqrt(c)
        - 15.2 * el["Ni"]
        + 44.7 * el["Si"]
        + 104.0 * el["V"]
        + 31.5 * el["Mo"]
        + 13.1 * el["W"]
    )


def andrews_critical_temperatures(
    composition: dict[str, float],
) -> Optional[dict[str, Any]]:
    """Return Ac1/Ac3 in K, or None when composition has no usable C (Ac3)."""
    if not composition:
        return None
    ac1_c = andrews_ac1_C(composition)
    ac3_c = andrews_ac3_C(composition)
    return {
        "Ac1_K": round(ac1_c + _C_TO_K, 4),
        "Ac3_K": round(ac3_c + _C_TO_K, 4),
        "Ac1_C": round(ac1_c, 4),
        "Ac3_C": round(ac3_c, 4),
        "method": "Andrews1965",
        "ref": RefKey.Andrews1965.value,
    }


def _elements(composition: dict[str, float]) -> dict[str, float]:
    keys = ("C", "Mn", "Si", "Ni", "Cr", "Mo", "V", "W", "As")
    out: dict[str, float] = {}
    for k in keys:
        raw = composition.get(k, composition.get(k.lower(), 0.0))
        try:
            out[k] = float(raw or 0.0)
        except (TypeError, ValueError):
            out[k] = 0.0
    return out
