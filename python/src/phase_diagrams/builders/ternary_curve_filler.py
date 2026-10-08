"""
phase_diagrams.builders.ternary_curve_filler — Fill ``polyline_wt`` (and boundary ``arrows``) of boundary curves, isotherms and inversion curves, and the liquid-immiscibility branches, in a ternary file.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Ternary curves, § Ternary files
"""
from __future__ import annotations

import copy
import json
import math
import re

import numpy as np
from PIL import Image, ImageDraw

from phase_diagrams.tracing.curve_tracer import trace_path
from phase_diagrams.config.curves_config import CurvesConfig
from phase_diagrams.detection.dash_mask import dash_mask
from phase_diagrams.detection.stroke_width_filter import stroke_width_filter
from phase_diagrams.tracing.polyline_simplifier import simplify_polyline
from phase_diagrams.tracing.quadratic_segment_fitter import fit_quadratic_segment
from phase_diagrams.tracing.convex_curve_fitter import fit_convex_curve
from phase_diagrams.tracing.divider_follower import follow_divider
from phase_diagrams.detection.text_detector import detect_text_boxes
from phase_diagrams.models.line_scale import LineScale
from phase_diagrams.models.review_item import ReviewItem
from phase_diagrams.models.ternary_calibration import TernaryCalibration
from phase_diagrams.models.ternary_fill import TernaryFill
from phase_diagrams.models.traced_curve import TracedCurve

_TRACE_GAP_PX = 15.0
_SAME_PIXEL_PX = 2.0
_MIN_ARC_PX = 6.0
_ON_DIVIDER_PX = 5.0
_GUIDE_PX = 10.0
_DIVIDER_BAND_PX = 11
_TRACK_POINT_PX = 3.0
_TEXT_MARGIN_PX = 2
_SIMPLIFY_WT = 0.1
_EDGE_WT = 0.3
_POLYLINE_KEY = re.compile(r'"polyline_wt"\s*:\s*')


