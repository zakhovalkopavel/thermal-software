"""
phase_diagrams.builders.binary_system_builder — Binary config + measurements on the scan → system dict.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Per-diagram workflow, § Output: binary system JSON
"""
from __future__ import annotations

import numpy as np

from phase_diagrams.models.binary_extraction import BinaryExtraction
from phase_diagrams.models.calibration_result import CalibrationResult
from phase_diagrams.nbs.composition_converter import convert_composition
from phase_diagrams.tracing.curve_sampler import sample_curve
from phase_diagrams.tracing.curve_tracer import trace_path
from phase_diagrams.config.diagram_config import DiagramConfig
from phase_diagrams.detection.horizontal_line_detector import detect_horizontal_lines
from phase_diagrams.config.invariant_spec import InvariantSpec
from phase_diagrams.detection.junction_locator import locate_junction
from phase_diagrams.figures.label_reader import read_label
from phase_diagrams.models.measured_line import MeasuredLine
from phase_diagrams.nbs.nbs_matcher import NbsMatcher
from phase_diagrams.models.review_item import ReviewItem
from phase_diagrams.nbs.status_resolver import resolve_status
from phase_diagrams.detection.stroke_width_filter import stroke_width_filter
from phase_diagrams.models.traced_curve import TracedCurve
from phase_diagrams.detection.vertical_line_detector import detect_vertical_lines

_KEY_ORDER = (
    "system", "components", "units", "source", "variantChoice", "nbsCrossCheck", "digitization",
    "phases", "invariantPoints", "liquidImmiscibility", "solidSolutions", "unmatchedSourcePoints",
    "inversions", "liquidus", "liquidusSource",
)
_METHOD = (
    "Liquidus traced along the stroke centre (shortest ink path between the junctions, "
    "centred across the stroke); invariant lines from the horizontal strokes."
)
_LINE_MATCH_PX = 15
_LABEL_DRAWING_WT = 0.5
_LABEL_DRAWING_T = 3.0
_TRACE_GAP_PX = 15.0
_END_INSET_PX = 8
_CRITICAL_FLAT_C = 0.5
_CROSSING_FIT_PX = 25
_CROSSING_SHIFT_PX = 25.0
_MAXIMUM_REACH_PX = 60
_SNAP_MAX_RUN = 15


class _Reference:
    """Resolved liquidus reference: printed point, page pixel and drawn composition."""

    def __init__(self, label_wt: float, temperature: float, pixel: tuple[float, float], drawn_wt: float | None, text: str):
        self.label_wt = label_wt
        self.temperature = temperature
        self.pixel = pixel
        self.drawn_wt = drawn_wt
        self.text = text


