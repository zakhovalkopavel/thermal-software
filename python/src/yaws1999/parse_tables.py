"""
yaws1999.parse_tables — OCR handbook pages and parse tables / freeform pages.

Flow:
1. Catalog ``Table X-Y`` page spans when parsing tables (fast ``djvutxt`` scan).
2. Per page: render + OCR via ``page-ocr`` (or resume page dumps).
3. Write dataset JSON for tables and ``pages/page-NNNN.json`` for freeform
   pages (chapter intros, appendices, or any ``PAGE=`` outside a table).

Page dumps: ``report_dir/pages/page-NNNN.txt``.
"""
from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

from yaws1999.cas_index import looks_like_cas_index, parse_cas_index_lines
from yaws1999.constants import PAGE_OFFSET, PROCESSED_DIR, REF_KEY, REPORT_DIR, SOURCE_DJVU
from yaws1999.dataset import to_dataset_table, to_debug_table
from yaws1999.row_parser import collect_equations, parse_page_lines
from yaws1999.table_catalog import TableSpan, build_table_catalog
from yaws1999.writers import (
    resolve_dataset_path,
    write_dataset_table,
    write_debug_table,
    write_index,
    write_json,
)

logger = logging.getLogger(__name__)

Progress = Optional[Callable[[str], None]]


@dataclass
class ParseResult:
    """Tables / freeform pages written and a short summary."""

    tables: list[dict[str, Any]] = field(default_factory=list)
    pages: list[dict[str, Any]] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)
    index_path: Optional[Path] = None
    elapsed_s: float = 0.0


