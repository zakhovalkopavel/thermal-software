"""
phase_diagrams.config.config_loader — Load and check a binary or ternary-curves config.

``<system>.config.json`` → DiagramConfig, ``<system>.curves.config.json`` → CurvesConfig.
"""
from __future__ import annotations

import json
from pathlib import Path

from phase_diagrams.config.curves_config import CurvesConfig
from phase_diagrams.config.diagram_config import DiagramConfig
from phase_diagrams.config.trace_segment_spec import TraceSegmentSpec

_BINARY_REQUIRED = (
    "system", "components", "output", "idPrefix", "source", "frameSearchBox",
    "axes", "phases", "endMembers", "invariants", "liquidus",
)
_CURVES_REQUIRED = ("systemFile", "pdfPage")


def load_config(path: Path | str) -> DiagramConfig | CurvesConfig:
    """Parse a config file; raises ValueError listing every schema problem found."""
    path = Path(path)
    data = json.loads(path.read_text(encoding="utf-8"))
    name = path.name.split(".")[0]
    if path.name.endswith(".curves.config.json"):
        _require(data, _CURVES_REQUIRED, path)
        problems = _curves_problems(data)
        if problems:
            raise ValueError(f"{path}: " + "; ".join(problems))
        return CurvesConfig.from_dict(data, name=name)
    _require(data, _BINARY_REQUIRED, path)
    problems = _binary_problems(data)
    if problems:
        raise ValueError(f"{path}: " + "; ".join(problems))
    return DiagramConfig.from_dict(data, name=name)


def _require(data: dict, keys: tuple[str, ...], path: Path) -> None:
    missing = [k for k in keys if k not in data]
    if missing:
        raise ValueError(f"{path}: missing keys {', '.join(missing)}")


def _width_problem(width, label: str) -> str | None:
    if width is not None and not (len(width) == 2 and 0 < width[0] < width[1]):
        return f"{label} must be [min, max] with 0 < min < max"
    return None


def _curves_problems(data: dict) -> list[str]:
    problems = [
        _width_problem(data.get("strokeWidth_px"), "strokeWidth_px"),
        _width_problem(data.get("isothermStrokeWidth_px"), "isothermStrokeWidth_px"),
    ]
    for curve in data.get("curves", []):
        label = f"curve {'/'.join(f or '?' for f in curve.get('fields', []))}"
        if not curve.get("path"):
            problems.append(f"{label}: empty path")
        elif len(curve["path"]) == 1 and not curve.get("endPixel"):
            problems.append(f"{label}: a single-point path needs endPixel")
        problems.append(_width_problem(curve.get("strokeWidth_px"), f"{label}: strokeWidth_px"))
        problems.extend(_waypoint_problems(curve.get("waypoints", []), label))
    for isotherm in data.get("isotherms", []):
        label = f"isotherm {isotherm.get('field')} {isotherm.get('temperature_C')}"
        for key in ("startPixel", "endPixel"):
            if key not in isotherm:
                problems.append(f"{label}: missing {key}")
        problems.append(_width_problem(isotherm.get("strokeWidth_px"), f"{label}: strokeWidth_px"))
        problems.extend(_waypoint_problems(isotherm.get("waypoints", []), label))
    for inversion in data.get("inversions", []):
        label = f"inversion {inversion.get('phase')} {inversion.get('change')}"
        for key in ("phase", "change", "startPixel", "endPixel"):
            if key not in inversion:
                problems.append(f"{label}: missing {key}")
        problems.append(_width_problem(inversion.get("strokeWidth_px"), f"{label}: strokeWidth_px"))
        problems.extend(_waypoint_problems(inversion.get("waypoints", []), label))
    for number, branch in enumerate(data.get("liquidImmiscibility", []), start=1):
        label = f"liquid immiscibility branch {number}"
        for key in ("startPixel", "endPixel"):
            if key not in branch:
                problems.append(f"{label}: missing {key}")
        problems.append(_width_problem(branch.get("strokeWidth_px"), f"{label}: strokeWidth_px"))
        problems.extend(_waypoint_problems(branch.get("waypoints", []), label))
    return [p for p in problems if p]


