"""Inden magnetic specific-heat model for ferritic steels.

Cp = a + b·T + c·T² + A_low·f_LRO(τ)  (τ < 1)
   = a + b·T + c·T² + A_high·f_SRO(τ) (τ > 1)

with τ = T/Tc and Inden’s logarithmic shapes (finite ε-cap at τ → 1).

Refs:
  [57] Inden1981 — Physica B+C 103 (1981) 82–100.
  [58] HillertJarl1978 — CALPHAD 2 (1978) 227–238 (context; truncated series).
"""

from __future__ import annotations

import math
from typing import Any, Optional

import numpy as np

from references import RefKey

# Avoid Inden log singularity at τ = 1 (ideal λ-peak).
_TAU_EPS = 1e-4
_TC_SCAN_HALF_WIDTH_K = 30
_PEAK_PROMINENCE = 1.15
_MIN_PEAK_POINTS = 5
_COEFF_SIG_FIGS = 4
_GATE_MAX_REL_PCT = 10.0

assert RefKey.Inden1981.value == "Inden1981"
assert RefKey.HillertJarl1978.value == "HillertJarl1978"


def detect_curie_peak_K(pairs: list[tuple[float, float]]) -> Optional[float]:
    """Return T of an interior λ-peak, or None if the series looks smooth."""
    if len(pairs) < _MIN_PEAK_POINTS:
        return None
    ys = [y for _, y in pairs]
    i = int(np.argmax(ys))
    if i == 0 or i == len(ys) - 1:
        return None
    baseline = 0.5 * (ys[i - 1] + ys[i + 1])
    if baseline <= 0 or ys[i] < _PEAK_PROMINENCE * baseline:
        return None
    return float(pairs[i][0])


def fit_inden_cp(
    pairs: list[tuple[float, float]],
) -> tuple[Optional[dict[str, Any]], Optional[str]]:
    """Fit Inden-log Cp; returns compound-style approx object or reject reason."""
    peak_t = detect_curie_peak_K(pairs)
    if peak_t is None:
        return None, "no-curie-peak"

    t_arr = np.asarray([p[0] for p in pairs], dtype=float)
    y_arr = np.asarray([p[1] for p in pairs], dtype=float)
    t_min = float(np.min(t_arr))
    t_max = float(np.max(t_arr))

    best: Optional[tuple[np.ndarray, float, float, int]] = None
    tc0 = int(round(peak_t))
    for tc in range(tc0 - _TC_SCAN_HALF_WIDTH_K, tc0 + _TC_SCAN_HALF_WIDTH_K + 1):
        if tc <= 0:
            continue
        coef, mean_rel, max_rel = _lstsq_inden(t_arr, y_arr, float(tc))
        if max_rel is None:
            continue
        if best is None or max_rel < best[2]:
            best = (coef, mean_rel if mean_rel is not None else 0.0, max_rel, tc)

    if best is None:
        return None, "inden-fit-failed"
    coef, mean_rel, max_rel, tc = best
    if max_rel > _GATE_MAX_REL_PCT:
        return None, "max-rel-above-threshold"

    a, b, c, a_low, a_high = (float(x) for x in coef)
    return {
        "Tswitch": tc,
        "low": {
            "type": "indenCp",
            "vars": {
                "a": _sigfigs(a, _COEFF_SIG_FIGS),
                "b": _sigfigs(b, _COEFF_SIG_FIGS),
                "c": _sigfigs(c, _COEFF_SIG_FIGS),
                "Al": _sigfigs(a_low, _COEFF_SIG_FIGS),
                "Ah": _sigfigs(a_high, _COEFF_SIG_FIGS),
                "Tc": tc,
            },
            "min": round(t_min, 2),
            "max": round(t_max, 2),
        },
        "meanRelPct": round(mean_rel, 2),
        "maxRelPct": round(max_rel, 2),
    }, None


def eval_inden_cp(vars_: dict[str, float], t: float) -> float:
    """Evaluate indenCp at T (K)."""
    tc = float(vars_["Tc"])
    base = float(vars_["a"]) + float(vars_["b"]) * t + float(vars_.get("c", 0.0)) * t**2
    tau = t / tc if tc > 0 else 1.0
    if tau < 1.0:
        return base + float(vars_["Al"]) * _f_lro(tau)
    return base + float(vars_["Ah"]) * _f_sro(tau)


def _lstsq_inden(
    t: np.ndarray, y: np.ndarray, tc: float
) -> tuple[np.ndarray, Optional[float], Optional[float]]:
    tau = t / tc
    f_lo = np.zeros_like(t)
    f_hi = np.zeros_like(t)
    lo = tau < 1.0
    f_lo[lo] = _f_lro_vec(tau[lo])
    f_hi[~lo] = _f_sro_vec(tau[~lo])
    x = np.column_stack([np.ones_like(t), t, t**2, f_lo, f_hi])
    coef, *_ = np.linalg.lstsq(x, y, rcond=None)
    y_hat = x @ coef
    mean_rel, max_rel = _rel_errors(y, y - y_hat)
    return coef, mean_rel, max_rel


def _f_lro(tau: float) -> float:
    tau = min(max(tau, 1e-6), 1.0 - _TAU_EPS)
    t3 = tau**3
    return math.log((1.0 + t3) / (1.0 - t3))


def _f_sro(tau: float) -> float:
    tau = max(tau, 1.0 + _TAU_EPS)
    t5 = tau ** (-5)
    return math.log((1.0 + t5) / (1.0 - t5))


def _f_lro_vec(tau: np.ndarray) -> np.ndarray:
    tau = np.clip(tau, 1e-6, 1.0 - _TAU_EPS)
    t3 = tau**3
    return np.log((1.0 + t3) / (1.0 - t3))


def _f_sro_vec(tau: np.ndarray) -> np.ndarray:
    tau = np.maximum(tau, 1.0 + _TAU_EPS)
    t5 = tau ** (-5)
    return np.log((1.0 + t5) / (1.0 - t5))


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
    if value == 0.0 or not np.isfinite(value):
        return 0.0
    order = int(np.floor(np.log10(abs(value))))
    decimals = n - 1 - order
    return float(round(value, decimals))
