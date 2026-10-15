"""
phase_diagrams.builders.compound_points_builder — Compound rings of the node map named by the compounds of the system, with a temperature.

Spec: docs/scripts/phase-diagrams/OUTPUT.md § Review outputs
"""
from __future__ import annotations

import math

from phase_diagrams.builders.nearest_compound import nearest_compound
from phase_diagrams.models.compound_point import CompoundPoint
from phase_diagrams.models.diagram_node import DiagramNode
from phase_diagrams.models.line_scale import LineScale

_ON_RING_PX = 10.0
_ATLAS = "slag-atlas-1995"


def build_compound_points(
    system: dict,
    nodes: list[DiagramNode],
    compounds: list[dict],
    pixel_origin: tuple[float, float] = (0.0, 0.0),
    scale: LineScale | None = None,
) -> list[CompoundPoint]:
    """One point per ``ring`` node, in node order.

    The compound is the nearest one within 1.5 wt% among the system's compounds:
    the system ``phases`` and the compounds their modifications belong to. The
    temperature is that of a system invariant whose atlas pixel lies within 10 px of
    the ring, else the compound's ``melting.temperature_C``. Pixels are page pixels
    (stored + ``pixel_origin``); pixel sizes are for the reference line width, scaled by ``scale``.
    """
    s = scale or LineScale()
    components = list(system["components"])
    by_id = {c["id"]: c for c in compounds}
    phases = set(system.get("phases") or [])
    own = phases | {by_id[p]["modificationOf"] for p in phases if by_id.get(p, {}).get("modificationOf")}
    candidates = [c for c in compounds if c["id"] in own]
    pixels = []
    for point in system.get("invariantPoints", []):
        source = next((x for x in point.get("sources", []) if x.get("ref") == _ATLAS and x.get("pixel")), None)
        if source:
            pixels.append(((float(source["pixel"][0]), float(source["pixel"][1])), point))
    out = []
    for node in (n for n in nodes if n.kind == "ring"):
        compound = nearest_compound(node.wt, components, candidates)
        on_ring = min(((math.dist(node.pixel, p), point) for p, point in pixels), default=None, key=lambda d: d[0])
        invariant = on_ring[1] if on_ring and on_ring[0] <= s.length(_ON_RING_PX) and on_ring[1].get("temperature_C") is not None else None
        melting = (compound or {}).get("melting") or {}
        point = CompoundPoint(
            tag=(compound or {}).get("notation") or node.label,
            pixel=(node.pixel[0] + pixel_origin[0], node.pixel[1] + pixel_origin[1]),
            wt=list(node.wt),
            compound=compound["id"] if compound else None,
            formula=compound.get("formula") if compound else None,
        )
        if invariant is not None:
            point.temperature_C, point.invariant = invariant["temperature_C"], invariant["id"]
        elif melting.get("temperature_C") is not None:
            point.temperature_C, point.behaviour = melting["temperature_C"], melting.get("behaviour")
        out.append(point)
    return out
