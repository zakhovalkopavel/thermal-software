"""
chemicals_tables.equation_eval — Python copy of the backend ``calculate`` methods for every equation type.

Contract (backend ``Equation.calculate``): clamp T to [min, max] when they are set, evaluate,
multiply by ``k``. The backend unit tests of the NEW_EQUATION_TYPES_SPEC types use reference values
computed with it.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md, docs/services/NEW_EQUATION_TYPES_SPEC.md
"""
from __future__ import annotations

import math
from typing import Any, Callable, Optional

from chemicals_tables.constants.gas_constant import GAS_CONSTANT

Vars = dict[str, Any]


def evaluate_equation(
    type_: str, T: float, vars_: Vars, min_: Optional[float] = None, max_: Optional[float] = None,
    k: Optional[float] = None,
) -> float:
    """``f(T)·k`` for an equation type name; raises ValueError where the formula is undefined (τ ≤ 0)."""
    method = _METHODS.get(str(type_))
    if method is None:
        raise ValueError(f"Unknown equation type: {type_}")
    if min_ is not None and T < min_:
        T = min_
    if max_ is not None and T > max_:
        T = max_
    return method(T, vars_) * (1.0 if k is None else k)


def _tau(T: float, Tc: float) -> float:
    return max(0.0, 1.0 - T / Tc)


def _range(T: float, ranges: list[Vars]) -> Vars:
    for r in ranges:
        if T <= r["Tmax"]:
            return r
    return ranges[-1]


def _linear(T: float, v: Vars) -> float:
    return v["a"] + v["b"] * T


def _quadratic(T: float, v: Vars) -> float:
    return v["a"] + v["b"] * T + v["c"] * T * T


def _cubic(T: float, v: Vars) -> float:
    return _quadratic(T, v) + v["d"] * T ** 3


def _quartic(T: float, v: Vars) -> float:
    return _cubic(T, v) + v["e"] * T ** 4


def _linear_hyperbolic(T: float, v: Vars) -> float:
    return v["a"] + v["b"] * T + v["d"] / (T * T)


def _linear_hyperbolic_logarithmic(T: float, v: Vars) -> float:
    return v["c1"] + v["c2"] * math.log(T) + v["c3"] / T + v["c4"] * T


def _aly_lee(T: float, v: Vars) -> float:
    x = v["c3"] / T
    y = v["c5"] / T
    return v["c1"] + v["c2"] * (x / math.sinh(x)) ** 2 + v["c4"] * (y / math.cosh(y)) ** 2


def _dippr_n102(T: float, v: Vars) -> float:
    return v["c1"] * T ** v["c2"] / (1 + v["c3"] / T + v["c4"] / (T * T))


def _nasa_poly(T: float, c: Vars) -> float:
    return c["a1"] + c["a2"] * T + c["a3"] * T ** 2 + c["a4"] * T ** 3 + c["a5"] * T ** 4


def _nasa7(T: float, v: Vars) -> float:
    return _nasa_poly(T, v["low"] if T <= v["Tswitch"] else v["high"]) * GAS_CONSTANT


def _nasa9(T: float, v: Vars) -> float:
    c = _range(T, v["ranges"])["coeffs"]
    return (c["a1"] / T ** 2 + c["a2"] / T + c["a3"] + c["a4"] * T + c["a5"] * T ** 2
            + c["a6"] * T ** 3 + c["a7"] * T ** 4) * GAS_CONSTANT


def _dippr_n114(T: float, v: Vars) -> float:
    t = 1.0 - T / v["Tc"]
    if t <= 0:
        raise ValueError(f"dipprN114 diverges at T >= Tc ({T} >= {v['Tc']})")
    c1, c2, c3, c4 = v["c1"], v["c2"], v["c3"], v["c4"]
    return (c1 * c1 / t + c2 - 2 * c1 * c3 * t - c1 * c4 * t ** 2 - c3 * c3 * t ** 3 / 3
            - c3 * c4 * t ** 4 / 2 - c4 * c4 * t ** 5 / 5)


