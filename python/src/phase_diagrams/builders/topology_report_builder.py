"""
phase_diagrams.builders.topology_report_builder — Field circuits, temperature points and curve routes of a ternary in node-map labels.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Topology report
"""
from __future__ import annotations

import math

from phase_diagrams.figures.formula_molar_mass import formula_molar_mass
from phase_diagrams.models.diagram_node import DiagramNode
from phase_diagrams.models.line_scale import LineScale
from phase_diagrams.models.ternary_calibration import TernaryCalibration

_LABEL_PX = 10.0
_ON_LINE_PX = 5.0
_EDGE_WT = 0.5
_COMPOUND_WT = 1.5
_ATLAS = "slag-atlas-1995"
_OFF_LINE_KINDS = ("ring", "corner")
_NO_PHASE = "(no phase)"
_LINKS = {">": "→", "<": "←", "<>": "←→"}
_FLIPPED = {"→": "←", "←": "→"}


def build_topology_report(
    name: str,
    system: dict,
    nodes: list[DiagramNode],
    user_nodes: dict[str, tuple[float, float]] | None = None,
    compounds: list[dict] | None = None,
    pixel_origin: tuple[float, float] = (0.0, 0.0),
    scale: LineScale | None = None,
    config_fields: list[dict] | None = None,
    shared_invariants: list[dict] | None = None,
    source: str | None = None,
) -> str:
    """Markdown report of the system file topology, written in node-map labels.

    Sections: field circuits (each phase's boundary curves chained by shared
    ends; ends on the triangle edge are joined along it when no other boundary
    meets the edge between them, through the corners; ``?`` marks a gap;
    boundary ``arrows`` show as → ← ←→ between labels, ``-`` where none is recorded),
    the config field rings, points with a temperature (invariants, inversion
    points, ``otherAtlasData`` points with a numeric label), compound rings
    (nearest compound of ``compounds.json`` within 1.5 wt%, invariant on the
    ring), and the routes of isotherms, inversions and two-liquid branches
    (every labelled point within 5 px of the polyline, in order along it).
    A pixel takes the label of the nearest node or user point (``user_nodes``,
    stored pixels) within 10 px, otherwise it is written ``[x, y]`` (stored
    coordinates). Curve ends that are invariants of other system files
    (``shared_invariants``, e.g. binary edge points) are placed by their wt%.
    ``source`` (the path ``system`` was read from) is named in the header.
    Pixel sizes are for the reference line width, scaled by ``scale``.
    """
    s = scale or LineScale()
    calibration = TernaryCalibration.from_system(system, pixel_origin)
    components = list(system["components"])
    points = [(n.label, n.pixel, n.kind) for n in nodes]
    points += [(label, (float(p[0]), float(p[1])), "user") for label, p in (user_nodes or {}).items()]
    by_invariant = {n.invariant: n.label for n in nodes if n.kind == "invariant" and n.invariant}
    corner_labels = [next((n.label for n in nodes if n.kind == "corner" and n.invariant == c), c) for c in components]
    own = {p["id"]: p for p in system.get("invariantPoints", [])}
    invariants = {p["id"]: p for p in shared_invariants or []} | own

    def stored(wt: list[float] | dict[str, float]) -> tuple[float, float]:
        return calibration.page_to_stored(*calibration.to_page(wt))

    def label(pixel: tuple[float, float]) -> str:
        best = min(((math.dist(pixel, p), text) for text, p, kind in points if kind != "ring"), default=None)
        if best is not None and best[0] <= s.length(_LABEL_PX):
            return best[1]
        return f"[{pixel[0]:.0f}, {pixel[1]:.0f}]"

    def invariant_wt(point_id: str) -> list[float] | None:
        wt = invariants.get(point_id, {}).get("liquid_wt")
        if not isinstance(wt, dict) or not wt or any(v and c not in components for c, v in wt.items()):
            return None
        return [float(wt.get(c) or 0.0) for c in components]

    def invariant_pixel(point_id: str) -> tuple[float, float] | None:
        source = next((x for x in own.get(point_id, {}).get("sources", []) if x.get("ref") == _ATLAS and x.get("pixel")), None)
        if source:
            return float(source["pixel"][0]), float(source["pixel"][1])
        wt = invariant_wt(point_id)
        return stored(wt) if wt else None

    def invariant_label(point_id: str) -> str:
        if point_id in by_invariant:
            return by_invariant[point_id]
        pixel = invariant_pixel(point_id)
        return label(pixel) if pixel else point_id

    def route(polyline: list[list[float]]) -> list[str]:
        pixels = [stored(p) for p in polyline]
        start, end = label(pixels[0]), label(pixels[-1])
        along = []
        for text, p, kind in points:
            if kind in _OFF_LINE_KINDS or text in (start, end):
                continue
            distance, position = _distance_along(p, pixels)
            if distance <= s.length(_ON_LINE_PX):
                along.append((position, text))
        return _without_repeats([start, *(text for _, text in sorted(along)), end])

    sections = [f"# Topology — {name}\n",
                *([f"System file: {source}\n"] if source else []),
                f"Labels from the node map ({name}.md) and the config nodes (•). [x, y] is a stored pixel with no label "
                f"within {s.length(_LABEL_PX):g} px; ? is a gap with no boundary curve in the system file. "
                "In the field circuits → / ← is the stored arrow of a boundary segment (towards falling temperature), "
                "←→ arrows away from a maximum inside it, - no arrow recorded (or the triangle edge).\n"]

    boundaries = []
    for curve in system.get("boundaryCurves", []):
        path = list(curve.get("path") or [])
        sequence = [invariant_label(i) for i in path]
        ends = [invariant_wt(path[0]) if path else None, invariant_wt(path[-1]) if path else None]
        polyline = curve.get("polyline_wt")
        if polyline and len(path) < 2:
            sequence.append(label(stored(polyline[-1])))
            ends[1] = polyline[-1]
        arrows = curve.get("arrows") if isinstance(curve.get("arrows"), list) else []
        links = [_LINKS.get(arrows[k], "-") if k < len(arrows) else "-" for k in range(len(sequence) - 1)]
        if sequence:
            boundaries.append(([f or _NO_PHASE for f in curve.get("fields") or []], (sequence, links), ends))
    perimeter: dict[str, float] = {}
    for _, (sequence, _), ends in boundaries:
        for text, wt in ((sequence[0], ends[0]), (sequence[-1], ends[1])):
            position = _perimeter_position(wt)
            if position is not None:
                perimeter.setdefault(text, position)
    phases = list(dict.fromkeys(f for fields, _, _ in boundaries for f in fields))
    circuits = []
    for phase in phases:
        segments = [segment for fields, segment, _ in boundaries if phase in fields]
        edge_ends = {text for sequence, _ in segments for text in (sequence[0], sequence[-1]) if text in perimeter}
        segments += [(link, ["-"] * (len(link) - 1)) for link in _edge_links(perimeter, edge_ends, corner_labels)]
        circuits.append(f"{phase}: {_circuit(_chains(segments))}")
    sections.append(_block("Field circuits", circuits or ["no boundary curves"]))

    if config_fields:
        sections.append(_block("Field rings of the config (overlay)",
                               [f"{f['name']}: {' - '.join(label(p) for p in f['ring'])}" for f in config_fields]))

    temperatures = []
    for point in system.get("invariantPoints", []):
        phases_text = ", ".join(p for p in point.get("phases", []) if p)
        temperatures.append(f"{invariant_label(point['id'])}  {_temperature(point.get('temperature_C'))}  {point['id']} ({phases_text})")
    for inversion in system.get("inversions", []):
        for point in inversion.get("points", []) or []:
            if point.get("pixel") and _number(point.get("temperature_C")):
                temperatures.append(f"{label(_pair(point['pixel']))}  {_temperature(point['temperature_C'])}  "
                                    f"inversion {inversion.get('phase')}: {inversion.get('change')}")
    for key, block in (system.get("otherAtlasData") or {}).items():
        for item in _dicts(block):
            value = item.get("label") if _number(item.get("label")) else item.get("temperature_C")
            if item.get("pixel") and _number(value):
                temperatures.append(f"{label(_pair(item['pixel']))}  {_temperature(value)}  otherAtlasData.{key}")
    sections.append(_block("Points with a temperature (°C)", temperatures or ["none"]))

    rings = []
    for node in (n for n in nodes if n.kind == "ring"):
        compound = _compound(node.wt, components, compounds or [])
        on_ring = min(((math.dist(node.pixel, p), i) for i in own if (p := invariant_pixel(i))), default=None)
        if on_ring is not None and on_ring[0] <= s.length(_LABEL_PX):
            point = own[on_ring[1]]
            where = f"{invariant_label(on_ring[1])} {on_ring[1]} {_temperature(point.get('temperature_C'))}"
        else:
            where = "no point in the system file"
        rings.append(f"{node.label}  {compound or 'no compound within ' + format(_COMPOUND_WT, 'g') + ' wt%'}  "
                     f"({' / '.join(f'{v:.1f}' for v in node.wt)}): {where}")
    sections.append(_block("Compound rings", rings or ["none detected"]))

    isotherms = []
    for isotherm in system.get("isotherms", []):
        title = f"{isotherm.get('field')} {_temperature(isotherm.get('temperature_C'))}"
        if (isotherm.get("part") or 1) > 1:
            title += f" (part {isotherm['part']})"
        if isinstance(isotherm.get("inferred"), dict):
            anchors = "/".join(f"{a:g}" for a in isotherm["inferred"].get("from") or [])
            title += f" (inferred from {anchors}, step {isotherm['inferred'].get('step')})"
        polyline = isotherm.get("polyline_wt")
        isotherms.append(f"{title}: {' → '.join(route(polyline)) if polyline else 'not traced'}")
    sections.append(_block("Isotherms", isotherms or ["none"]))

    others = []
    for inversion in system.get("inversions", []):
        polyline = inversion.get("polyline_wt")
        title = f"inversion {inversion.get('phase')}: {inversion.get('change')}"
        others.append(f"{title}: {' → '.join(route(polyline)) if polyline else 'not traced'}")
    immiscibility = system.get("liquidImmiscibility")
    if isinstance(immiscibility, dict):
        for number, polyline in enumerate(immiscibility.get("polylines_wt") or [], 1):
            if polyline:
                others.append(f"two liquids, branch {number}: {' → '.join(route(polyline))}")
    sections.append(_block("Inversions and other curves", others or ["none"]))
    return "\n".join(sections)


