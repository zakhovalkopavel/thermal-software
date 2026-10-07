"""
phase_diagrams.builders.node_map_builder — Numbered points of a ternary diagram for topology hints.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Node map
"""
from __future__ import annotations

import math

import cv2
import numpy as np
from scipy import ndimage

from phase_diagrams.detection.dash_end_detector import detect_dash_ends
from phase_diagrams.detection.junction_detector import detect_junctions
from phase_diagrams.detection.ring_detector import detect_rings
from phase_diagrams.detection.text_detector import detect_text_boxes
from phase_diagrams.models.diagram_node import DiagramNode
from phase_diagrams.models.line_scale import LineScale
from phase_diagrams.models.ternary_calibration import TernaryCalibration

_MARGIN_PX = 8
_INVARIANT_PX = 12.0
_EDGE_PX = 10.0
_ROW_BAND_PX = 50
_DASH_END_PX = 10.0
_TEXT_PAD_PX = 6
_FRAME_WIDTH_PX = 3
_TICK_PX = 15.0
_TICK_INNER_PX = (28, 42)
_TICK_SIDE_PX = 15
_SOLID_PX = 60
_CORNER_PX = 12.0
_RING_PAD_PX = 6.0
_PREFIX = {"corner": "V", "invariant": "I", "junction": "X", "edge": "E", "dash-end": "D", "ring": "C"}