def fill_ternary_curves(
    text: str,
    config: CurvesConfig,
    mask: np.ndarray,
    invariants: dict[str, dict],
    scale: LineScale | None = None,
) -> TernaryFill:
    """Trace every configured curve and isotherm and write its polyline into ``text``.

    ``mask`` is the plain ink mask of the page; each entry is traced on the mask
    filtered to its ``strokeWidth_px``. ``invariants`` maps every invariant id of
    the dataset to its entry (``liquid_wt``, ``sources``). The pixel tolerances
    are for the reference line width, scaled by ``scale``; config pixel values
    (``strokeWidth_px``, ``frameMask_px``) are taken as given.
    Config pixels (end points, waypoints, isotherm ends) are in the stored
    coordinates of the system file; ``pixelOrigin`` converts them to page pixels.
    Path points drawn at the same pixel are joined directly; an ``endPixel``
    extends a curve past its last path point (open end, not an invariant).
    With ``frameMask_px`` the triangle edges are erased from the tracing mask,
    so that no trace runs along the frame. Printed labels (text boxes) are
    erased from the tracing mask, and only traced pixels on ink are used as
    stroke data, so letters and dash gaps never shape a curve. Inversions,
    branches and isotherms are traced with the dividers traced before them
    erased as well, so they never take a boundary's ink as their own; whether a
    stretch runs along a divider is decided on the mask without them. For boundaries,
    inversions and immiscibility branches, the curve between two consecutive
    track points (path points, waypoints, ends) is one quadratic arc through
    both, fitted to the stroke; a straight waypoint joins its segment by a
    straight line (stroke hidden). A stretch of an inversion, branch or
    isotherm that runs along a boundary (or, for isotherms, an inversion or
    branch) between two track points is a copy of that curve, its ends moved
    onto it. Isotherms are traced last and split at those stretches and at the
    track points lying on a divider; each piece, inside one field, is one
    inflection-free curve of degree ≤ 4 (two points: the degree closest to the
    stroke; three or more: through the inner points). A ``dashed`` entry is traced on the
    dashes of the mask only (no stroke-width filter), so it cannot follow a
    solid line.
    An inversion entry (matched by ``phase`` and ``change``) gets ``polyline_wt``
    appended when it has none; that is the only key the filler may add there.
    A boundary curve with config ``arrows`` gets them set (appended when absent).
    Liquid-immiscibility branches are written, in config order, as
    ``liquidImmiscibility.polylines_wt`` (appended when absent).
    Raises ValueError for unmatched config entries, missing end pixels or a
    write that would change anything other than the filled polylines and arrows.
    """
    s = scale or LineScale()
    system = json.loads(text)
    components = list(system["components"])
    calibration = TernaryCalibration.from_system(system, config.pixel_origin)
    own_ids = {p["id"] for p in system.get("invariantPoints", [])}
    review: list[ReviewItem] = []
    log: list[str] = []
    curves: list[TracedCurve] = []
    polylines: dict[tuple[str, int], list[list[float]]] = {}

    def stored_pixel(point_id: str) -> tuple[float, float]:
        if point_id in config.endpoint_pixels:
            return config.endpoint_pixels[point_id]
        if point_id in own_ids:
            for source in invariants[point_id].get("sources", []):
                if source.get("ref") == "slag-atlas-1995" and source.get("pixel"):
                    return float(source["pixel"][0]), float(source["pixel"][1])
        raise ValueError(f"{config.name}: no pixel for '{point_id}'; add it to endpointPixels")

    def point_wt(point_id: str) -> list[float]:
        if point_id not in invariants:
            raise ValueError(f"{config.name}: path id '{point_id}' not found in any system file")
        liquid = invariants[point_id]["liquid_wt"]
        return [float(liquid.get(c, 0.0)) for c in components]

    def to_wt(pixels: list[tuple[float, float]]) -> list[list[float]]:
        out = []
        for px, py in pixels:
            wt = calibration.to_wt(px, py)
            out.append([wt[c] for c in components])
        return out

    filtered: dict[tuple[float, float] | str, np.ndarray] = {}
    frame = _frame_band(mask.shape, calibration, config.frame_mask_px) if config.frame_mask_px > 0 else None
    dividers: list[list[tuple[float, float]]] = []
    guide_px = s.length(_GUIDE_PX)

    def tracing_mask(width, dashed, divider_count) -> np.ndarray:
        key = ("dashed" if dashed else width, divider_count)
        if "text" not in filtered:
            filtered["text"] = _text_band(mask, s)
        if key not in filtered:
            erased = filtered["text"].copy()
            if frame is not None:
                erased |= frame
            if divider_count:
                erased |= _divider_band(mask.shape, dividers[:divider_count], s.count(_DIVIDER_BAND_PX))
            filtered[key] = (dash_mask(mask, scale=s) if dashed else stroke_width_filter(mask, width)) & ~erased
        return filtered[key]

    def trace(start, end, waypoints, label, width, dashed=False, kind="", temperature=None) -> TracedCurve:
        ink = tracing_mask(width, dashed, len(dividers) if kind != "boundary" else 0)
        plain = tracing_mask(width, dashed, 0)
        page = calibration.stored_to_page
        stops = [page(*start)] + [page(*w["pixel"]) for w in waypoints] + [page(*end)]
        straight = [False] + [w["straight"] for w in waypoints] + [False]
        forced = [False] + [w.get("split", False) for w in waypoints] + [False]
        strokes: list[list[tuple[float, float]]] = [[]]
        guides: list[list[tuple[float, float]]] = [[]]
        gap = 0.0
        for k in range(1, len(stops)):
            a, b = stops[k - 1], stops[k]
            stroke: list[tuple[float, float]] = []
            guide: list[tuple[float, float]] = []
            if straight[k]:
                log.append(f"{label}: straight step {_px(a)}→{_px(b)} ({math.dist(a, b):.0f} px, hidden stroke)")
            elif math.dist(a, b) >= s.length(_MIN_ARC_PX):
                traced = trace_path(ink, a, b, label=label, scale=s)
                gap += traced.gap_px
                stroke = [p for p in traced.pixels if _on(ink, p)]
                guide = stroke
                if ink is not plain and _near_divider(a, dividers, guide_px) and _near_divider(b, dividers, guide_px):
                    guide = [p for p in trace_path(plain, a, b, label=label, scale=s).pixels if _on(plain, p)]
            strokes.append(stroke)
            guides.append(guide)
        breaks = list(range(len(stops)))
        copies: dict[int, list[tuple[float, float]]] = {}
        if kind != "boundary":
            for k in range(1, len(stops)):
                along = follow_divider(stops[k - 1], stops[k], guides[k], dividers, tolerance_px=guide_px,
                                       on_px=s.length(_ON_DIVIDER_PX), scale=s)
                if along is not None:
                    copies[k] = along
                    log.append(f"{label}: {_px(stops[k - 1])}→{_px(stops[k])} runs along a field divider, "
                               "copied from it")
            for k, along in copies.items():
                stops[k - 1], stops[k] = along[0], along[-1]
            for k, along in copies.items():
                along[0], along[-1] = stops[k - 1], stops[k]
        if kind == "isotherm":
            ends = {k for c in copies for k in (c - 1, c)}
            inner = [k for k in range(1, len(stops) - 1)
                     if k in ends or forced[k] or _near_divider(stops[k], dividers, s.length(_ON_DIVIDER_PX))]
            for k in inner:
                reason = "split waypoint" if forced[k] else "on a field divider"
                log.append(f"{label}: split at {_px(stops[k])} ({reason})")
            breaks = [0] + inner + [len(stops) - 1]
        pixels: list[tuple[float, float]] = []
        for i, j in zip(breaks, breaks[1:]):
            a, b = stops[i], stops[j]
            if j - i == 1:
                if j in copies:
                    part = copies[j]
                elif straight[j] or not strokes[j]:
                    part = [a, b]
                elif kind == "isotherm":
                    part, degree, _ = fit_convex_curve(strokes[j], [a, b], scale=s)
                    if degree > 2:
                        log.append(f"{label} [{_px(a)}→{_px(b)}]: degree {degree} (closer to the printed line)")
                else:
                    part = fit_quadratic_segment(strokes[j], a, b, scale=s)
            else:
                data = [p for k in range(i + 1, j + 1) for p in strokes[k]]
                part, degree, offset = fit_convex_curve(data, stops[i:j + 1], scale=s)
                log.append(f"{label} [{_px(a)}→{_px(b)}]: degree {degree} through {j - i + 1} track points")
                if offset > s.length(_TRACK_POINT_PX):
                    review.append(ReviewItem("track-point-off-curve", label,
                                             f"a track point between {_px(a)} and {_px(b)} is {offset:.1f} px off the "
                                             "fitted curve (no inflection-free curve of degree ≤ 4 passes through all)"))
            pixels.extend(part if not pixels else part[1:])
        curve = TracedCurve(pixels=pixels, gap_px=gap, label=label, kind=kind, temperature_C=temperature)
        curves.append(curve)
        if curve.gap_px > s.length(_TRACE_GAP_PX):
            review.append(ReviewItem("trace-gap", label, f"path crosses {curve.gap_px:.0f} px of non-ink"))
        return curve

    boundary = system.get("boundaryCurves", [])
    arrows: dict[int, list[str]] = {}
    for entry in config.curves:
        index = next(
            (i for i, c in enumerate(boundary) if c.get("fields") == entry["fields"] and c.get("path") == entry["path"]),
            None,
        )
        if index is None:
            raise ValueError(f"{config.name}: no boundary curve {entry['fields']} {entry['path']}")
        label = f"{'/'.join(f or '?' for f in entry['fields'])} {'→'.join(entry['path'])}"
        path = entry["path"]
        ends = [stored_pixel(p) for p in path] + ([entry["endPixel"]] if entry["endPixel"] else [])
        assigned = _assign_waypoints(ends, entry["waypoints"])
        polyline: list[list[float]] = []
        for k in range(len(ends) - 1):
            a_id, b_id = path[k], path[k + 1] if k + 1 < len(path) else None
            if b_id is not None and not assigned[k] and math.dist(ends[k], ends[k + 1]) <= s.length(_SAME_PIXEL_PX):
                points = [point_wt(a_id), point_wt(b_id)]
                log.append(f"{label} [{a_id}→{b_id}]: drawn at the same pixel, joined directly")
            else:
                curve = trace(ends[k], ends[k + 1], assigned[k], f"{label} [{a_id}→{b_id or 'open end'}]", entry["strokeWidth_px"], entry["dashed"], "boundary")
                curve.arrow = entry["arrows"][k] if entry.get("arrows") else None
                points = to_wt(curve.pixels)
                points[0] = point_wt(a_id)
                if b_id is not None:
                    points[-1] = point_wt(b_id)
            simplified = simplify_polyline(points, _SIMPLIFY_WT)
            polyline.extend(simplified if not polyline else simplified[1:])
        polylines[("boundaryCurves", index)] = _rounded(polyline, label, log)
        log.append(f"{label}: {len(polyline)} points")
        if entry.get("arrows") is not None:
            arrows[index] = entry["arrows"]
            log.append(f"{label}: arrows {' '.join(entry['arrows'])}")
    dividers.extend(c.pixels for c in curves if c.kind == "boundary")

    inversions = system.get("inversions", [])
    for entry in config.inversions:
        index = next(
            (i for i, v in enumerate(inversions) if v.get("phase") == entry["phase"] and v.get("change") == entry["change"]),
            None,
        )
        if index is None:
            raise ValueError(f"{config.name}: no inversion {entry['phase']} '{entry['change']}'")
        label = f"inversion {entry['phase']} {entry['change']}"
        curve = trace(entry["startPixel"], entry["endPixel"], entry["waypoints"], label, entry["strokeWidth_px"], entry["dashed"], "inversion")
        polyline = simplify_polyline(to_wt(curve.pixels), _SIMPLIFY_WT)
        polylines[("inversions", index)] = _rounded(polyline, label, log)
        log.append(f"{label}: {len(polyline)} points")

    branches: list[list[list[float]]] = []
    if config.liquid_immiscibility and not isinstance(system.get("liquidImmiscibility"), dict):
        raise ValueError(f"{config.name}: liquidImmiscibility branches configured but the system file has no liquidImmiscibility object")
    for number, entry in enumerate(config.liquid_immiscibility, start=1):
        label = f"liquid immiscibility branch {number}"
        curve = trace(entry["startPixel"], entry["endPixel"], entry["waypoints"], label, entry["strokeWidth_px"], entry["dashed"], "immiscibility")
        polyline = simplify_polyline(to_wt(curve.pixels), _SIMPLIFY_WT)
        branches.append(_rounded(polyline, label, log))
        log.append(f"{label}: {len(polyline)} points")

    dividers.extend(c.pixels for c in curves if c.kind in ("inversion", "immiscibility"))
    isotherms = system.get("isotherms", [])
    for entry in config.isotherms:
        index = next(
            (i for i, c in enumerate(isotherms)
             if c.get("field") == entry["field"] and c.get("temperature_C") == entry["temperature_C"]
             and c.get("part", 1) == entry["part"]),
            None,
        )
        part = f" part {entry['part']}" if entry["part"] > 1 else ""
        if index is None:
            raise ValueError(f"{config.name}: no isotherm {entry['field']} {entry['temperature_C']}{part}")
        label = f"isotherm {entry['field']} {entry['temperature_C']}{part}"
        curve = trace(entry["startPixel"], entry["endPixel"], entry["waypoints"], label, entry["strokeWidth_px"], entry["dashed"], "isotherm",
                      entry["temperature_C"])
        curve.inferred = entry.get("inferred") is not None
        polyline = simplify_polyline(to_wt(curve.pixels), _SIMPLIFY_WT)
        polylines[("isotherms", index)] = _rounded(polyline, label, log)
        log.append(f"{label}: {len(polyline)} points")

    new_text = _replace_polylines(text, polylines)
    new_text = _set_entry_keys(new_text, "inversions", "polyline_wt", {i: v for (k, i), v in polylines.items() if k == "inversions"})
    new_text = _set_entry_keys(new_text, "boundaryCurves", "arrows", arrows)
    new_text = _set_immiscibility_polylines(new_text, branches)
    expected = copy.deepcopy(system)
    for (key, index), polyline in polylines.items():
        expected[key][index]["polyline_wt"] = polyline
    for index, value in arrows.items():
        expected["boundaryCurves"][index]["arrows"] = value
    if branches:
        expected["liquidImmiscibility"]["polylines_wt"] = branches
    units_missing = bool(polylines or branches) and "polyline_wt" not in system.get("units", {})
    if units_missing:
        unit = "[" + ", ".join(f"wt% {c}" for c in components) + "]"
        new_text = _add_units_entry(new_text, unit)
        expected.setdefault("units", {})["polyline_wt"] = unit
        log.append(f"units.polyline_wt added: {unit}")
    if json.loads(new_text) != expected:
        raise ValueError(f"{config.name}: rewrite changed more than polyline_wt and arrows; file left unchanged")
    return TernaryFill(text=new_text, curves=curves, filled=len(polylines) + len(branches), units_missing=units_missing, review=review, log=log)


