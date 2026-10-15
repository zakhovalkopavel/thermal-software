"""
phase_diagrams.builders.field_namer — Names of the primary fields of a ternary read from the page: field labels, their leaders, compound compositions.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Fully automatic extraction
"""
from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass, field
from difflib import SequenceMatcher

import cv2
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

from phase_diagrams.figures.formula_molar_mass import formula_molar_mass
from phase_diagrams.models.boundary_graph import BoundaryGraph
from phase_diagrams.models.line_scale import LineScale
from phase_diagrams.models.page_word import PageWord
from phase_diagrams.models.ternary_calibration import TernaryCalibration

_MARGIN_PX = 4
_BARRIER_PX = 3
_MIN_REGION_PX2 = 400
_NAME_RATIO = 0.8
_MIN_LETTERS = 4
_OUTSIDE_PX = 250.0
_LEGEND_COLUMN_PX = 15.0
_LEGEND_WORDS = 3
_LEGEND_LINES = 2.5
_LEADER_SKIP_PX = 6
_LEADER_WINDOW_PX = 300
_LEADER_MIN_PX = 30.0
_LEADER_NEAR_PX = 20.0
_LEADER_GAP_PX = 4
_REGION_SEARCH_PX = 12
_INWARD_PX = 12.0
_SIDE_PX = 6.0
_SIDE_SAMPLES = 9
_DIRECTION_PX = 6


@dataclass
class FieldNaming:
    """Regions of the triangle divided by the boundary curves (``labels``: crop of the page at
    ``origin``, 0 = no region) and the phase of each (``names``, region → phase id; ``sources`` how it
    was found); per graph edge the ``curve_fields`` (left, right of its drawing direction; None outside
    the triangle) and the ``dropped`` edges, between two regions of one phase."""

    origin: tuple[int, int]
    labels: np.ndarray
    names: dict[int, str] = field(default_factory=dict)
    sources: dict[int, str] = field(default_factory=dict)
    curve_fields: list[tuple[str | None, str | None]] = field(default_factory=list)
    dropped: list[int] = field(default_factory=list)
    log: list[str] = field(default_factory=list)


def system_phases(components: list[str], compounds: list[dict]) -> list[dict]:
    """Compounds of ``compounds.json`` made of ``components`` only (modifications included)."""
    by_id = {c["id"]: c for c in compounds}
    out = []
    for compound in compounds:
        moles = compound.get("oxideMoles") or (by_id.get(compound.get("modificationOf") or "", {}).get("oxideMoles")) or {}
        if moles and set(moles) <= set(components):
            out.append(compound)
    return out


def match_phase_name(text: str, phases: list[dict]) -> str | None:
    """Phase id whose name the printed word ``text`` reads as (letters compared, ratio ≥ 0.8), or None.

    A phase is named by its id (hyphens dropped) or by one word of it of at least five letters
    that no other phase of the system has (``alumina`` for beta-alumina: a Greek β is read as
    ``B``, ``@`` or ``G``). Words of fewer than four letters name nothing.
    """
    letters = re.sub(r"[^a-z]", "", text.lower())
    if len(letters) < _MIN_LETTERS:
        return None
    parts = Counter(part for p in phases for part in set(p["id"].split("-")))
    best: tuple[float, str] | None = None
    for phase in phases:
        keys = {phase["id"].replace("-", "")} | {part for part in phase["id"].split("-") if len(part) >= 5 and parts[part] == 1}
        for key in keys:
            ratio = SequenceMatcher(None, letters, key).ratio()
            if ratio >= _NAME_RATIO and (best is None or ratio > best[0]):
                best = (ratio, phase["id"])
    return best[1] if best else None


