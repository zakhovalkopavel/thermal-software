"""
phase_diagrams.output.auto_extraction_report — Report of a fully automatic extraction, compared with a semi-manual system file.

Spec: docs/scripts/phase-diagrams/AUTOMATIC.md § Fully automatic extraction
"""
from __future__ import annotations

import numpy as np
from scipy.spatial import cKDTree

from phase_diagrams.builders.field_namer import FieldNaming
from phase_diagrams.models.boundary_graph import BoundaryGraph
from phase_diagrams.models.isotherm_detection import IsothermDetection
from phase_diagrams.models.line_scale import LineScale
from phase_diagrams.models.ternary_calibration import TernaryCalibration

SAME_POINT_WT = 1.5
ON_CURVE_PX = 8.0
_SAMPLE_PX = 5.0
_ISOTHERM_ON_SHARE = 0.6
_STATES = ("same °C", "other °C", "no °C", "not found")


def compare_auto_system(
    auto: dict,
    reference: dict,
    calibration: TernaryCalibration,
    scale: LineScale | None = None,
    detection: IsothermDetection | None = None,
) -> list[str]:
    """Markdown lines comparing ``auto`` with the semi-manual ``reference`` system file.

    Invariant points: each reference point with a composition and the nearest automatic point (largest
    component difference ≤ 1.5 wt%), with both temperatures. Boundary curves: the share of each reference
    curve (every 5 px) within 8 px of an automatic curve, and of the automatic curves within 8 px of a
    reference one. Fields: the phases of both. Isotherms (with ``detection``): each reference isotherm with
    the detected pieces lying on it (≥ 60 % of a piece within 8 px), its covered share and whether their
    temperature is the same, another, none or no piece was found; then the pieces on no reference isotherm.
    Pixel sizes are for the reference line width, scaled by ``scale``.
    """
    s = scale or LineScale()
    components = list(auto["components"])

    def values(wt) -> np.ndarray:
        return np.array([float(wt.get(c, 0.0)) for c in components] if isinstance(wt, dict) else [float(w) for w in wt])

    lines = ["## Comparison with the semi-manual system", ""]
    own = [p for p in auto.get("invariantPoints", []) if p.get("liquid_wt")]
    rows = ["| Semi-manual point | °C | Automatic point | °C | Δ wt% |", "| --- | --- | --- | --- | --- |"]
    matched = same_t = 0
    reference_points = [p for p in reference.get("invariantPoints", []) if p.get("liquid_wt")]
    for point in reference_points:
        target = values(point["liquid_wt"])
        best = min(((float(np.abs(values(p["liquid_wt"]) - target).max()), p) for p in own), default=None,
                   key=lambda item: item[0])
        if best is not None and best[0] <= SAME_POINT_WT:
            matched += 1
            same_t += best[1].get("temperature_C") == point.get("temperature_C")
            rows.append(f"| {point['id']} | {_t(point)} | {best[1]['id']} | {_t(best[1])} | {best[0]:.1f} |")
        else:
            rows.append(f"| {point['id']} | {_t(point)} | — | | {'' if best is None else f'{best[0]:.1f}'} |")
    lines += [f"Invariant points: {matched} of {len(reference_points)} found within {SAME_POINT_WT} wt% "
              f"({same_t} with the same temperature); {len(own)} automatic points.", ""] + rows + [""]

    def dense(curve) -> np.ndarray:
        pixels = np.array([calibration.to_page(list(values(w))) for w in curve["polyline_wt"]], float)
        out = [pixels[0]]
        for a, b in zip(pixels[:-1], pixels[1:]):
            n = max(1, int(np.linalg.norm(b - a) / _SAMPLE_PX))
            out.extend(a + (b - a) * t for t in np.linspace(0, 1, n + 1)[1:])
        return np.array(out)

    auto_curves = [c for c in auto.get("boundaryCurves", []) if c.get("polyline_wt")]
    ref_curves = [c for c in reference.get("boundaryCurves", []) if c.get("polyline_wt")]
    near = s.length(ON_CURVE_PX)
    if auto_curves and ref_curves:
        auto_tree = cKDTree(np.vstack([dense(c) for c in auto_curves]))
        ref_tree = cKDTree(np.vstack([dense(c) for c in ref_curves]))
        rows = ["| Semi-manual curve | Covered |", "| --- | --- |"]
        total = covered = 0
        for curve in ref_curves:
            samples = dense(curve)
            hit = auto_tree.query(samples)[0] <= near
            total += len(samples)
            covered += int(hit.sum())
            rows.append(f"| {' / '.join(f or '—' for f in curve.get('fields', []))} ({' → '.join(curve.get('path', []))}) "
                        f"| {hit.mean() * 100:.0f} % |")
        extra_rows = []
        for curve in auto_curves:
            samples = dense(curve)
            share = float((ref_tree.query(samples)[0] <= near).mean())
            if share < 0.5:
                extra_rows.append(f"- {' / '.join(f or '—' for f in curve['fields'])} ({' → '.join(curve['path'])}): "
                                  f"{share * 100:.0f} % on a semi-manual curve")
        lines += [f"Boundary curves: {covered / max(total, 1) * 100:.0f} % of the semi-manual curves lie within "
                  f"{near:g} px of an automatic one.", ""] + rows + [""]
        if extra_rows:
            lines += ["Automatic curves mostly off the semi-manual ones:", ""] + extra_rows + [""]
    ref_phases = [p for p in reference.get("phases", []) if p]
    auto_phases = [p for p in auto.get("phases", []) if p]
    lines += [f"Fields: {len(set(ref_phases) & set(auto_phases))} of {len(set(ref_phases))} semi-manual phases named "
              f"automatically; missing: {', '.join(sorted(set(ref_phases) - set(auto_phases))) or 'none'}; "
              f"only automatic: {', '.join(sorted(set(auto_phases) - set(ref_phases))) or 'none'}.", ""]
    if detection is not None:
        lines += _isotherm_lines(detection, reference, calibration, values, near)
    return lines