def _add_units_entry(text: str, unit: str) -> str:
    """Append ``"polyline_wt": unit`` inside the (flat) ``units`` object."""
    match = re.search(r'"units"\s*:\s*\{', text)
    if match is None:
        raise ValueError("no 'units' object in system file")
    close = text.index("}", match.end())
    body = text[match.end():close].rstrip()
    separator = ", " if body.strip() else " "
    return text[:match.end()] + body + f'{separator}"polyline_wt": {json.dumps(unit, ensure_ascii=False)} ' + text[close:]


def _text_band(mask: np.ndarray, scale: LineScale) -> np.ndarray:
    """Mask of the printed labels (text boxes grown by ``_TEXT_MARGIN_PX``)."""
    band = np.zeros(mask.shape, bool)
    m = scale.count(_TEXT_MARGIN_PX)
    for x0, y0, x1, y1 in detect_text_boxes(mask, scale=scale):
        band[max(0, y0 - m):y1 + m, max(0, x0 - m):x1 + m] = True
    return band


def _on(ink: np.ndarray, point: tuple[float, float]) -> bool:
    return bool(ink[int(round(point[1])), int(round(point[0]))])


def _divider_band(shape: tuple[int, ...], dividers: list[list[tuple[float, float]]], width_px: int) -> np.ndarray:
    """Mask of the drawn dividers (traced polylines, ``width_px`` wide)."""
    band = Image.new("1", (shape[1], shape[0]), 0)
    draw = ImageDraw.Draw(band)
    for line in dividers:
        if len(line) >= 2:
            draw.line([tuple(p) for p in line], fill=1, width=width_px, joint="curve")
    return np.array(band, dtype=bool)