def name_fields(
    graph: BoundaryGraph,
    corners: dict[str, tuple[float, float]],
    corner_components: dict[str, str],
    calibration: TernaryCalibration,
    compounds: list[dict],
    words: list[PageWord],
    mask: np.ndarray,
    scale: LineScale | None = None,
) -> FieldNaming:
    """Phase of each region of the triangle ``corners`` (``top``, ``left``, ``right``; page pixels) divided by ``graph``.

    Regions: the triangle without its edges and the curves (3 px lines); under 400 px² dropped.
    Candidates, best first: a word naming a phase of the system (``match_phase_name``) whose box
    centre lies in the region; a word outside the triangle (≤ 250 px from it) whose leader — the
    straight line (≥ 30 px, Hough) starting within 20 px of its box and leading away — ends in the
    region; the composition of a compound of the system that does not melt incongruently (a point on
    an edge or corner moved 12 px inwards), and of a component at its corner. Among words, the more
    confident wins. Words in a legend (a column of three or more names, left edges within 15 px, lines
    close together) name nothing. Regions without a candidate are named ``field-<n>``. A curve between
    two regions of one phase (a line that is no field boundary) is dropped; each other curve gets the
    phases on its left and right (sampled 6 px off its middle part). Pixel sizes are for the reference
    line width, scaled by ``scale``.
    """
    s = scale or LineScale()
    components = list(calibration.components)
    tri = np.array([corners["top"], corners["left"], corners["right"]], float)
    x0, y0 = (np.floor(tri.min(axis=0)) - _MARGIN_PX).astype(int)
    x1, y1 = (np.ceil(tri.max(axis=0)) + _MARGIN_PX).astype(int)
    origin = np.array([x0, y0], float)
    size = (int(x1 - x0), int(y1 - y0))
    inside = Image.new("1", size, 0)
    ImageDraw.Draw(inside).polygon([tuple(p - origin) for p in tri], fill=1)
    barrier = Image.new("1", size, 0)
    draw = ImageDraw.Draw(barrier)
    width = s.count(_BARRIER_PX)
    draw.line([*(tuple(p - origin) for p in tri), tuple(tri[0] - origin)], fill=1, width=width)
    for edge in graph.edges:
        draw.line([tuple(p - origin) for p in edge.pixels], fill=1, width=width, joint="curve")
    open_area = np.array(inside, bool) & ~np.array(barrier, bool)
    labels, count = ndimage.label(open_area)
    sizes = np.bincount(labels.ravel(), minlength=count + 1)
    small = sizes < s.area(_MIN_REGION_PX2)
    small[0] = False
    labels[small[labels]] = 0
    naming = FieldNaming(origin=(int(x0), int(y0)), labels=labels)
    log = naming.log

    def region_at(point) -> int:
        x, y = int(round(point[0] - x0)), int(round(point[1] - y0))
        if 0 <= y < labels.shape[0] and 0 <= x < labels.shape[1] and labels[y, x]:
            return int(labels[y, x])
        r = s.count(_REGION_SEARCH_PX)
        window = labels[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1]
        found = window[window > 0]
        return int(Counter(found.tolist()).most_common(1)[0][0]) if found.size else 0

    phases = system_phases(components, compounds)
    named = [(word, phase) for word in words if (phase := match_phase_name(word.text, phases)) is not None]
    legend = _legend(named, s)
    candidates: dict[int, list[tuple[int, float, str, str]]] = {}
    for word, phase in named:
        if word in legend:
            log.append(f"label '{word.text}' → {phase}: in the legend (a column of names), not used")
            continue
        centre = word.centre
        outside = _outside_distance(centre, tri)
        if outside == 0.0:
            region = region_at(centre)
            if region:
                candidates.setdefault(region, []).append((0, -word.confidence, phase, f"label '{word.text}'"))
                log.append(f"label '{word.text}' → {phase}, region {region}")
            continue
        if outside > s.length(_OUTSIDE_PX):
            log.append(f"label '{word.text}' → {phase}: {outside:.0f} px outside the triangle, not used")
            continue
        end = _leader_end(mask, word.box, tri, s)
        if end is None:
            log.append(f"label '{word.text}' → {phase}: outside the triangle, no leader found")
            continue
        region = region_at(end)
        if region:
            candidates.setdefault(region, []).append((1, -word.confidence, phase, f"leader of '{word.text}'"))
            log.append(f"label '{word.text}' → {phase}: leader ends at ({end[0]:.0f}, {end[1]:.0f}), region {region}")

    centroid = tri.mean(axis=0)
    for compound in phases:
        if compound.get("modificationOf"):
            continue
        rank = 3 if (compound.get("melting") or {}).get("behaviour") == "incongruent" else 2
        wt = _compound_wt(compound, components)
        if wt is None:
            continue
        point = np.array(calibration.to_page(wt), float)
        if min(wt) <= 0.5:
            towards = centroid - point
            point = point + towards / max(float(np.linalg.norm(towards)), 1e-9) * s.length(_INWARD_PX)
        region = region_at(point)
        if region:
            candidates.setdefault(region, []).append((rank, 0.0, compound["id"], f"composition of {compound['id']}"))

    for region in range(1, count + 1):
        if not (labels == region).any():
            continue
        options = sorted(candidates.get(region, []))
        if options:
            naming.names[region] = options[0][2]
            naming.sources[region] = options[0][3]
            others = sorted({o[2] for o in options[1:] if o[2] != options[0][2]})
            if others:
                log.append(f"region {region}: {options[0][2]} ({options[0][3]}); also {', '.join(others)}")
        else:
            naming.names[region] = f"field-{region}"
            naming.sources[region] = "no label"
    for k, edge in enumerate(graph.edges):
        left, right = _sides(edge.pixels, region_at, s)
        names = tuple(naming.names.get(r) if r else None for r in (left, right))
        naming.curve_fields.append(names)
        if names[0] is not None and names[0] == names[1]:
            naming.dropped.append(k)
            log.append(f"curve {k}: {names[0]} on both sides, not a field boundary")
    return naming


