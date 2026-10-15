"""
phase_diagrams.builders.auto_ternary_builder — Ternary system read from the page alone: invariant points, edge points and boundary curves of the detected graph, named fields.

Spec: docs/scripts/phase-diagrams/AUTOMATIC.md § Fully automatic extraction
"""
from __future__ import annotations

import copy

import numpy as np

from phase_diagrams.builders.field_namer import FieldNaming
from phase_diagrams.builders.node_temperature_reader import CurveTemperature
from phase_diagrams.models.boundary_graph import BoundaryGraph
from phase_diagrams.models.page_word import PageWord
from phase_diagrams.models.ternary_calibration import TernaryCalibration
from phase_diagrams.tracing.polyline_simplifier import simplify_polyline

_ATLAS_REF = "slag-atlas-1995"
_SMOOTH_PX = 7
_SIMPLIFY_WT = 0.1
_TYPES = {"junction": "ternary", "edge": "binary", "end": "open end"}


def build_auto_ternary(
    start: dict,
    graph: BoundaryGraph,
    naming: FieldNaming,
    temperatures: dict[int, tuple[float, PageWord]],
    calibration: TernaryCalibration,
    prefix: str = "auto",
    saddles: list[CurveTemperature] | None = None,
) -> dict:
    """System file (``start``: components, source and calibration, as written by ``build_ternary_start``) with
    the curves of ``graph`` that ``naming`` keeps.

    Curves meeting at a node where no other kept curve ends, with the same two fields, are one curve (the node
    stays a path point). ``phases``: the field names. ``invariantPoints``: every node of a kept curve and every
    ``saddles`` point of a kept curve, ``id`` ``<prefix>-<°C>`` (or ``<prefix>-j|e|o|s<n>`` for a junction,
    edge point, open end or saddle without a read or with a repeated temperature), ``type`` (``ternary``,
    ``binary``, ``open end``, ``saddle``), ``temperature_C`` (read next to it, else None), ``phases`` (the
    fields of its curves), ``liquid_wt`` (0.01 wt%) and the page ``pixel`` and read ``label`` as an atlas
    source. ``boundaryCurves``: ``fields`` (left and right of the path direction; None outside the triangle),
    ``path`` (point ids in curve order, saddles included), ``dashed`` and ``polyline_wt`` (the stroke centre
    smoothed over 7 px, simplified to 0.1 wt%, 0.01 wt%).
    """
    system = copy.deepcopy(start)
    components = list(system["components"])
    curves = []
    for k in range(len(graph.edges)):
        if k in naming.dropped:
            continue
        pixels = np.asarray(graph.edges[k].pixels, float)
        curves.append({"nodes": list(graph.edges[k].nodes), "pixels": pixels,
                       "fields": list(naming.curve_fields[k]), "dashed": graph.edges[k].dashed,
                       "saddles": [(tuple(pixels[s.index]), s.value, s.word)
                                   for s in saddles or [] if s.edge == k]})
    _join_through(curves)

    used = sorted({n for c in curves for n in c["nodes"]})
    values = [temperatures[n][0] for n in used if n in temperatures]
    values += [value for c in curves for _, value, _ in c["saddles"]]
    counts = {v: values.count(v) for v in values}
    ids: dict[int, str] = {}
    for n in used:
        node = graph.nodes[n]
        value = temperatures.get(n, (None, None))[0]
        if value is not None and counts[value] == 1:
            ids[n] = f"{prefix}-{value:g}"
        else:
            ids[n] = f"{prefix}-{node.kind[0] if node.kind != 'end' else 'o'}{n}"

    def wt(pixel) -> list[float]:
        values = calibration.to_wt(float(pixel[0]), float(pixel[1]))
        return [values[c] for c in components]

    def point(point_id: str, kind: str, value, word, fields, pixel) -> dict:
        return {
            "id": point_id,
            "type": kind,
            "temperature_C": value,
            "phases": fields,
            "liquid_wt": {c: round(v, 2) for c, v in zip(components, wt(pixel))},
            "sources": [{"ref": _ATLAS_REF, "pixel": [round(pixel[0], 1), round(pixel[1], 1)],
                         "label": word.text if word is not None else None}],
        }

    points = []
    for n in used:
        node = graph.nodes[n]
        value, word = temperatures.get(n, (None, None))
        fields = sorted({f for c in curves if n in c["nodes"] for f in c["fields"] if f})
        points.append(point(ids[n], _TYPES[node.kind], value, word, fields, node.pixel))
    boundary = []
    count = 0
    for curve in curves:
        order = [(_nearest(curve["pixels"], graph.nodes[n].pixel, i, len(curve["nodes"])), ids[n])
                 for i, n in enumerate(curve["nodes"])]
        for pixel, value, word in curve["saddles"]:
            count += 1
            saddle_id = f"{prefix}-{value:g}" if counts[value] == 1 else f"{prefix}-s{count}"
            points.append(point(saddle_id, "saddle", value, word, sorted(f for f in curve["fields"] if f), pixel))
            order.append((_nearest(curve["pixels"], pixel, 1, 3), saddle_id))
        polyline = simplify_polyline([wt(p) for p in _smoothed(curve["pixels"])], _SIMPLIFY_WT)
        boundary.append({
            "fields": curve["fields"],
            "path": [point_id for _, point_id in sorted(order, key=lambda entry: entry[0])],
            "dashed": curve["dashed"],
            "polyline_wt": [[round(v, 2) for v in p] for p in polyline],
        })
    system["phases"] = list(dict.fromkeys(naming.names[r] for r in sorted(naming.names)))
    system["invariantPoints"] = points
    system["boundaryCurves"] = boundary
    system["isotherms"] = []
    system["inversions"] = []
    system.setdefault("units", {})["polyline_wt"] = "[" + ", ".join(f"wt% {c}" for c in components) + "]"
    return system