def build_binary_system(
    config: DiagramConfig,
    image: np.ndarray,
    mask: np.ndarray,
    calibration_result: CalibrationResult,
    nbs: NbsMatcher | None,
    compounds: dict,
    page_size: tuple[int, int],
) -> BinaryExtraction:
    """Measure invariants and liquidus on the scan and assemble the system dict.

    ``compounds`` is compounds.json; ``page_size`` = (width, height) of the render.
    """
    cal = calibration_result.calibration
    frame = calibration_result.frame
    x_name = config.x_component
    other = config.other_component
    review: list[ReviewItem] = list(calibration_result.review)
    log: list[str] = []
    lines = detect_horizontal_lines(mask, frame, cal)
    trace_mask = stroke_width_filter(mask, config.stroke_width_px) if config.stroke_width_px else mask
    if config.stroke_width_px:
        log.append(f"liquidus traced on strokes {config.stroke_width_px[0]:g}–{config.stroke_width_px[1]:g} px wide")

    def line_row(line: MeasuredLine):
        return lambda x: line.y_level + cal.bottom_slope * (x - cal.ref_px)

    def nearest_line(seed: tuple[float, float]) -> MeasuredLine | None:
        _, level = cal.level(*seed)
        best = None
        for line in lines:
            if not (line.x_start - 40 <= seed[0] <= line.x_end + 40):
                continue
            distance = abs(line.y_level - level)
            if distance <= _LINE_MATCH_PX and (best is None or distance < abs(best.y_level - level)):
                best = line
        return best

    junctions: dict[str, tuple[float, float]] = {}
    drawn: dict[str, float] = {}
    measured_t: dict[str, float] = {}
    junction_lines: dict[str, MeasuredLine] = {}
    for spec in config.invariants:
        if spec.type == "compound-melting":
            junctions[spec.id] = _snap_vertical(trace_mask, spec.seed_pixel)
            continue
        for key, seed in ((spec.id, spec.seed_pixel), (f"{spec.id}:second", spec.second_seed_pixel)):
            if seed is None:
                continue
            line = nearest_line(seed)
            if line is None:
                fallback = (
                    "lowest point of the traced curves used" if spec.label_temperature is None and spec.reaction == "eutectic"
                    else "seed pixel used"
                )
                review.append(ReviewItem("label-drawing", key, f"no invariant line found near the seed; {fallback}"))
                junctions[key] = seed
                drawn[key] = cal.to_data(*seed)[0]
                continue
            pixel = locate_junction(mask, seed, line_row(line), line.thickness)
            junctions[key] = pixel
            drawn[key] = cal.to_data(*pixel)[0]
            measured_t[spec.id] = line.temperature_C
            junction_lines[key] = line

    # end-member references
    end_refs: dict[str, _Reference] = {}
    corners = frame.corners()
    for phase, (x_value, temperature) in config.end_members.items():
        px, py = cal.to_pixel(float(x_value), float(temperature))
        left_side = abs(px - corners["bottomLeft"][0]) < abs(px - corners["bottomRight"][0])
        px = px + _END_INSET_PX if left_side else px - _END_INSET_PX
        end_refs[f"end:{phase}"] = _Reference(x_value, temperature, _snap_vertical(trace_mask, (px, py)), None, f"{phase} melting point")

    def pixel_of(ref_id: str) -> tuple[float, float]:
        return end_refs[ref_id].pixel if ref_id in end_refs else junctions[ref_id]

    # trace every drawn segment; each list in ``branch_ends`` runs outward from the junction
    segment_curves: dict[tuple[int, int], TracedCurve] = {}
    branch_ends: dict[str, list[list[tuple[float, float]]]] = {}
    for branch_index, branch in enumerate(config.liquidus):
        for segment_index, segment in enumerate(branch.resolved_segments()):
            if segment.kind != "trace":
                continue
            label = f"{branch.phase} {segment.from_ref}→{segment.to_ref}"
            waypoints = ([segment.seed_pixel] if segment.seed_pixel else []) + list(segment.waypoints)
            curve = trace_path(trace_mask, pixel_of(segment.from_ref), pixel_of(segment.to_ref), waypoints, label=label)
            segment_curves[(branch_index, segment_index)] = curve
            branch_ends.setdefault(segment.from_ref, []).append(list(curve.pixels))
            branch_ends.setdefault(segment.to_ref, []).append(list(reversed(curve.pixels)))
    dome_curve = None
    if config.liquid_immiscibility:
        block = config.liquid_immiscibility
        monotectic = block["monotectic"]
        seed = block.get("seedPixel")
        waypoints = ([tuple(seed)] if seed else []) + [tuple(p) for p in block.get("waypoints", [])]
        dome_curve = trace_path(
            trace_mask, junctions[monotectic], junctions[f"{monotectic}:second"], waypoints,
            label=f"liquid immiscibility {monotectic}",
        )
        branch_ends.setdefault(monotectic, []).append(list(dome_curve.pixels))
        branch_ends.setdefault(f"{monotectic}:second", []).append(list(reversed(dome_curve.pixels)))

    # refine junctions from the traced branches
    for key, line in junction_lines.items():
        row = line_row(line)
        crossings = [
            x for pixels in branch_ends.get(key, [])
            if (x := _branch_crossing(pixels, row, line.thickness, junctions[key][0])) is not None
        ]
        if crossings:
            x = float(np.mean(crossings))
            junctions[key] = (x, row(x))
            drawn[key] = cal.to_data(*junctions[key])[0]
    for spec in config.invariants:
        if spec.type == "compound-melting" and branch_ends.get(spec.id):
            near = [p for pixels in branch_ends[spec.id] for p in pixels[:_MAXIMUM_REACH_PX]]
            junctions[spec.id] = max(near, key=lambda p: cal.to_data(*p)[1])
        elif spec.label_temperature is None and spec.id not in junction_lines and spec.reaction == "eutectic" and branch_ends.get(spec.id):
            near = [
                p for pixels in branch_ends[spec.id] for p in pixels[:_MAXIMUM_REACH_PX]
                if trace_mask[int(round(p[1])), int(round(p[0]))]
            ]
            if near:
                junctions[spec.id] = min(near, key=lambda p: cal.to_data(*p)[1])
                drawn[spec.id] = cal.to_data(*junctions[spec.id])[0]

    temperatures: dict[str, float] = {}
    for spec in config.invariants:
        if spec.label_temperature is not None:
            temperatures[spec.id] = spec.label_temperature
            continue
        temperatures[spec.id] = int(round(measured_t.get(spec.id, cal.to_data(*junctions[spec.id])[1])))
        review.append(ReviewItem("unlabelled", spec.id, f"temperature not labelled; digitized {temperatures[spec.id]} °C"))

    refs: dict[str, _Reference] = dict(end_refs)
    stoichiometric = {c["id"]: c for c in compounds.get("compounds", [])}
    invariant_points: list[dict] = []
    compositions: dict[str, float] = {}
    for spec in config.invariants:
        composition, composition_text = _composition(spec, config, drawn, stoichiometric, review)
        compositions[spec.id] = composition
        refs[spec.id] = _Reference(float(composition), temperatures[spec.id], junctions[spec.id], drawn.get(spec.id), spec.id)
        if spec.type == "monotectic":
            second = spec.label_second_composition
            second_drawn = drawn.get(f"{spec.id}:second")
            if second is None:
                second = round(second_drawn, 1)
                review.append(ReviewItem("unlabelled", f"{spec.id}:second", f"second liquid not labelled; digitized {second} wt% {x_name}"))
            compositions[f"{spec.id}:second"] = second
            refs[f"{spec.id}:second"] = _Reference(float(second), temperatures[spec.id], junctions[f"{spec.id}:second"], second_drawn, f"{spec.id}:second")

    # liquidus
    curves: list[TracedCurve] = []
    sampled: list[tuple[float, float]] = []
    traced_data: dict[str, list[tuple[float, float]]] = {}
    liquidus: list[dict] = []
    dropped_notes: list[str] = []
    segment_notes: list[str] = []
    for branch_index, branch in enumerate(config.liquidus):
        points: list[list[float]] = []
        for segment_index, segment in enumerate(branch.resolved_segments()):
            start, end = refs[segment.from_ref], refs[segment.to_ref]
            label = f"{branch.phase} {segment.from_ref}→{segment.to_ref}"
            traced: list[tuple[float, float]] = []
            if segment.kind == "trace":
                curve = segment_curves[(branch_index, segment_index)]
                curves.append(curve)
                traced = [cal.to_data(px, py) for px, py in curve.pixels]
                curve.points = traced
                for ref_id in (segment.from_ref, segment.to_ref):
                    traced_data.setdefault(ref_id, []).extend(traced)
                if curve.gap_px > _TRACE_GAP_PX:
                    review.append(ReviewItem("trace-gap", label, f"path crosses {curve.gap_px:.0f} px of non-ink"))
                grid = branch.grid
            elif segment.kind == "straight":
                traced = [(start.label_wt, start.temperature), (end.label_wt, end.temperature)]
                grid = branch.grid
                segment_notes.append(
                    f"The {branch.phase} branch is a straight segment between {_ref_text(segment.from_ref)} and {_ref_text(segment.to_ref)}"
                )
            else:
                traced = [(start.label_wt, start.temperature), (end.label_wt, start.temperature)]
                grid = branch.grid
                segment_notes.append(
                    f"the {branch.phase} branch is flat at the {_ref_text(segment.from_ref)} temperature between "
                    f"{_fmt(start.label_wt)} and {_fmt(end.label_wt)} wt% {x_name}"
                )
            sample = sample_curve(
                traced, grid, (start.label_wt, start.temperature), (end.label_wt, end.temperature),
                start.drawn_wt, end.drawn_wt, config.junction_tolerance_wt,
            )
            if sample.dropped:
                review.append(ReviewItem("dropped-points", label, f"grid points {', '.join(_fmt(g) for g in sample.dropped)} dropped near a junction drawn away from its label"))
                dropped_notes.extend(_fmt(g) for g in sample.dropped)
            if sample.uncovered:
                review.append(ReviewItem("trace-gap", label, f"grid points {', '.join(_fmt(g) for g in sample.uncovered)} outside the traced range"))
            for point in sample.points:
                if points and abs(points[-1][0] - point[0]) < 1e-9:
                    continue
                points.append(point)
            sampled.extend(cal.to_pixel(float(p[0]), float(p[1])) for p in sample.points)
        liquidus.append(
            {
                "phase": branch.phase,
                "from": refs[branch.from_ref].text if branch.from_ref.startswith("end:") else branch.from_ref,
                "to": refs[branch.to_ref].text if branch.to_ref.startswith("end:") else branch.to_ref,
                "status": "extracted",
                "points": [[_round_wt(p[0]), p[1]] for p in points],
            }
        )

    # invariant points
    check_parts: list[str] = []
    for spec in config.invariants:
        liquid = _liquid(config, compositions[spec.id])
        comparisons = []
        if spec.nbs:
            if nbs is None:
                raise ValueError(f"{spec.id}: NBS entries chosen but no NBS index loaded (run nbs-index)")
            comparisons = [nbs.compare(n, liquid, temperatures[spec.id]) for n in spec.nbs]
        status = resolve_status(comparisons)
        if status == "conflict":
            review.append(ReviewItem("nbs-conflict", spec.id, "; ".join(f"entry {c.entry.entry}: {c.comparison_text()}" for c in comparisons)))
        for comparison in comparisons:
            if comparison.entry.approximate:
                review.append(ReviewItem("nbs-approximate", spec.id, f"entry {comparison.entry.entry} is approximate"))
        temperature_text = _temperature_text(spec, measured_t.get(spec.id), traced_data.get(spec.id))
        if spec.label_temperature is not None and spec.id in measured_t and abs(measured_t[spec.id] - spec.label_temperature) > _LABEL_DRAWING_T:
            review.append(ReviewItem("label-drawing", spec.id, f"line reads {_half(measured_t[spec.id])} °C, label {spec.label_temperature}"))
        atlas_source = {
            "ref": config.ref,
            "figure": config.source["figure"],
            "printedPage": config.source["printedPage"],
            "pdfPage": config.source["pdfPage"],
            "temperature": temperature_text,
            "composition": _composition_text(spec, config, compositions, drawn, traced_data.get(spec.id), stoichiometric),
            "pixel": [int(round(junctions[spec.id][0])), int(round(junctions[spec.id][1]))],
        }
        point: dict = {
            "id": spec.id,
            "type": spec.type,
            "reaction": spec.reaction,
            "phases": spec.phases,
            "temperature_C": temperatures[spec.id],
            "liquid_wt": liquid,
        }
        if spec.type == "monotectic":
            point["secondLiquid_wt"] = _liquid(config, compositions[f"{spec.id}:second"])
        point["status"] = status
        point["sources"] = [atlas_source] + [c.to_source(config.components) for c in comparisons]
        if spec.notes:
            point["notes"] = spec.notes
        invariant_points.append(point)
        for key in (spec.id, f"{spec.id}:second"):
            label = compositions.get(key)
            if key in drawn and label is not None and abs(drawn[key] - label) > _LABEL_DRAWING_WT:
                review.append(ReviewItem("label-drawing", key, f"drawn at {drawn[key]:.1f} wt% {x_name}, label {_fmt(label)}"))
        if spec.label_box is not None and spec.label_temperature is not None:
            guess, confidence = read_label(image, spec.label_box)
            if guess != str(spec.label_temperature):
                review.append(ReviewItem("ocr-differs", spec.id, f"OCR reads '{guess}' ({confidence:.0f} %), config label {spec.label_temperature}"))

    system: dict = {
        "system": config.system,
        "components": config.components,
        "units": {"temperature_C": "°C", "liquid_wt": "wt%", "liquidus": f"[wt% {x_name}, °C]"},
        "source": config.source,
        "digitization": {
            "render": f"pdfPage {config.pdf_page} at 400 dpi ({page_size[0]} × {page_size[1]} px), full page coordinates",
            "calibration": _calibration_text(config, calibration_result),
            "method": _METHOD,
            "check": _check_text(config, cal, frame, mask, lines, measured_t, drawn, compositions, stoichiometric, traced_data, refs),
        },
        "phases": config.phases,
        "invariantPoints": invariant_points,
    }
    if dome_curve is not None:
        system["liquidImmiscibility"] = _immiscibility(config, cal, dome_curve, refs, review)
        curves.append(dome_curve)
        sampled.extend(cal.to_pixel(float(w), float(t)) for w, t in system["liquidImmiscibility"]["boundary"])
    system["liquidus"] = liquidus
    system["liquidusSource"] = {
        "ref": config.ref,
        "figure": config.source["figure"],
        "printedPage": config.source["printedPage"],
        "pdfPage": config.source["pdfPage"],
        "read": _liquidus_read(config, refs, compositions, dropped_notes, segment_notes),
    }
    for key, value in config.verbatim.items():
        system[key] = value
    ordered = {k: system[k] for k in _KEY_ORDER if k in system}
    ordered.update({k: v for k, v in system.items() if k not in ordered})

    log.append("lines: " + ", ".join(f"{_half(line.temperature_C)}" for line in lines))
    for spec in config.invariants:
        if spec.id in drawn and spec.label_composition is not None and abs(drawn[spec.id] - spec.label_composition) > _LABEL_DRAWING_WT:
            log.append(f"{spec.id}: drawn {drawn[spec.id]:.1f} wt% vs label {_fmt(spec.label_composition)} → label used")
    statuses = [p["status"] for p in invariant_points]
    log.append(
        f"{len(invariant_points)} invariants ({', '.join(f'{statuses.count(s)} {s}' for s in sorted(set(statuses)))}), "
        f"{len(liquidus)} liquidus branches, {sum(len(s.nbs) for s in config.invariants)} NBS comparisons"
    )
    return BinaryExtraction(
        system=ordered,
        calibration=calibration_result,
        lines=lines,
        junctions=junctions,
        curves=curves,
        sampled=sampled,
        review=review,
        log=log,
    )


