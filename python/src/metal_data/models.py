"""In-memory alloy record used during synthesis."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


MIN_SPLINE_POINTS = 4


@dataclass
class PropertySeries:
    points: list[dict[str, float]] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)
    unit: str = ""
    donor: Optional[dict[str, Any]] = None
    approximation: Optional[dict[str, Any]] = None

    def point_count(self) -> int:
        return len(self.points)

    def by_t_c(self) -> dict[float, float]:
        out: dict[float, float] = {}
        for p in self.points:
            t_c = round(p.get("T_C", p["T_K"] - 273.15), 6)
            out[t_c] = p["value"]
        return out


@dataclass
class AlloyRecord:
    material_id: str
    name: str
    group: str
    family: Optional[str]
    match_keys: set[str] = field(default_factory=set)
    aliases: dict[str, Any] = field(default_factory=dict)
    composition: dict[str, float] = field(default_factory=dict)
    condition: Optional[str] = None
    properties: dict[str, PropertySeries] = field(default_factory=dict)
    mechanical: dict[str, Any] = field(default_factory=dict)
    source_files: set[str] = field(default_factory=set)
    critical_temperatures: Optional[dict[str, Any]] = None

    def merge_composition(self, comp: dict[str, float]) -> None:
        if not comp:
            return
        if not self.composition:
            self.composition = dict(comp)
            return
        # Prefer denser composition maps
        if len(comp) > len(self.composition):
            self.composition = dict(comp)

    def merge_series(
        self,
        prop: str,
        points: list[dict[str, float]],
        *,
        source: str,
        unit: str,
    ) -> None:
        if not points:
            return
        series = self.properties.get(prop)
        if series is None:
            series = PropertySeries(unit=unit)
            self.properties[prop] = series
        by_t: dict[float, dict[str, float]] = {round(p["T_K"], 6): p for p in series.points}
        for p in points:
            key = round(p["T_K"], 6)
            if key not in by_t:
                by_t[key] = p
        series.points = sorted(by_t.values(), key=lambda x: x["T_K"])
        if source not in series.sources:
            series.sources.append(source)
        if unit and not series.unit:
            series.unit = unit
        self.source_files.add(source)
