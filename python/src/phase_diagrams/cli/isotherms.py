"""Isotherm detection, auto-overlay, and auto ternary commands."""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import textwrap
import time
from datetime import datetime
from pathlib import Path

import numpy as np
from PIL import Image
from PIL.PngImagePlugin import PngInfo

from phase_diagrams import (
    CurvesConfig,
    LineScale,
    NbsEntry,
    NbsMatcher,
    STATUS_TOLERANCE,
    SourceRegistry,
    add_compound,
    atlas_disagrees,
    boundary_arrow_segments,
    build_binary_system,
    build_compound_points,
    build_field_approximation,
    build_node_map,
    build_nbs_index,
    build_ternary_start,
    build_topology_report,
    calibrate_binary,
    auto_extraction_report,
    auto_overlay_curves,
    build_auto_system,
    build_auto_ternary,
    compare_auto_system,
    detect_boundary_graph,
    name_fields,
    read_curve_temperatures,
    read_node_temperatures,
    read_page_words,
    compare_isotherm_draft,
    detect_isotherms,
    isotherm_draft_report,
    read_rotated_number,
    render_isotherm_draft,
    compare_systems,
    corner_components,
    default_compound_id,
    detect_triangles,
    display_caption,
    display_formula,
    edit_ternary_structure,
    fill_ternary_curves,
    find_system_figures,
    format_compound,
    formula_molar_mass,
    index_figures,
    ink_mask,
    load_config,
    measure_line_scale,
    melting_candidates,
    merge_compound_data,
    merge_figure_index,
    new_oxide_compound,
    new_system_checklist,
    replace_compound,
    render_node_map,
    render_overlay,
    render_page,
    render_ternary_overlay,
    TernaryCalibration,
    read_corner_labels,
    render_tile,
    review_report,
    system_components,
    triangle_reading_order,
    validate_dataset,
    validate_with_candidate,
    write_system_json,
)

from phase_diagrams.cli.common import (
    ATLAS,
    NBS,
    _ATLAS,
    _NBS,
    _candidate,
    _comparison_lines,
    _host,
    _line_scale,
    _load_nbs,
    _page_image,
    _say,
    _target,
    _write_candidate,
)

from phase_diagrams.cli.figures import _save_png
from phase_diagrams.cli.ternary import _system_path

def _detect(command: str, args, dataset: Path, registry: SourceRegistry, work: Path) -> dict:
    """Detector inputs (config, system with traced boundaries, page, mask, scale, invariants, calibration)
    and its result, shared by detect-isotherms and auto-overlay."""
    path = dataset / "configs" / f"{args.system}.curves.config.json"
    config = load_config(path)
    if not isinstance(config, CurvesConfig):
        raise ValueError(f"{args.system}: expected a curves config")
    candidate = _candidate(work, config.system_file)
    source = candidate if candidate.exists() else _system_path(dataset, work, config.system_file)
    system = json.loads(source.read_text(encoding="utf-8"))
    if not any(c.get("polyline_wt") for c in system.get("boundaryCurves", [])):
        raise ValueError(f"{_host(source)} has no traced boundary curves; run pd-curves first")
    _say(command, f"boundaries from {_host(source)}")
    image = _page_image(registry, work, _ATLAS, config.pdf_page)
    mask = ink_mask(image)
    scale = _line_scale(command, mask, config.line_width_px)
    invariants: dict[str, dict] = {}
    for system_file in sorted((dataset / "systems").glob("*.json")):
        for point in json.loads(system_file.read_text(encoding="utf-8")).get("invariantPoints", []):
            invariants.setdefault(point["id"], point)
    invariants.update({point["id"]: point for point in system.get("invariantPoints", [])})
    width = json.loads(path.read_text(encoding="utf-8")).get("isothermStrokeWidth_px") or _ISOTHERM_WIDTH_PX
    calibration = TernaryCalibration.from_system(system, config.pixel_origin)
    detection = detect_isotherms(
        system, mask, calibration, invariants, (float(width[0]), float(width[1])),
        args.step, read_rotated_number, scale, source_ref=_ATLAS,
    )
    for line in detection.log:
        _say(command, line)
    return {"config": config, "system": system, "image": image, "mask": mask, "scale": scale,
            "invariants": invariants, "calibration": calibration, "detection": detection}