def _composition(spec: InvariantSpec, config: DiagramConfig, drawn, stoichiometric, review) -> tuple[float, str]:
    if spec.label_composition is not None:
        return spec.label_composition, "label"
    if spec.type == "compound-melting":
        compound = stoichiometric.get(spec.phases[0])
        if compound is None:
            raise ValueError(f"{spec.id}: phase '{spec.phases[0]}' not in compounds.json")
        wt = convert_composition({k: float(v) for k, v in compound["oxideMoles"].items()}, "wt", digits=None)
        return round(wt.get(config.x_component, 0.0), 1), "stoichiometry"
    value = round(drawn[spec.id], 1)
    review.append(ReviewItem("unlabelled", spec.id, f"composition not labelled; digitized {value} wt% {config.x_component}"))
    return value, "digitized"


def _liquid(config: DiagramConfig, composition: float) -> dict[str, float]:
    x = round(float(composition), 1)
    values = {config.x_component: x, config.other_component: round(100.0 - x, 1)}
    return {c: values[c] for c in config.components}


def _temperature_text(spec: InvariantSpec, measured: float | None, traced) -> str:
    if spec.type == "compound-melting":
        text = f"printed label '{spec.label_temperature}' at the liquidus maximum"
        if traced:
            text += f"; digitized {int(round(max(t for _, t in traced)))}"
        return text
    if spec.label_temperature is None:
        if measured is not None:
            return f"not labelled; {spec.reaction or spec.type} line reads {_half(measured)}"
        if spec.reaction == "eutectic" and traced:
            return "not labelled; no line detected, digitized at the lowest point of the traced liquidus curves"
        return "not labelled; no line detected, digitized at the junction pixel"
    text = f"printed label '{spec.label_temperature}' on the {spec.reaction or spec.type} line"
    if measured is not None:
        text += f"; line reads {_half(measured)}"
    return text


