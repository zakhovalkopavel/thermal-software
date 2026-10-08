#!/usr/bin/env python3
"""
extract_phase_diagram.py — CLI entry point: phase-diagram data from the Slag Atlas and NSRDS-NBS 61.

Output
------
  reports/phase-diagrams/candidates/<system>.json   (extract / trace-curves; compared with the dataset file)
  reports/phase-diagrams/starts/<system>.json       (new: starting file of a ternary, read until it is promoted)
  shared/processed/phase-diagrams/configs/<system>.curves.config.json   (new: written only when absent)
  reports/phase-diagrams/{renders,tiles,nodes,overlays,review,figure-index,nbs,replaced}/   (working files)
  shared/processed/phase-diagrams/systems/<system>.json   (only via promote, after validation)
  shared/processed/phase-diagrams/overlays/<system>.png   (copied by promote with its system file)

Implementation
--------------
  phase_diagrams — calibration, detectors, tracing, NBS index, builders, validator

Spec
----
  docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md

Usage
-----
  docker compose run --rm python python src/scripts/extract_phase_diagram.py extract mgo-sio2
  make pd-extract SYSTEM=mgo-sio2   (all commands run in the python container)
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import textwrap
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
    SourceRegistry,
    boundary_arrow_segments,
    build_binary_system,
    build_node_map,
    build_nbs_index,
    build_ternary_start,
    build_topology_report,
    calibrate_binary,
    compare_systems,
    corner_components,
    detect_triangles,
    display_caption,
    display_formula,
    edit_ternary_structure,
    fill_ternary_curves,
    find_system_figures,
    index_figures,
    ink_mask,
    load_config,
    measure_line_scale,
    merge_figure_index,
    new_system_checklist,
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

_ATLAS = "slag-atlas-1995"
_NBS = "nsrds-nbs-61-1"


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Extract phase-diagram data from the Slag Atlas and NSRDS-NBS 61.")
    p.add_argument("--dataset", default="shared/processed/phase-diagrams", help="Dataset folder")
    p.add_argument("--work-dir", default="reports/phase-diagrams", help="Working folder")
    p.add_argument("-v", "--verbose", action="store_true", help="Per-step log")
    sub = p.add_subparsers(dest="command", required=True, metavar="COMMAND")

    s = sub.add_parser("index-figures", help="Caption OCR → figure-index/<source>.json")
    s.add_argument("--source", default=_ATLAS)
    s.add_argument("--pages", default="40-200", help="PDF page range, e.g. 40-200")

    s = sub.add_parser("tile", help="Zoom tile with pixel rulers → tiles/")
    s.add_argument("--source", default=_ATLAS)
    s.add_argument("--page", type=int, required=True)
    s.add_argument("--box", type=int, nargs=4, required=True, metavar=("X0", "Y0", "X1", "Y1"))
    s.add_argument("--scale", type=float, default=1.0)
    s.add_argument("--overlay", metavar="SYSTEM", help="draw overlays/<SYSTEM>.png over the page (same page)")

    s = sub.add_parser("calibrate", help="Detect frame and ticks; print tick pixels and residuals; overlay")
    s.add_argument("system")

    s = sub.add_parser("extract", help="Binary config → candidates/<system>.json, overlay, review list, comparison")
    s.add_argument("system")

    s = sub.add_parser("new", help="New ternary: find its figure, calibrate the triangle → starting file + curves config")
    s.add_argument("system", help="system id, e.g. cao-feox-sio2")
    s.add_argument("--figure", help="figure number when the index has several, e.g. 3.226")
    s.add_argument("--triangle", type=int, help="triangle number when the page has several")
    s.add_argument("--corners", nargs=3, metavar=("TOP", "LEFT", "RIGHT"), help="corner components when the labels are not read")

    s = sub.add_parser("trace-curves", help="Ternary curves config → candidate with polyline_wt filled, overlay, review")
    s.add_argument("system")

    s = sub.add_parser("nodes", help="Numbered junctions, edge points, invariants and rings of a ternary → nodes/")
    s.add_argument("system")
    s.add_argument("--origin", type=float, nargs=2, metavar=("X", "Y"),
                   help="pixelOrigin (default: from the curves config, else 0 0)")

    s = sub.add_parser("compare", help="Compare the candidate with the dataset file")
    s.add_argument("system")

    s = sub.add_parser("promote", help="Copy the candidate into the dataset if the dataset still validates")
    s.add_argument("system")

    sub.add_parser("nbs-index", help="Dump and parse NSRDS-NBS 61 → nbs/")

    s = sub.add_parser("nbs-suggest", help="Candidate NBS entries for exactly these components")
    s.add_argument("components", nargs="+", metavar="COMPONENT")

    s = sub.add_parser("validate", help="Validate the whole dataset (with --candidate: as if SYSTEM were promoted)")
    s.add_argument("--candidate", metavar="SYSTEM")
    return p


def _say(command: str, message: str) -> None:
    print(f"[{command}] {message}")


def _page_image(registry: SourceRegistry, work: Path, ref: str, page: int):
    return render_page(registry.pdf_path(ref), page, dpi=400, cache_dir=work / "renders", cache_stem=ref)


_HOST_REPORTS = Path("tmp/reports/python")


def _host(path: Path) -> str:
    """Path from the repository root; compose.yml mounts ./tmp/reports/python at the container's reports/."""
    return str(_HOST_REPORTS.joinpath(*path.parts[1:])) if path.parts and path.parts[0] == "reports" else str(path)


