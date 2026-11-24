"""Composition-nearest donor links — never copy donor knots into `points`.

`points` stay own measurements only. Donor is a brief link:
  materialId, mode, why, optional scale + scale-fit error.

Nearest neighbour by ElMD (Element Mover’s Distance) on Fe-balanced compositions;
family preference still applies. Consumers resolve the donor alloy and apply `scale`.

Refs:
  [59] Hargreaves2020ElMD — Chem. Mater. 32 (2020) 10610–10620.
"""

from __future__ import annotations

from typing import Any, Optional

import numpy as np

from metal_data.approximation import approximation_t_window
from metal_data.composition import (
    ELMD_METRIC,
    composition_elmd,
    composition_l1,
)
from metal_data.models import MIN_SPLINE_POINTS, AlloyRecord, PropertySeries
from references import RefKey

assert RefKey.Hargreaves2020ElMD.value == "Hargreaves2020ElMD"

THERMAL_PROPS = (
    "thermalConductivity",
    "specificHeat",
    "thermalExpansion",
    "electricalResistivity",
)

MIN_SCALE_POINTS = 2
WIDE_RANGE_FRACTION = 0.40
WIDE_RANGE_ABS_K = 200.0


def apply_donor_fill(registry: dict[str, AlloyRecord]) -> list[dict[str, Any]]:
    """Attach donor links for sparse series. Own `points` are never replaced/extended."""
    report: list[dict[str, Any]] = []
    records = list(registry.values())

    for rec in records:
        for prop in THERMAL_PROPS:
            series = rec.properties.get(prop)
            own_count = series.point_count() if series else 0
            own_points = [dict(p) for p in series.points] if series else []
            window = approximation_t_window(series) if series else None

            if own_count >= MIN_SPLINE_POINTS and window is None:
                continue

            donor = _nearest_donor(rec, prop, records)
            if donor is None:
                continue
            donor_series = donor.properties[prop]
            dist = round(composition_elmd(rec.composition, donor.composition), 6)
            match = _match_bracket(rec, donor, dist)

            if own_count >= MIN_SCALE_POINTS and series is not None:
                fitted = _fit_donor_scale(own_points, donor_series.points)
                if fitted is None:
                    continue
                scale, scale_quality, scale_error = fitted

                if window is not None:
                    t_min, t_max = window
                    has_exterior = any(
                        float(p["T_K"]) < t_min - 1e-9 or float(p["T_K"]) > t_max + 1e-9
                        for p in donor_series.points
                    )
                    if not has_exterior:
                        continue
                    # Keep own points only — exterior comes from donor×scale at eval time
                    series.donor = _brief_donor(
                        material_id=donor.material_id,
                        mode="extend-outside-range",
                        scale=scale,
                        scale_quality=scale_quality,
                        error=scale_error,
                        why=(
                            f"own approx covers {t_min:.0f}–{t_max:.0f} K; "
                            f"link scaled {donor.material_id} outside {match}"
                        ),
                        composition_distance=dist,
                    )
                else:
                    series.donor = _brief_donor(
                        material_id=donor.material_id,
                        mode="scaled-series",
                        scale=scale,
                        scale_quality=scale_quality,
                        error=scale_error,
                        why=(
                            f"only {own_count} own points; "
                            f"link scaled {donor.material_id} curve {match}"
                        ),
                        composition_distance=dist,
                    )
            else:
                if series is None:
                    series = PropertySeries(unit=donor_series.unit)
                    rec.properties[prop] = series
                elif not series.unit and donor_series.unit:
                    series.unit = donor_series.unit
                why = (
                    f"{rec.material_id} doesn't have {prop} points; "
                    f"link {donor.material_id} series {match}"
                    if own_count <= 0
                    else (
                        f"only 1 {prop} point; "
                        f"link {donor.material_id} series {match}"
                    )
                )
                series.donor = _brief_donor(
                    material_id=donor.material_id,
                    mode="full-series",
                    scale=None,
                    scale_quality=None,
                    error=None,
                    why=why,
                    composition_distance=dist,
                )

            report.append(
                {
                    "materialId": rec.material_id,
                    "property": prop,
                    "ownPoints": own_count,
                    "donorMaterialId": donor.material_id,
                    "mode": series.donor["mode"],
                    "compositionDistance": series.donor["compositionDistance"],
                    "distanceMetric": series.donor.get("distanceMetric"),
                    "scale": series.donor.get("scale"),
                    "error": series.donor.get("error"),
                    "why": series.donor["why"],
                }
            )
    return report