def _composition_text(spec, config, compositions, drawn, traced, stoichiometric) -> str:
    x_name = config.x_component
    if spec.type == "compound-melting" and spec.label_composition is None:
        formula = stoichiometric[spec.phases[0]].get("formula", spec.phases[0])
        text = f"{formula} at {_fmt(compositions[spec.id])} wt% {x_name} (stoichiometry)"
        if traced:
            top = _flat_top(traced)
            text += f"; digitized maximum at {top[0]:.1f}"
        return text
    if spec.label_composition is not None:
        text = f"printed label '{_fmt(spec.label_composition)}' (mass% {x_name})"
    else:
        text = f"not labelled (mass% {x_name})"
    if spec.id in drawn:
        text += f"; drawn junction at {drawn[spec.id]:.1f}"
    if spec.type == "monotectic":
        second = f"{spec.id}:second"
        if spec.label_second_composition is not None:
            text += f"; second liquid printed label '{_fmt(spec.label_second_composition)}'"
            if second in drawn:
                text += f", drawn at {drawn[second]:.1f}"
        else:
            text += f"; second liquid not labelled, digitized {_fmt(compositions[second])}"
    return text


def _calibration_text(config: DiagramConfig, result: CalibrationResult) -> str:
    cal = result.calibration
    x = ", ".join(f"{v}→{_half(p)}" for v, p in zip(config.x_ticks, result.x_tick_pixels))
    y = ", ".join(f"{v}→{_half(p)}" for v, p in zip(config.y_ticks, result.y_tick_pixels))
    return (
        f"x: mass% {config.x_component} ticks {x} (piecewise linear); y: ticks °C {y}; "
        f"scan rotation: frame bottom {cal.rotation_text()}, left frame dx/dy = {cal.left_slope:+.4f}"
    )