def _line_scale(command: str, mask: np.ndarray, line_width_px: float | None) -> LineScale:
    """Pixel scale of the page: ``lineWidth_px`` from the config, else measured on ``mask``."""
    scale = LineScale(line_width_px, "config") if line_width_px else measure_line_scale(mask)
    _say(command, f"line width {scale.line_px:g} px ({scale.source}) → pixel tolerances × {scale.factor:g}")
    return scale


def _load_nbs(work: Path) -> NbsMatcher | None:
    path = work / "nbs" / f"{_NBS}.entries.json"
    if not path.exists():
        return None
    return NbsMatcher([NbsEntry.from_dict(e) for e in json.loads(path.read_text(encoding="utf-8"))])


def _target(dataset: Path, system: str) -> str:
    """Dataset-relative path of the system file a config writes (binary output or ternary system file)."""
    binary = dataset / "configs" / f"{system}.config.json"
    if binary.exists():
        return load_config(binary).output
    curves = dataset / "configs" / f"{system}.curves.config.json"
    if curves.exists():
        return load_config(curves).system_file
    raise FileNotFoundError(f"no config for '{system}' in {dataset / 'configs'}")


def _candidate(work: Path, relative: str) -> Path:
    return work / "candidates" / Path(relative).name


def _comparison_lines(dataset: Path, relative: str, candidate_text: str) -> list[str]:
    current = dataset / relative
    if not current.exists():
        return [f"new system: {relative} not in the dataset yet"]
    comparison = compare_systems(json.loads(current.read_text(encoding="utf-8")), json.loads(candidate_text))
    return [f"vs {relative}: {line}" for line in comparison.lines()]


def _write_candidate(command: str, dataset: Path, work: Path, relative: str, text: str, review: Path) -> None:
    candidate = _candidate(work, relative)
    candidate.parent.mkdir(parents=True, exist_ok=True)
    candidate.write_text(text, encoding="utf-8")
    _say(command, f"candidate → {candidate}")
    lines = _comparison_lines(dataset, relative, text)
    for line in lines:
        _say(command, line)
    with review.open("a", encoding="utf-8") as handle:
        handle.write("\n## Comparison with the dataset file\n\n" + "".join(f"- {line}\n" for line in lines))


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
    nbs = _load_nbs(work)
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


