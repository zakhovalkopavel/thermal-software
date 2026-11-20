"""Steel property approximations — policy differs by property.

Compound-equation style (no def/ref — fitted here):
  { Tswitch?, low: {type, vars, min, max}, high?: {...}, meanRelPct, maxRelPct }

| Property | Model |
|---|---|
| thermalConductivity | Ac3 split: free linear on T>Ac3, then quadratic ≤ Ac3 anchored at Ac3 |
| specificHeat | Inden magnetic Cp (`indenCp`), Tswitch = Tc |
| electricalResistivity | Same Ac3 split (ρₑ slope softens ~800 °C) |
| thermalExpansion / density | Single quadratic over own points (no Ac3 high) |

Refs:
  [56] Andrews1965 — Ac1 / Ac3 from composition (wt%).
  [57] Inden1981 — magnetic Cp (τ = T/Tc).
"""

from __future__ import annotations

from typing import Any, Optional

import numpy as np

from metal_data.andrews import andrews_critical_temperatures
from metal_data.inden_cp import eval_inden_cp, fit_inden_cp
from metal_data.models import AlloyRecord, PropertySeries

MIN_APPROX_POINTS = 3
MIN_QUADRATIC_POINTS = 3
STEEL_GROUP = "steel"
GATE_MAX_REL_PCT = 10.0
COEFF_SIG_FIGS = 4

APPROX_PROPS = (
    "thermalConductivity",
    "specificHeat",
    "thermalExpansion",
    "electricalResistivity",
    "density",
)

# λ (slope sign flip) and ρₑ (slope softens near Ac3 ≈ 800 °C).
AC3_SPLIT_PROPS = frozenset({"thermalConductivity", "electricalResistivity"})
# Sparse / no austenite-side data — quadratic on own knots only.
SINGLE_QUADRATIC_PROPS = frozenset({"thermalExpansion", "density"})


def apply_approximations(registry: dict[str, AlloyRecord]) -> list[dict[str, Any]]:
    """Compute Andrews Ac1/Ac3 and fit per-property approximations on steel series."""
    report: list[dict[str, Any]] = []
    for rec in registry.values():
        if rec.group != STEEL_GROUP:
            continue
        crit = andrews_critical_temperatures(rec.composition)
        if crit is not None:
            # Ac3 uncertainty is ~±10–20 °C — store whole kelvin
            crit = dict(crit)
            crit["Ac1_K"] = int(round(float(crit["Ac1_K"])))
            crit["Ac3_K"] = int(round(float(crit["Ac3_K"])))
            crit["Ac1_C"] = int(round(float(crit["Ac1_C"])))
            crit["Ac3_C"] = int(round(float(crit["Ac3_C"])))
        rec.critical_temperatures = crit
        if crit is None:
            continue
        for prop in APPROX_PROPS:
            series = rec.properties.get(prop)
            if series is None:
                continue
            approx, reject_reason = fit_property_approximation(
                series,
                ac3_k=float(crit["Ac3_K"]),
                prop=prop,
            )
            if approx is None:
                if reject_reason:
                    row: dict[str, Any] = {
                        "materialId": rec.material_id,
                        "property": prop,
                        "status": "rejected",
                        "reason": reject_reason,
                    }
                    if prop in AC3_SPLIT_PROPS:
                        row["Tswitch"] = crit["Ac3_K"]
                    report.append(row)
                continue
            series.approximation = approx
            report.append(
                {
                    "materialId": rec.material_id,
                    "property": prop,
                    "status": "ok",
                    "type": approx["low"]["type"],
                    "Tswitch": approx.get("Tswitch"),
                    "meanRelPct": approx["meanRelPct"],
                    "maxRelPct": approx["maxRelPct"],
                }
            )
    return report


def fit_property_approximation(
    series: PropertySeries,
    *,
    ac3_k: float,
    prop: Optional[str] = None,
) -> tuple[Optional[dict[str, Any]], Optional[str]]:
    """Dispatch by property policy (see module docstring)."""
    pairs = _unique_t_value_pairs(series.points)
    if len(pairs) < MIN_APPROX_POINTS:
        return None, None

    if prop == "specificHeat":
        return fit_inden_cp(pairs)

    if prop in SINGLE_QUADRATIC_PROPS:
        return _fit_single_polynomial(pairs, max_degree=2)

    # Default / explicit: λ and ρₑ — Ac3 quadratic + linear
    if prop is None or prop in AC3_SPLIT_PROPS:
        return _fit_ac3_split(pairs, ac3_k=ac3_k)

    return _fit_single_polynomial(pairs, max_degree=2)


