"""Chapter / appendix placement for Yaws freeform pages.

Final handbook tables live under ``processed/yaws1999/tables/``.
Front matter: final ``front-matter/front-matter.json`` (per-page JSON is not
kept under ``shared/processed`` after join).
Chapter intros: final ``chapters/chNN-slug.json`` (flat; no per-chapter
subfolder for the public file). Staging pages may briefly live under
``chapters/chNN-slug/pages/`` then are retired to ``reports/…/intermediates/``.
CAS / synonym appendix: flat finals ``appendix/CAS_Compound_Index.json`` and
``appendix/Name_and_Synonym_Index.json`` (no ``cas-index/`` / ``synonyms/``
subfolders for publics). OCR quant/dpi variants never go under processed —
only under ``reports/…/variants/``.
"""
from __future__ import annotations

import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from yaws1999.constants import PAGE_OFFSET

# Legacy nested filename (``chapters/chNN/chapter.json``); finals are flat now.
LEGACY_CHAPTER_JSON_NAME = "chapter.json"
CHAPTER_JSON_NAME = LEGACY_CHAPTER_JSON_NAME  # alias for older imports/tests
FRONT_MATTER_JSON_NAME = "front-matter.json"
CAS_INDEX_JSON_NAME = "CAS_Compound_Index.json"
SYNONYM_INDEX_JSON_NAME = "Name_and_Synonym_Index.json"
CAS_INDEX_FINAL_REL = f"appendix/{CAS_INDEX_JSON_NAME}"
SYNONYM_INDEX_FINAL_REL = f"appendix/{SYNONYM_INDEX_JSON_NAME}"
CAS_INDEX_PAGES_REL = "appendix/cas-index/pages"
SYNONYM_PAGES_REL = "appendix/synonyms/pages"
FRONT_MATTER_PAGES_REL = "front-matter/pages"

_CHAPTER_DIR_RE = re.compile(r"^ch(\d+)-(.+)$")

_SLUG_STRIP = re.compile(r"[^a-z0-9]+")
_ORG_INORG = re.compile(
    r"\s*[-–—]\s*(?:ORGANIC|INORGANIC)\s+COMPOUNDS\s*$",
    re.I,
)


@dataclass(frozen=True)
class ChapterSpan:
    """One handbook chapter **intro** span (printed pages before its tables)."""

    number: int
    slug: str
    title: str
    printed_first: int
    printed_last: int

    @property
    def dirname(self) -> str:
        return f"ch{self.number:02d}-{self.slug}"

    @property
    def json_name(self) -> str:
        """Public filename under ``chapters/`` (e.g. ``ch05-….json``)."""
        return f"{self.dirname}.json"


def chapter_final_path(processed_root: Path, dirname: str) -> Path:
    """``processed/chapters/chNN-slug.json``."""
    return Path(processed_root) / "chapters" / f"{dirname}.json"


def _rm_empty_dir(path: Path) -> None:
    if path.is_dir():
        try:
            path.rmdir()
        except OSError:
            pass


# Short chapter titles (handbook order). Used when building spans from tables.
CHAPTER_TITLES: dict[int, str] = {
    1: "Critical properties and acentric factor",
    2: "Heat capacity of gas",
    3: "Heat capacity of liquid",
    4: "Heat capacity of solid",
    5: "Enthalpy of vaporization",
    6: "Enthalpy of fusion",
    7: "Vapor pressure",
    8: "Density of liquid",
    9: "Surface tension",
    10: "Refractive index, dipole moment, and radius of gyration",
    11: "Entropy and entropy of formation of gas",
    12: "Enthalpy of formation of gas",
    13: "Gibbs energy of formation of gas",
    14: "Solubility parameter, liquid volume, and van der Waals area and volume",
    15: "Solubility in water and octanol-water partition coefficient",
    16: "Solubility in salt water",
    17: "Solubility in water",
    18: "Henry's law constant for compound in water",
    19: "Adsorption capacity of activated carbon",
    20: "Soil sorption coefficient",
    21: "Viscosity of gas",
    22: "Viscosity of liquid",
    23: "Thermal conductivity of gas",
    24: "Thermal conductivity of liquid",
    25: "Explosion limits in air, flash point, and autoignition temperature",
    26: "Enthalpy of combustion",
    27: "Exposure limits",
    28: "Coefficient of thermal expansion",
}


def title_slug(title: str, *, max_len: int = 48) -> str:
    base = _ORG_INORG.sub("", title or "").strip().lower()
    slug = _SLUG_STRIP.sub("-", base).strip("-")
    if len(slug) > max_len:
        slug = slug[:max_len].rstrip("-")
    return slug or "chapter"


