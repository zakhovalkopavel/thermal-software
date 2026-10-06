"""
phase_diagrams.config.curves_config — Ternary curves config (configs/<system>.curves.config.json).

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Ternary curves config
"""
from __future__ import annotations

from dataclasses import dataclass, field


def _pixel(value) -> tuple[float, float]:
    return float(value[0]), float(value[1])


def _waypoint(value) -> dict:
    if isinstance(value, dict):
        return {"pixel": _pixel(value["pixel"]), "straight": bool(value.get("straight", False))}
    return {"pixel": _pixel(value), "straight": False}


def _width(value) -> tuple[float, float] | None:
    return None if value is None else (float(value[0]), float(value[1]))


@dataclass
class CurvesConfig:
    """Tracing hints for the boundary curves, isotherms, inversion curves and liquid-immiscibility branches of one ternary file.

    Each entry carries ``strokeWidth_px``: its own width range, or the config
    default (``strokeWidth_px`` for curves, inversions and immiscibility branches,
    ``isothermStrokeWidth_px`` for isotherms). A curve ``endPixel`` (or ``None``)
    is an open end after the last path point, where the curve leaves the figure.
    Isotherms, inversions and immiscibility branches run from ``startPixel`` to
    ``endPixel``. Waypoints are
    ``{"pixel": (x, y), "straight": bool}``; a straight waypoint is joined to the
    previous point by a straight line (stroke hidden by a label) instead of traced.
    """

    system_file: str
    pdf_page: int
    pixel_origin: tuple[float, float]
    stroke_width_px: tuple[float, float]
    endpoint_pixels: dict[str, tuple[float, float]]
    curves: list[dict] = field(default_factory=list)
    isotherms: list[dict] = field(default_factory=list)
    inversions: list[dict] = field(default_factory=list)
    liquid_immiscibility: list[dict] = field(default_factory=list)
    name: str = ""

    @classmethod
    def from_dict(cls, data: dict, name: str = "") -> "CurvesConfig":
        width = _width(data.get("strokeWidth_px", [3.5, 9]))
        isotherm_width = _width(data.get("isothermStrokeWidth_px")) or width
        curves = [
            {
                "fields": list(c["fields"]),
                "path": list(c["path"]),
                "waypoints": [_waypoint(p) for p in c.get("waypoints", [])],
                "endPixel": _pixel(c["endPixel"]) if c.get("endPixel") else None,
                "strokeWidth_px": _width(c.get("strokeWidth_px")) or width,
            }
            for c in data.get("curves", [])
        ]
        isotherms = [
            {
                "field": i["field"],
                "temperature_C": i["temperature_C"],
                "startPixel": _pixel(i["startPixel"]),
                "endPixel": _pixel(i["endPixel"]),
                "waypoints": [_waypoint(p) for p in i.get("waypoints", [])],
                "strokeWidth_px": _width(i.get("strokeWidth_px")) or isotherm_width,
            }
            for i in data.get("isotherms", [])
        ]
        inversions = [
            {
                "phase": v["phase"],
                "change": v["change"],
                "startPixel": _pixel(v["startPixel"]),
                "endPixel": _pixel(v["endPixel"]),
                "waypoints": [_waypoint(p) for p in v.get("waypoints", [])],
                "strokeWidth_px": _width(v.get("strokeWidth_px")) or width,
            }
            for v in data.get("inversions", [])
        ]
        liquid_immiscibility = [
            {
                "startPixel": _pixel(b["startPixel"]),
                "endPixel": _pixel(b["endPixel"]),
                "waypoints": [_waypoint(p) for p in b.get("waypoints", [])],
                "strokeWidth_px": _width(b.get("strokeWidth_px")) or width,
            }
            for b in data.get("liquidImmiscibility", [])
        ]
        return cls(
            system_file=data["systemFile"],
            pdf_page=int(data["pdfPage"]),
            pixel_origin=_pixel(data.get("pixelOrigin", [0, 0])),
            stroke_width_px=width,
            endpoint_pixels={k: _pixel(v) for k, v in data.get("endpointPixels", {}).items()},
            curves=curves,
            isotherms=isotherms,
            inversions=inversions,
            liquid_immiscibility=liquid_immiscibility,
            name=name,
        )
