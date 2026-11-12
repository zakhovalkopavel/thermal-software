"""Ternary new / trace-curves / nodes commands."""
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
    _update_compounds(dataset, Path(args.compound_data), components, index, args.pubchem)
    compounds = json.loads((dataset / "compounds.json").read_text(encoding="utf-8")).get("compounds", [])
    for line in new_system_checklist(components, compounds):
        _say("new", line)
    pairs = [f"{a} {b}" for i, a in enumerate(components) for b in components[i + 1:]]
    _say("new", "next: " + "; ".join(f'make pd-nbs-suggest COMPONENTS="{p}"' for p in pairs)
         + f"; make pd-curves SYSTEM={args.system}; make pd-nodes SYSTEM={args.system}")
    return 0


_KEEP_REPLIES = {"a": "atlas", "c": "compound-data", "x": "conflict"}


def _update_compounds(dataset: Path, compound_data: Path, components: list[str], index: list[dict],
                      pubchem: bool = False) -> None:
    """Single-oxide phases of ``components`` in compounds.json, checked against compound-data; asks before each write.

    With ``pubchem``, a component compound-data lacks is searched in PubChem by formula (the answer is kept in
    the compound-data PubChem files, see PUBCHEM_SPEC.md) and noted on the new entry.
    """
    path = dataset / "compounds.json"
    interactive = sys.stdin.isatty()
    searcher = None
    if pubchem:
        from pubchem.pubchem_searcher import PubchemSearcher
        searcher = PubchemSearcher()
    for component in components:
        if formula_molar_mass(component) is None:
            _say("new", f"{component}: no fixed formula, no compound-data lookup; its phases go into compounds.json by hand")
            continue
        text = path.read_text(encoding="utf-8")
        compounds = json.loads(text).get("compounds", [])
        candidates = melting_candidates(component, compound_data)
        existing = [c for c in compounds if c.get("oxideMoles") == {component: 1} and not c.get("modificationOf")]
        if existing:
            for compound in existing:
                updated = _checked_compound(compound, candidates, interactive)
                if updated is not None:
                    path.write_text(replace_compound(path.read_text(encoding="utf-8"), updated), encoding="utf-8")
                    _say("new", f"compounds.json: {updated['id']} updated")
            continue
        note = _pubchem_note(searcher, component) if searcher is not None and not candidates else None
        compound = _proposed_compound(component, candidates, index, interactive, note)
        if compound is None:
            continue
        print("    " + format_compound(compound))
        if not interactive:
            _say("new", f"{component}: not added (no terminal); run make pd-new in a terminal to add it")
            continue
        taken = {c["id"] for c in compounds}
        reply = _ask(f"Add to compounds.json? [y = as {compound['id']}, n = no, or another id]",
                     lambda r: compound["id"] if r.lower() == "y" else "" if r.lower() == "n"
                     else r if re.fullmatch(r"[a-z][a-z0-9-]*", r) and r not in taken else None)
        if not reply:
            _say("new", f"{component}: not added")
            continue
        compound["id"] = reply
        path.write_text(add_compound(path.read_text(encoding="utf-8"), compound), encoding="utf-8")
        temperature = compound["melting"]["temperature_C"]
        _say("new", f"compounds.json: {reply} ({component}, " + (f"{temperature:g} °C" if temperature is not None
                                                                  else "melting point missing") + ") added")


def _checked_compound(compound: dict, candidates: list, interactive: bool) -> dict | None:
    """The entry with the compound-data value merged in when the user chooses to; None to leave it."""
    if not candidates:
        return None
    candidate = candidates[0]
    temperature = compound["melting"].get("temperature_C")
    if temperature is not None and not atlas_disagrees(compound, candidate):
        _say("new", f"{compound['id']}: {temperature:g} °C agrees with compound-data {candidate.label()}")
        return None
    if temperature is None:
        _say("new", f"{compound['id']}: no melting point; compound-data has {candidate.label()}")
        if _ask("Take it into compounds.json? [y/n]", lambda r: r.lower() if r.lower() in ("y", "n") else None) != "y":
            return None
        return merge_compound_data(compound, candidate)
    _say("new", f"{compound['id']}: compounds.json has {temperature:g} °C, compound-data {candidate.label()} "
                f"(differ by more than {STATUS_TOLERANCE['temperature_C']:g} °C)")
    if not interactive:
        _say("new", f"{compound['id']}: left unchanged (no terminal)")
        return None
    keep = _ask("Keep [a = compounds.json value, compound-data value noted; c = compound-data value; "
                "x = both sources, status conflict; q = leave unchanged]", lambda r: _KEEP_REPLIES.get(r.lower()))
    return merge_compound_data(compound, candidate, keep) if keep else None


def _pubchem_note(searcher, component: str) -> str | None:
    """Print the PubChem formula search of ``component``; the note for its new entry, None when nothing was found."""
    from pubchem.pubchem_blocked_error import PubchemBlockedError
    from pubchem.pubchem_record_summary import experimental_values, record_summary

    try:
        record = searcher.search(component, "formula")
    except (PubchemBlockedError, OSError) as exc:
        _say("new", f"{component}: PubChem search failed ({exc})")
        return None
    finally:
        if searcher.requested:
            searcher.compact()
    if record is None:
        _say("new", f"{component}: PubChem refused the search")
        return None
    _say("new", f"{component}: PubChem:")
    for line in record_summary(record):
        print(f"  {line}")
    result = record.result
    if result.cid is None:
        return None
    melting = experimental_values(record, "Melting Point")
    return (f"PubChem CID {result.cid}" + (f" (CAS {result.cas})" if result.cas else "")
            + (f", melting point: {'; '.join(melting[:3])}" if melting else ", no melting point") + ".")