def chapters_from_table_docs(tables: Iterable[dict[str, Any]]) -> list[ChapterSpan]:
    """Build chapter **intro** spans from processed table docs.

    Intro pages sit between the previous chapter's last table page and this
    chapter's first table page. Table pages themselves are never part of the
    chapter span (they belong only to table datasets).
    """
    by_ch: dict[int, dict[str, int | str]] = {}
    for table in tables:
        tid = str(table.get("id") or "")
        match = re.match(r"^(\d+)-\d+$", tid)
        if not match:
            continue
        ch = int(match.group(1))
        pages = table.get("pages") or {}
        first, last = pages.get("first"), pages.get("last")
        if first is None or last is None:
            continue
        cur = by_ch.setdefault(ch, {"first": int(first), "last": int(last)})
        cur["first"] = min(int(cur["first"]), int(first))
        cur["last"] = max(int(cur["last"]), int(last))

    spans: list[ChapterSpan] = []
    numbers = sorted(by_ch)
    for i, ch in enumerate(numbers):
        table_first = int(by_ch[ch]["first"])
        prev_last = int(by_ch[numbers[i - 1]]["last"]) if i else 0
        printed_first = prev_last + 1 if prev_last else 1
        if printed_first < 1:
            printed_first = 1
        # Stop before the first table page of this chapter.
        printed_last = table_first - 1
        if printed_last < printed_first:
            # No intro pages (e.g. chapter 1 tables start on printed page 1).
            continue
        title = CHAPTER_TITLES.get(ch) or f"Chapter {ch}"
        spans.append(
            ChapterSpan(
                number=ch,
                slug=title_slug(title),
                title=title,
                printed_first=printed_first,
                printed_last=printed_last,
            )
        )
    return spans


def looks_like_table_page(lines: list[str]) -> bool:
    """True when freeform OCR lines are a handbook **table** page, not intro prose."""
    for raw in lines[:12]:
        line = str(raw).strip()
        if not line:
            continue
        if line.startswith("Table ") or line.upper().startswith("TABLE "):
            return True
        if re.search(r"\bNO\s+FORMULA\b", line, re.I):
            return True
    return False


# Pipeline printed page = DjVu − PAGE_OFFSET (Table 1-1 on DjVu 10 ⇒ printed 1).
# Each chapter: optional intro span, then contiguous table span. Apparent "gaps"
# between table blocks are the intros (not missing pages).
# Format: ch → (intro_first, intro_last) | None, (table_first, table_last)
CHAPTER_PAGE_MAP: dict[int, tuple[tuple[int, int] | None, tuple[int, int]]] = {
    # Ch1 intro is DjVu 4–9 (book pp. 1–6) ⇒ printed −5…0; tables start printed 1.
    1: ((4 - PAGE_OFFSET, 9 - PAGE_OFFSET), (1, 23)),
    2: ((24, 26), (27, 49)),
    3: ((50, 53), (54, 76)),
    4: ((77, 79), (80, 102)),
    5: ((103, 105), (106, 128)),
    6: ((129, 129), (130, 152)),
    7: ((153, 155), (156, 178)),
    8: ((179, 182), (183, 205)),
    9: ((206, 209), (210, 232)),
    10: ((233, 234), (235, 257)),
    11: ((258, 258), (259, 281)),
    12: ((282, 284), (285, 307)),
    13: ((308, 310), (311, 333)),
    14: (None, (334, 345)),  # no captured intro; tables abut ch13
    15: ((346, 352), (353, 370)),
    16: ((371, 374), (375, 377)),
    17: ((378, 381), (382, 384)),
    18: ((385, 388), (389, 406)),
    19: ((407, 413), (414, 424)),
    20: ((425, 428), (429, 433)),
    21: ((434, 436), (437, 459)),
    22: ((460, 463), (464, 486)),
    23: ((487, 489), (490, 512)),
    24: ((513, 515), (516, 538)),
    25: ((539, 544), (545, 563)),
    26: ((564, 566), (567, 584)),
    27: ((585, 586), (587, 597)),
    28: ((598, 601), (602, 624)),
}


def default_chapters() -> list[ChapterSpan]:
    """Chapter **intro** spans from ``CHAPTER_PAGE_MAP`` (tables stay on table datasets)."""
    spans: list[ChapterSpan] = []
    for ch in sorted(CHAPTER_PAGE_MAP):
        intro, _tables = CHAPTER_PAGE_MAP[ch]
        if intro is None:
            continue
        first, last = intro
        if last < first:
            continue
        title = CHAPTER_TITLES.get(ch) or f"Chapter {ch}"
        spans.append(
            ChapterSpan(
                number=ch,
                slug=title_slug(title),
                title=title,
                printed_first=first,
                printed_last=last,
            )
        )
    return spans