def _trc_cp(T: float, v: Vars) -> float:
    a7 = v["a7"]
    y = 0.0 if T <= a7 else (T - a7) / (T + v["a6"])
    term = v["a1"] / (T * T) * math.exp(-v["a2"] / T) if v["a1"] else 0.0
    y8 = (v["a4"] - v["a5"] / (T - a7) ** 2) * y ** 8 if y else 0.0
    return v["a0"] + term + v["a3"] * y * y + y8


def _shomate(T: float, v: Vars) -> float:
    r = _range(T, v["ranges"])
    return r["a"] + r["b"] * T + r["c"] * T * T + r["d"] * T ** 3 + r["e"] / (T * T)


def _zabransky_spline(T: float, v: Vars) -> float:
    r = _range(T, v["ranges"])
    x = T / 100.0
    return r["a1"] + r["a2"] * x + r["a3"] * x * x + r["a4"] * x ** 3


def _zabransky_quasi(T: float, v: Vars) -> float:
    Tr = T / v["Tc"]
    t = 1.0 - Tr
    if t <= 0:
        raise ValueError(f"zabranskyQuasiPolynomial diverges at T >= Tc ({T} >= {v['Tc']})")
    return (v["a1"] * math.log(t) + v["a2"] / t + v["a3"] + v["a4"] * Tr + v["a5"] * Tr ** 2
            + v["a6"] * Tr ** 3)


def _dippr_n101(T: float, v: Vars) -> float:
    return math.exp(v["c1"] + v["c2"] / T + v["c3"] * math.log(T) + v["c4"] * T ** v["c5"])


def _ppds9(T: float, v: Vars) -> float:
    s = (v["c"] - T) / (T - v["d"])
    root = math.cbrt(s)
    return v["e"] * math.exp(v["a"] * root + v["b"] * s * root)


def _ppds10(T: float, v: Vars) -> float:
    t = _tau(T, v["Tc"])
    return v["rhoc"] + v["a"] * t ** 0.35 + v["b"] * t ** (2 / 3) + v["c"] * t + v["d"] * t ** (4 / 3)


def _ppds12(T: float, v: Vars) -> float:
    t = _tau(T, v["Tc"])
    return GAS_CONSTANT * v["Tc"] * (
        v["a"] * t ** (1 / 3) + v["b"] * t ** (2 / 3) + v["c"] * t + v["d"] * t * t + v["e"] * t ** 6
    )


def _dippr_n106(T: float, v: Vars) -> float:
    t = _tau(T, v["Tc"])
    if t == 0:
        return 0.0
    Tr = T / v["Tc"]
    return v["c1"] * t ** (v["c2"] + v["c3"] * Tr + v["c4"] * Tr ** 2 + v["c5"] * Tr ** 3)


def _wagner25(T: float, v: Vars) -> float:
    Tr = min(T / v["Tc"], 1.0)
    t = 1.0 - Tr
    return v["Pc"] * math.exp((v["a"] * t + v["b"] * t ** 1.5 + v["c"] * t ** 2.5 + v["d"] * t ** 5) / Tr)


def _sutherland(T: float, v: Vars) -> float:
    return v["y0"] * (T / v["T0"]) ** 1.5 * (v["T0"] + v["S"]) / (T + v["S"])


def _power_law(T: float, v: Vars) -> float:
    return v["y0"] * (T / v["T0"]) ** v["n"]


_METHODS: dict[str, Callable[[float, Vars], float]] = {
    "linear": _linear,
    "quadratic": _quadratic,
    "cubic": _cubic,
    "quartic": _quartic,
    "linearHyperbolic": _linear_hyperbolic,
    "linearHyperbolicLogarithmic": _linear_hyperbolic_logarithmic,
    "alyLee": _aly_lee,
    "dipprN102": _dippr_n102,
    "nasa7": _nasa7,
    "nasa9": _nasa9,
    "dipprN114": _dippr_n114,
    "trcCp": _trc_cp,
    "shomate": _shomate,
    "zabranskySpline": _zabransky_spline,
    "zabranskyQuasiPolynomial": _zabransky_quasi,
    "dipprN101": _dippr_n101,
    "ppds9": _ppds9,
    "ppds10": _ppds10,
    "ppds12": _ppds12,
    "dipprN106": _dippr_n106,
    "wagner25": _wagner25,
    "sutherland": _sutherland,
    "powerLaw": _power_law,
}