def _check_text(config, cal, frame, mask, lines, measured_t, drawn, compositions, stoichiometric, traced_data, refs) -> str:
    parts: list[str] = []
    verticals = detect_vertical_lines(mask, frame, cal)
    compound_checks = []
    for phase in config.phases:
        if any(phase == p for p in config.end_members):
            continue
        compound = stoichiometric.get(phase)
        if compound is None:
            continue
        wt = convert_composition({k: float(v) for k, v in compound["oxideMoles"].items()}, "wt", digits=None).get(config.x_component)
        if wt is None:
            continue
        positions = [cal.x.to_value(v[0]) for v in verticals]
        if not positions:
            continue
        nearest = min(positions, key=lambda p: abs(p - wt))
        if abs(nearest - wt) <= 2.0:
            compound_checks.append(f"{compound.get('formula', phase)} line at {nearest:.1f} (stoichiometric {wt:.1f})")
    if compound_checks:
        parts.append(f"Compound lines (wt% {config.x_component}): " + "; ".join(compound_checks) + ".")
    line_specs = [s for s in config.invariants if s.id in measured_t]
    if line_specs:
        parts.append(
            "Invariant lines read "
            + " / ".join(_half(measured_t[s.id]) for s in line_specs)
            + " °C (labels "
            + " / ".join(str(s.label_temperature) if s.label_temperature is not None else "not printed" for s in line_specs)
            + ")."
        )
    for spec in config.invariants:
        if spec.type == "compound-melting" and traced_data.get(spec.id):
            top = _flat_top(traced_data[spec.id])
            parts.append(f"{spec.phases[0].capitalize()} maximum {int(round(top[1]))} °C at {top[0]:.1f} wt% (label {spec.label_temperature}).")
    for phase, (x_value, temperature) in config.end_members.items():
        points = traced_data.get(f"end:{phase}")
        if not points:
            continue
        near = sorted(points, key=lambda p: abs(p[0] - x_value))[:30]
        if len(near) >= 5:
            fit = np.polyfit([p[0] for p in near], [p[1] for p in near], 1)
            parts.append(f"{phase.capitalize()} liquidus meets the axis at {int(round(np.polyval(fit, x_value)))} °C (label {temperature}).")
    comparisons = []
    for key, value in drawn.items():
        label = compositions.get(key)
        if label is not None:
            comparisons.append(f"{value:.1f} / '{_fmt(label)}'")
    if comparisons:
        parts.append(f"Digitized vs printed compositions (wt% {config.x_component}): " + ", ".join(comparisons) + ".")
    return " ".join(parts)