def _compound_wt(compound: dict, components: list[str]) -> list[float] | None:
    moles = compound.get("oxideMoles") or {}
    if not moles or not set(moles) <= set(components) or any(formula_molar_mass(c) is None for c in moles):
        return None
    mass = [moles.get(c, 0) * formula_molar_mass(c) for c in components]
    total = sum(mass)
    return [m / total * 100.0 for m in mass]


def _outside_distance(point, tri: np.ndarray) -> float:
    """0 inside the triangle, else the distance to it."""
    p = np.asarray(point, float)
    sign = []
    for i in range(3):
        a, b = tri[i], tri[(i + 1) % 3]
        sign.append((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]))
    if all(v >= 0 for v in sign) or all(v <= 0 for v in sign):
        return 0.0
    return min(_segment_distance(p, tri[i], tri[(i + 1) % 3]) for i in range(3))


def _segment_distance(p, a, b) -> float:
    seg = b - a
    t = float(np.clip((p - a) @ seg / max(float(seg @ seg), 1e-12), 0.0, 1.0))
    return float(np.linalg.norm(p - (a + t * seg)))


def _box_distance(point, box) -> float:
    dx = max(box[0] - point[0], 0.0, point[0] - box[2])
    dy = max(box[1] - point[1], 0.0, point[1] - box[3])
    return math.hypot(dx, dy)


def _leader_end(mask: np.ndarray, box: tuple[int, int, int, int], tri: np.ndarray, s: LineScale):
    """Far end (page pixels, inside the triangle) of the straight line starting at the label ``box``, or None."""
    w = s.count(_LEADER_WINDOW_PX)
    wx0, wy0 = max(0, box[0] - w), max(0, box[1] - w)
    wx1, wy1 = min(mask.shape[1], box[2] + w), min(mask.shape[0], box[3] + w)
    window = mask[wy0:wy1, wx0:wx1].astype(np.uint8) * 255
    found = cv2.HoughLinesP(window, 1, math.pi / 360, threshold=s.count(20), minLineLength=s.count(_LEADER_MIN_PX),
                            maxLineGap=s.count(_LEADER_GAP_PX))
    if found is None:
        return None
    best = None
    near_px = s.length(_LEADER_NEAR_PX)
    for segment in found:
        ax, ay, bx, by = (float(v) for v in segment[0])
        a, b = np.array([ax + wx0, ay + wy0]), np.array([bx + wx0, by + wy0])
        da, db = _box_distance(a, box), _box_distance(b, box)
        near, far, d = (a, b, da) if da <= db else (b, a, db)
        if d > near_px or max(da, db) - d < s.length(_LEADER_MIN_PX):
            continue
        if _outside_distance(far, tri) > 0.0:
            continue
        length = float(np.linalg.norm(far - near))
        key = (round(d / 4.0), -length)
        if best is None or key < best[0]:
            best = (key, far, near)
    if best is None:
        return None
    return _extend(mask, best[2], best[1], s)