def _block(title: str, lines: list[str]) -> str:
    return f"## {title}\n\n```text\n" + "\n".join(lines) + "\n```\n"


def _number(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _temperature(value) -> str:
    return f"{value:g}" if _number(value) else "—"


def _pair(value) -> tuple[float, float]:
    return float(value[0]), float(value[1])


def _dicts(value):
    if isinstance(value, dict):
        yield value
        for item in value.values():
            yield from _dicts(item)
    elif isinstance(value, list):
        for item in value:
            yield from _dicts(item)


def _without_repeats(labels: list[str]) -> list[str]:
    return [text for i, text in enumerate(labels) if i == 0 or text != labels[i - 1]]


def _distance_along(point: tuple[float, float], pixels: list[tuple[float, float]]) -> tuple[float, float]:
    """Distance from ``point`` to the polyline and the arc length of its foot point."""
    best, travelled = (math.inf, 0.0), 0.0
    for a, b in zip(pixels, pixels[1:]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        length = math.hypot(dx, dy)
        t = 0.0 if length == 0 else max(0.0, min(1.0, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length ** 2))
        distance = math.dist(point, (a[0] + t * dx, a[1] + t * dy))
        if distance < best[0]:
            best = (distance, travelled + t * length)
        travelled += length
    return best


def _perimeter_position(wt) -> float | None:
    """Position along the triangle edge (0 → 1 → 2 → 3 at corners 1, 2, 3, 1), or None inside."""
    if wt is None:
        return None
    w = [float(v) for v in wt]
    zero = min(range(3), key=lambda i: w[i])
    if w[zero] > _EDGE_WT:
        return None
    start = (zero + 1) % 3
    end = (zero + 2) % 3
    span = w[start] + w[end]
    return start + (w[end] / span if span else 0.0)


def _edge_links(perimeter: dict[str, float], own: set[str], corners: list[str]) -> list[list[str]]:
    """Edge segments between this phase's edge ends that are neighbours among all boundary ends on the edge."""
    order = sorted(perimeter, key=perimeter.get)
    if len(order) < 2:
        return []
    pairs = [(order[i], order[(i + 1) % len(order)]) for i in range(len(order))]
    if len(order) == 2:
        forward = (perimeter[order[1]] - perimeter[order[0]]) % 3
        pairs = [pairs[0]] if forward <= 1.5 else [pairs[1]]
    links = []
    for a, b in pairs:
        if a in own and b in own:
            ta, span = perimeter[a], (perimeter[b] - perimeter[a]) % 3
            between = sorted((k for k in range(3) if 0 < (k - ta) % 3 < span), key=lambda k: (k - ta) % 3)
            links.append([a, *(corners[k] for k in between), b])
    return links


_Segment = tuple[list[str], list[str]]


def _reversed(segment: _Segment) -> _Segment:
    labels, links = segment
    return labels[::-1], [_FLIPPED.get(link, link) for link in links[::-1]]


def _joined(chain: _Segment, segment: _Segment) -> _Segment | None:
    """``segment`` attached to an end of ``chain`` (reversed if needed), or None if no end is shared."""
    (labels, links), (seg, seg_links) = chain, segment
    back, back_links = _reversed(segment)
    if seg[0] == labels[-1]:
        return labels + seg[1:], links + seg_links
    if seg[-1] == labels[-1]:
        return labels + back[1:], links + back_links
    if seg[-1] == labels[0]:
        return seg[:-1] + labels, seg_links + links
    if seg[0] == labels[0]:
        return back[:-1] + labels, back_links + links
    return None


def _chains(segments: list[_Segment]) -> list[_Segment]:
    left = [(list(labels), list(links)) for labels, links in segments if labels]
    chains = []
    while left:
        chain = left.pop(0)
        extended = True
        while extended and not (len(chain[0]) > 2 and chain[0][0] == chain[0][-1]):
            extended = False
            for i, segment in enumerate(left):
                joined = _joined(chain, segment)
                if joined is not None:
                    chain = joined
                    left.pop(i)
                    extended = True
                    break
        chains.append(chain)
    return chains


def _chain_text(chain: _Segment) -> str:
    labels, links = chain
    return labels[0] + "".join(f" {link} {text}" for link, text in zip(links, labels[1:]))


def _circuit(chains: list[_Segment]) -> str:
    labels = chains[0][0]
    if len(chains) == 1 and len(labels) > 2 and labels[0] == labels[-1]:
        return _chain_text(chains[0])
    return " - ? - ".join(_chain_text(chain) for chain in chains) + f" - ? - {labels[0]}"


def _compound(wt: list[float], components: list[str], compounds: list[dict]) -> str | None:
    best = None
    for compound in compounds:
        moles = compound.get("oxideMoles") or {}
        if not moles or not set(moles) <= set(components) or any(formula_molar_mass(c) is None for c in moles):
            continue
        mass = {c: moles[c] * formula_molar_mass(c) if c in moles else 0.0 for c in components}
        total = sum(mass.values())
        difference = max(abs(mass[c] / total * 100.0 - w) for c, w in zip(components, wt))
        if difference <= _COMPOUND_WT and (best is None or difference < best[0]):
            best = (difference, compound)
    if best is None:
        return None
    compound = best[1]
    return f"{compound['id']} ({compound['formula']})" if compound.get("formula") else compound["id"]
