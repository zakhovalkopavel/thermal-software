"""NSRDS-NBS 61 index and suggest commands."""
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

def _cmd_nbs_index(args, registry: SourceRegistry, work: Path) -> int:
    import time

    from phase_diagrams.nbs.nbs_page_ocr import ocr_page_text_tesseract
    from phase_diagrams.rendering.pdf_renderer import render_page

    folder = work / "nbs"
    folder.mkdir(parents=True, exist_ok=True)
    pages_meta = registry.source(_NBS).get("tablePages") or {}
    first = args.first if args.first is not None else int(pages_meta.get("first", 11))
    last = args.last if args.last is not None else int(pages_meta.get("last", 119))
    if last < first:
        raise ValueError(f"last page {last} < first page {first}")
    dump = folder / f"{_NBS}.txt"
    entries_path = folder / f"{_NBS}.entries.json"
    unparsed_path = folder / f"{_NBS}.unparsed.txt"
    engine = getattr(args, "engine", "vlm")
    force = bool(getattr(args, "force", False))
    pdf = registry.pdf_path(_NBS)
    offset = registry.page_offset(_NBS)
    cache_dir = folder / "renders"
    total = last - first + 1

    predictor = None
    hybrid_detector = None
    hybrid_recognizer = None
    if engine == "hybrid":
        from phase_diagrams.nbs.nbs_hybrid_ocr import (
            _detection_predictor,
            _indra_recognizer,
            ocr_pdf_page as ocr_pdf_page_hybrid,
            select_onnx_providers,
            select_torch_device,
        )

        _say(
            "nbs-index",
            f"starting hybrid (detect on {select_torch_device()}, "
            f"Indra on {','.join(select_onnx_providers())})…",
        )
        t_boot = time.perf_counter()
        hybrid_detector = _detection_predictor()
        hybrid_recognizer = _indra_recognizer()
        _say("nbs-index", f"hybrid ready in {time.perf_counter() - t_boot:.0f}s")
    elif engine == "vlm":
        from phase_diagrams.nbs.nbs_vlm_ocr import _recognition_predictor, ensure_llama_env, ocr_pdf_page

        ensure_llama_env()
        _say("nbs-index", "starting VLM OCR (llama-server)…")
        t_boot = time.perf_counter()
        predictor = _recognition_predictor()
        _say("nbs-index", f"VLM OCR ready in {time.perf_counter() - t_boot:.0f}s")
    elif engine != "tesseract":
        raise ValueError(f"unknown NBS OCR engine {engine!r}")

    _say(
        "nbs-index",
        f"OCR ({engine}) pdf pages {first}–{last} of {pdf.name}"
        + (" [force]" if force else " [resume skips non-empty pages]"),
    )

    for i, page in enumerate(range(first, last + 1), start=1):
        if _nbs_page_already_done(entries_path, page) and not force:
            _say("nbs-index", f"page {page}/{last} ({i}/{total}) skip (already in dump)")
            continue

        _say("nbs-index", f"page {page}/{last} ({i}/{total}) OCR…")
        t0 = time.perf_counter()
        if engine == "hybrid":
            text = ocr_pdf_page_hybrid(
                pdf, page, cache_dir=cache_dir,
                detector=hybrid_detector, recognizer=hybrid_recognizer,
            )
        elif engine == "vlm":
            text = ocr_pdf_page(pdf, page, cache_dir=cache_dir, predictor=predictor)
        else:
            image = render_page(pdf, page, dpi=400, cache_dir=cache_dir, cache_stem="nbs-table")
            text = ocr_page_text_tesseract(image)
        elapsed = time.perf_counter() - t0
        n_entries, n_unparsed = _append_nbs_page(
            dump, entries_path, unparsed_path, page, text, offset,
        )
        lines = len([ln for ln in text.splitlines() if ln.strip()])
        _say(
            "nbs-index",
            f"page {page}/{last} done in {elapsed:.0f}s — {lines} lines on page, "
            f"{n_entries} entries / {n_unparsed} unparsed total → {_host(folder)}",
        )

    n_entries, n_unparsed = _nbs_output_counts(entries_path, unparsed_path)
    _say("nbs-index", f"finished: {n_entries} entries, {n_unparsed} unparsed → {_host(folder)}")
    return 0