def _waypoint_problems(waypoints: list, label: str) -> list[str]:
    problems = []
    for waypoint in waypoints:
        pixel = waypoint.get("pixel") if isinstance(waypoint, dict) else waypoint
        if not isinstance(pixel, list) or len(pixel) != 2:
            problems.append(f"{label}: waypoint {waypoint} must be [x, y] or {{\"pixel\": [x, y], \"straight\": true}}")
    return problems


def _binary_problems(data: dict) -> list[str]:
    problems: list[str] = []
    components = data["components"]
    if len(components) != 2:
        problems.append("components must list two oxides")
    x = data["axes"].get("x", {})
    if x.get("component") not in components:
        problems.append("axes.x.component must be one of components")
    for axis in ("x", "y"):
        ticks = data["axes"].get(axis, {}).get("ticks", [])
        pixels = data["axes"].get(axis, {}).get("tickPixels")
        if len(ticks) < 2:
            problems.append(f"axes.{axis}.ticks needs at least two values")
        if pixels is not None and len(pixels) != len(ticks):
            problems.append(f"axes.{axis}.tickPixels must have one pixel per tick")
    if len(data["frameSearchBox"]) != 4:
        problems.append("frameSearchBox must be [x0, y0, x1, y1]")
    width = data.get("strokeWidth_px")
    if width is not None and not (len(width) == 2 and 0 < width[0] < width[1]):
        problems.append("strokeWidth_px must be [min, max] with 0 < min < max")
    phases = set(data["phases"])
    ids = [i.get("id") for i in data["invariants"]]
    if len(ids) != len(set(ids)):
        problems.append("invariant ids are not unique")
    for inv in data["invariants"]:
        for key in ("id", "type", "phases", "label", "seedPixel"):
            if key not in inv:
                problems.append(f"invariant {inv.get('id')}: missing {key}")
        if not str(inv.get("id", "")).startswith(data["idPrefix"] + "-"):
            problems.append(f"invariant {inv.get('id')}: id must start with '{data['idPrefix']}-'")
        for phase in inv.get("phases", []):
            if phase not in phases:
                problems.append(f"invariant {inv.get('id')}: phase '{phase}' not in phases")
        if inv.get("type") == "monotectic" and "secondSeedPixel" not in inv:
            problems.append(f"invariant {inv.get('id')}: monotectic needs secondSeedPixel")
        if "temperature" not in inv.get("label", {}):
            problems.append(f"invariant {inv.get('id')}: label.temperature missing (null = not printed)")
        elif inv["label"]["temperature"] is None and inv.get("type") == "compound-melting":
            problems.append(f"invariant {inv.get('id')}: compound-melting needs a printed temperature")
    refs = set(ids) | {f"end:{p}" for p in data["endMembers"]} | {f"{i}:second" for i in ids}
    for branch in data["liquidus"]:
        label = f"liquidus {branch.get('phase')} {branch.get('from')}→{branch.get('to')}"
        for key in ("from", "to"):
            if branch.get(key) not in refs:
                problems.append(f"{label}: unknown reference '{branch.get(key)}'")
        for segment in branch.get("segments", []):
            if segment.get("kind") not in TraceSegmentSpec.KINDS:
                problems.append(f"{label}: segment kind '{segment.get('kind')}'")
            for key in ("from", "to"):
                if key in segment and segment[key] not in refs:
                    problems.append(f"{label}: unknown segment reference '{segment[key]}'")
        if not branch.get("segments"):
            problems.append(f"{label}: no segments")
    immiscibility = data.get("liquidImmiscibility")
    if immiscibility and immiscibility.get("monotectic") not in ids:
        problems.append("liquidImmiscibility.monotectic must be an invariant id")
    return problems
