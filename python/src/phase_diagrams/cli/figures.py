"""Figure-index and tile commands."""
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

def _cmd_index_figures(args, registry: SourceRegistry, work: Path) -> int:
    first, last = (int(v) for v in args.pages.split("-"))
    pages = range(first, last + 1)
    found = index_figures(
        registry.pdf_path(args.source), pages, registry.page_offset(args.source),
        progress=(lambda page: _say("index-figures", f"page {page}")) if args.verbose else None,
    )
    out = work / "figure-index" / f"{args.source}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    existing = json.loads(out.read_text(encoding="utf-8")) if out.exists() else []
    figures = merge_figure_index(existing, found, pages)
    out.write_text(json.dumps(figures, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.verbose:
        for entry in found:
            _say("index-figures", f"p{entry['pdfPage']} {entry['figure']}: {entry['captionStart'][:80] or '(label only)'}")
    labels = sum(1 for f in found if not f["captionStart"])
    _say("index-figures", f"pages {first}-{last}: {len(found)} figures ({labels} without caption text); "
                          f"index {len(figures)} figures → {out}")
    return 0


def _save_png(image: Image.Image, path: Path) -> None:
    info = PngInfo()
    for key, value in image.info.items():
        if isinstance(value, str):
            info.add_text(key, value)
    image.save(path, pnginfo=info)


def _with_overlay(image: np.ndarray, overlay_path: Path) -> np.ndarray:
    """The page in RGB with the overlay pasted at its page origin."""
    if not overlay_path.exists():
        raise FileNotFoundError(f"no overlay {overlay_path}; run extract or trace-curves first")
    overlay = Image.open(overlay_path)
    origin = overlay.text.get("pageOrigin")
    if origin is None:
        raise ValueError(f"{overlay_path} has no page origin; run extract or trace-curves again")
    x0, y0 = (int(v) for v in origin.split(","))
    page = np.stack([image] * 3, axis=-1) if image.ndim == 2 else image.copy()
    pixels = np.array(overlay.convert("RGB"))
    page[y0:y0 + pixels.shape[0], x0:x0 + pixels.shape[1]] = pixels
    return page


def _cmd_tile(args, registry: SourceRegistry, work: Path) -> int:
    image = _page_image(registry, work, args.source, args.page)
    x0, y0, x1, y1 = args.box
    scale = f"{args.scale:g}"
    suffix = ""
    if args.overlay:
        image = _with_overlay(image, work / "overlays" / f"{args.overlay}.png")
        suffix = f"-{args.overlay}"
    out = work / "tiles" / f"p{args.page}-{x0}-{y0}-{x1}-{y1}-x{scale}{suffix}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    render_tile(image, (x0, y0, x1, y1), args.scale).save(out)
    _say("tile", f"→ {out}")
    return 0