def _near_divider(point: tuple[float, float], dividers: list[list[tuple[float, float]]], px: float) -> bool:
    """Whether ``point`` lies within ``px`` of one of the divider polylines (page pixels)."""
    p = np.asarray(point, float)
    for line in dividers:
        if len(line) < 2:
            continue
        pts = np.asarray(line, float)
        a, seg = pts[:-1], np.diff(pts, axis=0)
        u = np.clip(((p - a) * seg).sum(axis=1) / np.maximum((seg ** 2).sum(axis=1), 1e-12), 0.0, 1.0)
        if float(np.linalg.norm(a + u[:, None] * seg - p, axis=1).min()) <= px:
            return True
    return False


def _frame_band(shape: tuple[int, ...], calibration: TernaryCalibration, width_px: float) -> np.ndarray:
    """Mask of the triangle edges (straight lines between the corner pixels), ``width_px`` wide."""
    band = Image.new("1", (shape[1], shape[0]), 0)
    corners = [calibration.stored_to_page(*calibration.corners[c]) for c in calibration.components]
    ImageDraw.Draw(band).line([*corners, corners[0]], fill=1, width=max(1, round(width_px)))
    return np.array(band, dtype=bool)


def _px(point: tuple[float, float]) -> str:
    return f"({point[0]:.0f}, {point[1]:.0f})"