_NBS_DUMP_ENTRY_LINE = re.compile(r"^\s*(\d{1,4})\b")


def _normalize_nbs_page_text(page_text: str) -> str:
    """Strip form-feeds; keep a trailing newline for non-empty OCR text."""
    if not page_text or not page_text.strip():
        return ""
    return page_text.replace("\f", "\n").rstrip("\n") + "\n"


def _nbs_page_already_done(entries_path: Path, page: int) -> bool:
    """Resume skip: page is done when ``entries.json`` already has that ``pdfPage``."""
    if not entries_path.is_file() or not entries_path.stat().st_size:
        return False
    try:
        data = json.loads(entries_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return False
    if not isinstance(data, list):
        return False
    return any(int(row.get("pdfPage", -1)) == page for row in data)


def _dump_entry_number(line: str) -> int | None:
    match = _NBS_DUMP_ENTRY_LINE.match(line.replace("\f", " "))
    return int(match.group(1)) if match else None


def _merge_continuous_nbs_dump(dump: Path, page_text: str, drop_entry_nums: set[int]) -> None:
    """Merge OCR lines into a continuous dump (no page separators / form-feeds).

    Keeps existing hand-edited lines whose entry numbers are not in ``drop_entry_nums``,
    then inserts the new page lines, sorted by entry number.
    """
    kept: list[str] = []
    if dump.is_file() and dump.stat().st_size:
        for raw_line in dump.read_text(encoding="utf-8").replace("\f", "\n").splitlines():
            line = raw_line.rstrip()
            if not line.strip():
                continue
            number = _dump_entry_number(line)
            if number is not None and number in drop_entry_nums:
                continue
            kept.append(line)
    new_lines = [
        ln.rstrip()
        for ln in _normalize_nbs_page_text(page_text).splitlines()
        if ln.strip()
    ]
    combined = kept + new_lines

    def sort_key(line: str) -> tuple[int, str]:
        number = _dump_entry_number(line)
        return (number if number is not None else 10**9, line)

    combined.sort(key=sort_key)
    dump.write_text("\n".join(combined) + ("\n" if combined else ""), encoding="utf-8")


def _append_nbs_page(
    dump: Path,
    entries_path: Path,
    unparsed_path: Path,
    page: int,
    page_text: str,
    page_offset: int,
) -> tuple[int, int]:
    """Merge one OCR'd page into continuous dump + entries + unparsed."""
    page_body = _normalize_nbs_page_text(page_text)
    # Form-feeds only in memory so build_nbs_index assigns the correct pdf_page.
    page_dump = "\f".join([""] * (page - 1) + [page_body]) + "\f"
    new_entries, new_unparsed = build_nbs_index(page_dump, page_offset)

    prior = []
    if entries_path.is_file() and entries_path.stat().st_size:
        try:
            prior = json.loads(entries_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            prior = []
    if not isinstance(prior, list):
        prior = []
    prior_page_nums = {int(row.get("entry", -1)) for row in prior if int(row.get("pdfPage", -1)) == page}
    kept = [row for row in prior if int(row.get("pdfPage", -1)) != page]
    new_nums = {int(e.entry) for e in new_entries}
    kept = [row for row in kept if int(row.get("entry", -1)) not in new_nums]
    merged = kept + [e.to_dict() for e in new_entries]
    merged.sort(key=lambda row: (int(row.get("entry", 0)), int(row.get("pdfPage", 0))))
    entries_path.write_text(json.dumps(merged, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    _merge_continuous_nbs_dump(dump, page_body, prior_page_nums | new_nums)

    prior_unparsed: list[str] = []
    if unparsed_path.is_file() and unparsed_path.stat().st_size:
        prior_unparsed = [ln for ln in unparsed_path.read_text(encoding="utf-8").splitlines() if ln.strip()]
    prefix = f"p{page}:"
    kept_u = [ln for ln in prior_unparsed if not ln.startswith(prefix)]
    merged_u = kept_u + list(new_unparsed)
    unparsed_path.write_text("\n".join(merged_u) + ("\n" if merged_u else ""), encoding="utf-8")
    return len(merged), len(merged_u)


def _nbs_output_counts(entries_path: Path, unparsed_path: Path) -> tuple[int, int]:
    n_entries = 0
    if entries_path.is_file() and entries_path.stat().st_size:
        try:
            data = json.loads(entries_path.read_text(encoding="utf-8"))
            n_entries = len(data) if isinstance(data, list) else 0
        except json.JSONDecodeError:
            n_entries = 0
    n_unparsed = 0
    if unparsed_path.is_file() and unparsed_path.stat().st_size:
        n_unparsed = sum(1 for ln in unparsed_path.read_text(encoding="utf-8").splitlines() if ln.strip())
    return n_entries, n_unparsed


def _cmd_nbs_bibliography(args, registry: SourceRegistry, work: Path) -> int:
    """pdftotext + parse Bibliography → nbs/*.bibliography.json (merge by ref id)."""
    from phase_diagrams.nbs.nbs_bibliography import (
        extract_bibliography_text,
        merge_bibliography,
        parse_bibliography,
    )

    folder = work / "nbs"
    folder.mkdir(parents=True, exist_ok=True)
    pages_meta = registry.source(_NBS).get("bibliographyPages") or {}
    first = args.first if args.first is not None else int(pages_meta.get("first", 165))
    last = args.last if args.last is not None else int(pages_meta.get("last", 251))
    if last < first:
        raise ValueError(f"last page {last} < first page {first}")
    force = bool(getattr(args, "force", False))
    pdf = registry.pdf_path(_NBS)
    out_json = folder / f"{_NBS}.bibliography.json"
    out_txt = folder / f"{_NBS}.bibliography.txt"
    missing_path = folder / f"{_NBS}.bibliography.missing.txt"

    _say("nbs-bibliography", f"pdftotext pdf pages {first}–{last} of {pdf.name}")
    t0 = time.perf_counter()
    raw = extract_bibliography_text(pdf, first, last)
    out_txt.write_text(raw, encoding="utf-8")
    parsed, missing = parse_bibliography(raw)

    prior: dict[str, str] = {}
    if out_json.is_file() and out_json.stat().st_size and not force:
        try:
            loaded = json.loads(out_json.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                prior = {str(k): str(v) for k, v in loaded.items()}
        except json.JSONDecodeError:
            prior = {}

    merged = merge_bibliography(prior, parsed, force=force)
    out_json.write_text(json.dumps(merged, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    # Recompute gaps over the merged key set (hand-filled ids count as present).
    if merged:
        lo, hi = min(int(k) for k in merged), max(int(k) for k in merged)
        present = {int(k) for k in merged}
        missing = [n for n in range(lo, hi + 1) if n not in present]
    missing_path.write_text(
        "\n".join(str(n) for n in missing) + ("\n" if missing else ""),
        encoding="utf-8",
    )
    elapsed = time.perf_counter() - t0
    _say(
        "nbs-bibliography",
        f"done in {elapsed:.1f}s — {len(merged)} citations, {len(missing)} missing "
        f"→ {_host(folder)}"
        + (" [force]" if force else ""),
    )
    if missing:
        preview = ", ".join(str(n) for n in missing[:12])
        more = f", … (+{len(missing) - 12})" if len(missing) > 12 else ""
        _say("nbs-bibliography", f"missing ids: {preview}{more}")
    return 0


def _cmd_nbs_refs(args, registry: SourceRegistry, work: Path) -> int:
    """Repair Table I references in the dump (pdftotext + rules), then rebuild entries.json."""
    from phase_diagrams.nbs.nbs_ref_repair import (
        extract_table_refs,
        fill_refs_hybrid_ocr,
        format_dump_line,
        parse_dump_line,
        rebuild_entries_json,
        repair_dump_lines,
    )

    folder = work / "nbs"
    dump = folder / f"{_NBS}.txt"
    entries_path = folder / f"{_NBS}.entries.json"
    unparsed_path = folder / f"{_NBS}.unparsed.txt"
    anomalies_path = folder / f"{_NBS}.anomalies.txt"
    if not dump.is_file():
        raise FileNotFoundError(f"NBS dump not found: {dump}; run nbs-index first")

    pages_meta = registry.source(_NBS).get("tablePages") or {}
    first = args.first if args.first is not None else int(pages_meta.get("first", 11))
    last = args.last if args.last is not None else int(pages_meta.get("last", 119))
    if last < first:
        raise ValueError(f"last page {last} < first page {first}")
    force = bool(getattr(args, "force", False))
    use_ocr = bool(getattr(args, "ocr", False))
    pdf = registry.pdf_path(_NBS)
    page_offset = registry.page_offset(_NBS)

    _say("nbs-refs", f"pdftotext refs pdf pages {first}–{last} of {pdf.name}")
    t0 = time.perf_counter()
    pdf_refs = extract_table_refs(pdf, first, last)
    lines = dump.read_text(encoding="utf-8").splitlines()
    new_lines, anomalies, missing = repair_dump_lines(lines, pdf_refs, force=force)

    if use_ocr and missing:
        entry_pages: dict[int, int] = {}
        if entries_path.is_file() and entries_path.stat().st_size:
            try:
                prior = json.loads(entries_path.read_text(encoding="utf-8"))
                if isinstance(prior, list):
                    for row in prior:
                        entry_pages[int(row["entry"])] = int(row.get("pdfPage", first))
            except (json.JSONDecodeError, KeyError, TypeError, ValueError):
                entry_pages = {}
        _say("nbs-refs", f"hybrid OCR gap-fill for {len(missing)} entries…")
        found = fill_refs_hybrid_ocr(
            missing, entry_pages, pdf, cache_dir=folder / "renders",
        )
        if found:
            filled: list[str] = []
            still_missing: list[int] = []
            for line in new_lines:
                fields = parse_dump_line(line)
                if fields is None:
                    filled.append(line)
                    continue
                if not fields.refs and fields.entry in found:
                    fields.refs = found[fields.entry]
                    anomalies.append(
                        f"{fields.entry}: refs filled by hybrid OCR: {fields.refs}"
                    )
                filled.append(format_dump_line(fields))
                if not fields.refs:
                    still_missing.append(fields.entry)
            new_lines = filled
            missing = still_missing

    dump.write_text("\n".join(new_lines) + ("\n" if new_lines else ""), encoding="utf-8")
    anomalies_path.write_text(
        "\n".join(anomalies) + ("\n" if anomalies else ""),
        encoding="utf-8",
    )
    n_entries, _n_unparsed = rebuild_entries_json(
        "\n".join(new_lines) + "\n",
        page_offset,
        entries_path,
        unparsed_path,
    )
    elapsed = time.perf_counter() - t0
    _say(
        "nbs-refs",
        f"done in {elapsed:.1f}s — {n_entries} entries, {len(missing)} still missing refs, "
        f"{len(anomalies)} anomalies → {_host(folder)}"
        + (" [force]" if force else "")
        + (" [ocr]" if use_ocr else ""),
    )
    if missing:
        preview = ", ".join(str(n) for n in missing[:12])
        more = f", … (+{len(missing) - 12})" if len(missing) > 12 else ""
        _say("nbs-refs", f"missing refs: {preview}{more}")
    return 0


def _cmd_nbs_suggest(args, work: Path, dataset: Path | None = None) -> int:
    nbs = _load_nbs(work, dataset)
    if nbs is None:
        raise FileNotFoundError(
            "NBS index not found; expected dataset/nbs/*.entries.json or work nbs/ (run nbs-index)"
        )
    rows = nbs.suggest(args.components)
    for entry, wt in rows:
        mol = "-".join(f"{v:g}" for v in entry.composition_mol) if entry.composition_mol else "?"
        wt_text = ", ".join(f"{k} {v}" for k, v in wt.items()) if wt else "?"
        temperature = f"{entry.temperature_C:g}" if entry.temperature_C is not None else "?"
        flag = " APP" if entry.approximate else ""
        page = (
            f"p{entry.pdf_page} (printed {entry.printed_page})  "
            if entry.pdf_page else ""
        )
        print(f"{entry.entry:5d}  {entry.system:24} mol {mol:14} wt {wt_text:28} {temperature:>7} °C{flag}  "
              f"{page}ref {', '.join(entry.references)}")
    _say("nbs-suggest", f"{len(rows)} entries for {'-'.join(args.components)}")
    return 0