def _cmd_detect_isotherms(args, dataset: Path, registry: SourceRegistry, work: Path) -> int:
    found_on_page = _detect("detect-isotherms", args, dataset, registry, work)
    config, image, calibration, detection = (found_on_page[k] for k in ("config", "image", "calibration", "detection"))
    rows, unmatched = compare_isotherm_draft(detection.isotherms, config.isotherms, config.pixel_origin)
    folder = work / "isotherms"
    folder.mkdir(parents=True, exist_ok=True)
    draft = {"systemFile": config.system_file, "step_C": args.step,
             "isotherms": [p.config_entry(config.pixel_origin) for p in detection.isotherms]}
    (folder / f"{args.system}.json").write_text(json.dumps(draft, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (folder / f"{args.system}.md").write_text(isotherm_draft_report(args.system, detection, rows, unmatched), encoding="utf-8")
    corners = [calibration.stored_to_page(*calibration.corners[c]) for c in calibration.components]
    box = (max(0, int(min(c[0] for c in corners)) - _DRAFT_MARGIN_PX), max(0, int(min(c[1] for c in corners)) - _DRAFT_MARGIN_PX),
           min(image.shape[1], int(max(c[0] for c in corners)) + _DRAFT_MARGIN_PX),
           min(image.shape[0], int(max(c[1] for c in corners)) + _DRAFT_MARGIN_PX))
    _save_png(render_isotherm_draft(image, detection, box), folder / f"{args.system}.png")
    found = sum(1 for r in rows if r["pieces"])
    agree = sum(1 for r in rows if r["agrees"])
    _say("detect-isotherms", f"config isotherms: {found} of {len(rows)} found, {agree} with the same temperature; "
                             f"{len(unmatched)} detected pieces on no config isotherm")
    _say("detect-isotherms", f"draft entries → {_host(folder / f'{args.system}.json')}; report → "
                             f"{_host(folder / f'{args.system}.md')}; image → {_host(folder / f'{args.system}.png')}")
    return 0


def _cmd_auto_overlay(args, dataset: Path, registry: SourceRegistry, work: Path) -> int:
    found_on_page = _detect("auto-overlay", args, dataset, registry, work)
    config, system, image, mask, scale, invariants, calibration, detection = (
        found_on_page[k] for k in ("config", "system", "image", "mask", "scale", "invariants", "calibration", "detection"))
    auto = build_auto_system(system, detection, calibration)
    page = calibration.stored_to_page
    corners = [page(*calibration.corners[c]) for c in calibration.components]
    box = (min(p[0] for p in corners), min(p[1] for p in corners), max(p[0] for p in corners), max(p[1] for p in corners))
    approximation = build_field_approximation(auto, calibration, invariants, scale)
    for line in approximation.log:
        _say("auto-overlay", f"approximation: {line}")
    compounds = json.loads((dataset / "compounds.json").read_text(encoding="utf-8")).get("compounds", [])
    compound_points = build_compound_points(
        auto, build_node_map(auto, mask, config.pixel_origin, scale, source_ref=_ATLAS), compounds,
                                            config.pixel_origin, scale)
    rendered, _ = render_ternary_overlay(image, box, auto_overlay_curves(auto, detection, calibration), [], corners,
                                         scale=scale, approximation=approximation, compound_points=compound_points)
    folder = work / "auto"
    folder.mkdir(parents=True, exist_ok=True)
    overlay = folder / f"{args.system}.png"
    _save_png(rendered, overlay)
    (folder / f"{args.system}.json").write_text(json.dumps(auto, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    known = sum(1 for p in detection.isotherms if p.temperature_C is not None)
    _say("auto-overlay", f"{len(detection.isotherms)} detected isotherm pieces ({known} with a temperature), "
                         f"{len(approximation.phases)} fields, {len(compound_points)} compound points; "
                         "boundaries and invariants from the traced system file, no config isotherms, fields or arrows")
    _say("auto-overlay", f"overlay → {_host(overlay)}; system with the detected isotherms → {_host(folder / f'{args.system}.json')}")
    return 0


_WORDS_MARGIN_PX = (300, 150, 300, 100)


def _cmd_auto(args, dataset: Path, registry: SourceRegistry, work: Path) -> int:
    components = system_components(args.system)
    index_path = work / "figure-index" / f"{_ATLAS}.json"
    if not index_path.exists():
        raise FileNotFoundError(f"no figure index {_host(index_path)}; run pd-index first")
    index = json.loads(index_path.read_text(encoding="utf-8"))
    found = find_system_figures(index, components)
    if args.figure:
        wanted = f"Fig. {args.figure.removeprefix('Fig.').strip()}"
        chosen = [e for e in found if e["figure"] == wanted] or [e for e in index if e["figure"] == wanted]
        if not chosen:
            raise ValueError(f"{wanted} is not in the figure index")
    else:
        chosen = found
        if not chosen:
            raise ValueError(f"no caption in the figure index names {'-'.join(components)}; give FIGURE=")
    figure = next((e for e in chosen if e.get("captionStart")), chosen[0])
    page = int(figure["pdfPage"])
    _say("auto", f"{'-'.join(components)}: {figure['figure']}, pdfPage {page} (printed {figure['printedPage']})"
                 + ("" if args.figure or len({e['figure'] for e in found}) <= 1 else "; FIGURE= to choose another"))
    image = _page_image(registry, work, _ATLAS, page)
    mask = ink_mask(image)
    scale = _line_scale("auto", mask, None)
    triangles = detect_triangles(mask, scale)
    if not triangles:
        raise ValueError(f"no ternary triangle found on pdfPage {page}")
    base = triangles[0][2][0] - triangles[0][1][0]
    large = triangle_reading_order([t for t in triangles if t[2][0] - t[1][0] >= _LARGE_TRIANGLE * base], image.shape[1])
    if args.triangle and not 1 <= args.triangle <= len(large):
        raise ValueError(f"TRIANGLE must be 1–{len(large)}")
    numbers = [args.triangle] if args.triangle else list(range(1, len(large) + 1))
    picked = None
    for number in numbers:
        corners = dict(zip(("top", "left", "right"), large[number - 1]))
        if args.corners:
            if sorted(args.corners) != sorted(components):
                raise ValueError(f"CORNERS must name each of {', '.join(components)} once (top left right)")
            picked = (number, corners, dict(zip(("top", "left", "right"), args.corners)), None)
            break
        readings = read_corner_labels(image, corners)
        assignment = corner_components({k: v["text"] for k, v in readings.items()}, components)
        if assignment is not None:
            picked = (number, corners, assignment, readings)
            break
    if picked is None:
        raise ValueError(f"no triangle on pdfPage {page} has corner labels naming {', '.join(components)}; "
                         "give TRIANGLE= and CORNERS=\"<top> <left> <right>\"")
    number, corners, assignment, readings = picked
    header = [f"Figure: {figure['figure']}, pdfPage {page} (printed {figure['printedPage']}); line width {scale.line_px:.2f} px.",
              f"Triangle {number} of {len(large)}: " + ", ".join(
                  f"{k} {assignment[k]} ({v[0]:.1f}, {v[1]:.1f})" + (f" read {readings[k]['text']!r}" if readings else "")
                  for k, v in corners.items())]
    for line in header:
        _say("auto", line)
    start_text, _ = build_ternary_start(args.system, components, figure, corners, assignment,
                                        (image.shape[1], image.shape[0]), scale.line_px)
    start = json.loads(start_text)
    start["digitization"]["method"] = ("Fully automatic (pd-auto): corners from the triangle edges, boundary curves from the "
                                       "heavy strokes, fields and temperatures from text recognition; not reviewed.")
    calibration = TernaryCalibration.from_system(start)

    graph = detect_boundary_graph(mask, [corners["top"], corners["left"], corners["right"]], scale)
    for line in graph.log[:2]:
        _say("auto", f"boundaries: {line}")
    xs, ys = [p[0] for p in corners.values()], [p[1] for p in corners.values()]
    m = [scale.length(v) for v in _WORDS_MARGIN_PX]
    words = read_page_words(image, mask, (int(min(xs) - m[0]), int(min(ys) - m[1]), int(max(xs) + m[2]), int(max(ys) + m[3])),
                            scale=scale)
    compounds = json.loads((dataset / "compounds.json").read_text(encoding="utf-8")).get("compounds", [])
    naming = name_fields(graph, corners, assignment, calibration, compounds, words, mask, scale)
    unnamed = sum(1 for v in naming.sources.values() if v == "no label")
    _say("auto", f"{len(words)} words read; {len(naming.names)} fields ({unnamed} without a label), "
                 f"{len(naming.dropped)} curves between two regions of one field dropped")
    temperatures = read_node_temperatures(graph.nodes, words, args.step, scale)
    taken = {i for i, word in enumerate(words) if any(word is w for _, w in temperatures.values())}
    kept = {k: np.asarray(edge.pixels, float) for k, edge in enumerate(graph.edges) if k not in naming.dropped}
    ends = {k: [temperatures[n][0] for n in graph.edges[k].nodes if n in temperatures] for k in kept}
    saddles = read_curve_temperatures(kept, words, taken, args.step, scale, end_temperatures=ends)
    system = build_auto_ternary(start, graph, naming, temperatures, calibration, saddles=saddles)
    points = system["invariantPoints"]
    _say("auto", f"{len(system['boundaryCurves'])} boundary curves, {len(points)} points "
                 f"({sum(1 for p in points if p['temperature_C'] is not None)} with a temperature read, "
                 f"{len(saddles)} on a curve)")

    invariants = {p["id"]: p for p in points}
    width = tuple(round(f * scale.line_px * 2) / 2 for f in (0.5, 1.55))
    point_words = [w for _, w in temperatures.values()] + [t.word for t in saddles]
    detection = detect_isotherms(
        system, mask, calibration, invariants, width, args.step, read_rotated_number, scale,
        side_labels=[w for w in words if not any(w is p for p in point_words)],
        skip_boxes=[w.box for w in point_words], text_words=words, source_ref=_ATLAS,
    )
    auto = build_auto_system(system, detection, calibration)
    known = sum(1 for p in detection.isotherms if p.temperature_C is not None)
    _say("auto", f"isotherms: {len(detection.isotherms)} pieces, {known} with a temperature")
    approximation = build_field_approximation(auto, calibration, invariants, scale)
    compound_points = build_compound_points(
        auto, build_node_map(auto, mask, (0.0, 0.0), scale, source_ref=_ATLAS), compounds, (0.0, 0.0), scale,
    )
    page_corners = [calibration.stored_to_page(*calibration.corners[c]) for c in calibration.components]
    box = (min(p[0] for p in page_corners), min(p[1] for p in page_corners),
           max(p[0] for p in page_corners), max(p[1] for p in page_corners))
    rendered, _ = render_ternary_overlay(image, box, auto_overlay_curves(auto, detection, calibration), [], page_corners,
                                         scale=scale, approximation=approximation, compound_points=compound_points)

    relative = f"systems/{args.system}.json"
    candidate = _candidate(work, relative)
    reference_path = candidate if candidate.exists() else dataset / relative if (dataset / relative).exists() else None
    if reference_path is not None:
        reference = json.loads(reference_path.read_text(encoding="utf-8"))
        reference_calibration = TernaryCalibration.from_system(reference)
        comparison = compare_auto_system(auto, reference, reference_calibration, scale, detection)
        comparison[2:2] = [f"Semi-manual system: {_host(reference_path)}.", ""]
        for line in comparison:
            if line.startswith(("Invariant points:", "Boundary curves:", "Fields:", "Isotherms:")):
                _say("auto", f"vs semi-manual: {line}")
    else:
        comparison = ["## Comparison with the semi-manual system", "", "No semi-manual system file yet.", ""]
    folder = work / "auto-full"
    folder.mkdir(parents=True, exist_ok=True)
    overlay = folder / f"{args.system}.png"
    _save_png(rendered, overlay)
    (folder / f"{args.system}.json").write_text(json.dumps(auto, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    report = folder / f"{args.system}.md"
    report.write_text(auto_extraction_report(args.system, header, graph, naming, auto, detection, comparison), encoding="utf-8")
    _say("auto", f"overlay → {_host(overlay)}; system → {_host(folder / f'{args.system}.json')}; report → {_host(report)}")
    return 0


