"""Binary calibrate and extract commands."""
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

def _binary_setup(args, dataset: Path, registry: SourceRegistry, work: Path):
    config = load_config(dataset / "configs" / f"{args.system}.config.json")
    if isinstance(config, CurvesConfig):
        raise ValueError(f"{args.system}: expected a binary config")
    image = _page_image(registry, work, config.ref, config.pdf_page)
    mask = ink_mask(image)
    return config, image, mask, calibrate_binary(mask, config)


def _calibration_layers(result):
    frame = result.frame
    ticks = [(x, frame.bottom_y(x)) for x in result.x_tick_pixels]
    ticks += [(frame.left_x(y), y) for y in result.y_tick_pixels]
    corners = frame.corners()
    box = (corners["topLeft"][0], corners["topLeft"][1], corners["bottomRight"][0], corners["bottomRight"][1])
    return box, ticks


def _cmd_calibrate(args, dataset: Path, registry: SourceRegistry, work: Path) -> int:
    config, image, _, result = _binary_setup(args, dataset, registry, work)
    for line in result.log:
        _say("calibrate", f"{args.system}: {line}")
    for axis, values, pixels, residuals in (
        ("x", config.x_ticks, result.x_tick_pixels, result.x_residuals),
        ("y", config.y_ticks, result.y_tick_pixels, result.y_residuals),
    ):
        order = sorted(range(len(values)), key=lambda i: pixels[i])
        text = ", ".join(f"{values[i]}→{pixels[i]:.1f} ({residuals[k]:+.1f})" for k, i in enumerate(order))
        _say("calibrate", f"{axis}: {text}")
    for item in result.review:
        _say("calibrate", f"review {item.kind} {item.subject}: {item.message}")
    box, ticks = _calibration_layers(result)
    out = work / "overlays" / f"{args.system}-calibration.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    _save_png(render_overlay(image, box, ticks=ticks), out)
    _say("calibrate", f"overlay → {out}")
    return 0


def _cmd_extract(args, dataset: Path, registry: SourceRegistry, work: Path) -> int:
    config, image, mask, result = _binary_setup(args, dataset, registry, work)
    for line in result.log:
        _say("calibrate", f"{args.system}: {line}")
    nbs = _load_nbs(work, dataset)
    compounds = json.loads((dataset / "compounds.json").read_text(encoding="utf-8"))
    extraction = build_binary_system(config, image, mask, result, nbs, compounds, (image.shape[1], image.shape[0]))
    for line in extraction.log:
        _say("extract", line)
    if args.verbose:
        for line in extraction.lines:
            _say("extract", f"line {line.temperature_C:.1f} °C at y {line.y_level:.1f} "
                            f"(rows {line.row_top:g}–{line.row_bottom:g}), x {line.x_start:g}–{line.x_end:g}")
    cal = result.calibration
    lines = [
        ((line.x_start, line.y_level + cal.bottom_slope * (line.x_start - cal.ref_px)),
         (line.x_end, line.y_level + cal.bottom_slope * (line.x_end - cal.ref_px)))
        for line in extraction.lines
    ]
    box, ticks = _calibration_layers(result)
    overlay = work / "overlays" / f"{args.system}.png"
    overlay.parent.mkdir(parents=True, exist_ok=True)
    _save_png(render_overlay(image, box, extraction.curves, extraction.sampled, lines, ticks, extraction.junctions), overlay)
    review = work / "review" / f"{args.system}.md"
    review.parent.mkdir(parents=True, exist_ok=True)
    review.write_text(review_report(args.system, extraction.review, result.log + extraction.log), encoding="utf-8")
    _say("extract", f"overlay → {overlay}")
    _say("extract", f"review: {len(extraction.review)} items → {review}")
    _write_candidate("extract", dataset, work, config.output, write_system_json(extraction.system), review)
    return 0