def _assign_waypoints(ends, waypoints) -> list[list[dict]]:
    """Waypoints per path segment (nearest segment), ordered along the segment."""
    assigned: list[list[tuple[float, int, dict]]] = [[] for _ in range(len(ends) - 1)]
    for order, w in enumerate(waypoints):
        best = None
        for k, (a, b) in enumerate(zip(ends[:-1], ends[1:])):
            a_arr, b_arr, w_arr = np.array(a), np.array(b), np.array(w["pixel"])
            seg = b_arr - a_arr
            t = float(np.clip((w_arr - a_arr) @ seg / max(seg @ seg, 1e-9), 0.0, 1.0))
            distance = float(np.linalg.norm(w_arr - (a_arr + t * seg)))
            if best is None or distance < best[0]:
                best = (distance, k, t)
        assigned[best[1]].append((best[2], order, w))
    return [[w for _, _, w in sorted(items, key=lambda item: item[:2])] for items in assigned]


def _rounded(polyline: list[list[float]], label: str, log: list[str]) -> list[list[float]]:
    """Round to 0.1 wt%; a component up to ``_EDGE_WT`` below 0 (a stroke drawn on an edge) becomes 0."""
    out = []
    clamped = 0
    for point in polyline:
        a, b = round(point[0], 1), round(point[1], 1)
        values = [a, b, round(100.0 - a - b, 1)]
        if min(values) < -_EDGE_WT:
            raise ValueError(f"{label}: point {values} lies {-min(values):.1f} wt% outside the triangle")
        for i, value in enumerate(values):
            if value < 0.0:
                largest = max(range(3), key=lambda j: values[j])
                values[largest] = round(values[largest] + value, 1)
                values[i] = 0.0
                clamped += 1
        out.append([v + 0.0 for v in values])
    if clamped:
        log.append(f"{label}: {clamped} values within {_EDGE_WT} wt% outside the triangle set to 0")
    return out