def _system_path(dataset: Path, work: Path, relative: str) -> Path:
    """The dataset system file, else the starting file of ``new`` (system not promoted yet)."""
    path = dataset / relative
    if path.exists():
        return path
    start = work / "starts" / Path(relative).name
    if start.exists():
        return start
    raise FileNotFoundError(f"no {relative} in the dataset and no starting file {_host(start)}; run pd-new first")


def _figure_number(figure: str) -> tuple[int, ...]:
    return tuple(int(v) for v in figure.removeprefix("Fig.").strip().split(".") if v.isdigit())


_LARGE_TRIANGLE = 0.4


def _ask(question: str, parse):
    """``parse(reply)`` of the first reply it accepts; None without a terminal, on q, Ctrl-D or Ctrl-C."""
    if not sys.stdin.isatty():
        return None
    while True:
        try:
            reply = input(f"{question}: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return None
        if reply.lower() in ("q", "quit"):
            return None
        value = parse(reply)
        if value is not None:
            return value
        print(f"  not an answer: {reply!r}")


def _number(reply: str, count: int) -> int | None:
    return int(reply) if reply.isdigit() and 1 <= int(reply) <= count else None


def _corner_order(reply: str, components: list[str]) -> list[str] | None:
    by_name = {c.lower(): c for c in components}
    order = [by_name.get(word.lower()) for word in reply.split()]
    return order if None not in order and sorted(order) == sorted(components) else None


def _cmd_new(args, dataset: Path, registry: SourceRegistry, work: Path) -> int:
    components = system_components(args.system)
    relative = f"systems/{args.system}.json"
    if (dataset / relative).exists():
        raise ValueError(f"{relative} is already in the dataset; edit its curves config and run pd-curves")
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
        figure = next((e for e in chosen if e.get("captionStart")), chosen[0])
    else:
        if not found:
            raise ValueError(f"no caption in the figure index names {'-'.join(components)}; give FIGURE= or run pd-index "
                             "over more pages")
        figures = [e for i, e in enumerate(found) if e["figure"] not in {f["figure"] for f in found[:i]}]
        if len(figures) == 1:
            figure = figures[0]
        else:
            _say("new", f"{'-'.join(display_formula(c) for c in components)}: {len(figures)} figures in the caption index")
            for number, entry in enumerate(figures, start=1):
                print(f"  {number}) {entry['figure']}, page {entry['printedPage']} (pdfPage {entry['pdfPage']})")
                print(textwrap.fill(display_caption(entry.get("captionStart") or "", components), width=100,
                                    initial_indent=" " * 5, subsequent_indent=" " * 5))
            number = _ask(f"Figure [1-{len(figures)}, q = quit]", lambda reply: _number(reply, len(figures)))
            if number is None:
                _say("new", f"no figure chosen; or: make pd-new SYSTEM={args.system} "
                            f"FIGURE=<e.g. {figures[0]['figure'].removeprefix('Fig. ')}>")
                return 0
            figure = figures[number - 1]
    page = int(figure["pdfPage"])
    _say("new", f"{'-'.join(components)}: {figure['figure']}, pdfPage {page} (printed {figure['printedPage']})")

    image = _page_image(registry, work, _ATLAS, page)
    mask = ink_mask(image)
    scale = _line_scale("new", mask, None)
    triangles = detect_triangles(mask, scale)
    if not triangles:
        raise ValueError(f"no ternary triangle found on pdfPage {page}")
    base = triangles[0][2][0] - triangles[0][1][0]
    large = triangle_reading_order([t for t in triangles if t[2][0] - t[1][0] >= _LARGE_TRIANGLE * base], image.shape[1])
    for number, (top, left, right) in enumerate(large, start=1):
        _say("new", f"triangle {number}: top ({top[0]:.1f}, {top[1]:.1f}), left ({left[0]:.1f}, {left[1]:.1f}), "
                    f"right ({right[0]:.1f}, {right[1]:.1f}), base {right[0] - left[0]:.0f} px")
    if args.triangle:
        if not 1 <= args.triangle <= len(large):
            raise ValueError(f"TRIANGLE must be 1–{len(large)}")
        number = args.triangle
    elif len(large) == 1:
        number = 1
    else:
        on_page = sorted({e["figure"] for e in index if int(e["pdfPage"]) == page}, key=_figure_number)
        if len(on_page) == len(large) and figure["figure"] in on_page:
            number = on_page.index(figure["figure"]) + 1
            _say("new", f"triangle {number}: {figure['figure']} is figure {number} of {', '.join(on_page)} on the page "
                        "(reading order); TRIANGLE= to choose another")
        else:
            number = _ask(f"Triangle of {figure['figure']} [1-{len(large)}, reading order; q = quit]",
                          lambda reply: _number(reply, len(large)))
            if number is None:
                _say("new", f"no triangle chosen; or: make pd-new SYSTEM={args.system} "
                            f"FIGURE={figure['figure'].removeprefix('Fig. ')} TRIANGLE=<number>")
                return 0
    corners = dict(zip(("top", "left", "right"), large[number - 1]))

    readings = read_corner_labels(image, corners)
    for name, reading in readings.items():
        _say("new", f"{name} corner ({corners[name][0]:.1f}, {corners[name][1]:.1f}): read {reading['text']!r}")
    if args.corners:
        if sorted(args.corners) != sorted(components):
            raise ValueError(f"CORNERS must name each of {', '.join(components)} once (top left right)")
        assignment = dict(zip(("top", "left", "right"), args.corners))
    else:
        assignment = corner_components({k: v["text"] for k, v in readings.items()}, components)
        if assignment is None and not args.triangle and len(large) > 1:
            matching = []
            for other in (n for n in range(1, len(large) + 1) if n != number):
                other_corners = dict(zip(("top", "left", "right"), large[other - 1]))
                other_readings = read_corner_labels(image, other_corners)
                other_assignment = corner_components({k: v["text"] for k, v in other_readings.items()}, components)
                if other_assignment:
                    matching.append((other, other_corners, other_readings, other_assignment))
            if len(matching) == 1:
                number, corners, readings, assignment = matching[0]
                _say("new", f"the labels of triangle {number} name {'-'.join(components)}, those of the chosen one do "
                            f"not: triangle {number} used; TRIANGLE= to choose another")
                for name, reading in readings.items():
                    _say("new", f"{name} corner ({corners[name][0]:.1f}, {corners[name][1]:.1f}): read {reading['text']!r}")
    for name, reading in readings.items():
        tile = work / "tiles" / f"{args.system}-corner-{name}.png"
        tile.parent.mkdir(parents=True, exist_ok=True)
        render_tile(image, reading["box"], 1.0).save(tile)
    if assignment is None:
        _say("new", f"corner labels not recognised (triangle {number}); see tiles/{args.system}-corner-*.png")
        order = _ask(f"Corners top left right (of {' '.join(components)}; q = quit)",
                     lambda reply: _corner_order(reply, components))
        if order is None:
            raise ValueError(f"corner labels not recognised; give CORNERS=\"<top> <left> <right>\" "
                             f"(of {' '.join(components)}) or TRIANGLE=")
        assignment = dict(zip(("top", "left", "right"), order))
    _say("new", "corner components: " + ", ".join(f"{k} {v}" for k, v in assignment.items())
         + f" (verify on tiles/{args.system}-corner-*.png)")

    system_text, config_text = build_ternary_start(args.system, components, figure, corners, assignment,
                                                   (image.shape[1], image.shape[0]), scale.line_px)
    start = work / "starts" / f"{args.system}.json"
    start.parent.mkdir(parents=True, exist_ok=True)
    start.write_text(system_text, encoding="utf-8")
    _say("new", f"starting file → {_host(start)} (pd-curves and pd-nodes use it until pd-promote)")
    config = dataset / "configs" / f"{args.system}.curves.config.json"
    if config.exists():
        _say("new", f"curves config kept: {config}")
    else:
        config.write_text(config_text, encoding="utf-8")
        _say("new", f"curves config → {config}")
    listed = any(f.get("figure") == figure["figure"] for f in registry.data["sources"][_ATLAS].get("figures", []))
    if not listed:
        entry = {"system": "-".join(components), "figure": figure["figure"], "diagram": "<from the caption>",
                 "printedPage": figure["printedPage"], "pdfPage": page}
        _say("new", f"sources.json → sources.{_ATLAS}.figures needs (before pd-promote, PD008): "
                    f"{json.dumps(entry, ensure_ascii=False)}")
    compounds = json.loads((dataset / "compounds.json").read_text(encoding="utf-8")).get("compounds", [])
    for line in new_system_checklist(components, compounds):
        _say("new", line)
    pairs = [f"{a} {b}" for i, a in enumerate(components) for b in components[i + 1:]]
    _say("new", "next: " + "; ".join(f'make pd-nbs-suggest COMPONENTS="{p}"' for p in pairs)
         + f"; make pd-curves SYSTEM={args.system}; make pd-nodes SYSTEM={args.system}")
    return 0


def _cmd_trace_curves(args, dataset: Path, registry: SourceRegistry, work: Path) -> int:
    config = load_config(dataset / "configs" / f"{args.system}.curves.config.json")
    if not isinstance(config, CurvesConfig):
        raise ValueError(f"{args.system}: expected a curves config")
    system_path = _system_path(dataset, work, config.system_file)
    if not system_path.is_relative_to(dataset):
        _say("trace-curves", f"system not in the dataset yet: starting file {_host(system_path)}")
    text = system_path.read_text(encoding="utf-8")
    image = _page_image(registry, work, _ATLAS, config.pdf_page)
    mask = ink_mask(image)
    scale = _line_scale("trace-curves", mask, config.line_width_px)
    invariants: dict[str, dict] = {}
    for path in sorted((dataset / "systems").glob("*.json")):
        for point in json.loads(path.read_text(encoding="utf-8")).get("invariantPoints", []):
            invariants.setdefault(point["id"], point)
    text, edit_log = edit_ternary_structure(text, config)
    for line in edit_log:
        _say("trace-curves", line)
    invariants.update({point["id"]: point for point in json.loads(text).get("invariantPoints", [])})
    fill = fill_ternary_curves(text, config, mask, invariants, scale)
    for line in fill.log:
        _say("trace-curves", line)
    calibration = TernaryCalibration.from_system(json.loads(fill.text), config.pixel_origin)
    page = calibration.stored_to_page
    corners = [page(*calibration.corners[c]) for c in calibration.components]
    box = (min(p[0] for p in corners), min(p[1] for p in corners), max(p[0] for p in corners), max(p[1] for p in corners))
    fields = [
        {"name": f["name"], "legend": f["legend"], "ring": [page(*p) for p in f["ring"]],
         "seed": page(*f["seed"]) if f["seed"] else None}
        for f in config.fields
    ]
    rendered, field_log = render_ternary_overlay(image, box, fill.curves, fields, corners, scale=scale)
    for line in field_log:
        _say("trace-curves", line)
    overlay = work / "overlays" / f"{args.system}.png"
    overlay.parent.mkdir(parents=True, exist_ok=True)
    _save_png(rendered, overlay)
    _say("trace-curves", f"overlay → {overlay}; {len(config.fields) - len(field_log)} of {len(config.fields)} fields filled")
    review = work / "review" / f"{args.system}.md"
    review.parent.mkdir(parents=True, exist_ok=True)
    review.write_text(review_report(args.system, fill.review, edit_log + fill.log), encoding="utf-8")
    _say("trace-curves", f"{fill.filled} polylines filled; review: {len(fill.review)} items → {review}")
    _write_candidate("trace-curves", dataset, work, config.system_file, fill.text, review)
    return 0


_NODE_TILE_PX = 650
_NODE_TILE_OVERLAP_PX = 60
_NODE_TILE_SCALE = 1.25
_NODE_OVERVIEW_SCALE = 2.0
_NODE_OVERVIEW_FONT_PX = 30


def _cmd_nodes(args, dataset: Path, registry: SourceRegistry, work: Path) -> int:
    curves = dataset / "configs" / f"{args.system}.curves.config.json"
    config = load_config(curves) if curves.exists() else None
    system_path = _system_path(dataset, work, config.system_file if config else f"systems/{args.system}.json")
    system = json.loads(system_path.read_text(encoding="utf-8"))
    if args.origin:
        origin = (args.origin[0], args.origin[1])
    else:
        origin = config.pixel_origin if config else (0.0, 0.0)
    image = _page_image(registry, work, _ATLAS, int(system["source"]["pdfPage"]))
    mask = ink_mask(image)
    scale = _line_scale("nodes", mask, config.line_width_px if config else None)
    nodes = build_node_map(system, mask, origin, scale)
    folder = work / "nodes"
    folder.mkdir(parents=True, exist_ok=True)
    for old in folder.glob(f"{args.system}-r*c*.png"):
        old.unlink()
    (folder / f"{args.system}.json").write_text(
        json.dumps([n.to_dict() for n in nodes], ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    components = "/".join(system["components"])
    rows = [f"# Node map — {args.system}\n", f"Pixels in stored coordinates (pixelOrigin {origin[0]:g}, {origin[1]:g}); wt% {components}.\n",
            "| Label | Kind | Pixel | wt% | Invariant |", "| --- | --- | --- | --- | --- |"]
    for n in nodes:
        rows.append(f"| {n.label} | {n.kind} | {n.pixel[0]:.0f}, {n.pixel[1]:.0f} | "
                    f"{' / '.join(f'{v:.1f}' for v in n.wt)} | {n.invariant or ''} |")
    (folder / f"{args.system}.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
    candidate = _candidate(work, config.system_file) if config else None
    source = candidate if candidate is not None and candidate.exists() else system_path
    reported = json.loads(source.read_text(encoding="utf-8")) if source == candidate else system
    arrows = boundary_arrow_segments(reported, origin)
    corners = [(x + origin[0], y + origin[1]) for x, y in system["digitization"]["calibration"].values()]
    x0, y0 = (int(min(c[i] for c in corners)) - 30 for i in (0, 1))
    x1, y1 = (int(max(c[i] for c in corners)) + 30 for i in (0, 1))
    columns = max(1, -(-(x1 - x0) // _NODE_TILE_PX))
    rows_count = max(1, -(-(y1 - y0) // _NODE_TILE_PX))
    width, height = (x1 - x0) / columns, (y1 - y0) / rows_count
    for r in range(rows_count):
        for c in range(columns):
            box = (max(0, int(x0 + c * width - _NODE_TILE_OVERLAP_PX)), max(0, int(y0 + r * height - _NODE_TILE_OVERLAP_PX)),
                   min(image.shape[1], int(x0 + (c + 1) * width + _NODE_TILE_OVERLAP_PX)),
                   min(image.shape[0], int(y0 + (r + 1) * height + _NODE_TILE_OVERLAP_PX)))
            out = folder / f"{args.system}-r{r + 1}c{c + 1}.png"
            render_node_map(image, nodes, box, _NODE_TILE_SCALE, origin, arrows=arrows).save(out)
    whole = (max(0, x0), max(0, y0), min(image.shape[1], x1), min(image.shape[0], y1))
    overview = folder / f"{args.system}-overview.png"
    render_node_map(image, nodes, whole, _NODE_OVERVIEW_SCALE, origin, legend=True, font_px=_NODE_OVERVIEW_FONT_PX,
                    arrows=arrows).save(overview)
    compounds = json.loads((dataset / "compounds.json").read_text(encoding="utf-8")).get("compounds", [])
    user_nodes = {k: v for k, v in config.nodes.items() if k.endswith("•")} if config else None
    shared = [p for path in sorted((dataset / "systems").glob("*.json"))
              for p in json.loads(path.read_text(encoding="utf-8")).get("invariantPoints", [])]
    topology = folder / f"{args.system}-topology.md"
    topology.write_text(build_topology_report(args.system, reported, nodes, user_nodes, compounds, origin, scale,
                                              config.fields if config else None, shared, _host(source)),
                        encoding="utf-8")
    counts = {kind: sum(1 for n in nodes if n.kind == kind) for kind in ("corner", "invariant", "junction", "edge", "dash-end", "ring")}
    _say("nodes", f"{len(nodes)} nodes ({', '.join(f'{v} {k}' for k, v in counts.items())})")
    _say("nodes", f"node list       → {_host(folder / f'{args.system}.md')}")
    _say("nodes", f"node map        → {_host(overview)} (+ {rows_count * columns} tiles {args.system}-r*c*.png; "
                  f"{len(arrows)} stored arrows)")
    _say("nodes", f"topology report → {_host(topology)} (from {_host(source)})")
    return 0


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


def _cmd_nbs_index(args, registry: SourceRegistry, work: Path) -> int:
    folder = work / "nbs"
    folder.mkdir(parents=True, exist_ok=True)
    dump = folder / f"{_NBS}.txt"
    subprocess.run(["pdftotext", "-layout", str(registry.pdf_path(_NBS)), str(dump)], check=True)
    entries, unparsed = build_nbs_index(dump.read_text(encoding="utf-8", errors="replace"), registry.page_offset(_NBS))
    (folder / f"{_NBS}.entries.json").write_text(
        json.dumps([e.to_dict() for e in entries], ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    (folder / f"{_NBS}.unparsed.txt").write_text("\n".join(unparsed) + "\n", encoding="utf-8")
    _say("nbs-index", f"{len(entries)} entries, {len(unparsed)} unparsed lines → {folder}")
    return 0


def _cmd_nbs_suggest(args, work: Path) -> int:
    nbs = _load_nbs(work)
    if nbs is None:
        raise FileNotFoundError("NBS index not found; run nbs-index first")
    rows = nbs.suggest(args.components)
    for entry, wt in rows:
        mol = "-".join(f"{v:g}" for v in entry.composition_mol) if entry.composition_mol else "?"
        wt_text = ", ".join(f"{k} {v}" for k, v in wt.items()) if wt else "?"
        temperature = f"{entry.temperature_C:g}" if entry.temperature_C is not None else "?"
        flag = " APP" if entry.approximate else ""
        print(f"{entry.entry:5d}  {entry.system:24} mol {mol:14} wt {wt_text:28} {temperature:>7} °C{flag}  "
              f"p{entry.pdf_page} (printed {entry.printed_page})  ref {', '.join(entry.references)}")
    _say("nbs-suggest", f"{len(rows)} entries for {'-'.join(args.components)}")
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


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    dataset = Path(args.dataset)
    work = Path(args.work_dir)
    try:
        if args.command == "validate":
            return _cmd_validate(args, dataset, work)
        if args.command == "nbs-suggest":
            return _cmd_nbs_suggest(args, work)
        if args.command == "compare":
            return _cmd_compare(args, dataset, work)
        if args.command == "promote":
            return _cmd_promote(args, dataset, work)
        registry = SourceRegistry(dataset)
        handlers = {
            "index-figures": lambda: _cmd_index_figures(args, registry, work),
            "tile": lambda: _cmd_tile(args, registry, work),
            "calibrate": lambda: _cmd_calibrate(args, dataset, registry, work),
            "extract": lambda: _cmd_extract(args, dataset, registry, work),
            "new": lambda: _cmd_new(args, dataset, registry, work),
            "trace-curves": lambda: _cmd_trace_curves(args, dataset, registry, work),
            "nodes": lambda: _cmd_nodes(args, dataset, registry, work),
            "nbs-index": lambda: _cmd_nbs_index(args, registry, work),
        }
        return handlers[args.command]()
    except (ValueError, KeyError, FileNotFoundError) as exc:
        print(f"[{args.command}] error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