def parse_yaws1999(
    djvu: Path | str = SOURCE_DJVU,
    out_dir: Path | str = PROCESSED_DIR,
    report_dir: Path | str | None = REPORT_DIR,
    tables: list[str] | None = None,
    pages: list[int] | None = None,
    first_page: int | None = None,
    last_page: int | None = None,
    force: bool = False,
    quant: str = "q8",
    dpi: int = 400,
    no_replace: bool = False,
    ocr: bool = True,
    progress: Progress = None,
) -> ParseResult:
    """Parse handbook tables and/or freeform DjVu pages into JSON.

    With ``ocr=False``, only rebuild from existing page dumps (no OCR).

    ``PAGE=`` / ``pages``:
    - Without ``TABLE=``: OCR/parse those DjVu pages as freeform (intros,
      appendices, or any page — no ``Table X-Y`` required).
    - With ``TABLE=``: OCR only those pages inside the table span; other span
      pages resume dumps. Pages outside the span are still freeform-parsed.
    """
    if dpi < 72 or dpi > 600:
        raise ValueError(f"dpi must be in 72..600, got {dpi}")
    only_pages = _normalize_pages(pages)
    t_run = time.perf_counter()
    source = Path(djvu)
    output = Path(out_dir)
    reports = Path(report_dir) if report_dir is not None else None
    debug_dir = reports / "debug" if reports is not None else None
    pages_out = output / "pages"
    if reports is not None:
        (reports / "pages").mkdir(parents=True, exist_ok=True)
        (reports / "renders").mkdir(parents=True, exist_ok=True)
        (reports / "debug").mkdir(parents=True, exist_ok=True)

    def say(message: str) -> None:
        if progress:
            progress(message)
        else:
            logger.info(message)

    t_cat = time.perf_counter()
    catalog: list[TableSpan] = []
    freeform_pages: set[int] = set()

    if tables:
        catalog = build_table_catalog(source, first_page=first_page or 1, last_page=last_page)
        wanted = {t.strip() for t in tables}
        catalog = [span for span in catalog if span.id in wanted]
        missing = wanted - {span.id for span in catalog}
        if missing:
            raise ValueError(f"unknown table id(s): {', '.join(sorted(missing))}")
        if only_pages is not None:
            covered = {
                p
                for span in catalog
                for p in only_pages
                if span.first_page <= p <= span.last_page
            }
            freeform_pages = only_pages - covered
            catalog = [
                span
                for span in catalog
                if any(span.first_page <= p <= span.last_page for p in only_pages)
            ]
    elif only_pages is not None:
        # PAGE= alone: freeform OCR of those pages (intro / appendix / any page).
        freeform_pages = set(only_pages)
    else:
        catalog = build_table_catalog(source, first_page=first_page or 1, last_page=last_page)

    if not catalog and not freeform_pages:
        raise ValueError("nothing to parse: provide TABLE= and/or PAGE=")

    ocr_cfg = None
    if ocr:
        from yaws1999.ocr import load_ocr_config

        ocr_cfg = load_ocr_config(quant_override=quant)
        page_note = (
            f" pages={','.join(str(p) for p in sorted(only_pages))}"
            if only_pages is not None
            else ""
        )
        say(
            f"catalog: {len(catalog)} table(s), {len(freeform_pages)} freeform page(s) "
            f"in {source.name} [dpi={dpi}{page_note} {ocr_cfg.summary()}] "
            f"({time.perf_counter() - t_cat:.0f}s)"
        )
    else:
        say(
            f"catalog: {len(catalog)} table(s), {len(freeform_pages)} freeform page(s) "
            f"in {source.name} [rebuild-from-dumps] ({time.perf_counter() - t_cat:.0f}s)"
        )

    predictor = None
    if ocr and ocr_cfg is not None:
        if ocr_cfg.backend == "local":
            from yaws1999.ocr import apply_cpu_defaults, prepare_local_predictor

            cpu = apply_cpu_defaults()
            say(
                f"CPU tune: logical={cpu.get('logical_cpus')} physical={cpu.get('physical_cpus')} "
                f"parallel={cpu.get('SURYA_INFERENCE_PARALLEL') or cpu.get('parallel')} "
                f"llama_extra={cpu.get('LLAMA_CPP_EXTRA_ARGS')!r}"
            )
            say(f"starting local OCR ({ocr_cfg.summary()})…")
            t_boot = time.perf_counter()
            predictor = prepare_local_predictor(ocr_cfg)
            say(f"OCR ready in {time.perf_counter() - t_boot:.0f}s")
        else:
            say(
                f"Modal OCR: app={ocr_cfg.modal_app} class={ocr_cfg.modal_class} "
                f"gpu={ocr_cfg.modal_gpu} (one image per call)"
            )

    result = ParseResult()
    n_tables = len(catalog)
    for i, span in enumerate(catalog, start=1):
        # Title for the filename comes from the catalog; refined after parse.
        provisional_title = span.title
        variant = _variant_tag(quant, dpi)
        out_path = resolve_dataset_path(
            output, provisional_title, span.id, tag=variant, no_replace=no_replace,
        )
        if out_path is None:
            result.skipped.append(span.id)
            say(
                f"table {span.id} ({i}/{n_tables}): skip — dataset already exists (--no-replace)"
            )
            continue

        t_table = time.perf_counter()
        intermediate = _parse_table(
            source,
            span,
            reports,
            force=force,
            predictor=predictor,
            quant=quant,
            dpi=dpi,
            ocr=ocr,
            ocr_config=ocr_cfg,
            only_pages=only_pages,
            dump_tag=variant if no_replace else None,
            say=say,
        )
        dataset = to_dataset_table(intermediate)
        debug = to_debug_table(intermediate)

        # Re-resolve path if OCR refined the title (slug may change).
        if dataset.get("title") and dataset["title"] != provisional_title:
            refined = resolve_dataset_path(
                output, dataset["title"], span.id, tag=variant, no_replace=no_replace,
            )
            if refined is not None:
                out_path = refined

        path = write_dataset_table(output, dataset, path=out_path)
        dataset["_file"] = path.name
        if debug_dir is not None:
            dbg_path = write_debug_table(debug_dir, debug)
            say(f"table {span.id} debug → {dbg_path.name}")

        result.tables.append(dataset)
        table_s = time.perf_counter() - t_table
        say(
            f"table {span.id} ({i}/{n_tables}): {len(dataset['rows'])} rows in "
            f"{table_s:.0f}s → {path.name}"
        )

    for page in sorted(freeform_pages):
        variant = _variant_tag(quant, dpi)
        page_path = _freeform_page_path(
            pages_out, page, tag=variant, no_replace=no_replace,
        )
        if page_path is None:
            result.skipped.append(f"page-{page}")
            say(f"page {page}: skip — already exists (--no-replace)")
            continue
        t_page = time.perf_counter()
        # Keep OCR dumps side-by-side when comparing variants (quant/dpi).
        dump_tag = variant if no_replace else None
        document = _parse_freeform_page(
            source,
            page,
            reports,
            force=force,
            predictor=predictor,
            quant=quant,
            dpi=dpi,
            ocr=ocr,
            ocr_config=ocr_cfg,
            dump_tag=dump_tag,
            say=say,
        )
        path = write_json(page_path, document)
        document["_file"] = str(path.relative_to(output)).replace("\\", "/")
        if debug_dir is not None:
            dbg = write_json(debug_dir / "pages" / path.name, document)
            say(f"page {page} debug → {dbg.relative_to(debug_dir)}")
        result.pages.append(document)
        say(
            f"page {page}: {len(document.get('lines') or [])} lines "
            f"in {time.perf_counter() - t_page:.0f}s → {document['_file']}"
        )

    result.index_path = write_index(
        output,
        result.tables,
        str(source).replace("\\", "/"),
        merge_existing=no_replace or bool(tables) or bool(only_pages),
    )
    if result.pages:
        _merge_pages_into_index(result.index_path, result.pages)
    result.elapsed_s = time.perf_counter() - t_run
    say(f"index → {result.index_path} (total {result.elapsed_s:.0f}s)")
    return result


