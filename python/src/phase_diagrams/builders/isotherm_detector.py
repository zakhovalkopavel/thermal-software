"""
phase_diagrams.builders.isotherm_detector — Isotherms of a ternary found on the page: the thin lines inside the fields,
their temperatures from the labels printed in them and from the order of the lines along the boundaries.

Spec: docs/scripts/phase-diagrams/ALGORITHMS.md § Isotherm detection
"""
from __future__ import annotations

import math
from collections import Counter
from typing import Callable

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

from phase_diagrams.builders.field_regions_builder import build_field_regions
from phase_diagrams.builders.isotherm_field_order import field_order_chains
from phase_diagrams.builders.isotherm_side_labels import side_label_pieces
from phase_diagrams.builders.isotherm_temperature_solver import solve_isotherm_temperatures
from phase_diagrams.detection.ring_detector import detect_rings
from phase_diagrams.detection.skeleton_branches import skeleton_branches
from phase_diagrams.detection.skeletonizer import skeletonize
from phase_diagrams.detection.text_detector import detect_text_boxes
from phase_diagrams.models.detected_isotherm import DetectedIsotherm
from phase_diagrams.models.isotherm_detection import IsothermDetection
from phase_diagrams.models.line_scale import LineScale
from phase_diagrams.models.page_word import PageWord
from phase_diagrams.models.review_item import ReviewItem
from phase_diagrams.models.ternary_calibration import TernaryCalibration
from phase_diagrams.tracing.branch_chainer import chain_branches
from phase_diagrams.validation.inferred_temperature_check import inferred_temperature_problem

NumberReader = Callable[[np.ndarray, float], tuple[str, float]]

_MARGIN_PX = 20
_TEXT_PAD_PX = 3
_BOUNDARY_BAND_PX = 17
_FRAME_BAND_PX = 14
_HEAVY_MARGIN_PX = 1.5
_HEAVY_GROW_PX = 6
_RING_PAD_PX = 6
_MIN_BRANCH_PX = 3
_SPUR_PX = 8
_MIN_INK_PX = 30.0
_MIN_EXTENT_PX = 45.0
_DIRECTION_PX = 8
_SNAP_REACH_PX = 25.0
_NEAR_BOUNDARY_PX = 16.0
_NEAR_EDGE_PX = 16.0
_NEAR_TEXT_PX = 10
_OUTSIDE_PX = (6.0, 60.0)
_OUTSIDE_SHARE = 0.7
_OUTSIDE_SIDE_PX = 3
_STRAIGHT_PX = 2.5
_LEADER_MAX_PX = 150.0
_LEADER_POINT_PX = 30.0
_JOIN_MIN_PX = 100.0
_JOIN_RING_PX = 14.0
_CORNER_ARM_PX = 40.0
_CORNER_DEG = 25.0
_LOST_ONE_C = 1000.0
_LABELLED_CROSSING = 1.5
_RESNAP_EDGE_PX = 25.0
_CROSSING_PX = 35.0
_LABEL_AHEAD_PX = 80.0
_LABEL_SIDE_PX = 15.0
_LABEL_GROW = 0.8
_LABEL_RANGE_C = (100.0, 3000.0)
_MIN_CONFIDENCE = 25.0
_DASHED_SHARE = 0.25
_ARC_MARGIN_PX = 3.0
_MAX_CANDIDATES = 8