def _liquidus_read(config, refs, compositions, dropped_notes, segment_notes) -> str:
    labels = []
    seen = set()
    for branch in config.liquidus:
        for segment in branch.resolved_segments():
            for ref_id in (segment.from_ref, segment.to_ref):
                if ref_id in seen:
                    continue
                seen.add(ref_id)
                ref = refs[ref_id]
                if ref_id.startswith("end:"):
                    labels.append(f"{ref.temperature}")
                    continue
                spec_id = ref_id.split(":")[0]
                spec = config.invariant(spec_id)
                if spec.type == "compound-melting":
                    labels.append(f"{ref.temperature}")
                elif ref_id.endswith(":second"):
                    continue
                elif spec.label_temperature is None:
                    labels.append(f"{ref.temperature} (digitized) at {_fmt(ref.label_wt)}")
                else:
                    labels.append(f"{ref.temperature} at {_fmt(ref.label_wt)}")
    text = "digitized stroke centre; end points set to the printed invariant and melting-point labels (" + ", ".join(labels) + ")."
    if dropped_notes:
        text += f" Digitized grid points {', '.join(sorted(set(dropped_notes), key=float))} wt% {config.x_component} within {_fmt(config.junction_tolerance_wt)} wt% of junctions drawn away from their labels are omitted."
    if segment_notes:
        sentence = "; ".join(segment_notes)
        text += " " + sentence[0].upper() + sentence[1:] + "."
    return text


