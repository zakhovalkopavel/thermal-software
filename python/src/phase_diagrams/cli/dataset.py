"""Compare, promote, and validate commands."""
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

def _cmd_compare(args, dataset: Path, work: Path) -> int:
    relative = _target(dataset, args.system)
    candidate = _candidate(work, relative)
    if not candidate.exists():
        raise FileNotFoundError(f"no candidate {candidate}; run extract or trace-curves first")
    lines = _comparison_lines(dataset, relative, candidate.read_text(encoding="utf-8"))
    for line in lines:
        _say("compare", line)
    return 1 if any("DIFF" in line for line in lines) else 0


def _cmd_promote(args, dataset: Path, work: Path) -> int:
    relative = _target(dataset, args.system)
    candidate = _candidate(work, relative)
    if not candidate.exists():
        raise FileNotFoundError(f"no candidate {candidate}; run extract or trace-curves first")
    text = candidate.read_text(encoding="utf-8")
    for line in _comparison_lines(dataset, relative, text):
        _say("promote", line)
    errors = [i for i in validate_with_candidate(dataset, relative, text) if i.level == "error"]
    for issue in errors:
        print(issue)
    if errors:
        _say("promote", f"refused: the dataset would have {len(errors)} validation errors")
        return 1
    current = dataset / relative
    if current.exists():
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup = work / "replaced" / f"{current.stem}.{stamp}.json"
        backup.parent.mkdir(parents=True, exist_ok=True)
        backup.write_text(current.read_text(encoding="utf-8"), encoding="utf-8")
        _say("promote", f"previous file → {backup}")
    current.parent.mkdir(parents=True, exist_ok=True)
    current.write_text(text, encoding="utf-8")
    _say("promote", f"promoted → {current}")
    overlay = work / "overlays" / f"{args.system}.png"
    if overlay.exists():
        shared = dataset / "overlays" / overlay.name
        shared.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(overlay, shared)
        _say("promote", f"overlay → {shared}")
    else:
        _say("promote", f"no overlay {overlay}; the dataset overlay is left as it is")
    return 0


def _cmd_validate(args, dataset: Path, work: Path) -> int:
    if args.candidate:
        relative = _target(dataset, args.candidate)
        candidate = _candidate(work, relative)
        if not candidate.exists():
            raise FileNotFoundError(f"no candidate {candidate}; run extract or trace-curves first")
        issues = validate_with_candidate(dataset, relative, candidate.read_text(encoding="utf-8"))
        _say("validate", f"dataset with candidate {candidate.name} in place of {relative}")
    else:
        issues = validate_dataset(dataset)
    for issue in issues:
        print(issue)
    errors = sum(1 for i in issues if i.level == "error")
    _say("validate", f"{errors} errors, {len(issues) - errors} warnings")
    return 1 if errors else 0


