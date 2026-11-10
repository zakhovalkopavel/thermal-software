"""
yaws1999.parse_tables — OCR DjVu table pages and parse each handbook table to JSON.

Flow:
1. Catalog ``Table X-Y`` page spans (fast ``djvutxt`` header scan).
2. Per page: ``ddjvu`` render → full-page Surya OCR (or resume page dumps).
3. Write public dataset JSON under ``shared/processed/yaws1999/`` and a debug
   copy under ``reports/yaws1999/debug/``, plus ``index.json``.

Page dumps: ``report_dir/pages/page-NNNN.txt`` (legacy ``pages/surya/`` still resumed).
"""
from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

from yaws1999.constants import PAGE_OFFSET, PROCESSED_DIR, REF_KEY, REPORT_DIR, SOURCE_DJVU
from yaws1999.dataset import to_dataset_table, to_debug_table
from yaws1999.row_parser import parse_page_lines
from yaws1999.table_catalog import TableSpan, build_table_catalog
from yaws1999.writers import (
    resolve_dataset_path,
    write_dataset_table,
    write_debug_table,
    write_index,
)

logger = logging.getLogger(__name__)

Progress = Optional[Callable[[str], None]]
_ENGINE = "surya"


@dataclass
class ParseResult:
    """Tables written and a short summary."""

    tables: list[dict[str, Any]] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)
    index_path: Optional[Path] = None
    elapsed_s: float = 0.0