def _immiscibility(config, cal, curve: TracedCurve, refs, review) -> dict:
    block = config.liquid_immiscibility
    monotectic = block["monotectic"]
    first, second = refs[monotectic], refs[f"{monotectic}:second"]
    data = [cal.to_data(px, py) for px, py in curve.pixels]
    curve.points = data
    if curve.gap_px > _TRACE_GAP_PX:
        review.append(ReviewItem("trace-gap", "liquidImmiscibility", f"path crosses {curve.gap_px:.0f} px of non-ink"))
    top_index = int(np.argmax([t for _, t in data]))
    t_max = data[top_index][1]
    flat = [w for w, t in data if t >= t_max - _CRITICAL_FLAT_C]
    critical_wt = round((min(flat) + max(flat)) / 2.0, 1)
    critical_t = int(round(t_max))
    x_name = config.x_component
    boundary = [[first.label_wt, first.temperature]]
    xs = np.array([w for w, _ in data])
    ts = np.array([t for _, t in data])
    left = xs <= xs[top_index]
    right = ~left
    for g in block.get("grid", []):
        if abs(g - critical_wt) <= _CRITICAL_FLAT_C or not (first.label_wt < g < second.label_wt):
            continue
        side = left if g < critical_wt else right
        order = np.argsort(xs[side])
        if not side.any() or g < xs[side].min() or g > xs[side].max():
            continue
        boundary.append([g, int(round(float(np.interp(g, xs[side][order], ts[side][order]))))])
    boundary.append([critical_wt, critical_t])
    boundary.append([second.label_wt, second.temperature])
    boundary.sort(key=lambda p: p[0])
    boundary = [[_round_wt(p[0]), p[1]] for p in boundary]
    pixel = curve.pixels[top_index]
    critical = {
        "temperature_C": critical_t,
        f"wt_{x_name}": critical_wt,
        "status": "extracted",
        "pixel": [int(round(pixel[0])), int(round(pixel[1]))],
        "read": f"top of the dome, not labelled; flat between {min(flat):.1f} and {max(flat):.1f} wt% {x_name}",
    }
    if block.get("criticalPointNotes"):
        critical["notes"] = block["criticalPointNotes"]
    review.append(ReviewItem("unlabelled", "liquidImmiscibility.criticalPoint", f"critical point digitized: {critical_t} °C at {critical_wt} wt% {x_name}"))
    out = {
        "region": f"Two liquids above the monotectic {monotectic} between {_fmt(first.label_wt)} and {_fmt(second.label_wt)} wt% {x_name}",
        "criticalPoint": critical,
        "boundary": boundary,
    }
    if block.get("notes"):
        out["notes"] = block["notes"]
    return out