def build_node_map(
    system: dict,
    mask: np.ndarray,
    pixel_origin: tuple[float, float] = (0.0, 0.0),
    scale: LineScale | None = None,
) -> list[DiagramNode]:
    """Triangle corners, invariants, junctions, edge points, dash ends and rings.

    Labels have one letter per kind (V corner, I invariant, X crossing, E edge
    point, D dash end, C ring) and run in reading order (bands of 50 px, then x).
    Corners are the calibration corners (``invariant`` = the component); other
    points within 12 px of a corner, except invariants, are dropped.
    Detected junctions within 12 px of an invariant of the system file are
    replaced by the invariant (its stored atlas pixel); junctions on a ring are
    dropped. Junctions and dash ends inside label boxes (padded 6 px) and rings
    inside unpadded label boxes are dropped. Edge points lie on the edge line;
    an edge point at a 10 % tick with no ink 28–42 px inside is the bare tick
    and dropped. Dash ends within 10 px of another node are dropped. Pixel sizes
    are for the reference line width, scaled by ``scale``.
    """
    s = scale or LineScale()
    margin, pad = s.count(_MARGIN_PX), s.count(_TEXT_PAD_PX)
    calibration = TernaryCalibration.from_system(system, pixel_origin)
    components = list(system["components"])
    corners = np.array([calibration.stored_to_page(*calibration.corners[c]) for c in components])
    x0, y0 = (np.floor(corners.min(axis=0)) - 3 * margin).astype(int)
    x1, y1 = (np.ceil(corners.max(axis=0)) + 3 * margin).astype(int)
    x0, y0 = max(x0, 0), max(y0, 0)
    x1, y1 = min(x1, mask.shape[1]), min(y1, mask.shape[0])
    region = np.zeros((y1 - y0, x1 - x0), np.uint8)
    cv2.fillPoly(region, [np.round(corners - [x0, y0]).astype(np.int32)], 1)
    region = ndimage.binary_dilation(region.astype(bool), iterations=margin)
    local = mask[y0:y1, x0:x1] & region
    frame = np.zeros(local.shape, np.uint8)
    cv2.polylines(frame, [np.round(corners - [x0, y0]).astype(np.int32)], True, 1, s.count(_FRAME_WIDTH_PX))
    found_rings = detect_rings(local, scale=s)
    text_boxes = detect_text_boxes(local, exclude=[(x, y) for x, y, _ in found_rings], scale=s)
    blocked = np.zeros(local.shape, bool)
    for bx0, by0, bx1, by1 in text_boxes:
        blocked[max(by0 - pad, 0):by1 + pad, max(bx0 - pad, 0):bx1 + pad] = True

    def in_text(page: tuple[float, float], pad: bool) -> bool:
        lx, ly = int(round(page[0] - x0)), int(round(page[1] - y0))
        if pad:
            return 0 <= ly < blocked.shape[0] and 0 <= lx < blocked.shape[1] and bool(blocked[ly, lx])
        return any(bx0 <= lx <= bx1 and by0 <= ly <= by1 for bx0, by0, bx1, by1 in text_boxes)

    rings = [(x + x0, y + y0, d) for x, y, d in found_rings if not in_text((x + x0, y + y0), False)]
    component_labels, _ = ndimage.label(local, structure=np.ones((3, 3), bool))
    sides = [0] + [max(b[0].stop - b[0].start, b[1].stop - b[1].start) for b in ndimage.find_objects(component_labels)]
    solid = (np.array(sides) >= s.count(_SOLID_PX))[component_labels]
    invariants = []
    for point in system.get("invariantPoints", []):
        pixel = next((s.get("pixel") for s in point.get("sources", []) if s.get("ref") == "slag-atlas-1995" and s.get("pixel")), None)
        if pixel is not None:
            invariants.append((point["id"], calibration.stored_to_page(float(pixel[0]), float(pixel[1]))))

    candidates: list[tuple[str, tuple[float, float], str | None]] = [("invariant", p, i) for i, p in invariants]
    for jx, jy in detect_junctions(local, scale=s):
        page = (jx + x0, jy + y0)
        if any(math.dist(page, p) <= s.length(_INVARIANT_PX) for _, p in invariants):
            continue
        if any(math.dist(page, (rx, ry)) <= d / 2.0 + s.length(_RING_PAD_PX) for rx, ry, d in rings) or in_text(page, True):
            continue
        if _edge_distance(page, corners) <= s.length(_EDGE_PX):
            page = _onto_edge(page, corners)
            if _bare_tick(page, corners, solid, (x0, y0), s):
                continue
            candidates.append(("edge", page, None))
        else:
            candidates.append(("junction", page, None))
    for ex, ey in detect_dash_ends(local, frame=frame.astype(bool), blocked=blocked, scale=s):
        page = (ex + x0, ey + y0)
        if in_text(page, True) or any(math.dist(page, p) <= s.length(_DASH_END_PX) for _, p, _ in candidates):
            continue
        candidates.append(("dash-end", page, None))
    candidates += [("ring", (x, y), None) for x, y, _ in rings]
    candidates = [c for c in candidates
                  if c[0] == "invariant" or all(math.dist(c[1], corner) > s.length(_CORNER_PX) for corner in corners)]
    candidates += [("corner", (float(x), float(y)), c) for c, (x, y) in zip(components, corners)]
    band = s.count(_ROW_BAND_PX)
    candidates.sort(key=lambda c: (int(c[1][1] // band), c[1][0]))

    numbers = dict.fromkeys(_PREFIX, 0)
    nodes = []
    for kind, page, invariant in candidates:
        numbers[kind] += 1
        wt = calibration.to_wt(*page)
        nodes.append(DiagramNode(f"{_PREFIX[kind]}{numbers[kind]}", kind, calibration.page_to_stored(*page),
                                 [wt[c] for c in components], invariant))
    return nodes


def _edges(corners: np.ndarray) -> list[tuple[np.ndarray, np.ndarray]]:
    return [(corners[0], corners[1]), (corners[1], corners[2]), (corners[2], corners[0])]


def _foot(point: tuple[float, float], a: np.ndarray, b: np.ndarray) -> tuple[np.ndarray, float]:
    segment = b - a
    t = float(np.clip((np.array(point) - a) @ segment / (segment @ segment), 0.0, 1.0))
    return a + t * segment, t


def _edge_distance(point: tuple[float, float], corners: np.ndarray) -> float:
    return min(float(np.linalg.norm(np.array(point) - _foot(point, a, b)[0])) for a, b in _edges(corners))


def _onto_edge(point: tuple[float, float], corners: np.ndarray) -> tuple[float, float]:
    foot = min((_foot(point, a, b)[0] for a, b in _edges(corners)), key=lambda f: float(np.linalg.norm(np.array(point) - f)))
    return float(foot[0]), float(foot[1])


def _bare_tick(point: tuple[float, float], corners: np.ndarray, solid: np.ndarray, origin: tuple[int, int],
               scale: LineScale) -> bool:
    """True if ``point`` is at a 10 % tick of its edge and no solid line lies 28–42 px inside it."""
    centroid = corners.mean(axis=0)
    a, b = min(_edges(corners), key=lambda e: float(np.linalg.norm(np.array(point) - _foot(point, *e)[0])))
    _, t = _foot(point, a, b)
    length = float(np.linalg.norm(b - a))
    tick = round(t * 10) / 10
    if not 0.0 < tick < 1.0 or abs(t - tick) * length > scale.length(_TICK_PX):
        return False
    along = (b - a) / length
    inward = np.array([-along[1], along[0]])
    if inward @ (centroid - a) < 0:
        inward = -inward
    base = a + tick * (b - a)
    side_px = scale.count(_TICK_SIDE_PX)
    for depth in range(scale.count(_TICK_INNER_PX[0]), scale.count(_TICK_INNER_PX[1]) + 1):
        for side in range(-side_px, side_px + 1):
            x, y = np.round(base + inward * depth + along * side - origin).astype(int)
            if 0 <= y < solid.shape[0] and 0 <= x < solid.shape[1] and solid[y, x]:
                return False
    return True