def _join_through(curves: list[dict]) -> None:
    """Join, in place, two curves ending at a node where no other curve ends, when they have the same two fields."""
    changed = True
    while changed:
        changed = False
        ends: dict[int, list[tuple[int, int]]] = {}
        for i, c in enumerate(curves):
            ends.setdefault(c["nodes"][0], []).append((i, 0))
            ends.setdefault(c["nodes"][-1], []).append((i, -1))
        for node, at in ends.items():
            if len(at) != 2 or at[0][0] == at[1][0]:
                continue
            (i, ei), (j, ej) = at
            a, b = curves[i], curves[j]
            if sorted(a["fields"], key=str) != sorted(b["fields"], key=str):
                continue
            if ei == 0:
                a = _reversed(a)
            if ej == -1:
                b = _reversed(b)
            joined = {"nodes": a["nodes"] + b["nodes"][1:], "pixels": np.vstack([a["pixels"], b["pixels"][1:]]),
                      "fields": a["fields"], "dashed": a["dashed"] and b["dashed"],
                      "saddles": a["saddles"] + b["saddles"]}
            curves[:] = [c for k, c in enumerate(curves) if k not in (i, j)] + [joined]
            changed = True
            break


def _reversed(curve: dict) -> dict:
    return {"nodes": curve["nodes"][::-1], "pixels": curve["pixels"][::-1], "fields": curve["fields"][::-1],
            "dashed": curve["dashed"], "saddles": curve["saddles"]}


def _nearest(pixels: np.ndarray, pixel, position: int, count: int) -> float:
    """Index of ``pixel`` along ``pixels``: the ends for the first and last of ``count`` path points, else the
    nearest pixel."""
    if position == 0:
        return 0.0
    if position == count - 1:
        return float(len(pixels) - 1)
    return float(np.argmin(np.hypot(*(pixels - np.asarray(pixel, float)).T)))


def _smoothed(pixels: np.ndarray) -> np.ndarray:
    """Moving average over ``_SMOOTH_PX`` points; the end points are kept."""
    if len(pixels) <= _SMOOTH_PX:
        return pixels
    kernel = np.ones(_SMOOTH_PX) / _SMOOTH_PX
    half = _SMOOTH_PX // 2
    padded = np.vstack([np.repeat(pixels[:1], half, axis=0), pixels, np.repeat(pixels[-1:], half, axis=0)])
    out = np.column_stack([np.convolve(padded[:, i], kernel, mode="valid") for i in (0, 1)])
    out[0], out[-1] = pixels[0], pixels[-1]
    return out