def placement_for_page(
    *,
    kind: str | None,
    printed_page: int | None,
    djvu_page: int | None = None,
    chapters: list[ChapterSpan] | None = None,
) -> tuple[str, str]:
    """Return ``(bucket, relative_dir)`` for a freeform page.

    Buckets: ``chapter`` | ``front-matter`` | ``appendix-cas`` |
    ``appendix-synonym`` | ``appendix``.
    """
    if kind == "casIndex":
        return "appendix-cas", "appendix/cas-index/pages"
    if kind == "synonymIndex":
        return "appendix-synonym", "appendix/synonyms/pages"

    printed = printed_page
    if printed is None and djvu_page is not None:
        printed = int(djvu_page) - PAGE_OFFSET

    spans = chapters if chapters is not None else default_chapters()
    if printed is not None:
        for span in spans:
            if span.printed_first <= printed <= span.printed_last:
                return "chapter", f"chapters/{span.dirname}/pages"

    # Title / LoC / TOC (DjVu 1–3 ⇒ printed < ch1 intro) and any other pre-body pages.
    if printed is None or printed < 1:
        return "front-matter", "front-matter/pages"

    return "appendix", "appendix/other"


def freeform_relpath(
    page: int,
    *,
    kind: str | None,
    printed_page: int | None,
    tag: str | None = None,
    chapters: list[ChapterSpan] | None = None,
) -> str:
    """Relative path under the processed root for one freeform page JSON."""
    _bucket, directory = placement_for_page(
        kind=kind,
        printed_page=printed_page,
        djvu_page=page,
        chapters=chapters,
    )
    name = f"page-{page:04d}.{tag}.json" if tag else f"page-{page:04d}.json"
    return f"{directory}/{name}"


def migrate_flat_pages(
    processed_root: Path,
    *,
    chapters: list[ChapterSpan] | None = None,
    report_dir: Path | None = None,
) -> list[tuple[Path, Path]]:
    """Move legacy ``pages/page-NNNN.json`` into chapter/appendix folders.

    Quant/dpi variant files go to ``reports/…/variants/`` (never processed).
    Returns list of ``(src, dest)`` moves performed.
    """
    flat = processed_root / "pages"
    if not flat.is_dir():
        return []

    spans = chapters if chapters is not None else default_chapters()
    moves: list[tuple[Path, Path]] = []
    for src in sorted(flat.glob("page-*.json")):
        stem = src.name
        # page-0001.json vs page-0001.q8.dpi400.json
        parts = stem[:-5].split(".")  # drop .json
        page_token = parts[0]  # page-0001
        try:
            page = int(page_token.split("-")[1])
        except (IndexError, ValueError):
            continue
        tag = ".".join(parts[1:]) if len(parts) > 1 else None

        kind = None
        printed = page - PAGE_OFFSET
        try:
            data = json.loads(src.read_text(encoding="utf-8"))
            kind = data.get("kind")
            if data.get("printedPage") is not None:
                printed = int(data["printedPage"])
        except (OSError, json.JSONDecodeError, TypeError, ValueError):
            pass

        if tag:
            if report_dir is None:
                # Do not park OCR variants under shared/processed.
                src.unlink(missing_ok=True)
                continue
            dest = Path(report_dir) / "variants" / stem
        else:
            dest = processed_root / freeform_relpath(
                page, kind=kind, printed_page=printed, chapters=spans,
            )
        if dest.resolve() == src.resolve():
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.is_file():
            # Prefer keeping dest; drop duplicate flat copy.
            src.unlink(missing_ok=True)
            moves.append((src, dest))
            continue
        shutil.move(str(src), str(dest))
        moves.append((src, dest))

    # Remove empty flat pages dir when drained.
    _rm_empty_dir(flat)
    return moves


def migrate_nested_appendix_json(processed_root: Path) -> list[tuple[Path, Path]]:
    """Flatten nested CAS/synonym finals into ``appendix/*.json``."""
    moves: list[tuple[Path, Path]] = []
    pairs = (
        (
            processed_root / "appendix" / "cas-index" / CAS_INDEX_JSON_NAME,
            processed_root / CAS_INDEX_FINAL_REL,
        ),
        (
            processed_root / "appendix" / "synonyms" / SYNONYM_INDEX_JSON_NAME,
            processed_root / SYNONYM_INDEX_FINAL_REL,
        ),
    )
    for src, dest in pairs:
        if not src.is_file():
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.resolve() == src.resolve():
            continue
        if dest.is_file():
            src.unlink(missing_ok=True)
            moves.append((src, dest))
        else:
            shutil.move(str(src), str(dest))
            moves.append((src, dest))
        _rm_empty_dir(src.parent)
        # Drop empty pages parent leftovers after a later retire.
        _rm_empty_dir(src.parent)
    return moves