def rebuild_yaws1999(
    djvu: Path | str = SOURCE_DJVU,
    out_dir: Path | str = PROCESSED_DIR,
    report_dir: Path | str | None = REPORT_DIR,
    tables: list[str] | None = None,
    pages: list[int] | None = None,
    first_page: int | None = None,
    last_page: int | None = None,
    progress: Progress = None,
) -> ParseResult:
    """Rebuild dataset/debug JSON from existing page dumps (no OCR)."""
    return parse_yaws1999(
        djvu=djvu,
        out_dir=out_dir,
        report_dir=report_dir,
        tables=tables,
        pages=pages,
        first_page=first_page,
        last_page=last_page,
        force=False,
        ocr=False,
        progress=progress,
    )


def _normalize_pages(pages: list[int] | None) -> set[int] | None:
    if not pages:
        return None
    out: set[int] = set()
    for page in pages:
        n = int(page)
        if n < 1:
            raise ValueError(f"page must be >= 1, got {n}")
        out.add(n)
    return out


def _variant_tag(quant: str, dpi: int) -> str:
    """Filename tag for --no-replace variants (quant + dpi)."""
    return f"{quant}.dpi{int(dpi)}"


def _freeform_page_path(
    directory: Path,
    page: int,
    *,
    tag: str | None,
    no_replace: bool,
) -> Path | None:
    """Path for a freeform page JSON under ``…/pages/``."""
    directory.mkdir(parents=True, exist_ok=True)
    primary = directory / f"page-{page:04d}.json"
    if not no_replace:
        return primary
    if not primary.is_file():
        return primary
    if not tag:
        return None
    alt = directory / f"page-{page:04d}.{tag}.json"
    if alt.is_file():
        return None
    return alt