def _extend(mask: np.ndarray, near: np.ndarray, far: np.ndarray, s: LineScale) -> tuple[float, float]:
    """Last ink point of the straight line ``near`` → ``far`` followed beyond ``far`` (gaps ≤ 6 px: crossings)."""
    u = (far - near) / max(float(np.linalg.norm(far - near)), 1e-9)
    normal = np.array([-u[1], u[0]])
    last, misses, p = far.copy(), 0, far.copy()
    while misses <= s.count(_LEADER_SKIP_PX):
        p = p + u
        x, y = int(round(p[0])), int(round(p[1]))
        if not (0 <= y < mask.shape[0] and 0 <= x < mask.shape[1]):
            break
        hit = any(mask[int(round(y + k * normal[1])), int(round(x + k * normal[0]))]
                  for k in (-1, 0, 1)
                  if 0 <= int(round(y + k * normal[1])) < mask.shape[0] and 0 <= int(round(x + k * normal[0])) < mask.shape[1])
        if hit:
            last, misses = p.copy(), 0
        else:
            misses += 1
    return float(last[0]), float(last[1])


def _legend(named: list[tuple[PageWord, str]], s: LineScale) -> set[PageWord]:
    """Name words standing in a column of at least three (left edges within 15 px, each line at most
    2.5 word heights below the previous): a legend."""
    out: set[PageWord] = set()
    for word, _ in named:
        column = sorted((w for w, _ in named if abs(w.box[0] - word.box[0]) <= s.length(_LEGEND_COLUMN_PX)),
                        key=lambda w: w.box[1])
        run: list[PageWord] = []
        for w in column:
            if run and w.box[1] - run[-1].box[1] > _LEGEND_LINES * (run[-1].box[3] - run[-1].box[1]):
                if word in run:
                    break
                run = []
            run.append(w)
        if word in run and len(run) >= _LEGEND_WORDS:
            out.update(run)
    return out


def _sides(pixels: np.ndarray, region_at, s: LineScale) -> tuple[int, int]:
    """Most frequent region on the left and on the right of the middle part of a polyline (page pixels)."""
    if len(pixels) < 3:
        return 0, 0
    lengths = np.r_[0.0, np.cumsum(np.linalg.norm(np.diff(pixels, axis=0), axis=1))]
    total = lengths[-1]
    if total <= 0:
        return 0, 0
    left: list[int] = []
    right: list[int] = []
    offset = s.length(_SIDE_PX)
    step = s.length(_DIRECTION_PX)
    for f in np.linspace(0.2, 0.8, _SIDE_SAMPLES):
        at = f * total
        p = np.array([np.interp(at, lengths, pixels[:, 0]), np.interp(at, lengths, pixels[:, 1])])
        q1 = np.array([np.interp(at - step, lengths, pixels[:, 0]), np.interp(at - step, lengths, pixels[:, 1])])
        q2 = np.array([np.interp(at + step, lengths, pixels[:, 0]), np.interp(at + step, lengths, pixels[:, 1])])
        d = q2 - q1
        n = float(np.linalg.norm(d))
        if n == 0:
            continue
        normal = np.array([d[1], -d[0]]) / n
        for side, values in ((1.0, left), (-1.0, right)):
            region = region_at(p + side * normal * offset)
            if region:
                values.append(region)
    pick = lambda values: Counter(values).most_common(1)[0][0] if values else 0
    return pick(left), pick(right)