def purge_appendix_scratch(
    processed_root: Path,
    report_dir: Path | None = None,
) -> int:
    """Remove ``appendix/scratch`` from processed (OCR variants → reports)."""
    scratch = processed_root / "appendix" / "scratch"
    if not scratch.is_dir():
        return 0
    moved = 0
    dest_root = Path(report_dir) / "variants" if report_dir is not None else None
    if dest_root is not None:
        dest_root.mkdir(parents=True, exist_ok=True)
    for path in sorted(scratch.glob("*.json")):
        if dest_root is not None:
            dest = dest_root / path.name
            if dest.exists():
                dest.unlink()
            shutil.move(str(path), str(dest))
        else:
            path.unlink(missing_ok=True)
        moved += 1
    # Remove any leftover non-json noise, then the dir.
    for path in sorted(scratch.iterdir()):
        if path.is_file():
            path.unlink(missing_ok=True)
    _rm_empty_dir(scratch)
    return moved


def migrate_cas_pages(
    processed_root: Path,
) -> list[tuple[Path, Path]]:
    """Re-parse Appendix C/D pages under ``appendix/other`` into ``cas-index/pages``.

    Existing freeform dumps keep OCR ``lines``; rows are rebuilt as
    ``kind: casIndex``. Returns ``(src, dest)`` moves performed.
    """
    import json

    from yaws1999.cas_index import looks_like_cas_index, parse_cas_index_lines

    other = processed_root / "appendix" / "other"
    if not other.is_dir():
        return []

    moves: list[tuple[Path, Path]] = []
    for src in sorted(other.glob("page-*.json")):
        if src.name.count(".") != 1:
            continue
        try:
            doc = json.loads(src.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        lines = [str(x) for x in (doc.get("lines") or [])]
        if doc.get("kind") != "casIndex" and not looks_like_cas_index(lines):
            continue
        page = int(doc.get("djvuPage") or int(src.stem.split("-")[1]))
        parsed = parse_cas_index_lines(lines, page)
        doc["kind"] = "casIndex"
        doc["layout"] = "twoColumnCas"
        doc["rows"] = [e.to_dict() for e in parsed.entries]
        doc["unparsed"] = parsed.unparsed
        for key in ("equation", "equations"):
            doc.pop(key, None)
        dest = processed_root / CAS_INDEX_PAGES_REL / src.name
        if dest.resolve() == src.resolve():
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        src.unlink(missing_ok=True)
        moves.append((src, dest))
    return moves


def migrate_synonym_pages(
    processed_root: Path,
) -> list[tuple[Path, Path]]:
    """Re-parse Appendix E pages under ``appendix/other`` into ``synonyms/pages``.

    Existing freeform dumps keep OCR ``lines``; rows are rebuilt as
    ``kind: synonymIndex``. Returns ``(src, dest)`` moves performed.
    """
    import json

    from yaws1999.synonym_index import looks_like_synonym_index, parse_synonym_index_lines

    other = processed_root / "appendix" / "other"
    if not other.is_dir():
        return []

    moves: list[tuple[Path, Path]] = []
    for src in sorted(other.glob("page-*.json")):
        if src.name.count(".") != 1:
            continue
        try:
            doc = json.loads(src.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        lines = [str(x) for x in (doc.get("lines") or [])]
        if doc.get("kind") != "synonymIndex" and not looks_like_synonym_index(lines):
            continue
        page = int(doc.get("djvuPage") or int(src.stem.split("-")[1]))
        parsed = parse_synonym_index_lines(lines, page)
        doc["kind"] = "synonymIndex"
        doc["layout"] = "nameSynonym"
        doc["rows"] = [e.to_dict() for e in parsed.entries]
        doc["unparsed"] = parsed.unparsed
        for key in ("equation", "equations"):
            doc.pop(key, None)
        if not doc.get("title"):
            doc["title"] = "COMPOUND LIST BY NAME AND SYNONYM"
        dest = processed_root / "appendix" / "synonyms" / "pages" / src.name
        if dest.resolve() == src.resolve():
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        src.unlink(missing_ok=True)
        moves.append((src, dest))
    return moves


def _move_page_jsons(src_dir: Path, dest_dir: Path) -> list[tuple[Path, Path]]:
    """Move ``page-*.json`` from ``src_dir`` into ``dest_dir``."""
    if not src_dir.is_dir():
        return []
    moves: list[tuple[Path, Path]] = []
    for src in sorted(src_dir.glob("page-*.json")):
        if src.parent.resolve() == dest_dir.resolve():
            continue
        dest = dest_dir / src.name
        if dest.resolve() == src.resolve():
            continue
        dest_dir.mkdir(parents=True, exist_ok=True)
        if dest.is_file():
            src.unlink(missing_ok=True)
            moves.append((src, dest))
            continue
        src.replace(dest)
        moves.append((src, dest))
    return moves


def migrate_chapter_pages(processed_root: Path) -> list[tuple[Path, Path]]:
    """Move ``chapters/ch*/page-*.json`` into ``chapters/ch*/pages/``.

    Returns ``(src, dest)`` moves performed.
    """
    chapters_root = processed_root / "chapters"
    if not chapters_root.is_dir():
        return []
    moves: list[tuple[Path, Path]] = []
    for chapter_dir in sorted(chapters_root.iterdir()):
        if not chapter_dir.is_dir():
            continue
        moves.extend(_move_page_jsons(chapter_dir, chapter_dir / "pages"))
    return moves


def migrate_nested_chapter_json(processed_root: Path) -> list[tuple[Path, Path]]:
    """Flatten ``chapters/chNN-slug/chapter.json`` → ``chapters/chNN-slug.json``.

    Leaves staging ``pages/`` in place for a later retire step. Returns moves.
    """
    chapters_root = processed_root / "chapters"
    if not chapters_root.is_dir():
        return []
    moves: list[tuple[Path, Path]] = []
    for chapter_dir in sorted(chapters_root.iterdir()):
        if not chapter_dir.is_dir() or not _CHAPTER_DIR_RE.match(chapter_dir.name):
            continue
        src = chapter_dir / LEGACY_CHAPTER_JSON_NAME
        if not src.is_file():
            continue
        dest = chapter_final_path(processed_root, chapter_dir.name)
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.resolve() == src.resolve():
            continue
        if dest.is_file():
            src.unlink(missing_ok=True)
            moves.append((src, dest))
        else:
            src.replace(dest)
            moves.append((src, dest))
        _rm_empty_dir(chapter_dir)
    # Drop a mistaken root-level ``chapters/chapter.json`` if present.
    stray = chapters_root / LEGACY_CHAPTER_JSON_NAME
    if stray.is_file():
        stray.unlink(missing_ok=True)
    return moves


def migrate_front_matter_pages(processed_root: Path) -> list[tuple[Path, Path]]:
    """Move ``front-matter/page-*.json`` into ``front-matter/pages/``."""
    return _move_page_jsons(
        processed_root / "front-matter",
        processed_root / "front-matter" / "pages",
    )


def rehome_misplaced_front_matter_pages(
    processed_root: Path,
    *,
    chapters: list[ChapterSpan] | None = None,
) -> list[tuple[Path, Path]]:
    """Move chapter-intro pages that landed under ``front-matter/pages`` (e.g. ch1).

    DjVu 4–9 are Chapter 1 prose but map to printed −5…0, so older runs filed
    them with the title/TOC. Returns ``(src, dest)`` moves.
    """
    pages_dir = processed_root / "front-matter" / "pages"
    if not pages_dir.is_dir():
        return []
    spans = chapters if chapters is not None else default_chapters()
    moves: list[tuple[Path, Path]] = []
    for src in list(_primary_page_jsons(pages_dir)):
        try:
            doc = json.loads(src.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        bucket, directory = placement_for_page(
            kind=doc.get("kind"),
            printed_page=doc.get("printedPage"),
            djvu_page=doc.get("djvuPage"),
            chapters=spans,
        )
        if bucket != "chapter":
            continue
        dest = processed_root / directory / src.name
        if dest.resolve() == src.resolve():
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.is_file():
            src.unlink(missing_ok=True)
            moves.append((src, dest))
            continue
        src.replace(dest)
        moves.append((src, dest))
    return moves


def _join_freeform_page_docs(
    page_docs: list[dict[str, Any]],
) -> tuple[list[str], list[str], list[int]]:
    """Return ``(lines, equations, printed_pages)`` joined in page order."""
    ordered = sorted(
        page_docs,
        key=lambda d: (
            int(d.get("djvuPage") or 0),
            int(d.get("printedPage") or 0),
        ),
    )
    lines: list[str] = []
    equations: list[str] = []
    printed_pages: list[int] = []
    for doc in ordered:
        printed = doc.get("printedPage")
        if isinstance(printed, int):
            printed_pages.append(printed)
        for line in doc.get("lines") or []:
            lines.append(str(line))
        eq0 = doc.get("equation")
        if eq0:
            equations.append(str(eq0))
        for eq in doc.get("equations") or []:
            if eq:
                equations.append(str(eq))
    seen: set[str] = set()
    uniq_eqs: list[str] = []
    for eq in equations:
        if eq in seen:
            continue
        seen.add(eq)
        uniq_eqs.append(eq)
    return lines, uniq_eqs, printed_pages


def build_chapter_document(
    span: ChapterSpan,
    page_docs: list[dict[str, Any]],
    *,
    ref_key: str,
) -> dict[str, Any]:
    """Join per-page freeform dumps into one chapter JSON (``lines`` last)."""
    lines, uniq_eqs, printed_pages = _join_freeform_page_docs(page_docs)
    return {
        "id": str(span.number),
        "title": span.title,
        "refKey": ref_key,
        "equations": uniq_eqs,
        "pages": {
            "first": min(printed_pages) if printed_pages else span.printed_first,
            "last": max(printed_pages) if printed_pages else span.printed_last,
        },
        "kind": "chapter",
        "lines": lines,
    }


def build_front_matter_document(
    page_docs: list[dict[str, Any]],
    *,
    ref_key: str,
) -> dict[str, Any]:
    """Join front-matter page dumps into one JSON (``lines`` last)."""
    lines, uniq_eqs, printed_pages = _join_freeform_page_docs(page_docs)
    return {
        "id": "front-matter",
        "title": "Front matter",
        "refKey": ref_key,
        "equations": uniq_eqs,
        "pages": {
            "first": min(printed_pages) if printed_pages else None,
            "last": max(printed_pages) if printed_pages else None,
        },
        "kind": "frontMatter",
        "lines": lines,
    }


def _span_from_dirname(
    dirname: str,
    by_dirname: dict[str, ChapterSpan],
) -> ChapterSpan | None:
    span = by_dirname.get(dirname)
    if span is not None:
        return span
    match = _CHAPTER_DIR_RE.match(dirname)
    if not match:
        return None
    number = int(match.group(1))
    return ChapterSpan(
        number=number,
        slug=match.group(2),
        title=CHAPTER_TITLES.get(number) or f"Chapter {number}",
        printed_first=1,
        printed_last=1,
    )


def purge_misplaced_chapter_table_pages(
    processed_root: Path,
    *,
    chapters: list[ChapterSpan] | None = None,
    report_dir: Path | None = None,
) -> int:
    """Remove handbook table-page dumps that landed under ``chapters/*/pages``.

    Returns the number of page files removed (or moved to report intermediates).
    """
    spans = chapters if chapters is not None else default_chapters()
    by_dirname = {span.dirname: span for span in spans}
    chapters_root = processed_root / "chapters"
    if not chapters_root.is_dir():
        return 0
    removed = 0
    for entry in sorted(chapters_root.iterdir()):
        if not entry.is_dir() or not _CHAPTER_DIR_RE.match(entry.name):
            continue
        span = _span_from_dirname(entry.name, by_dirname)
        pages_dir = entry / "pages"
        for path in list(_primary_page_jsons(pages_dir)):
            try:
                doc = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            lines = [str(x) for x in (doc.get("lines") or [])]
            printed = doc.get("printedPage")
            outside = (
                span is not None
                and isinstance(printed, int)
                and not (span.printed_first <= printed <= span.printed_last)
            )
            if not (looks_like_table_page(lines) or outside):
                continue
            if report_dir is not None:
                rel = f"chapters/{entry.name}/pages"
                # Quarantine so rebuild materialize does not re-inject table pages.
                quarantine = (
                    report_dir / "intermediates" / "_misplaced-table-pages" / rel
                )
                quarantine.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, quarantine / path.name)
                inter = report_dir / "intermediates" / rel / path.name
                inter.unlink(missing_ok=True)
            path.unlink(missing_ok=True)
            removed += 1
        _rm_empty_dir(pages_dir)
    return removed


def write_chapter_datasets(
    processed_root: Path,
    *,
    chapters: list[ChapterSpan] | None = None,
    ref_key: str,
) -> list[Path]:
    """Build flat ``chapters/chNN-slug.json`` from per-page **intro** dumps."""
    spans = chapters if chapters is not None else default_chapters()
    by_dirname = {span.dirname: span for span in spans}
    written: list[Path] = []
    chapters_root = processed_root / "chapters"
    if not chapters_root.is_dir():
        return written

    dirnames: set[str] = set()
    for entry in chapters_root.iterdir():
        if entry.is_dir() and _CHAPTER_DIR_RE.match(entry.name):
            dirnames.add(entry.name)
        elif entry.is_file() and entry.suffix == ".json" and _CHAPTER_DIR_RE.match(entry.stem):
            dirnames.add(entry.stem)

    for dirname in sorted(dirnames):
        span = by_dirname.get(dirname)
        if span is None:
            # No intro span for this chapter (e.g. ch01) — remove stale final.
            stale = chapter_final_path(processed_root, dirname)
            stale.unlink(missing_ok=True)
            continue
        pages_dir = chapters_root / dirname / "pages"
        page_docs: list[dict[str, Any]] = []
        for path in _primary_page_jsons(pages_dir):
            try:
                doc = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            lines = [str(x) for x in (doc.get("lines") or [])]
            if looks_like_table_page(lines):
                continue
            printed = doc.get("printedPage")
            if isinstance(printed, int) and not (
                span.printed_first <= printed <= span.printed_last
            ):
                continue
            page_docs.append(doc)
        if not page_docs:
            chapter_final_path(processed_root, dirname).unlink(missing_ok=True)
            continue
        doc = build_chapter_document(span, page_docs, ref_key=ref_key)
        out = chapter_final_path(processed_root, dirname)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(
            json.dumps(doc, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        # Remove legacy nested final if still present.
        legacy = chapters_root / dirname / LEGACY_CHAPTER_JSON_NAME
        if legacy.is_file():
            legacy.unlink(missing_ok=True)
        written.append(out)
    return written


def write_front_matter_dataset(
    processed_root: Path,
    *,
    ref_key: str,
    chapters: list[ChapterSpan] | None = None,
) -> Path | None:
    """Build ``front-matter/front-matter.json`` from per-page dumps."""
    pages_dir = processed_root / "front-matter" / "pages"
    if not pages_dir.is_dir():
        return None
    spans = chapters if chapters is not None else default_chapters()
    page_docs: list[dict[str, Any]] = []
    for path in sorted(pages_dir.glob("page-*.json")):
        if path.name.count(".") != 1:
            continue
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        bucket, _directory = placement_for_page(
            kind=doc.get("kind"),
            printed_page=doc.get("printedPage"),
            djvu_page=doc.get("djvuPage"),
            chapters=spans,
        )
        if bucket != "front-matter":
            continue
        page_docs.append(doc)
    if not page_docs:
        return None
    doc = build_front_matter_document(page_docs, ref_key=ref_key)
    out = processed_root / "front-matter" / FRONT_MATTER_JSON_NAME
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        json.dumps(doc, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return out


def report_intermediates_dir(report_dir: Path | None, rel: str) -> Path | None:
    """``reports/…/intermediates/<rel>`` for page JSON retired from processed."""
    if report_dir is None:
        return None
    return Path(report_dir) / "intermediates" / rel


def _primary_page_jsons(pages_dir: Path) -> list[Path]:
    if not pages_dir.is_dir():
        return []
    return [
        path
        for path in sorted(pages_dir.glob("page-*.json"))
        if path.name.count(".") == 1
    ]


def consolidated_page_rels(
    processed_root: Path,
    report_dir: Path | None = None,
) -> list[str]:
    """Relative ``…/pages`` dirs that feed a consolidated final in processed."""
    rels = [CAS_INDEX_PAGES_REL, SYNONYM_PAGES_REL, FRONT_MATTER_PAGES_REL]
    seen = set(rels)

    def _add(rel: str) -> None:
        if rel not in seen:
            rels.append(rel)
            seen.add(rel)

    chapters_root = processed_root / "chapters"
    if chapters_root.is_dir():
        for entry in sorted(chapters_root.iterdir()):
            if entry.is_dir() and _CHAPTER_DIR_RE.match(entry.name):
                _add(f"chapters/{entry.name}/pages")
            elif (
                entry.is_file()
                and entry.suffix == ".json"
                and _CHAPTER_DIR_RE.match(entry.stem)
            ):
                _add(f"chapters/{entry.stem}/pages")
    if report_dir is not None:
        inter_chapters = Path(report_dir) / "intermediates" / "chapters"
        if inter_chapters.is_dir():
            for entry in sorted(inter_chapters.iterdir()):
                if entry.is_dir() and _CHAPTER_DIR_RE.match(entry.name):
                    _add(f"chapters/{entry.name}/pages")
    return rels


def materialize_pages_from_intermediates(
    processed_root: Path,
    report_dir: Path | None,
) -> int:
    """Copy retired page JSON back into processed when ``pages/`` is empty.

    Needed so rewrite / re-consolidate can run from report intermediates without
    leaving those files in ``shared/processed`` after the final is written.
    """
    if report_dir is None:
        return 0
    copied = 0
    for rel in consolidated_page_rels(processed_root, report_dir):
        dest = processed_root / rel
        src = report_intermediates_dir(report_dir, rel)
        if src is None:
            continue
        # Copy any missing page files (do not skip the whole dir when a
        # partial migrate already dropped 1–2 pages into dest).
        existing = {p.name for p in _primary_page_jsons(dest)}
        for path in _primary_page_jsons(src):
            if path.name in existing:
                continue
            dest.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, dest / path.name)
            copied += 1
    return copied


def retire_consolidated_pages(
    processed_pages: Path,
    *,
    report_dir: Path | None,
    rel: str,
) -> int:
    """Remove intermediate page JSON from ``shared/processed`` after a final.

    When ``report_dir`` is set, move files under ``intermediates/<rel>/`` so
    rebuild can materialize them again. Otherwise delete.
    """
    paths = list(processed_pages.glob("page-*.json")) if processed_pages.is_dir() else []
    if not paths:
        if processed_pages.is_dir():
            try:
                processed_pages.rmdir()
            except OSError:
                pass
        return 0

    moved = 0
    dest_root = report_intermediates_dir(report_dir, rel)
    if dest_root is not None:
        dest_root.mkdir(parents=True, exist_ok=True)
    for path in sorted(paths):
        if dest_root is not None:
            dest = dest_root / path.name
            if dest.exists():
                dest.unlink()
            shutil.move(str(path), str(dest))
        else:
            path.unlink()
        moved += 1
    if processed_pages.is_dir():
        try:
            processed_pages.rmdir()
        except OSError:
            pass
    return moved


def retire_all_consolidated_pages(
    processed_root: Path,
    report_dir: Path | None,
    *,
    chapter_dirs: Iterable[Path] | None = None,
    front_matter: bool = True,
    cas_index: bool = True,
    synonym_index: bool = True,
) -> int:
    """Retire page JSON for every consolidated final that exists on disk."""
    total = 0
    cas_final = processed_root / CAS_INDEX_FINAL_REL
    legacy_cas = processed_root / "appendix" / "cas-index" / CAS_INDEX_JSON_NAME
    if cas_index and (cas_final.is_file() or legacy_cas.is_file()):
        total += retire_consolidated_pages(
            processed_root / CAS_INDEX_PAGES_REL,
            report_dir=report_dir,
            rel=CAS_INDEX_PAGES_REL,
        )
        _rm_empty_dir(processed_root / "appendix" / "cas-index")
    syn_final = processed_root / SYNONYM_INDEX_FINAL_REL
    legacy_syn = processed_root / "appendix" / "synonyms" / SYNONYM_INDEX_JSON_NAME
    if synonym_index and (syn_final.is_file() or legacy_syn.is_file()):
        total += retire_consolidated_pages(
            processed_root / SYNONYM_PAGES_REL,
            report_dir=report_dir,
            rel=SYNONYM_PAGES_REL,
        )
        _rm_empty_dir(processed_root / "appendix" / "synonyms")
    if front_matter and (
        processed_root / "front-matter" / FRONT_MATTER_JSON_NAME
    ).is_file():
        total += retire_consolidated_pages(
            processed_root / FRONT_MATTER_PAGES_REL,
            report_dir=report_dir,
            rel=FRONT_MATTER_PAGES_REL,
        )

    chapters_root = processed_root / "chapters"
    dirnames: set[str] = set()
    if chapter_dirs is not None:
        dirnames = {p.name for p in chapter_dirs}
    elif chapters_root.is_dir():
        for entry in chapters_root.iterdir():
            if entry.is_dir() and _CHAPTER_DIR_RE.match(entry.name):
                dirnames.add(entry.name)
            elif (
                entry.is_file()
                and entry.suffix == ".json"
                and _CHAPTER_DIR_RE.match(entry.stem)
            ):
                dirnames.add(entry.stem)

    for dirname in sorted(dirnames):
        flat = chapter_final_path(processed_root, dirname)
        nested_legacy = chapters_root / dirname / LEGACY_CHAPTER_JSON_NAME
        if not flat.is_file() and not nested_legacy.is_file():
            continue
        rel = f"chapters/{dirname}/pages"
        chapter_dir = chapters_root / dirname
        total += retire_consolidated_pages(
            chapter_dir / "pages",
            report_dir=report_dir,
            rel=rel,
        )
        if nested_legacy.is_file() and flat.is_file():
            nested_legacy.unlink(missing_ok=True)
        _rm_empty_dir(chapter_dir)
    return total


def rewrite_appendix_index_page_rows(processed_root: Path) -> int:
    """Re-parse CAS/synonym per-page dumps so rows match table public shape.

    Returns the number of page files rewritten.
    """
    from yaws1999.cas_index import parse_cas_index_lines
    from yaws1999.synonym_index import parse_synonym_index_lines

    specs = (
        (processed_root / CAS_INDEX_PAGES_REL, "casIndex", parse_cas_index_lines),
        (processed_root / SYNONYM_PAGES_REL, "synonymIndex", parse_synonym_index_lines),
    )
    rewritten = 0
    for pages_dir, kind, parse_fn in specs:
        if not pages_dir.is_dir():
            continue
        for path in _primary_page_jsons(pages_dir):
            try:
                doc = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            if doc.get("kind") != kind:
                continue
            lines = [str(x) for x in (doc.get("lines") or [])]
            page = int(doc.get("djvuPage") or int(path.stem.split("-")[1]))
            parsed = parse_fn(lines, page)
            new_rows = [e.to_dict() for e in parsed.entries]
            if doc.get("rows") == new_rows and doc.get("unparsed") == parsed.unparsed:
                continue
            doc["rows"] = new_rows
            doc["unparsed"] = parsed.unparsed
            path.write_text(
                json.dumps(doc, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            rewritten += 1
    return rewritten