def fit_property_polynomial(series: PropertySeries) -> Optional[dict[str, Any]]:
    """Single quadratic over all points (smooth series / tests)."""
    pairs = _unique_t_value_pairs(series.points)
    if len(pairs) < MIN_APPROX_POINTS:
        return None
    approx, _ = _fit_single_polynomial(pairs, max_degree=2)
    return approx


def approximation_t_window(series: PropertySeries) -> Optional[tuple[float, float]]:
    approx = series.approximation
    if not approx or "low" not in approx:
        return None
    t_min = float(approx["low"]["min"])
    high = approx.get("high")
    t_max = float(high["max"]) if isinstance(high, dict) else float(approx["low"]["max"])
    return t_min, t_max


def eval_approximation(
    approx: dict[str, Any],
    t: float,
    *,
    points: Optional[list[dict[str, float]]] = None,
) -> float:
    """Evaluate low / high (Ac3 split) or single-curve / indenCp."""
    del points
    low = approx["low"]
    if low.get("type") == "indenCp":
        return eval_inden_cp(low["vars"], t)
    switch = approx.get("Tswitch")
    high = approx.get("high")
    if switch is not None and isinstance(high, dict) and t > float(switch) + 1e-9:
        return _eval_vars(high["vars"], t)
    return _eval_vars(low["vars"], t)


# When Ac3-anchored continuous fit fails the gate, try moving Tswitch to a
# measured knot within this window of Andrews Ac3 (K).
SWITCH_POINT_WINDOW_K = 200.0


def _fit_ac3_split(
    pairs: list[tuple[float, float]],
    *,
    ac3_k: float,
) -> tuple[Optional[dict[str, Any]], Optional[str]]:
    """Ac3 split: free linear on T>Tswitch first, then low poly anchored at join.

    1. Try continuous join at Andrews Ac3.
    2. If that fails the ≤10% gate, move ``Tswitch`` to a measured knot near Ac3
       (nearest first) and retry continuous free-linear / anchored-quadratic.
    3. No usable high branch → unconstrained low poly only.
    """
    ac3_switch = int(round(ac3_k))
    t_all = [p[0] for p in pairs]
    t_min = round(float(min(t_all)), 2)
    t_max = round(float(max(t_all)), 2)

    # 1) Andrews Ac3
    best = _try_continuous_split(pairs, switch_k=ac3_switch, t_min=t_min, t_max=t_max)
    if _passes_gate(best):
        return best, None

    # 2) Move switch to a nearby measured point (fix discontinuous anomaly)
    for cand_t in _switch_point_candidates(pairs, ac3_k=float(ac3_k)):
        cand_k = int(round(cand_t))
        if cand_k == ac3_switch:
            continue
        trial = _try_continuous_split(pairs, switch_k=cand_k, t_min=t_min, t_max=t_max)
        if not _passes_gate(trial):
            continue
        assert trial is not None
        trial["switchMovedFromAc3_K"] = ac3_switch
        return trial, None

    # 3) Low-only if nothing above any viable switch
    below_ac3 = [(t, y) for t, y in pairs if t <= ac3_switch + 1e-9]
    if len(below_ac3) < 2:
        return None, "insufficient-points-below-ac3"
    deg = min(2 if len(below_ac3) >= MIN_QUADRATIC_POINTS else 1, len(below_ac3) - 1, 2)
    low_only = _build_ac3_approx(
        switch_k=ac3_switch,
        low_vars=_fit_unconstrained_low(below_ac3, deg),
        deg=deg,
        t_min=t_min,
        low_max=t_max if t_max <= ac3_switch + 1e-9 else float(ac3_switch),
        below=below_ac3,
        above=[],
        high=None,
        continuous=True,
        y_anchor=None,
    )
    if _passes_gate(low_only):
        return low_only, None
    return None, "max-rel-above-threshold"


def _passes_gate(approx: Optional[dict[str, Any]]) -> bool:
    if approx is None:
        return False
    max_rel = approx.get("maxRelPct")
    return max_rel is not None and max_rel <= GATE_MAX_REL_PCT


def _switch_point_candidates(
    pairs: list[tuple[float, float]], *, ac3_k: float
) -> list[float]:
    """Measured T knots near Ac3 that leave ≥2 points on each side of the split."""
    temps = sorted({float(t) for t, _ in pairs})
    scored: list[tuple[float, float]] = []
    for t in temps:
        below_n = sum(1 for u, _ in pairs if u <= t + 1e-9)
        above_n = sum(1 for u, _ in pairs if u > t + 1e-9)
        if below_n < 2 or above_n < 2:
            continue
        dist = abs(t - ac3_k)
        if dist > SWITCH_POINT_WINDOW_K:
            continue
        scored.append((dist, t))
    scored.sort()
    return [t for _, t in scored]