def _brief_donor(
    *,
    material_id: str,
    mode: str,
    scale: Optional[float],
    scale_quality: Optional[str],
    error: Optional[dict[str, Any]],
    why: str,
    composition_distance: float,
) -> dict[str, Any]:
    out: dict[str, Any] = {
        "materialId": material_id,
        "mode": mode,
        "why": why,
        "compositionDistance": composition_distance,
        "distanceMetric": f"ElMD-{ELMD_METRIC}",
    }
    if scale is not None:
        out["scale"] = round(float(scale), 8)
    if scale_quality is not None:
        out["scaleQuality"] = scale_quality
    if error is not None:
        out["error"] = error
    return out


def _fit_donor_scale(
    own_points: list[dict[str, float]],
    donor_points: list[dict[str, float]],
) -> Optional[tuple[float, str, dict[str, Any]]]:
    """Least-squares scale s so donor(T)·s ≈ own(T) at own anchors."""
    donor_t = np.asarray([float(p["T_K"]) for p in donor_points], dtype=float)
    donor_y = np.asarray([float(p["value"]) for p in donor_points], dtype=float)
    if len(donor_t) < MIN_SPLINE_POINTS:
        return None

    own_t = np.asarray([float(p["T_K"]) for p in own_points], dtype=float)
    own_y = np.asarray([float(p["value"]) for p in own_points], dtype=float)
    d_at_own = np.interp(own_t, donor_t, donor_y)
    usable = np.abs(d_at_own) > 1e-15
    if int(np.count_nonzero(usable)) < MIN_SCALE_POINTS:
        return None

    d_u = d_at_own[usable]
    y_u = own_y[usable]
    denom = float(np.sum(d_u**2))
    if denom <= 0:
        return None
    scale = float(np.sum(d_u * y_u) / denom)
    if not np.isfinite(scale) or scale == 0:
        return None

    pred = d_u * scale
    resid = y_u - pred
    rmse = float(np.sqrt(np.mean(resid**2)))
    max_rel = None
    rels = [abs(r / y) * 100.0 for r, y in zip(resid, y_u) if y != 0]
    if rels:
        max_rel = float(max(rels))
    scale_error = {
        "rmse": round(rmse, 8),
        "maxRelPct": None if max_rel is None else round(max_rel, 6),
    }

    own_span = float(np.max(own_t) - np.min(own_t))
    donor_span = float(np.max(donor_t) - np.min(donor_t))
    wide = own_span >= WIDE_RANGE_ABS_K or (
        donor_span > 0 and own_span / donor_span >= WIDE_RANGE_FRACTION
    )
    scale_quality = "wide-range" if wide else "narrow-range"
    return scale, scale_quality, scale_error


def _match_bracket(rec: AlloyRecord, donor: AlloyRecord, dist: float) -> str:
    """Match note: ElMD + raw |Δwt%| breakdown for readability."""
    if rec.family and donor.family == rec.family:
        scope = f"same family {rec.family}"
    else:
        scope = f"same group {rec.group}"
    parts = _composition_delta_parts(rec.composition, donor.composition)
    detail = f" [{'; '.join(parts)}]" if parts else ""
    l1 = composition_l1(rec.composition, donor.composition)
    return (
        f"({scope}; ElMD={dist:g}, L1={l1:g} wt%{detail})"
    )


def _composition_delta_parts(
    own: dict[str, float], other: dict[str, float]
) -> list[str]:
    """Non-zero |Δwt%| terms, largest first: ΔC=0.3; ΔCr=0.5."""
    deltas: list[tuple[float, str, float]] = []
    for el in set(own) | set(other):
        d = abs(float(own.get(el, 0.0)) - float(other.get(el, 0.0)))
        if d <= 1e-9:
            continue
        deltas.append((-d, el, d))
    deltas.sort()
    return [f"Δ{el}={d:g}%" for _, el, d in deltas]


def _nearest_donor(
    rec: AlloyRecord,
    prop: str,
    records: list[AlloyRecord],
) -> Optional[AlloyRecord]:
    candidates: list[tuple[float, float, AlloyRecord]] = []
    for other in records:
        if other.material_id == rec.material_id:
            continue
        if other.group != rec.group:
            continue
        series = other.properties.get(prop)
        if series is None or series.point_count() < MIN_SPLINE_POINTS:
            continue
        if series.donor is not None:
            continue
        dist = composition_elmd(rec.composition, other.composition)
        same_family = int(not (rec.family and other.family == rec.family))
        same_condition = 0.0
        if rec.condition and other.condition:
            same_condition = float(rec.condition != other.condition)
        candidates.append((float(same_family), same_condition + dist, other))

    if not candidates:
        return None
    candidates.sort(key=lambda t: (t[0], t[1]))
    return candidates[0][2]