def detect_isotherms(
    system: dict,
    mask: np.ndarray,
    calibration: TernaryCalibration,
    invariants: dict[str, dict],
    isotherm_width_px: tuple[float, float],
    step_C: float = 100.0,
    read_number: NumberReader | None = None,
    scale: LineScale | None = None,
    side_labels: list[PageWord] | None = None,
    skip_boxes: list[tuple[int, int, int, int]] | None = None,
) -> IsothermDetection:
    """Isotherm pieces of ``system`` (boundary curves with ``polyline_wt``) on the page ``mask``.

    Thin lines: the ink inside the triangle without the frame (14 px band), the boundary curves
    (17 px band along their polylines), strokes wider than ``isotherm_width_px`` (+ 1.5 px; ink
    within 6 px of their cores), label
    boxes (``detect_text_boxes``, + 3 px) and rings (+ 6 px); skeletonized, split into branches and
    joined into lines by ``chain_branches`` (through crossings, breaks, dash gaps and labels).
    Not isotherms: lines with < 30 px of ink or < 45 px across (digits the label detector missed);
    lines running on outside the triangle (ink within ±3 px on ≥ 70 % of 6–60 px beyond the edge:
    leaders of outside labels); straight lines (≤ 2.5 px off their chord) up to 150 px from a label
    to a free end or to within 30 px of a printed point (an atlas invariant pixel or a ring: leaders),
    or ≥ 100 px long ending at a ring (compatibility joins); two straight parts (each ≥ 40 px) meeting at a
    corner of at least 25° (joins, leaders: isotherms are smooth); lines outside every field region
    (``build_field_regions``). Ends are moved onto the
    boundary or edge they point at (≤ 25 px ahead, else ≤ 16 px away).
    Temperatures: a label in a line gap, or touching a line end ahead of it (≤ 80 px), is read by
    ``read_number`` (its glyph boxes plus every ink component lying wholly within them grown by
    0.8 glyph size: a long thin ``1`` is not a glyph box) (a multiple of ``step_C`` between 100 and 3000 °C with Tesseract confidence ≥ 25); pieces
    ending at one point of a boundary (ends ≤ 35 px apart: the liquidus has one temperature there)
    are one line (``group``; ends of pieces with one label first, up to 52 px apart as a shallow
    crossing shifts the ends, then closest ends first; never two pieces of one field or with
    different labels); along each boundary stretch between path points of known, different
    temperatures (``invariants``; not a stretch with a maximum, arrows ``<>``) the crossings rise
    strictly from the lower to the higher temperature (a label outside the temperatures of a stretch
    its piece ends on is not used; a crossing of another piece of a labelled line outside the
    stretch's temperatures is not used; ``solve_isotherm_temperatures``; a stretch
    contradicting the others is not used and goes to the review list).
    Optional words read on the page: ``side_labels`` (temperatures printed beside a line, joined by a
    leader or touching it: ``side_label_pieces``; a multiple of ``step_C``) label the piece they belong
    to, after the labels in its gaps; a 3-digit side label below the lowest invariant temperature is
    taken with a leading 1 (lost in its leader tick); glyphs inside ``skip_boxes`` (page boxes of words
    that are point temperatures) are not read as isotherm labels. Labels below the lowest invariant
    temperature are not isotherm temperatures. An end of a labelled piece on a boundary stretch whose
    temperatures exclude the label is moved to the triangle edge when that is within 25 px (a narrow
    field between a boundary and an edge).
    Then the order across each field (``field_order_chains``: neighbouring lines one ``step_C`` apart)
    fixes the lines still open (source ``field order``); a section contradicting the rest is not used.
    Pixel sizes are for the reference line width, scaled by ``scale``.
    """
    s = scale or LineScale()
    log: list[str] = []
    review: list[ReviewItem] = []
    components = list(system["components"])
    corners = np.array([calibration.stored_to_page(*calibration.corners[c]) for c in components])
    margin = s.count(_MARGIN_PX)
    x0, y0 = (np.floor(corners.min(axis=0)) - margin).astype(int)
    x1, y1 = (np.ceil(corners.max(axis=0)) + margin).astype(int)
    x0, y0, x1, y1 = max(int(x0), 0), max(int(y0), 0), min(int(x1), mask.shape[1]), min(int(y1), mask.shape[0])
    origin = np.array([x0, y0], float)
    local = mask[y0:y1, x0:x1]
    height, width = local.shape

    def page(wt) -> np.ndarray:
        return np.array(calibration.to_page([float(wt.get(c, 0.0)) for c in components] if isinstance(wt, dict) else wt))

    boundaries = [(index, curve, np.array([page(w) for w in curve["polyline_wt"]]) - origin)
                  for index, curve in enumerate(system.get("boundaryCurves", [])) if curve.get("polyline_wt")]
    triangle = corners - origin
    edges = [(triangle[k], triangle[(k + 1) % 3]) for k in range(3)]

    barrier_image = Image.new("1", (width, height), 0)
    draw = ImageDraw.Draw(barrier_image)
    draw.line([*map(tuple, triangle), tuple(triangle[0])], fill=1, width=s.count(_FRAME_BAND_PX))
    for _, _, line in boundaries:
        draw.line([tuple(p) for p in line], fill=1, width=s.count(_BOUNDARY_BAND_PX), joint="curve")
    barrier = np.array(barrier_image, bool)
    inside_image = Image.new("1", (width, height), 0)
    ImageDraw.Draw(inside_image).polygon([tuple(p) for p in triangle], fill=1)
    inside = np.array(inside_image, bool)
    core = ndimage.distance_transform_edt(local) >= (isotherm_width_px[1] + _HEAVY_MARGIN_PX) / 2.0
    heavy = local & ndimage.binary_dilation(core, iterations=s.count(_HEAVY_GROW_PX))
    rings = detect_rings(local, scale=s)
    boxes = detect_text_boxes(local, exclude=[(x, y) for x, y, _ in rings], scale=s)
    text = np.zeros(local.shape, bool)
    pad = s.count(_TEXT_PAD_PX)
    for bx0, by0, bx1, by1 in boxes:
        text[max(by0 - pad, 0):by1 + pad, max(bx0 - pad, 0):bx1 + pad] = True
    ring_image = Image.new("1", (width, height), 0)
    for rx, ry, diameter in rings:
        r = diameter / 2.0 + s.length(_RING_PAD_PX)
        ImageDraw.Draw(ring_image).ellipse([rx - r, ry - r, rx + r, ry + r], fill=1)
    thin = local & inside & ~barrier & ~heavy & ~text & ~np.array(ring_image, bool)
    branches, junctions = skeleton_branches(skeletonize(thin), min_pixels=s.count(_MIN_BRANCH_PX),
                                            spur_pixels=s.count(_SPUR_PX))
    chains = chain_branches(branches, junctions, text, barrier, s)
    log.append(f"{len(branches)} skeleton branches → {len(chains)} lines; {len(boxes)} label glyph boxes, {len(rings)} rings")

    regions = build_field_regions({**system, "isotherms": []}, calibration, s)
    region_shift = origin - np.array(regions.origin, float)

    def field_of(points: np.ndarray) -> str | None:
        at = np.round(points + region_shift).astype(int)
        ok = (at[:, 0] >= 0) & (at[:, 0] < regions.labels.shape[1]) & (at[:, 1] >= 0) & (at[:, 1] < regions.labels.shape[0])
        values = regions.labels[at[ok, 1], at[ok, 0]]
        values = values[values > 0]
        if values.size == 0:
            return None
        return regions.phases[int(Counter(values.tolist()).most_common(1)[0][0]) - 1]

    def snap(p: np.ndarray, u: np.ndarray) -> tuple[np.ndarray, str, int | None]:
        reach = s.length(_SNAP_REACH_PX)
        best: tuple[float, np.ndarray, str, int | None] | None = None
        for index, _, line in boundaries:
            hit = _ray_hit(p, u, line, reach)
            if hit is not None and (best is None or hit[0] < best[0]):
                best = (hit[0], hit[1], "boundary", index)
        for a, b in edges:
            hit = _ray_hit(p, u, np.array([a, b]), reach)
            if hit is not None and (best is None or hit[0] < best[0]):
                best = (hit[0], hit[1], "edge", None)
        if best is not None:
            return best[1], best[2], best[3]
        near = min(((_nearest(p, line), index) for index, _, line in boundaries), key=lambda item: item[0][0], default=None)
        if near is not None and near[0][0] <= s.length(_NEAR_BOUNDARY_PX):
            return near[0][1], "boundary", near[1]
        foot = min((_nearest(p, np.array([a, b])) for a, b in edges), key=lambda item: item[0])
        if foot[0] <= s.length(_NEAR_EDGE_PX):
            return foot[1], "edge", None
        r = s.count(_NEAR_TEXT_PX)
        x, y = int(round(p[0])), int(round(p[1]))
        if text[max(y - r, 0):y + r + 1, max(x - r, 0):x + r + 1].any():
            return p, "label", None
        return p, "free", None

    def outside_ink(point: np.ndarray, u: np.ndarray) -> bool:
        """Ink on ≥ 70 % of the steps 6–60 px beyond ``point`` along ``u`` (within ±3 px across)."""
        lo, hi = s.length(_OUTSIDE_PX[0]), s.length(_OUTSIDE_PX[1])
        normal = np.array([-u[1], u[0]])
        side = s.count(_OUTSIDE_SIDE_PX)
        hits = []
        for t in np.linspace(lo, hi, int(hi - lo) + 1):
            at = np.round(point + origin + t * u + np.arange(-side, side + 1)[:, None] * normal).astype(int)
            if not ((at[:, 0] >= 0) & (at[:, 0] < mask.shape[1]) & (at[:, 1] >= 0) & (at[:, 1] < mask.shape[0])).all():
                return False
            hits.append(bool(mask[at[:, 1], at[:, 0]].any()))
        return float(np.mean(hits)) >= _OUTSIDE_SHARE

    printed_points = [np.array(calibration.stored_to_page(*source["pixel"])) - origin
                      for point in system.get("invariantPoints", []) for source in point.get("sources", [])
                      if source.get("ref") == "slag-atlas-1995" and source.get("pixel")]
    printed_points += [np.array([rx, ry]) for rx, ry, _ in rings]

    def at_printed_point(point: np.ndarray) -> bool:
        return any(float(np.linalg.norm(point - q)) <= s.length(_LEADER_POINT_PX) for q in printed_points)

    skipped = [(bx0 - origin[0], by0 - origin[1], bx1 - origin[0], by1 - origin[1]) for bx0, by0, bx1, by1 in skip_boxes or []]
    lowest = min((p["temperature_C"] for p in invariants.values() if p.get("temperature_C") is not None), default=None)

    def read_label(a: np.ndarray, b: np.ndarray) -> tuple[float | None, str]:
        """Number printed in the corridor a → b (label glyph boxes whose centre lies within 15 px of it)."""
        if read_number is None:
            return None, "no reader"
        side = s.length(_LABEL_SIDE_PX)
        chosen = sorted({box for box in boxes
                         if _corridor_distance(np.array([(box[0] + box[2]) / 2, (box[1] + box[3]) / 2]), a, b) <= side})
        if not chosen:
            return None, "no label box"
        kept = [box for box in chosen if not any(sx0 <= (box[0] + box[2]) / 2 <= sx1 and sy0 <= (box[1] + box[3]) / 2 <= sy1
                                                 for sx0, sy0, sx1, sy1 in skipped)]
        if not kept:
            return None, "label of a point temperature"
        chosen = kept
        grow = int(round(_LABEL_GROW * float(np.median([max(c[2] - c[0], c[3] - c[1]) for c in chosen]))))
        bx0, by0 = max(min(box[0] for box in chosen) - grow, 0), max(min(box[1] for box in chosen) - grow, 0)
        bx1, by1 = min(max(box[2] for box in chosen) + grow, width), min(max(box[3] for box in chosen) + grow, height)
        glyphs = np.zeros((by1 - by0, bx1 - bx0), bool)
        for cx0, cy0, cx1, cy1 in chosen:
            glyphs[cy0 - by0:cy1 - by0, cx0 - bx0:cx1 - bx0] |= local[cy0:cy1, cx0:cx1]
        parts, _ = ndimage.label(local[by0:by1, bx0:bx1], structure=np.ones((3, 3), int))
        for k, found in enumerate(ndimage.find_objects(parts), start=1):
            if found and found[0].start > 0 and found[1].start > 0 and found[0].stop < by1 - by0 and found[1].stop < bx1 - bx0:
                glyphs |= parts == k
        angle = math.degrees(math.atan2(float(b[1] - a[1]), float(b[0] - a[0])))
        words, confidence = read_number(glyphs, angle)
        digits = "".join(ch for ch in words if ch.isdigit())
        where = f"'{words}' ({confidence:.0f}) at {_px(np.array([(bx0 + bx1) / 2, (by0 + by1) / 2]) + origin)}"
        if not digits or confidence < _MIN_CONFIDENCE:
            return None, f"label {where}: not read"
        value = float(int(digits))
        if not _LABEL_RANGE_C[0] <= value <= _LABEL_RANGE_C[1] or abs(value / step_C - round(value / step_C)) > 1e-9:
            return None, f"label {where}: not an isotherm temperature (multiple of {step_C:g} °C)"
        if lowest is not None and value < lowest:
            return None, f"label {where}: below the lowest invariant point ({lowest:g} °C)"
        return value, f"label {where}"

    pieces: list[DetectedIsotherm] = []
    piece_ends: list[list[tuple[np.ndarray, np.ndarray, str, int | None]]] = []
    piece_labels: list[list[tuple[float, str]]] = []
    dropped: list[tuple[list[tuple[float, float]], str]] = []
    short = 0
    step_px = s.count(_DIRECTION_PX)
    for chain in chains:
        points = chain.pixels
        if chain.ink_px < s.length(_MIN_INK_PX) or float(np.ptp(points, axis=0).max()) < s.length(_MIN_EXTENT_PX):
            short += 1
            continue
        ends = []
        for end in (0, 1):
            p, u = _end(points, end, step_px)
            point, kind, curve = snap(p, u)
            ends.append((point, u, kind, curve))
        as_page = [tuple(map(float, p + origin)) for p in points]
        straight = "text" not in chain.gap_kinds() and _deviation(points) <= s.length(_STRAIGHT_PX)
        reason = None
        if ((straight or chain.length_px <= s.length(_LEADER_MAX_PX))
                and any(kind == "edge" and outside_ink(point, u) for point, u, kind, _ in ends)):
            reason = "leader of a label outside the triangle"
        elif (straight and chain.length_px <= s.length(_LEADER_MAX_PX) and any(kind == "label" for _, _, kind, _ in ends)
              and any(kind != "label" and (kind == "free" or at_printed_point(point)) for point, _, kind, _ in ends)):
            reason = "label leader"
        elif straight and chain.length_px >= s.length(_JOIN_MIN_PX) and any(
                math.dist(tuple(point), (rx, ry)) <= d / 2.0 + s.length(_RING_PAD_PX + _JOIN_RING_PX)
                for point, _, _, _ in ends for rx, ry, d in rings):
            reason = "compatibility join (straight, ends at a ring)"
        elif "text" not in chain.gap_kinds() and _cornered(points, s):
            reason = "two straight segments with a corner (joins or a leader)"
        field = None if reason else field_of(points[:: max(1, len(points) // 50)])
        if reason is None and field is None:
            reason = "outside every field region"
        if reason:
            dropped.append((as_page, reason))
            continue
        labels: list[tuple[float, str]] = []
        for index, kind in chain.gaps:
            if kind == "text":
                value, note = read_label(points[index - 1], points[index])
                log.append(f"{field} line at {_px(points[index - 1] + origin)}: {note}")
                if value is not None:
                    labels.append((value, note))
        for point, u, kind, _ in ends:
            if kind == "label":
                value, note = read_label(point, point + u * s.length(_LABEL_AHEAD_PX))
                log.append(f"{field} line end {_px(point + origin)}: {note}")
                if value is not None:
                    labels.append((value, note))
        pixels = [tuple(map(float, ends[0][0] + origin))] + as_page + [tuple(map(float, ends[1][0] + origin))]
        straight_at = [index + 1 for index, kind in chain.gaps if kind == "text"]
        dashed = chain.gap_kinds() >= {"dash"} and chain.gap_px >= _DASHED_SHARE * chain.length_px
        piece = DetectedIsotherm(field=field, pixels=pixels, straight=straight_at,
                                 ends=tuple(_describe(kind, curve, system) for _, _, kind, curve in ends), dashed=dashed)
        pieces.append(piece)
        piece_ends.append(ends)
        piece_labels.append(labels)
    log.append(f"{len(pieces)} isotherm pieces; {short} lines under {s.length(_MIN_INK_PX):g} px of ink "
               f"or {s.length(_MIN_EXTENT_PX):g} px across; "
               + ", ".join(f"{n} {reason}" for reason, n in Counter(r for _, r in dropped).items()))

    printed = []
    for word in side_labels or []:
        value = _isotherm_value(word.text, step_C)
        if value is None or lowest is None or value >= lowest:
            if value is not None:
                printed.append((value, word))
            continue
        if value < _LOST_ONE_C and value + _LOST_ONE_C >= lowest:
            log.append(f"label '{word.text}' at {_px(word.centre)}: below the lowest invariant point ({lowest:g} °C), "
                       f"taken as {value + _LOST_ONE_C:g} (a leading 1 lost in its leader)")
            printed.append((value + _LOST_ONE_C, word))
    side_count = 0
    for i, value, word in side_label_pieces(printed, [np.array(p.pixels, float) for p in pieces], mask, s):
        note = f"label '{word.text}' ({word.confidence:.0f}) beside the line at {_px(word.centre)}"
        if any(v == value for v, _ in piece_labels[i]):
            continue
        if piece_labels[i]:
            review.append(ReviewItem("isotherm-conflict", f"isotherm {pieces[i].field}",
                                     f"{note}: {value:g} °C, the line reads {piece_labels[i][0][0]:g} °C; not used"))
            continue
        piece_labels[i].append((value, note))
        log.append(f"{pieces[i].field} line: {note}")
        side_count += 1
    if side_labels is not None:
        log.append(f"{side_count} labels beside a line of {len(printed)} isotherm temperatures read on the page")

    known_on: dict[int, list[tuple[str, float | None, float | None]]] = {}
    lines_of: dict[int, np.ndarray] = {}
    for index, curve, line in boundaries:
        lines_of[index] = line
        known_on[index] = []
        for point_id in curve.get("path", []):
            entry = invariants.get(point_id) or {}
            liquid = entry.get("liquid_wt")
            known_on[index].append((point_id, _arc(page(liquid) - origin, line) if liquid else None, entry.get("temperature_C")))
    edge_reach = s.length(_RESNAP_EDGE_PX)
    for i, labels in enumerate(piece_labels):
        if not labels:
            continue
        value = labels[0][0]
        for e, (point, u, kind, curve) in enumerate(piece_ends[i]):
            if kind != "boundary" or curve is None:
                continue
            bounds = _stretch_bounds(known_on[curve], _arc(point, lines_of[curve]))
            if bounds is None or bounds[0] < value < bounds[1]:
                continue
            distance, foot = min((_nearest(point, np.array([a, b])) for a, b in edges), key=lambda item: item[0])
            if distance > edge_reach:
                continue
            piece_ends[i][e] = (foot, u, "edge", None)
            ends = list(pieces[i].ends)
            ends[e] = _describe("edge", None, system)
            pieces[i].ends = (ends[0], ends[1])
            pieces[i].pixels[0 if e == 0 else -1] = tuple(map(float, foot + origin))
            log.append(f"{pieces[i].field} line end {_px(point + origin)}: {value:g} °C is outside the boundary stretch "
                       f"{bounds[0]:g}–{bounds[1]:g} °C; moved to the triangle edge {distance:.0f} px away")

    parent = list(range(len(pieces)))

    def root(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    pairs: list[tuple[int, float, int, int, np.ndarray]] = []
    for i in range(len(pieces)):
        for j in range(i + 1, len(pieces)):
            known = {v for v, _ in piece_labels[i][:1] + piece_labels[j][:1]}
            if len(known) > 1:
                continue
            same = int(not (piece_labels[i] and piece_labels[j]))
            limit = s.length(_CROSSING_PX) * (1.0 if same else _LABELLED_CROSSING)
            for pi, _, ki, ci in piece_ends[i]:
                for pj, _, kj, cj in piece_ends[j]:
                    distance = float(np.linalg.norm(pi - pj))
                    if ki == kj == "boundary" and ci == cj and distance <= limit:
                        pairs.append((same, distance, i, j, (pi + pj) / 2.0))
    fields_of = {i: {piece.field} for i, piece in enumerate(pieces)}
    crossings: list[tuple[int, int, np.ndarray]] = []
    for _, _, i, j, point in sorted(pairs, key=lambda p: p[:2]):
        a, b = root(i), root(j)
        if a != b:
            if fields_of[a] & fields_of[b]:
                continue
            parent[a] = b
            fields_of[b] |= fields_of.pop(a)
        crossings.append((i, j, point))
    roots = sorted({root(i) for i in range(len(pieces))})
    group_of = {r: g for g, r in enumerate(roots)}
    for i, piece in enumerate(pieces):
        piece.group = group_of[root(i)]
    for i, j, point in crossings:
        for a, b in ((i, j), (j, i)):
            relation = f"continues as {pieces[b].field}" if pieces[a].field != pieces[b].field else "meets another piece"
            pieces[a].evidence.append(f"{relation} on the boundary at {_px(point + origin)}")

    group_labels: dict[int, float] = {}
    for i, labels in enumerate(piece_labels):
        for value, note in labels:
            g = pieces[i].group
            if g in group_labels and group_labels[g] != value:
                review.append(ReviewItem("isotherm-conflict", f"isotherm {pieces[i].field}",
                                         f"labels {group_labels[g]:g} and {value:g} °C on one line ({note})"))
                continue
            group_labels[g] = value

    ladders: list[tuple[list[int], float, float]] = []
    ladder_notes: list[str] = []
    ladder_curves: list[int] = []
    for index, curve, line in boundaries:
        known = known_on[index]
        arrows = curve.get("arrows") or []
        hits = [(_arc(point, line), pieces[i].group)
                for i, ends in enumerate(piece_ends) for point, _, kind, c in ends if kind == "boundary" and c == index]
        for k in range(len(known) - 1):
            (id_a, arc_a, t_a), (id_b, arc_b, t_b) = known[k], known[k + 1]
            if arc_a is None or arc_b is None or t_a is None or t_b is None or t_a == t_b:
                continue
            if k < len(arrows) and arrows[k] == "<>":
                continue
            low_arc, high_arc = sorted((arc_a, arc_b))
            on = {}
            for arc, g in hits:
                if low_arc + _ARC_MARGIN_PX < arc < high_arc - _ARC_MARGIN_PX:
                    on.setdefault(g, []).append(arc)
            if not on:
                continue
            ordered = sorted(on, key=lambda g: float(np.mean(on[g])), reverse=(arc_a > arc_b) != (t_a > t_b))
            ladders.append((ordered, float(min(t_a, t_b)), float(max(t_a, t_b))))
            ladder_curves.append(index)
            ladder_notes.append(f"{'/'.join(f or '?' for f in curve.get('fields', []))} between {id_a} ({t_a:g}) and {id_b} ({t_b:g})")

    for g, value in list(group_labels.items()):
        labelled = [i for i, piece in enumerate(pieces) if piece.group == g and piece_labels[i]]
        for k, (groups, low, high) in enumerate(ladders):
            if g not in groups or low < value < high or g not in group_labels:
                continue
            if any(kind == "boundary" and c == ladder_curves[k] for i in labelled for _, _, kind, c in piece_ends[i]):
                del group_labels[g]
                for i in labelled:
                    review.append(ReviewItem("isotherm-conflict", f"isotherm {pieces[i].field}",
                                             f"{piece_labels[i][0][1]}: {value:g} °C is outside the boundary stretch "
                                             f"{ladder_notes[k]} the line ends on; label not used"))
                    piece_labels[i] = []
            else:
                groups.remove(g)
                review.append(ReviewItem("isotherm-conflict", ladder_notes[k],
                                         f"a crossing continues a line labelled {value:g} °C, outside the stretch; "
                                         "crossing not used (wrong end snap?)"))
    keep = [k for k, (groups, _, _) in enumerate(ladders) if groups]
    ladders, ladder_notes = [ladders[k] for k in keep], [ladder_notes[k] for k in keep]

    base, rejected, _ = solve_isotherm_temperatures(len(roots), group_labels, ladders, step_C)
    for k in rejected:
        review.append(ReviewItem("isotherm-conflict", ladder_notes[k],
                                 f"order of {len(ladders[k][0])} crossing line(s) contradicts the other boundaries "
                                 f"or the labels; not used"))
    ladders = [ladder for k, ladder in enumerate(ladders) if k not in rejected]
    ladder_notes = [note for k, note in enumerate(ladder_notes) if k not in rejected]
    stop = barrier | ~inside
    chains = field_order_chains([np.array(p.pixels, float) - origin for p in pieces], [p.group for p in pieces], stop, s)
    domains, _, unused = solve_isotherm_temperatures(len(roots), group_labels, ladders, step_C, chains)
    log.append(f"field order: {len(chains)} sections across fields, {len(unused)} contradicting the rest not used")
    labelled_in_field: dict[str, set[float]] = {}
    for i, piece in enumerate(pieces):
        if piece_labels[i]:
            labelled_in_field.setdefault(piece.field, set()).update(v for v, _ in piece_labels[i])
    for i, piece in enumerate(pieces):
        g = piece.group
        for k, (groups, low, high) in enumerate(ladders):
            if g in groups:
                piece.evidence.append(f"crossing {groups.index(g) + 1} of {len(groups)} on {ladder_notes[k]}")
        options = domains[g]
        if piece_labels[i]:
            piece.temperature_C, piece.source = piece_labels[i][0][0], "label"
            piece.label = piece_labels[i][0][1]
            piece.evidence.insert(0, piece.label)
        elif g in group_labels:
            piece.temperature_C, piece.source = group_labels[g], "continuation"
            piece.evidence.insert(0, f"temperature printed on the same line in another field ({group_labels[g]:g})")
        elif len(options) == 1:
            piece.temperature_C, piece.source = options[0], "boundary order" if len(base[g]) == 1 else "field order"
            piece.inferred = _inferred(options[0], labelled_in_field.get(piece.field, set()), g, ladders, step_C)
            if piece.source == "field order":
                piece.evidence.append("one step from its neighbours across the field")
        else:
            piece.candidates = options if len(options) <= _MAX_CANDIDATES else []
        piece.evidence.append(f"ends: {piece.ends[0]}, {piece.ends[1]}")
        if piece.straight:
            piece.evidence.append(f"{len(piece.straight)} label gap(s) joined straight")
        review.extend(piece.review_items())
    determined = sum(1 for p in pieces if p.temperature_C is not None)
    log.append(f"temperatures: {determined} of {len(pieces)} pieces "
               f"({sum(1 for p in pieces if p.source == 'label')} read, "
               f"{sum(1 for p in pieces if p.source == 'continuation')} continued, "
               f"{sum(1 for p in pieces if p.source == 'boundary order')} from the boundary order, "
               f"{sum(1 for p in pieces if p.source == 'field order')} from the order across the field); "
               f"{len(ladders)} boundary stretches with crossings")
    return IsothermDetection(isotherms=pieces, dropped=dropped, log=log, review=review)


def _inferred(temperature: float, labelled: set[float], group: int, ladders, step_C: float) -> dict | None:
    below = max((t for t in labelled if t < temperature), default=None)
    above = min((t for t in labelled if t > temperature), default=None)
    anchors = [t for t in (below, above) if t is not None]
    if anchors:
        candidate = {"from": anchors, "step": step_C}
        if inferred_temperature_problem(temperature, candidate) is None:
            return candidate
    lows = [low for groups, low, high in ladders if group in groups]
    highs = [high for groups, low, high in ladders if group in groups]
    if not lows:
        return None
    return {"between": [max(lows), min(highs)], "step": step_C}


def _stretch_bounds(known: list[tuple[str, float | None, float | None]], arc: float) -> tuple[float, float] | None:
    """Temperatures (low, high) of the path points of known temperature on either side of ``arc`` along a boundary."""
    for (_, arc_a, t_a), (_, arc_b, t_b) in zip(known[:-1], known[1:]):
        if arc_a is None or arc_b is None or t_a is None or t_b is None:
            continue
        if min(arc_a, arc_b) <= arc <= max(arc_a, arc_b):
            return (min(t_a, t_b), max(t_a, t_b))
    return None


def _isotherm_value(text: str, step_C: float) -> float | None:
    """°C of a printed isotherm temperature (3–4 digits, a multiple of ``step_C``), else None."""
    digits = text.strip().lstrip("~").rstrip(".,")
    if not digits.isdigit() or not 3 <= len(digits) <= 4:
        return None
    value = float(digits)
    if not _LABEL_RANGE_C[0] <= value <= _LABEL_RANGE_C[1] or abs(value / step_C - round(value / step_C)) > 1e-9:
        return None
    return value


def _describe(kind: str, curve: int | None, system: dict) -> str:
    if kind == "boundary" and curve is not None:
        return "boundary " + "/".join(f or "?" for f in system["boundaryCurves"][curve].get("fields", []))
    return {"edge": "triangle edge", "label": "label", "free": "free end"}[kind]


def _end(points: np.ndarray, end: int, step: int) -> tuple[np.ndarray, np.ndarray]:
    k = min(step, len(points) - 1)
    p = points[0] if end == 0 else points[-1]
    q = points[k] if end == 0 else points[-1 - k]
    u = p - q
    norm = float(np.linalg.norm(u))
    return p.astype(float), (u / norm if norm > 0 else np.zeros(2))


def _ray_hit(p: np.ndarray, u: np.ndarray, line: np.ndarray, reach: float) -> tuple[float, np.ndarray] | None:
    """Distance along the ray ``p + t·u`` (0 ≤ t ≤ ``reach``) to its first crossing with the polyline, and the crossing."""
    a, b = line[:-1], line[1:]
    seg = b - a
    denom = u[0] * seg[:, 1] - u[1] * seg[:, 0]
    ok = np.abs(denom) > 1e-9
    if not ok.any():
        return None
    diff = a - p
    t = np.where(ok, (diff[:, 0] * seg[:, 1] - diff[:, 1] * seg[:, 0]) / np.where(ok, denom, 1.0), np.inf)
    v = np.where(ok, (diff[:, 0] * u[1] - diff[:, 1] * u[0]) / np.where(ok, denom, 1.0), -1.0)
    valid = ok & (t >= 0) & (t <= reach) & (v >= 0) & (v <= 1)
    if not valid.any():
        return None
    k = int(np.argmin(np.where(valid, t, np.inf)))
    return float(t[k]), p + t[k] * u


def _nearest(p: np.ndarray, line: np.ndarray) -> tuple[float, np.ndarray]:
    a, b = line[:-1], line[1:]
    seg = b - a
    span = np.maximum((seg ** 2).sum(axis=1), 1e-12)
    t = np.clip(((p - a) * seg).sum(axis=1) / span, 0.0, 1.0)
    feet = a + t[:, None] * seg
    distances = np.linalg.norm(feet - p, axis=1)
    k = int(np.argmin(distances))
    return float(distances[k]), feet[k]


def _arc(p: np.ndarray, line: np.ndarray) -> float:
    a, b = line[:-1], line[1:]
    seg = b - a
    lengths = np.linalg.norm(seg, axis=1)
    span = np.maximum(lengths ** 2, 1e-12)
    t = np.clip(((p - a) * seg).sum(axis=1) / span, 0.0, 1.0)
    distances = np.linalg.norm(a + t[:, None] * seg - p, axis=1)
    k = int(np.argmin(distances))
    return float(lengths[:k].sum() + t[k] * lengths[k])


def _cornered(points: np.ndarray, s: LineScale) -> bool:
    """Two straight parts (each ≥ 40 px, ≤ 2.5 px off its chord) meeting at a turn of at least 25°, split at
    the point farthest from the whole chord."""
    if len(points) < 3:
        return False
    a, b = points[0], points[-1]
    chord = b - a
    norm = float(np.linalg.norm(chord))
    if norm == 0:
        return False
    k = int(np.argmax(np.abs((points[:, 0] - a[0]) * chord[1] - (points[:, 1] - a[1]) * chord[0])))
    first, second = points[:k + 1], points[k:]
    if min(float(np.linalg.norm(first[-1] - first[0])), float(np.linalg.norm(second[-1] - second[0]))) < s.length(_CORNER_ARM_PX):
        return False
    if max(_deviation(first), _deviation(second)) > s.length(_STRAIGHT_PX):
        return False
    u, v = first[-1] - first[0], second[-1] - second[0]
    cos = float(u @ v) / (float(np.linalg.norm(u)) * float(np.linalg.norm(v)))
    return cos <= math.cos(math.radians(_CORNER_DEG))


def _deviation(points: np.ndarray) -> float:
    a, b = points[0], points[-1]
    chord = b - a
    norm = float(np.linalg.norm(chord))
    if norm == 0:
        return float(np.linalg.norm(points - a, axis=1).max())
    return float(np.abs((points[:, 0] - a[0]) * chord[1] - (points[:, 1] - a[1]) * chord[0]).max() / norm)


def _corridor_distance(c: np.ndarray, a: np.ndarray, b: np.ndarray) -> float:
    seg = b - a
    t = float(np.clip((c - a) @ seg / max(float(seg @ seg), 1e-12), 0.0, 1.0))
    return float(np.linalg.norm(a + t * seg - c))


def _px(p) -> str:
    return f"({p[0]:.0f}, {p[1]:.0f})"