def _try_continuous_split(
    pairs: list[tuple[float, float]],
    *,
    switch_k: int,
    t_min: float,
    t_max: float,
) -> Optional[dict[str, Any]]:
    """Free linear on T>switch, low poly anchored at (switch, y_high)."""
    below = [(t, y) for t, y in pairs if t <= switch_k + 1e-9]
    above = [(t, y) for t, y in pairs if t > switch_k + 1e-9]
    if len(below) < 2 or len(above) < 2:
        return None

    deg = min(2 if len(below) >= MIN_QUADRATIC_POINTS else 1, len(below) - 1, 2)
    high_vars = _vars_sigfigs(_fit_free_linear(above), 1)
    y_anchor = _eval_vars(high_vars, float(switch_k))
    high = {
        "type": "linear",
        "vars": high_vars,
        "min": float(switch_k),
        "max": t_max,
    }
    low_vars = _vars_sigfigs(
        _fit_poly_through_point(below, switch_k, y_anchor, deg), deg
    )
    low_vars = _anchor_constant(low_vars, float(switch_k), y_anchor)
    low_max = t_max if t_max <= switch_k + 1e-9 else float(switch_k)
    return _build_ac3_approx(
        switch_k=switch_k,
        low_vars=low_vars,
        deg=deg,
        t_min=t_min,
        low_max=low_max,
        below=below,
        above=above,
        high=high,
        continuous=True,
        y_anchor=y_anchor,
    )


def _fit_unconstrained_low(
    below: list[tuple[float, float]], deg: int
) -> dict[str, float]:
    t = np.asarray([p[0] for p in below], dtype=float)
    y = np.asarray([p[1] for p in below], dtype=float)
    return _vars_sigfigs(_coeffs_poly(np.polyfit(t, y, deg)), deg)


def _build_ac3_approx(
    *,
    switch_k: int,
    low_vars: dict[str, float],
    deg: int,
    t_min: float,
    low_max: float,
    below: list[tuple[float, float]],
    above: list[tuple[float, float]],
    high: Optional[dict[str, Any]],
    continuous: bool,
    y_anchor: Optional[float],
) -> Optional[dict[str, Any]]:
    y_hat_all: list[float] = []
    y_obs_all: list[float] = []
    for ti, yi in below:
        y_hat_all.append(_eval_vars(low_vars, float(ti)))
        y_obs_all.append(yi)
    if high is not None:
        for ti, yi in above:
            y_hat_all.append(_eval_vars(high["vars"], float(ti)))
            y_obs_all.append(yi)
    if not y_obs_all:
        return None
    y_obs = np.asarray(y_obs_all, dtype=float)
    y_hat = np.asarray(y_hat_all, dtype=float)
    mean_rel, max_rel = _rel_errors(y_obs, y_obs - y_hat)
    approx: dict[str, Any] = {
        "Tswitch": switch_k,
        "low": {
            "type": "quadratic" if deg == 2 else "linear",
            "vars": low_vars,
            "min": t_min,
            "max": low_max,
        },
        "meanRelPct": round(mean_rel, 2) if mean_rel is not None else None,
        "maxRelPct": round(max_rel, 2) if max_rel is not None else None,
        "joinContinuous": continuous,
    }
    if high is not None:
        approx["high"] = high
    if (
        not continuous
        and y_anchor is not None
        and high is not None
    ):
        y_low_sw = _eval_vars(low_vars, float(switch_k))
        if y_low_sw != 0:
            approx["joinGapRelPct"] = round(
                abs(y_anchor - y_low_sw) / abs(y_low_sw) * 100.0, 2
            )
    return approx


def _fit_single_polynomial(
    pairs: list[tuple[float, float]],
    *,
    max_degree: int,
) -> tuple[Optional[dict[str, Any]], Optional[str]]:
    """One polynomial over all own points — no Tswitch / high branch."""
    t = np.asarray([p[0] for p in pairs], dtype=float)
    y = np.asarray([p[1] for p in pairs], dtype=float)
    deg = min(max_degree, len(pairs) - 1)
    if deg < 1:
        return None, "insufficient-points"
    coeffs_hf = np.polyfit(t, y, deg)
    coeffs = _coeffs_poly(coeffs_hf)
    y_hat = np.array([_eval_vars(coeffs, float(ti)) for ti in t])
    mean_rel, max_rel = _rel_errors(y, y - y_hat)
    if max_rel is not None and max_rel > GATE_MAX_REL_PCT:
        return None, "max-rel-above-threshold"

    type_name = {1: "linear", 2: "quadratic", 3: "cubic"}.get(deg, f"poly{deg}")
    t_min = round(float(t.min()), 2)
    t_max = round(float(t.max()), 2)
    return (
        {
            "low": {
                "type": type_name,
                "vars": _vars_sigfigs(coeffs, deg),
                "min": t_min,
                "max": t_max,
            },
            "meanRelPct": round(mean_rel, 2) if mean_rel is not None else None,
            "maxRelPct": round(max_rel, 2) if max_rel is not None else None,
        },
        None,
    )


