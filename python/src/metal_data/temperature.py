"""Temperature key parsing and SI conversions for metal property tables."""

from __future__ import annotations

import re
from typing import Any, Optional


_RANGE = re.compile(r"^\s*(-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)\s*$")
_POINT = re.compile(r"^\s*(-?\d+(?:\.\d+)?)\s*$")


def celsius_to_kelvin(t_c: float) -> float:
    return t_c + 273.15


def parse_temp_key_c(key: Any, *, range_mode: str = "mid") -> Optional[float]:
    """Parse a table temperature key expressed in °C.

    ``range_mode``:
      - ``mid`` — midpoint (specific heat bands)
      - ``high`` — upper bound (mean CTE from 0→T)
    """
    if isinstance(key, (int, float)):
        return float(key)
    s = str(key).strip()
    m = _RANGE.match(s)
    if m:
        lo, hi = float(m.group(1)), float(m.group(2))
        return hi if range_mode == "high" else (lo + hi) / 2.0
    m = _POINT.match(s)
    if m:
        return float(m.group(1))
    return None


def values_map_to_series(
    values: dict[Any, Any],
    *,
    unit_temp: str = "C",
    range_mode: str = "mid",
) -> list[dict[str, float]]:
    """Convert a {temp_key: value} map to sorted ``[{T_K, value}, …]``."""
    points: list[dict[str, float]] = []
    for k, v in (values or {}).items():
        if v is None:
            continue
        try:
            num = float(v)
        except (TypeError, ValueError):
            continue
        t_c = parse_temp_key_c(k, range_mode=range_mode)
        if t_c is None:
            continue
        t_k = float(t_c) if unit_temp.upper() == "K" else celsius_to_kelvin(t_c)
        points.append({"T_K": t_k, "value": num, "T_C": t_c if unit_temp.upper() != "K" else t_k - 273.15})
    points.sort(key=lambda p: p["T_K"])
    return points


def density_to_si(value: float, unit: str) -> float:
    u = unit.lower().replace(" ", "")
    if "g/cm" in u or "g·cm" in u or u in {"g/cm3", "g/cm³"}:
        return value * 1000.0  # → kg/m³
    return value


def resistivity_to_si(value: float, unit: str) -> float:
    """Convert tabulated resistivity to Ω·m."""
    u = (
        unit.lower()
        .replace(" ", "")
        .replace("·", "")
        .replace("*", "")
        .replace("μ", "u")
        .replace("µ", "u")
        .replace("ω", "ohm")
        .replace("Ω", "ohm")
    )
    if "nohm" in u:
        return value * 1e-9
    if "uohm" in u or "microohm" in u:
        if "cm" in u:
            return value * 1e-8
        return value * 1e-6
    return value