def _isotherm_lines(detection: IsothermDetection, reference: dict, calibration: TernaryCalibration, values,
                    near: float) -> list[str]:
    """Each reference isotherm with the detected pieces on it (≥ 60 % of a piece within ``near`` px of it):
    covered share, their temperatures and the state; then the pieces on no reference isotherm."""
    def dense(points: np.ndarray) -> np.ndarray:
        out = [points[0]]
        for a, b in zip(points[:-1], points[1:]):
            n = max(1, int(np.linalg.norm(b - a) / _SAMPLE_PX))
            out.extend(a + (b - a) * t for t in np.linspace(0, 1, n + 1)[1:])
        return np.array(out)

    pieces = [dense(np.array(p.pixels, float)) for p in detection.isotherms]
    rows = ["| Semi-manual isotherm | °C | Covered | Automatic pieces (°C, source) | State |", "| --- | --- | --- | --- | --- |"]
    states: dict[str, int] = {}
    used: set[int] = set()
    for entry in reference.get("isotherms", []):
        if not entry.get("polyline_wt"):
            continue
        samples = dense(np.array([calibration.to_page(list(values(w))) for w in entry["polyline_wt"]], float))
        tree = cKDTree(samples)
        on = [k for k, own in enumerate(pieces) if float((tree.query(own)[0] <= near).mean()) >= _ISOTHERM_ON_SHARE]
        used.update(on)
        covered = np.zeros(len(samples), bool)
        for k in on:
            covered |= cKDTree(pieces[k]).query(samples)[0] <= near
        found = {detection.isotherms[k].temperature_C for k in on} - {None}
        state = ("not found" if not on else "same °C" if found == {entry.get("temperature_C")}
                 else "no °C" if not found else "other °C")
        states[state] = states.get(state, 0) + 1
        listed = ", ".join(f"D{k + 1} {_piece_t(detection.isotherms[k])}" for k in on)
        rows.append(f"| {entry.get('field')} | {entry.get('temperature_C')} | {covered.mean() * 100:.0f} % | {listed} | {state} |")
    extra = [k for k in range(len(pieces)) if k not in used]
    total = sum(states.values())
    lines = [f"Isotherms: {total} semi-manual; " + ", ".join(f"{states.get(s, 0)} {s}" for s in _STATES)
             + f"; {len(extra)} automatic pieces on no semi-manual isotherm.", ""] + rows + [""]
    if extra:
        lines += ["Automatic isotherm pieces on no semi-manual isotherm (D-numbers count the detected pieces from 1):", ""]
        for k in extra:
            p = detection.isotherms[k]
            lines.append(f"- D{k + 1} {p.field} {_piece_t(p)}: ({p.start[0]:.0f}, {p.start[1]:.0f}) → "
                         f"({p.end[0]:.0f}, {p.end[1]:.0f}); ends {p.ends[0]}, {p.ends[1]}")
        lines.append("")
    return lines


def _piece_t(piece) -> str:
    return "?" if piece.temperature_C is None else f"{piece.temperature_C:g} {piece.source}"


def auto_extraction_report(
    system_id: str,
    header: list[str],
    graph: BoundaryGraph,
    naming: FieldNaming,
    auto: dict,
    detection: IsothermDetection,
    comparison: list[str],
) -> str:
    """Markdown report: ``header`` lines (figure, triangle, corners), the field names, invariant points,
    boundary curves and isotherms of ``auto``, the ``comparison`` and the logs."""
    out = [f"# Fully automatic extraction — {system_id}", ""] + header + [""]
    out += ["## Fields", "", "| Region | Phase | From | Area px² |", "| --- | --- | --- | --- |"]
    for region in sorted(naming.names):
        out.append(f"| {region} | {naming.names[region]} | {naming.sources[region]} | {int((naming.labels == region).sum())} |")
    out += ["", "## Invariant points", "", "| Id | Type | Pixel | wt% | °C | Read | Phases |", "| --- | --- | --- | --- | --- | --- | --- |"]
    for p in auto["invariantPoints"]:
        source = p["sources"][0]
        out.append(f"| {p['id']} | {p['type']} | {source['pixel'][0]:.0f}, {source['pixel'][1]:.0f} | "
                   f"{' / '.join(f'{v:.1f}' for v in p['liquid_wt'].values())} | {_t(p)} | {source.get('label') or ''} | "
                   f"{', '.join(p['phases'])} |")
    out += ["", "## Boundary curves", "", "| Fields | Path | Dashed | Points |", "| --- | --- | --- | --- |"]
    for c in auto["boundaryCurves"]:
        out.append(f"| {' / '.join(f or '—' for f in c['fields'])} | {' → '.join(c['path'])} | "
                   f"{'yes' if c.get('dashed') else ''} | {len(c['polyline_wt'])} |")
    known = [p for p in detection.isotherms if p.temperature_C is not None]
    by_source: dict[str, int] = {}
    for p in known:
        by_source[p.source or "?"] = by_source.get(p.source or "?", 0) + 1
    out += ["", "## Isotherms", "",
            f"{len(detection.isotherms)} pieces, {len(known)} with a temperature "
            f"({', '.join(f'{v} {k}' for k, v in sorted(by_source.items())) or 'none'}).", ""]
    out += comparison
    out += ["## Log", ""] + [f"- {line}" for line in graph.log + naming.log + detection.log] + [""]
    return "\n".join(out)


def _t(point: dict) -> str:
    value = point.get("temperature_C")
    return "" if value is None else f"{value:g}"