def _merge_pages_into_index(index_path: Path, pages: list[dict[str, Any]]) -> None:
    """Attach / merge freeform page entries onto ``index.json``."""
    try:
        index = json.loads(index_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        index = {}
    entries = [
        {
            "djvuPage": p.get("djvuPage"),
            "printedPage": p.get("printedPage"),
            "file": p.get("_file"),
            "equation": p.get("equation"),
            "lineCount": len(p.get("lines") or []),
        }
        for p in pages
    ]
    prior = list(index.get("pages") or [])
    written = {e.get("file") for e in entries if e.get("file")}
    for old in prior:
        name = old.get("file")
        if name and name not in written:
            entries.append(old)
    entries.sort(key=lambda e: (int(e.get("djvuPage") or 0), str(e.get("file") or "")))
    index["pages"] = entries
    write_json(index_path, index)


def _ocr_or_resume_lines(
    source: Path,
    page: int,
    reports: Path | None,
    *,
    force: bool,
    predictor: object | None,
    dpi: int,
    ocr: bool,
    ocr_config: object | None,
    label: str,
    say: Callable[[str], None],
    dump_tag: str | None = None,
) -> list[str]:
    """Load dump or OCR one page; always writes/updates the dump when OCR runs."""
    page_dump = _page_dump_path(reports, page, tag=dump_tag)
    t_page = time.perf_counter()
    if not force and page_dump is not None and page_dump.is_file():
        lines = [ln.rstrip("\n") for ln in page_dump.read_text(encoding="utf-8").splitlines()]
        say(f"{label} resume dump ({len(lines)} lines)")
        return lines
    if not ocr:
        raise FileNotFoundError(
            f"missing page dump for DjVu page {page} "
            f"(expected {page_dump or 'reports/yaws1999/pages/page-XXXX.txt'})"
        )
    backend = getattr(ocr_config, "backend", "local") if ocr_config else "local"
    say(f"{label} full-page OCR ({backend})…")
    from yaws1999.ocr import ocr_source_page
    from yaws1999.progress import heartbeat

    render_cache = reports / "renders" if reports is not None else None
    raw_dump = (
        page_dump.with_name(page_dump.name[: -len(".txt")] + ".ocr.json")
        if page_dump is not None
        else None
    )
    with heartbeat(say, label, interval_s=30.0):
        lines = ocr_source_page(
            source,
            page,
            cache_dir=render_cache,
            dpi=dpi,
            predictor=predictor,
            config=ocr_config,  # type: ignore[arg-type]
            raw_dump_path=raw_dump,
        )
    if page_dump is not None:
        page_dump.parent.mkdir(parents=True, exist_ok=True)
        page_dump.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
    say(f"{label} done in {time.perf_counter() - t_page:.0f}s — {len(lines)} lines")
    return lines


def _parse_freeform_page(
    source: Path,
    page: int,
    reports: Path | None,
    *,
    force: bool,
    predictor: object | None,
    quant: str,
    dpi: int,
    ocr: bool,
    ocr_config: object | None,
    say: Callable[[str], None],
    dump_tag: str | None = None,
) -> dict[str, Any]:
    """OCR/parse one non-table page (chapter intro, appendix, …)."""
    label = f"page {page}"
    lines = _ocr_or_resume_lines(
        source,
        page,
        reports,
        force=force,
        predictor=predictor,
        dpi=dpi,
        ocr=ocr,
        ocr_config=ocr_config,
        label=label,
        dump_tag=dump_tag,
        say=say,
    )
    if looks_like_cas_index(lines):
        cas = parse_cas_index_lines(lines, page)
        say(
            f"{label} CAS index: {len(cas.entries)} entries "
            f"({cas.dual_lines} dual-col lines, {len(cas.unparsed)} unparsed)"
        )
        return {
            "kind": "casIndex",
            "layout": "twoColumnCas",
            "djvuPage": page,
            "printedPage": page - PAGE_OFFSET,
            "refKey": REF_KEY,
            "engine": getattr(ocr_config, "engine", None) if ocr_config else None,
            "backend": getattr(ocr_config, "backend", None) if ocr_config else None,
            "model": getattr(ocr_config, "model", None) if ocr_config else None,
            "quant": quant,
            "dpi": dpi,
            "title": None,
            "equation": None,
            "equations": [],
            "header": None,
            "lines": lines,
            "rows": [e.to_dict() for e in cas.entries],
            "unparsed": cas.unparsed,
        }

    parsed = parse_page_lines(lines, page)
    equations = collect_equations(lines)
    if parsed.equation and parsed.equation not in equations:
        equations.insert(0, parsed.equation)
    return {
        "kind": "page",
        "djvuPage": page,
        "printedPage": page - PAGE_OFFSET,
        "refKey": REF_KEY,
        "engine": getattr(ocr_config, "engine", None) if ocr_config else None,
        "backend": getattr(ocr_config, "backend", None) if ocr_config else None,
        "model": getattr(ocr_config, "model", None) if ocr_config else None,
        "quant": quant,
        "dpi": dpi,
        "title": parsed.title,
        "equation": equations[0] if equations else None,
        "equations": equations,
        "header": parsed.header,
        "lines": lines,
        "rows": [row.to_dict() for row in parsed.rows],
        "unparsed": parsed.unparsed,
    }


def _parse_table(
    source: Path,
    span: TableSpan,
    reports: Path | None,
    force: bool,
    predictor: object | None,
    quant: str,
    dpi: int,
    ocr: bool,
    ocr_config: object | None,
    say: Callable[[str], None],
    only_pages: set[int] | None = None,
    dump_tag: str | None = None,
) -> dict[str, Any]:
    rows_by_no: dict[int, dict[str, Any]] = {}
    unparsed: list[str] = []
    equation: str | None = None
    header: str | None = None
    title = span.title
    page_total = span.last_page - span.first_page + 1

    for i, page in enumerate(range(span.first_page, span.last_page + 1), start=1):
        selected = only_pages is None or page in only_pages
        label = f"table {span.id} page {page}/{span.last_page} ({i}/{page_total})"
        if not selected:
            # Outside PAGE= selection: resume primary dump only (never OCR).
            page_dump = _page_dump_path(reports, page, tag=None)
            if page_dump is None or not page_dump.is_file():
                say(f"{label} skip — not in --page and no dump")
                continue
            lines = _ocr_or_resume_lines(
                source,
                page,
                reports,
                force=False,
                predictor=predictor,
                dpi=dpi,
                ocr=False,
                ocr_config=ocr_config,
                label=label,
                dump_tag=None,
                say=say,
            )
        else:
            lines = _ocr_or_resume_lines(
                source,
                page,
                reports,
                force=force,
                predictor=predictor,
                dpi=dpi,
                ocr=ocr,
                ocr_config=ocr_config,
                label=label,
                dump_tag=dump_tag,
                say=say,
            )

        parsed = parse_page_lines(lines, page)
        if parsed.title:
            title = parsed.title
        if parsed.equation and equation is None:
            equation = parsed.equation
        if parsed.header:
            header = parsed.header
        for row in parsed.rows:
            rows_by_no[row.no] = row.to_dict()
        unparsed.extend(parsed.unparsed)

    ordered = [rows_by_no[n] for n in sorted(rows_by_no)]
    return {
        "id": span.id,
        "title": title,
        "refKey": REF_KEY,
        "engine": getattr(ocr_config, "engine", None) if ocr_config else None,
        "backend": getattr(ocr_config, "backend", None) if ocr_config else None,
        "model": getattr(ocr_config, "model", None) if ocr_config else None,
        "quant": quant,
        "dpi": dpi,
        "equation": equation,
        "header": header,
        "djvuPages": {"first": span.first_page, "last": span.last_page},
        "printedPages": {
            "first": span.first_page - PAGE_OFFSET,
            "last": span.last_page - PAGE_OFFSET,
        },
        "rows": ordered,
        "unparsed": unparsed,
    }


def _page_dump_path(
    reports: Path | None,
    page: int,
    tag: str | None = None,
) -> Path | None:
    if reports is None:
        return None
    if tag:
        return reports / "pages" / f"page-{page:04d}.{tag}.txt"
    return reports / "pages" / f"page-{page:04d}.txt"


def load_table(path: Path | str) -> dict[str, Any]:
    """Read one table JSON file."""
    return json.loads(Path(path).read_text(encoding="utf-8"))