def parse_yaws1999(
    djvu: Path | str = SOURCE_DJVU,
    out_dir: Path | str = PROCESSED_DIR,
    report_dir: Path | str | None = REPORT_DIR,
    tables: list[str] | None = None,
    first_page: int | None = None,
    last_page: int | None = None,
    force: bool = False,
    quant: str = "bf16",
    dpi: int = 400,
    no_replace: bool = False,
    ocr: bool = True,
    progress: Progress = None,
) -> ParseResult:
    """Parse selected (or all) handbook tables into dataset + debug JSON.

    With ``ocr=False``, only rebuild from existing page dumps (no Surya).
    """
    if dpi < 72 or dpi > 600:
        raise ValueError(f"dpi must be in 72..600, got {dpi}")
    t_run = time.perf_counter()
    source = Path(djvu)
    output = Path(out_dir)
    reports = Path(report_dir) if report_dir is not None else None
    debug_dir = reports / "debug" if reports is not None else None
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
    catalog = build_table_catalog(source, first_page=first_page or 1, last_page=last_page)
    if tables:
        wanted = {t.strip() for t in tables}
        catalog = [span for span in catalog if span.id in wanted]
        missing = wanted - {span.id for span in catalog}
        if missing:
            raise ValueError(f"unknown table id(s): {', '.join(sorted(missing))}")
    mode = "rebuild-from-dumps" if not ocr else f"ocr quant={quant} dpi={dpi}"
    say(
        f"catalog: {len(catalog)} table(s) in {source.name} "
        f"[{mode}] ({time.perf_counter() - t_cat:.0f}s)"
    )

    predictor = None
    if ocr:
        from yaws1999.surya_cpu import apply_yaws_cpu_defaults

        cpu = apply_yaws_cpu_defaults()
        say(
            f"CPU tune: logical={cpu.get('logical_cpus')} physical={cpu.get('physical_cpus')} "
            f"parallel={cpu.get('SURYA_INFERENCE_PARALLEL')} "
            f"llama_extra={cpu.get('LLAMA_CPP_EXTRA_ARGS')!r}"
        )

        from phase_diagrams.nbs.nbs_surya_ocr import (
            _recognition_predictor,
            apply_surya_quant,
            ensure_llama_env,
        )

        gguf = apply_surya_quant(quant)
        say(f"starting Surya (full-page, llama-server, quant={quant}, {gguf})…")
        t_boot = time.perf_counter()
        ensure_llama_env()
        predictor = _recognition_predictor()
        say(f"Surya ready in {time.perf_counter() - t_boot:.0f}s")

    result = ParseResult()
    n_tables = len(catalog)
    for i, span in enumerate(catalog, start=1):
        # Title for the filename comes from the catalog; refined after parse.
        provisional_title = span.title
        out_path = resolve_dataset_path(
            output, provisional_title, span.id, tag=quant, no_replace=no_replace,
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
            say=say,
        )
        dataset = to_dataset_table(intermediate)
        debug = to_debug_table(intermediate)

        # Re-resolve path if OCR refined the title (slug may change).
        if dataset.get("title") and dataset["title"] != provisional_title:
            refined = resolve_dataset_path(
                output, dataset["title"], span.id, tag=quant, no_replace=no_replace,
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

    result.index_path = write_index(
        output,
        result.tables,
        str(source).replace("\\", "/"),
        merge_existing=no_replace or bool(tables),
    )
    result.elapsed_s = time.perf_counter() - t_run
    say(f"index → {result.index_path} (total {result.elapsed_s:.0f}s)")
    return result


def rebuild_yaws1999(
    djvu: Path | str = SOURCE_DJVU,
    out_dir: Path | str = PROCESSED_DIR,
    report_dir: Path | str | None = REPORT_DIR,
    tables: list[str] | None = None,
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
        first_page=first_page,
        last_page=last_page,
        force=False,
        ocr=False,
        progress=progress,
    )


def _parse_table(
    source: Path,
    span: TableSpan,
    reports: Path | None,
    force: bool,
    predictor: object | None,
    quant: str,
    dpi: int,
    ocr: bool,
    say: Callable[[str], None],
) -> dict[str, Any]:
    rows_by_no: dict[int, dict[str, Any]] = {}
    unparsed: list[str] = []
    equation: str | None = None
    header: str | None = None
    title = span.title
    render_cache = reports / "renders" if reports is not None else None
    page_total = span.last_page - span.first_page + 1

    for i, page in enumerate(range(span.first_page, span.last_page + 1), start=1):
        page_dump = _page_dump_path(reports, page)
        legacy_surya = (
            reports / "pages" / "surya" / f"page-{page:04d}.txt"
            if reports is not None
            else None
        )
        t_page = time.perf_counter()
        resume_from = None
        if not force:
            for candidate in (page_dump, legacy_surya):
                if candidate is not None and candidate.is_file():
                    resume_from = candidate
                    break
        if resume_from is not None:
            lines = [ln.rstrip("\n") for ln in resume_from.read_text(encoding="utf-8").splitlines()]
            say(
                f"table {span.id} page {page}/{span.last_page} ({i}/{page_total}) "
                f"resume dump ({len(lines)} lines)"
            )
        elif not ocr:
            raise FileNotFoundError(
                f"missing page dump for DjVu page {page} "
                f"(expected {page_dump or 'reports/yaws1999/pages/page-XXXX.txt'})"
            )
        else:
            label = f"table {span.id} page {page}/{span.last_page} ({i}/{page_total})"
            say(f"{label} full-page Surya…")
            from yaws1999.progress import heartbeat
            from yaws1999.surya_ocr import ocr_djvu_page

            with heartbeat(say, label, interval_s=30.0):
                lines = ocr_djvu_page(
                    source, page, cache_dir=render_cache, dpi=dpi, predictor=predictor,
                )
            if page_dump is not None:
                page_dump.parent.mkdir(parents=True, exist_ok=True)
                page_dump.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
            elapsed = time.perf_counter() - t_page
            say(f"{label} done in {elapsed:.0f}s — {len(lines)} lines")

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
        "engine": _ENGINE,
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


def _page_dump_path(reports: Path | None, page: int) -> Path | None:
    if reports is None:
        return None
    return reports / "pages" / f"page-{page:04d}.txt"


def load_table(path: Path | str) -> dict[str, Any]:
    """Read one table JSON file."""
    return json.loads(Path(path).read_text(encoding="utf-8"))
