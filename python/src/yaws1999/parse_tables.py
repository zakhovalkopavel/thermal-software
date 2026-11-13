"""
yaws1999.parse_tables — OCR handbook pages and parse tables / freeform pages.

Flow:
1. Catalog ``Table X-Y`` page spans when parsing tables (fast ``djvutxt`` scan).
2. Per page: render + OCR via ``page-ocr`` (or resume page dumps).
3. Write dataset JSON for tables; freeform pages go under ``chapters/`` or
   ``appendix/``. After CAS / synonym / chapter / front-matter finals are
   written, per-page JSON is retired from ``shared/processed`` into
   ``report_dir/intermediates/``.

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
from yaws1999.chapters import (
    CAS_INDEX_FINAL_REL,
    CAS_INDEX_PAGES_REL,
    FRONT_MATTER_JSON_NAME,
    SYNONYM_INDEX_FINAL_REL,
    SYNONYM_PAGES_REL,
    default_chapters,
    freeform_relpath,
    materialize_pages_from_intermediates,
    migrate_chapter_pages,
    migrate_flat_pages,
    migrate_front_matter_pages,
    migrate_nested_appendix_json,
    migrate_nested_chapter_json,
    migrate_synonym_pages,
    purge_appendix_scratch,
    retire_all_consolidated_pages,
    rewrite_appendix_index_page_rows,
    write_chapter_datasets,
    write_front_matter_dataset,
)
from yaws1999.synonym_index import (
    group_synonym_rows,
    looks_like_synonym_index,
    parse_synonym_index_lines,
)
from yaws1999.constants import PAGE_OFFSET, PROCESSED_DIR, REF_KEY, REPORT_DIR, SOURCE_DJVU
from yaws1999.dataset import to_dataset_table, to_debug_table
from yaws1999.equations import apply_canonical_equations
from yaws1999.row_parser import collect_equations, parse_page_lines
from yaws1999.table_catalog import TableSpan, build_table_catalog
from yaws1999.writers import (
    migrate_root_tables,
    purge_legacy_short_table_files,
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
    chapter_spans = default_chapters()
    migrated_tables = migrate_root_tables(output)
    purged_short_tables = purge_legacy_short_table_files(output)
    migrated = migrate_flat_pages(
        output, chapters=chapter_spans, report_dir=reports,
    )
    migrated_chapter_pages = migrate_chapter_pages(output)
    migrated_nested_chapters = migrate_nested_chapter_json(output)
    migrated_nested_appendix = migrate_nested_appendix_json(output)
    purged_scratch = purge_appendix_scratch(output, reports)
    migrated_front_matter = migrate_front_matter_pages(output)
    migrated_synonyms = migrate_synonym_pages(output)
    materialized = materialize_pages_from_intermediates(output, reports)
    rewritten_appendix = rewrite_appendix_index_page_rows(output)
    if reports is not None:
        (reports / "pages").mkdir(parents=True, exist_ok=True)
        (reports / "renders").mkdir(parents=True, exist_ok=True)
        (reports / "debug").mkdir(parents=True, exist_ok=True)
        (reports / "intermediates").mkdir(parents=True, exist_ok=True)
        (reports / "variants").mkdir(parents=True, exist_ok=True)

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
        dataset["_file"] = str(path.relative_to(output)).replace("\\", "/")
        if debug_dir is not None:
            dbg_path = write_debug_table(debug_dir, debug)
            say(f"table {span.id} debug → {dbg_path.name}")

        result.tables.append(dataset)
        table_s = time.perf_counter() - t_table
        say(
            f"table {span.id} ({i}/{n_tables}): {len(dataset['rows'])} rows in "
            f"{table_s:.0f}s → {path.name}"
        )

    if migrated_tables:
        say(f"migrated {len(migrated_tables)} table file(s) into tables/")
    if purged_short_tables:
        say(
            f"removed {len(purged_short_tables)} legacy short table-X-Y.json "
            "file(s) superseded by slug-named finals"
        )
    if migrated:
        say(f"migrated {len(migrated)} legacy flat page file(s) into chapters/appendix")
    if migrated_chapter_pages:
        say(
            f"migrated {len(migrated_chapter_pages)} chapter page(s) into "
            "chapters/*/pages"
        )
    if migrated_nested_chapters:
        say(
            f"flattened {len(migrated_nested_chapters)} nested chapter.json "
            "→ chapters/chNN-slug.json"
        )
    if migrated_nested_appendix:
        say(
            f"flattened {len(migrated_nested_appendix)} nested appendix "
            "index JSON → appendix/*.json"
        )
    if purged_scratch:
        say(
            f"moved {purged_scratch} OCR variant file(s) out of "
            "appendix/scratch → reports/variants"
        )
    if migrated_front_matter:
        say(
            f"migrated {len(migrated_front_matter)} front-matter page(s) into "
            "front-matter/pages"
        )
    if migrated_synonyms:
        say(
            f"migrated {len(migrated_synonyms)} synonym page(s) into "
            "appendix/synonyms/pages"
        )
    if rewritten_appendix:
        say(f"rewrote rows on {rewritten_appendix} appendix index page(s)")
    if materialized:
        say(
            f"materialized {materialized} intermediate page(s) from "
            "reports/intermediates for rebuild"
        )

    for page in sorted(freeform_pages):
        variant = _variant_tag(quant, dpi)
        t_page = time.perf_counter()
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
        page_path = _freeform_page_path(
            output,
            page,
            document=document,
            tag=variant,
            no_replace=no_replace,
            chapters=chapter_spans,
            report_dir=reports,
        )
        if page_path is None:
            result.skipped.append(f"page-{page}")
            say(f"page {page}: skip — already exists (--no-replace)")
            continue
        path = write_json(page_path, document)
        document["_file"] = str(path.relative_to(output)).replace("\\", "/")
        document["_bucket"] = placement_bucket(document, chapter_spans)
        if debug_dir is not None:
            dbg = write_json(
                debug_dir / "pages" / path.name,
                document,
            )
            say(f"page {page} debug → {dbg.relative_to(debug_dir)}")
        result.pages.append(document)
        say(
            f"page {page}: {len(document.get('lines') or [])} lines "
            f"in {time.perf_counter() - t_page:.0f}s → {document['_file']}"
        )

    chapter_paths = write_chapter_datasets(
        output, chapters=chapter_spans, ref_key=REF_KEY,
    )
    if chapter_paths:
        say(f"chapters (final): {len(chapter_paths)} chapter file(s)")
    front_matter_path = write_front_matter_dataset(output, ref_key=REF_KEY)
    if front_matter_path is not None:
        say(f"front matter (final) → {front_matter_path.relative_to(output)}")
    cas_path = _write_cas_index_dataset(output, say=say)
    if cas_path is not None:
        say(f"CAS index (final) → {cas_path.relative_to(output)}")
    synonym_path = _write_synonym_index_dataset(output, say=say)
    if synonym_path is not None:
        say(f"synonym index (final) → {synonym_path.relative_to(output)}")

    retired = retire_all_consolidated_pages(output, reports)
    if retired:
        say(
            f"retired {retired} consolidated page JSON file(s) from "
            "shared/processed → reports/intermediates"
        )

    # Index freeform layout from disk + pages written this run.
    # Consolidated page files are gone from processed; only finals + other/.
    organized = _load_organized_freeform_pages(output, chapter_spans)
    by_file = {p.get("_file"): p for p in organized if p.get("_file")}
    for page_doc in result.pages:
        rel = page_doc.get("_file")
        if rel and (output / rel).is_file():
            by_file[rel] = page_doc
    indexed_pages = list(by_file.values())

    result.index_path = write_index(
        output,
        result.tables,
        str(source).replace("\\", "/"),
        merge_existing=no_replace or bool(tables) or bool(only_pages),
    )
    _merge_pages_into_index(
        result.index_path,
        indexed_pages,
        chapters=chapter_spans,
        chapter_files=[
            str(p.relative_to(output)).replace("\\", "/") for p in chapter_paths
        ],
        front_matter_file=(
            str(front_matter_path.relative_to(output)).replace("\\", "/")
            if front_matter_path is not None
            else None
        ),
        cas_index_file=(
            str(cas_path.relative_to(output)).replace("\\", "/")
            if cas_path is not None
            else None
        ),
        synonym_index_file=(
            str(synonym_path.relative_to(output)).replace("\\", "/")
            if synonym_path is not None
            else None
        ),
    )
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
    processed_root: Path,
    page: int,
    *,
    document: dict[str, Any],
    tag: str | None,
    no_replace: bool,
    chapters=None,
    report_dir: Path | None = None,
) -> Path | None:
    """Path for a freeform page under ``chapters/`` or ``appendix/``.

    Quant/dpi variants (``no_replace``) are written under ``report_dir/variants``
    only — never under ``shared/processed``.
    """
    printed = document.get("printedPage")
    kind = document.get("kind")
    primary_rel = freeform_relpath(
        page,
        kind=kind,
        printed_page=printed if isinstance(printed, int) else None,
        tag=None,
        chapters=chapters,
    )
    primary = processed_root / primary_rel
    primary.parent.mkdir(parents=True, exist_ok=True)
    if not no_replace:
        return primary
    if not primary.is_file():
        return primary
    if not tag or report_dir is None:
        return None
    alt = Path(report_dir) / "variants" / f"page-{page:04d}.{tag}.json"
    alt.parent.mkdir(parents=True, exist_ok=True)
    if alt.is_file():
        return None
    return alt


def placement_bucket(document: dict[str, Any], chapters=None) -> str:
    from yaws1999.chapters import placement_for_page

    bucket, _directory = placement_for_page(
        kind=document.get("kind"),
        printed_page=document.get("printedPage"),
        djvu_page=document.get("djvuPage"),
        chapters=chapters,
    )
    return bucket


def _load_organized_freeform_pages(
    processed_root: Path,
    chapters=None,
) -> list[dict[str, Any]]:
    """Load freeform JSON already under chapters/ / appendix/ / front-matter/."""
    roots = [
        processed_root / "front-matter" / "pages",
        processed_root / "chapters",
        processed_root / "appendix" / "cas-index" / "pages",
        processed_root / "appendix" / "synonyms" / "pages",
        processed_root / "appendix" / "other",
    ]
    out: list[dict[str, Any]] = []
    for root in roots:
        if not root.is_dir():
            continue
        for path in sorted(root.rglob("page-*.json")):
            if path.name.count(".") != 1:
                continue  # skip quant/dpi variants
            try:
                doc = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            rel = str(path.relative_to(processed_root)).replace("\\", "/")
            doc["_file"] = rel
            doc["_bucket"] = placement_bucket(doc, chapters)
            out.append(doc)
    return out


def _merge_pages_into_index(
    index_path: Path,
    pages: list[dict[str, Any]],
    *,
    chapters=None,
    chapter_files: list[str] | None = None,
    front_matter_file: str | None = None,
    cas_index_file: str | None = None,
    synonym_index_file: str | None = None,
) -> None:
    """Attach chapter/appendix freeform entries onto ``index.json``."""
    try:
        index = json.loads(index_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        index = {}

    chapter_page_entries: list[dict[str, Any]] = []
    appendix_entries: list[dict[str, Any]] = []
    front_page_entries: list[dict[str, Any]] = []
    for page_doc in pages:
        kind = page_doc.get("kind")
        if kind in {"casIndex", "synonymIndex"}:
            appendix_entries.append(
                {
                    "kind": (
                        "casIndexPage" if kind == "casIndex" else "synonymIndexPage"
                    ),
                    "final": False,
                    "djvuPage": page_doc.get("djvuPage"),
                    "printedPage": page_doc.get("printedPage"),
                    "file": page_doc.get("_file"),
                    "rowCount": len(page_doc.get("rows") or []),
                }
            )
            continue
        entry = {
            "djvuPage": page_doc.get("djvuPage"),
            "printedPage": page_doc.get("printedPage"),
            "file": page_doc.get("_file"),
            "lineCount": len(page_doc.get("lines") or []),
            "final": False,
        }
        bucket = page_doc.get("_bucket") or placement_bucket(page_doc, chapters)
        if bucket == "front-matter":
            entry["kind"] = "frontMatterPage"
            front_page_entries.append(entry)
        elif bucket == "appendix":
            appendix_entries.append(entry)
        else:
            entry["kind"] = "chapterPage"
            chapter_page_entries.append(entry)

    processed_root = index_path.parent

    def _merge(prior_key: str, new_entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
        prior = list(index.get(prior_key) or [])
        written = {e.get("file") for e in new_entries if e.get("file")}
        out = list(new_entries)
        for old in prior:
            name = old.get("file")
            if not name or name in written:
                continue
            # Drop stale pointers left after moves (e.g. other/ → synonyms/pages/).
            if not (processed_root / name).is_file():
                continue
            out.append(old)
        out.sort(
            key=lambda e: (
                int(e.get("djvuPage") or e.get("id") or 0)
                if str(e.get("id") or "").isdigit() or e.get("djvuPage") is not None
                else 0,
                str(e.get("file") or ""),
            ),
        )
        return out

    chapter_finals: list[dict[str, Any]] = []
    for rel in chapter_files or []:
        path = processed_root / rel
        if not path.is_file():
            continue
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        chapter_finals.append(
            {
                "id": doc.get("id"),
                "title": doc.get("title"),
                "kind": "chapter",
                "final": True,
                "file": rel,
                "pages": doc.get("pages"),
                "lineCount": len(doc.get("lines") or []),
            }
        )
    # Prefer finals; keep intermediate page pointers separately under chapterPages.
    if chapter_files is not None:
        # Also discover flat chapters/chNN-slug.json not passed in (partial runs).
        chapters_root = processed_root / "chapters"
        if chapters_root.is_dir():
            known = {e["file"] for e in chapter_finals}
            for path in sorted(chapters_root.glob("ch*.json")):
                if path.name.count(".") != 1:
                    continue
                rel = str(path.relative_to(processed_root)).replace("\\", "/")
                if rel in known:
                    continue
                try:
                    doc = json.loads(path.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    continue
                if doc.get("kind") not in {None, "chapter"}:
                    continue
                chapter_finals.append(
                    {
                        "id": doc.get("id"),
                        "title": doc.get("title"),
                        "kind": "chapter",
                        "final": True,
                        "file": rel,
                        "pages": doc.get("pages"),
                        "lineCount": len(doc.get("lines") or []),
                    }
                )
        chapter_finals.sort(key=lambda e: int(e.get("id") or 0))

    front_matter_final: dict[str, Any] | None = None
    fm_rel = front_matter_file
    if fm_rel is None:
        candidate = processed_root / "front-matter" / FRONT_MATTER_JSON_NAME
        if candidate.is_file():
            fm_rel = str(candidate.relative_to(processed_root)).replace("\\", "/")
    if fm_rel:
        path = processed_root / fm_rel
        if path.is_file():
            try:
                doc = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                doc = {}
            front_matter_final = {
                "id": doc.get("id") or "front-matter",
                "title": doc.get("title") or "Front matter",
                "kind": "frontMatter",
                "final": True,
                "file": fm_rel,
                "pages": doc.get("pages"),
                "lineCount": len(doc.get("lines") or []),
            }

    if front_matter_final is not None:
        index["frontMatter"] = front_matter_final
        index["frontMatterPages"] = _merge("frontMatterPages", front_page_entries)
    else:
        index["frontMatter"] = _merge("frontMatter", front_page_entries)
        index.pop("frontMatterPages", None)

    if chapter_files is not None:
        index["chapters"] = chapter_finals
        index["chapterPages"] = _merge("chapterPages", chapter_page_entries)
    else:
        index["chapters"] = _merge("chapters", chapter_page_entries)
    index["appendix"] = _merge("appendix", appendix_entries)
    if cas_index_file:
        index["casIndex"] = {
            "final": True,
            "file": cas_index_file,
        }
        # Drop retired per-page pointers once the consolidated final exists.
        index["appendix"] = [
            e
            for e in (index.get("appendix") or [])
            if e.get("kind") != "casIndexPage"
        ]
    if synonym_index_file:
        index["synonymIndex"] = {
            "final": True,
            "file": synonym_index_file,
        }
        index["appendix"] = [
            e
            for e in (index.get("appendix") or [])
            if e.get("kind") != "synonymIndexPage"
        ]
    index.pop("pages", None)
    write_json(index_path, index)


_CAS_ROW_KEYS = ("cas", "name", "formula")
_SYN_ROW_KEYS = ("synonyms", "formula", "name", "cas")


def _appendix_dataset(
    *,
    table_id: str,
    title: str,
    kind: str,
    columns: list[dict[str, str | None]],
    row_keys: tuple[str, ...],
    source_pages: list[int],
    raw_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    """Table-shaped appendix document; ``rows`` is always last."""
    rows: list[dict[str, Any]] = []
    for i, raw in enumerate(raw_rows, start=1):
        row: dict[str, Any] = {"id": i}
        for key in row_keys:
            row[key] = raw.get(key)
        rows.append(row)
    pages = {
        "first": (min(source_pages) - PAGE_OFFSET) if source_pages else None,
        "last": (max(source_pages) - PAGE_OFFSET) if source_pages else None,
    }
    return {
        "id": table_id,
        "title": title,
        "refKey": REF_KEY,
        "equation": None,
        "columns": columns,
        "pages": pages,
        "kind": kind,
        "rows": rows,
    }


def _collect_appendix_page_rows(
    pages_dir: Path,
    *,
    kind: str,
) -> tuple[list[int], list[dict[str, Any]]]:
    """Load per-page appendix rows in page order."""
    source_pages: list[int] = []
    rows: list[dict[str, Any]] = []
    if not pages_dir.is_dir():
        return source_pages, rows
    for path in sorted(pages_dir.glob("page-*.json")):
        if path.name.count(".") != 1:
            continue
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if doc.get("kind") != kind:
            continue
        source_pages.append(int(doc.get("djvuPage") or 0))
        for row in doc.get("rows") or []:
            rows.append(dict(row))
    return source_pages, rows


def _write_cas_index_dataset(
    processed_root: Path,
    *,
    say: Callable[[str], None],
) -> Path | None:
    """Build final consolidated CAS index from appendix per-page intermediates."""
    out = processed_root / CAS_INDEX_FINAL_REL
    # Prefer staging pages/; also accept a legacy nested final path.
    legacy = processed_root / "appendix" / "cas-index" / "CAS_Compound_Index.json"
    source_pages, raw_rows = _collect_appendix_page_rows(
        processed_root / CAS_INDEX_PAGES_REL,
        kind="casIndex",
    )
    if not raw_rows:
        if out.is_file():
            return out
        return legacy if legacy.is_file() else None
    dataset = _appendix_dataset(
        table_id="CAS",
        title="CAS COMPOUND INDEX",
        kind="casIndex",
        columns=[
            {"key": "id", "header": "NO", "unit": None},
            {"key": "cas", "header": "CAS", "unit": None},
            {"key": "name", "header": "NAME", "unit": None},
            {"key": "formula", "header": "FORMULA", "unit": None},
        ],
        row_keys=_CAS_ROW_KEYS,
        source_pages=source_pages,
        raw_rows=raw_rows,
    )
    write_json(out, dataset)
    if legacy.is_file() and legacy.resolve() != out.resolve():
        legacy.unlink(missing_ok=True)
    say(f"CAS index: {len(dataset['rows'])} rows from {len(source_pages)} page(s)")
    return out


def _write_synonym_index_dataset(
    processed_root: Path,
    *,
    say: Callable[[str], None],
) -> Path | None:
    """Build final consolidated name/synonym index from per-page intermediates."""
    out = processed_root / SYNONYM_INDEX_FINAL_REL
    legacy = processed_root / "appendix" / "synonyms" / "Name_and_Synonym_Index.json"
    source_pages, raw_rows = _collect_appendix_page_rows(
        processed_root / SYNONYM_PAGES_REL,
        kind="synonymIndex",
    )
    if not raw_rows:
        if out.is_file():
            return out
        return legacy if legacy.is_file() else None
    # Re-group across pages so the same CAS merges all synonym strings.
    grouped = [e.to_dict() for e in group_synonym_rows(raw_rows)]
    dataset = _appendix_dataset(
        table_id="SYN",
        title="COMPOUND LIST BY NAME AND SYNONYM",
        kind="synonymIndex",
        columns=[
            {"key": "id", "header": "NO", "unit": None},
            {"key": "synonyms", "header": "Names (Synonyms)", "unit": None},
            {"key": "formula", "header": "Formula", "unit": None},
            {"key": "name", "header": "Name in Tables", "unit": None},
            {"key": "cas", "header": "CAS Reg. No", "unit": None},
        ],
        row_keys=_SYN_ROW_KEYS,
        source_pages=source_pages,
        raw_rows=grouped,
    )
    write_json(out, dataset)
    if legacy.is_file() and legacy.resolve() != out.resolve():
        legacy.unlink(missing_ok=True)
    say(f"synonym index: {len(dataset['rows'])} rows from {len(source_pages)} page(s)")
    return out


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

    if looks_like_synonym_index(lines):
        syn = parse_synonym_index_lines(lines, page)
        say(
            f"{label} synonym index: {len(syn.entries)} entries "
            f"({len(syn.unparsed)} unparsed)"
        )
        return {
            "kind": "synonymIndex",
            "layout": "nameSynonym",
            "djvuPage": page,
            "printedPage": page - PAGE_OFFSET,
            "refKey": REF_KEY,
            "engine": getattr(ocr_config, "engine", None) if ocr_config else None,
            "backend": getattr(ocr_config, "backend", None) if ocr_config else None,
            "model": getattr(ocr_config, "model", None) if ocr_config else None,
            "quant": quant,
            "dpi": dpi,
            "title": "COMPOUND LIST BY NAME AND SYNONYM",
            "equation": None,
            "equations": [],
            "header": None,
            "lines": lines,
            "rows": [e.to_dict() for e in syn.entries],
            "unparsed": syn.unparsed,
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
    return apply_canonical_equations(
        {
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
    )


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