def _flat_top(points: list[tuple[float, float]]) -> tuple[float, float]:
    """(middle of the region within 0.5 °C of the maximum, maximum temperature)."""
    t_max = max(t for _, t in points)
    flat = [w for w, t in points if t >= t_max - _CRITICAL_FLAT_C]
    return (min(flat) + max(flat)) / 2.0, t_max


def _branch_crossing(pixels, row, thickness: float, near_x: float) -> float | None:
    """x where the traced branch, extended straight, meets the invariant line centre.

    ``pixels`` runs outward from the junction; pixels on the line stroke are
    skipped and the next ``_CROSSING_FIT_PX`` are fitted.
    """
    band = thickness / 2.0 + 2.0
    start = next((i for i, (x, y) in enumerate(pixels) if abs(y - row(x)) > band), None)
    if start is None:
        return None
    fit = [(x, y) for x, y in pixels[start:start + _CROSSING_FIT_PX] if abs(y - row(x)) > band]
    if len(fit) < 6:
        return None
    xs = np.array([p[0] for p in fit])
    ys = np.array([p[1] for p in fit])
    c, s = row(0.0), row(1.0) - row(0.0)
    if np.ptp(ys) >= np.ptp(xs):
        b, a = np.polyfit(ys, xs, 1)
        if abs(1.0 - b * s) < 1e-9:
            return None
        x = (a + b * c) / (1.0 - b * s)
    else:
        b, a = np.polyfit(xs, ys, 1)
        if abs(b - s) < 1e-6:
            return None
        x = (c - a) / (b - s)
    return float(x) if abs(x - near_x) <= _CROSSING_SHIFT_PX else None


def _snap_vertical(mask: np.ndarray, point: tuple[float, float], radius: int = 25) -> tuple[float, float]:
    """``point`` if it is on ink, else the nearest stroke-sized ink run centre in its column.

    Longer runs (a crossing or a steep line along the column) are ignored; with
    no stroke-sized run the point is returned unchanged.
    """
    x, y = int(round(point[0])), int(round(point[1]))
    if mask[y, x]:
        return point
    column = mask[y - radius:y + radius + 1, x]
    padded = np.concatenate([[0], column.astype(np.int8), [0]])
    diff = np.diff(padded)
    runs = [
        (a, b) for a, b in zip(np.flatnonzero(diff == 1), np.flatnonzero(diff == -1) - 1)
        if b - a + 1 <= _SNAP_MAX_RUN
    ]
    if not runs:
        return point
    centre = min(((a + b) / 2.0 for a, b in runs), key=lambda c: abs(c - radius))
    return float(x), float(y - radius + centre)


def _ref_text(ref: str) -> str:
    return ref.replace("end:", "") + (" melting point" if ref.startswith("end:") else "")


def _round_wt(value):
    """Grid values keep their config type; invariant compositions are floats with one decimal."""
    return round(value, 1) if isinstance(value, float) else value


def _fmt(value: float) -> str:
    value = float(value)
    return str(int(value)) if value.is_integer() else f"{value:.1f}"


def _half(value: float) -> str:
    rounded = round(value * 2) / 2.0
    return str(int(rounded)) if rounded.is_integer() else f"{rounded:.1f}"