def _replace_polylines(text: str, polylines: dict[tuple[str, int], list[list[float]]]) -> str:
    """Replace the value after the n-th ``"polyline_wt"`` key inside each array, back to front."""
    edits: list[tuple[int, int, str]] = []
    for key in ("boundaryCurves", "isotherms"):
        wanted = {index: value for (k, index), value in polylines.items() if k == key}
        if not wanted:
            continue
        key_match = re.search(rf'"{key}"\s*:\s*\[', text)
        if key_match is None:
            raise ValueError(f"no '{key}' array in system file")
        start = key_match.end() - 1
        end = _closing_index(text, start)
        matches = list(_POLYLINE_KEY.finditer(text, start, end))
        for index, value in wanted.items():
            edits.append((*_value_span(text, matches[index].end()), json.dumps(value)))
    return _apply_edits(text, edits)


def _set_entry_keys(text: str, array: str, key: str, values: dict[int, object]) -> str:
    """Set ``key`` of the n-th entry of ``array``; appended before its ``}`` when the entry has none."""
    if not values:
        return text
    key_match = re.search(rf'"{array}"\s*:\s*\[', text)
    if key_match is None:
        raise ValueError(f"no '{array}' array in system file")
    end = _closing_index(text, key_match.end() - 1)
    objects: list[tuple[int, int]] = []
    index = key_match.end()
    while index < end:
        if text[index] == "{":
            objects.append((index, _closing_index(text, index)))
            index = objects[-1][1]
        index += 1
    edits = [_key_edit(text, *objects[index], key, value) for index, value in values.items()]
    return _apply_edits(text, edits)


def _set_immiscibility_polylines(text: str, branches: list[list[list[float]]]) -> str:
    """Set ``polylines_wt`` of the ``liquidImmiscibility`` object; appended before its ``}`` when absent."""
    if not branches:
        return text
    key_match = re.search(r'"liquidImmiscibility"\s*:\s*\{', text)
    if key_match is None:
        raise ValueError("no 'liquidImmiscibility' object in system file")
    open_index = key_match.end() - 1
    return _apply_edits(text, [_key_edit(text, open_index, _closing_index(text, open_index), "polylines_wt", branches)])


def _key_edit(text: str, open_index: int, close_index: int, key: str, value) -> tuple[int, int, str]:
    """Edit setting ``key`` in the object between ``open_index`` and ``close_index``; appended before ``}`` when absent."""
    match = re.compile(rf'"{key}"\s*:\s*').search(text, open_index, close_index)
    if match is not None:
        return *_value_span(text, match.end()), json.dumps(value)
    body_end = len(text[:close_index].rstrip())
    return body_end, body_end, f', "{key}": {json.dumps(value)}'


def _value_span(text: str, value_start: int) -> tuple[int, int]:
    """Start and end of the ``null`` or array value at ``value_start``."""
    value_end = value_start + 4 if text.startswith("null", value_start) else _closing_index(text, value_start) + 1
    return value_start, value_end


def _apply_edits(text: str, edits: list[tuple[int, int, str]]) -> str:
    for value_start, value_end, replacement in sorted(edits, reverse=True):
        text = text[:value_start] + replacement + text[value_end:]
    return text


def _closing_index(text: str, open_index: int) -> int:
    """Index of the ``]`` or ``}`` closing the bracket at ``open_index`` (strings are skipped)."""
    depth = 0
    in_string = False
    index = open_index
    while index < len(text):
        char = text[index]
        if in_string:
            if char == "\\":
                index += 1
            elif char == '"':
                in_string = False
        elif char == '"':
            in_string = True
        elif char in "[{":
            depth += 1
        elif char in "]}":
            depth -= 1
            if depth == 0:
                return index
        index += 1
    raise ValueError("unbalanced brackets in system file")