def _proposed_compound(component: str, candidates: list, index: list[dict], interactive: bool,
                       pubchem_note: str | None = None) -> dict | None:
    """New entry for ``component``: compound-data value and/or a printed atlas value the user types; None to skip.

    ``pubchem_note`` (the PubChem search of a component compound-data lacks) goes into the entry's notes.
    """
    candidate = candidates[0] if candidates else None
    if candidates:
        _say("new", f"{component}: not in compounds.json; compound-data has:")
        for number, option in enumerate(candidates, start=1):
            print(f"  {number}) {option.label()}")
        if interactive and len(candidates) > 1:
            number = _ask(f"Variant [1-{len(candidates)}, Enter = 1; q = skip {component}]",
                          lambda r: 1 if not r else _number(r, len(candidates)))
            if number is None:
                return None
            candidate = candidates[number - 1]
    else:
        _say("new", f"{component}: not in compounds.json nor in compound-data (NSRDS-NBS 61 Part I has eutectics only)")
    atlas = None
    if interactive:
        figures = {e["figure"]: e for e in index}
        reply = _ask(f'Slag Atlas melting point of {component} if printed: "<°C> <figure>", e.g. "1870 3.169" '
                     f"[Enter = none; q = skip {component}]", lambda r: _atlas_reading(r, figures))
        if reply is None:
            return None
        atlas = reply or None
    compound = new_oxide_compound(default_compound_id(candidate, component), component, atlas)
    if candidate is None:
        notes = ["Not in compound-data; melting point to read from a Slag Atlas figure."] if atlas is None else []
        notes += [pubchem_note] if pubchem_note else []
        if notes:
            compound["notes"] = " ".join(notes)
        return compound
    keep = None
    if atlas is not None and atlas_disagrees(compound, candidate):
        _say("new", f"{component}: the atlas prints {atlas[0]:g} °C, compound-data {candidate.label()}")
        keep = _ask("Keep [a = atlas value, compound-data value noted; c = compound-data value; "
                    f"x = both sources, status conflict; q = skip {component}]", lambda r: _KEEP_REPLIES.get(r.lower()))
        if keep is None:
            return None
    return merge_compound_data(compound, candidate, keep)


def _atlas_reading(reply: str, figures: dict[str, dict]) -> tuple | None:
    """(°C, figure-index entry) of '1870 3.169'; () for an empty reply; None when not an answer."""
    if not reply:
        return ()
    match = re.fullmatch(r"(\d+(?:[.,]\d+)?)\s+(?:Fig\.?\s*)?(\d+\.\d+)", reply.strip())
    if match is None:
        return None
    figure = figures.get(f"Fig. {match.group(2)}")
    if figure is None:
        print(f"  Fig. {match.group(2)} is not in the figure index")
        return None
    temperature = float(match.group(1).replace(",", "."))
    return (int(temperature) if temperature.is_integer() else temperature), figure


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
    approximation = build_field_approximation(json.loads(fill.text), calibration, invariants, scale)
    for line in approximation.log:
        _say("trace-curves", f"approximation: {line}")
    filled = json.loads(fill.text)
    compounds = json.loads((dataset / "compounds.json").read_text(encoding="utf-8")).get("compounds", [])
    compound_points = build_compound_points(
        filled, build_node_map(filled, mask, config.pixel_origin, scale, source_ref=_ATLAS), compounds,
        config.pixel_origin, scale,
    )
    for point in compound_points:
        _say("trace-curves", f"compound point {point.legend()}")
    rendered, field_log = render_ternary_overlay(image, box, fill.curves, fields, corners, scale=scale,
                                                 approximation=approximation, compound_points=compound_points)
    for line in field_log:
        _say("trace-curves", line)
    overlay = work / "overlays" / f"{args.system}.png"
    overlay.parent.mkdir(parents=True, exist_ok=True)
    _save_png(rendered, overlay)
    if config.fields:
        _say("trace-curves", f"overlay → {overlay}; {len(config.fields) - len(field_log)} of {len(config.fields)} fields filled")
    else:
        _say("trace-curves", f"overlay → {overlay}; fields from the boundaries: {len(approximation.phases)} phases")
    review = work / "review" / f"{args.system}.md"
    review.parent.mkdir(parents=True, exist_ok=True)
    review.write_text(review_report(args.system, fill.review, edit_log + fill.log
                                    + [f"approximation: {line}" for line in approximation.log]), encoding="utf-8")
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
    nodes = build_node_map(system, mask, origin, scale, source_ref=_ATLAS)
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
    counts = {kind: sum(1 for n in nodes if n.kind == kind) for kind in ("corner", "invariant", "junction", "edge", "dash-end", "free-end", "ring")}
    _say("nodes", f"{len(nodes)} nodes ({', '.join(f'{v} {k}' for k, v in counts.items())})")
    _say("nodes", f"node list       → {_host(folder / f'{args.system}.md')}")
    _say("nodes", f"node map        → {_host(overview)} (+ {rows_count * columns} tiles {args.system}-r*c*.png; "
                  f"{len(arrows)} stored arrows)")
    _say("nodes", f"topology report → {_host(topology)} (from {_host(source)})")
    return 0


_ISOTHERM_WIDTH_PX = (2.0, 6.0)
_DRAFT_MARGIN_PX = 40