def _fit_free_linear(points: list[tuple[float, float]]) -> dict[str, float]:
    """Unconstrained LS linear a+bT through ``points`` (≥2)."""
    t = np.asarray([p[0] for p in points], dtype=float)
    y = np.asarray([p[1] for p in points], dtype=float)
    b, a = np.polyfit(t, y, 1)  # high-first: b T + a
    return {"a": float(a), "b": float(b), "c": 0.0, "d": 0.0}


def _anchor_constant(
    vars_: dict[str, float], t_anchor: float, y_anchor: float
) -> dict[str, float]:
    """Shift ``a`` so a+bT+cT² equals ``y_anchor`` at ``t_anchor`` exactly.

    ``a`` is left unrounded so the Ac3 join survives 4-sigfig ``b``/``c``.
    """
    out = dict(vars_)
    b = float(out.get("b", 0.0))
    c = float(out.get("c", 0.0))
    t = float(t_anchor)
    out["a"] = float(y_anchor) - b * t - c * t * t
    return out


def _fit_poly_through_point(
    points: list[tuple[float, float]],
    t_anchor: float,
    y_anchor: float,
    deg: int,
) -> dict[str, float]:
    """Poly of degree ``deg`` on ``points``, forced through (t_anchor, y_anchor).

    Parameterization: y = y_anchor + Σ_{k=1..deg} c_k (T − t_anchor)^k
    """
    t = np.asarray([p[0] for p in points], dtype=float)
    y = np.asarray([p[1] for p in points], dtype=float)
    dt = t - float(t_anchor)
    cols = [dt**k for k in range(1, deg + 1)]
    if not cols:
        return {"a": float(y_anchor), "b": 0.0, "c": 0.0, "d": 0.0}
    A = np.column_stack(cols)
    coef, *_ = np.linalg.lstsq(A, y - float(y_anchor), rcond=None)
    # Expand y_anchor + b Δ + c Δ²  →  a + b' T + c' T²
    # Δ = T − Ts → y = y_a + b(T−Ts) + c(T−Ts)²
    #   = (y_a − b Ts + c Ts²) + (b − 2 c Ts) T + c T²
    Ts = float(t_anchor)
    if deg == 1:
        b = float(coef[0])
        return {
            "a": float(y_anchor) - b * Ts,
            "b": b,
            "c": 0.0,
            "d": 0.0,
        }
    b_d, c_d = float(coef[0]), float(coef[1])
    return {
        "a": float(y_anchor) - b_d * Ts + c_d * Ts * Ts,
        "b": b_d - 2.0 * c_d * Ts,
        "c": c_d,
        "d": 0.0,
    }


def _unique_t_value_pairs(points: list[dict[str, float]]) -> list[tuple[float, float]]:
    by_t: dict[float, float] = {}
    for p in points:
        key = round(float(p["T_K"]), 6)
        by_t[key] = float(p["value"])
    return sorted(by_t.items(), key=lambda item: item[0])


def _coeffs_poly(coeffs_high_first: np.ndarray) -> dict[str, float]:
    """numpy poly (high→low) → {a,b,c,d} low-first a+bT+cT²+dT³."""
    low_first = list(reversed([float(c) for c in coeffs_high_first]))
    while len(low_first) < 4:
        low_first.append(0.0)
    return {
        "a": low_first[0],
        "b": low_first[1],
        "c": low_first[2],
        "d": low_first[3],
    }


def _vars_sigfigs(coeffs: dict[str, float], deg: int) -> dict[str, float]:
    keys = ("a", "b", "c", "d")[: deg + 1]
    return {k: _sigfigs(coeffs[k], COEFF_SIG_FIGS) for k in keys}


def _eval_vars(vars_: dict[str, float], t: float) -> float:
    return (
        float(vars_["a"])
        + float(vars_.get("b", 0.0)) * t
        + float(vars_.get("c", 0.0)) * t**2
        + float(vars_.get("d", 0.0)) * t**3
    )


def _rel_errors(
    y: np.ndarray, residuals: np.ndarray
) -> tuple[Optional[float], Optional[float]]:
    rels: list[float] = []
    for yi, ri in zip(y, residuals):
        if yi == 0:
            continue
        rels.append(abs(ri / yi) * 100.0)
    if not rels:
        return None, None
    return float(np.mean(rels)), float(max(rels))


def _sigfigs(value: float, n: int) -> float:
    """Round to n significant figures."""
    if value == 0.0 or not np.isfinite(value):
        return 0.0
    order = int(np.floor(np.log10(abs(value))))
    decimals = n - 1 - order
    return float(round(value, decimals))
