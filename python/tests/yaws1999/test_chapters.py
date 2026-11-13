"""Chapter placement and consolidated chapter.json."""
from __future__ import annotations

import json
from pathlib import Path

from yaws1999.chapters import (
    CAS_INDEX_FINAL_REL,
    CAS_INDEX_JSON_NAME,
    CAS_INDEX_PAGES_REL,
    FRONT_MATTER_JSON_NAME,
    LEGACY_CHAPTER_JSON_NAME,
    SYNONYM_INDEX_FINAL_REL,
    SYNONYM_INDEX_JSON_NAME,
    build_chapter_document,
    build_front_matter_document,
    chapter_final_path,
    default_chapters,
    materialize_pages_from_intermediates,
    migrate_chapter_pages,
    migrate_front_matter_pages,
    migrate_nested_appendix_json,
    migrate_nested_chapter_json,
    placement_for_page,
    purge_appendix_scratch,
    retire_all_consolidated_pages,
    retire_consolidated_pages,
    write_chapter_datasets,
    write_front_matter_dataset,
)


def test_chapter_placement_uses_pages_subdir():
    bucket, directory = placement_for_page(
        kind="page",
        printed_page=24,
        chapters=default_chapters(),
    )
    assert bucket == "chapter"
    assert directory.startswith("chapters/ch02-")
    assert directory.endswith("/pages")


def test_build_chapter_document_joins_lines_and_equations():
    span = next(s for s in default_chapters() if s.number == 2)
    doc = build_chapter_document(
        span,
        [
            {
                "djvuPage": 34,
                "printedPage": 25,
                "equation": "eq-b",
                "equations": ["eq-b", "eq-c"],
                "lines": ["page-b"],
            },
            {
                "djvuPage": 33,
                "printedPage": 24,
                "equation": "eq-a",
                "equations": ["eq-a"],
                "lines": ["page-a-1", "page-a-2"],
            },
        ],
        ref_key="Yaws1999",
    )
    assert doc["id"] == "2"
    assert doc["title"] == span.title
    assert doc["kind"] == "chapter"
    assert doc["pages"] == {"first": 24, "last": 25}
    assert "equation" not in doc
    assert doc["equations"] == ["eq-a", "eq-b", "eq-c"]
    assert doc["lines"] == ["page-a-1", "page-a-2", "page-b"]
    assert list(doc.keys())[-1] == "lines"


def test_migrate_and_write_chapter_datasets(tmp_path: Path):
    span = next(s for s in default_chapters() if s.number == 2)
    chapter_dir = tmp_path / "chapters" / span.dirname
    chapter_dir.mkdir(parents=True)
    (chapter_dir / "page-0033.json").write_text(
        json.dumps(
            {
                "kind": "page",
                "djvuPage": 33,
                "printedPage": 24,
                "equation": "Cp = A",
                "equations": ["Cp = A"],
                "lines": ["Chapter 2"],
            }
        ),
        encoding="utf-8",
    )
    moves = migrate_chapter_pages(tmp_path)
    assert moves
    assert (chapter_dir / "pages" / "page-0033.json").is_file()
    assert not (chapter_dir / "page-0033.json").exists()

    written = write_chapter_datasets(
        tmp_path, chapters=default_chapters(), ref_key="Yaws1999",
    )
    assert len(written) == 1
    out = chapter_final_path(tmp_path, span.dirname)
    assert out.is_file()
    assert out.name == f"{span.dirname}.json"
    assert out.parent.name == "chapters"
    doc = json.loads(out.read_text(encoding="utf-8"))
    assert doc["id"] == "2"
    assert doc["lines"] == ["Chapter 2"]
    assert list(doc.keys())[-1] == "lines"


def test_migrate_nested_chapter_json_flattens(tmp_path: Path):
    span = next(s for s in default_chapters() if s.number == 5)
    nested = tmp_path / "chapters" / span.dirname
    nested.mkdir(parents=True)
    (nested / LEGACY_CHAPTER_JSON_NAME).write_text(
        json.dumps({"id": "5", "kind": "chapter", "lines": ["x"]}),
        encoding="utf-8",
    )
    moves = migrate_nested_chapter_json(tmp_path)
    assert len(moves) == 1
    flat = chapter_final_path(tmp_path, span.dirname)
    assert flat.is_file()
    assert not (nested / LEGACY_CHAPTER_JSON_NAME).exists()
    assert json.loads(flat.read_text(encoding="utf-8"))["id"] == "5"


def test_front_matter_placement_uses_pages_subdir():
    bucket, directory = placement_for_page(
        kind="page",
        printed_page=-1,
        chapters=default_chapters(),
    )
    assert bucket == "front-matter"
    assert directory == "front-matter/pages"


def test_migrate_and_write_front_matter(tmp_path: Path):
    fm = tmp_path / "front-matter"
    fm.mkdir(parents=True)
    (fm / "page-0001.json").write_text(
        json.dumps(
            {
                "kind": "page",
                "djvuPage": 1,
                "printedPage": -8,
                "equation": None,
                "equations": [],
                "lines": ["CHEMICAL PROPERTIES HANDBOOK"],
            }
        ),
        encoding="utf-8",
    )
    (fm / "page-0002.json").write_text(
        json.dumps(
            {
                "kind": "page",
                "djvuPage": 2,
                "printedPage": -7,
                "equation": None,
                "equations": [],
                "lines": ["CONTENTS"],
            }
        ),
        encoding="utf-8",
    )
    moves = migrate_front_matter_pages(tmp_path)
    assert len(moves) == 2
    assert (fm / "pages" / "page-0001.json").is_file()
    assert not (fm / "page-0001.json").exists()

    out = write_front_matter_dataset(tmp_path, ref_key="Yaws1999")
    assert out is not None
    assert out.name == FRONT_MATTER_JSON_NAME
    doc = json.loads(out.read_text(encoding="utf-8"))
    assert doc == build_front_matter_document(
        [
            {
                "djvuPage": 1,
                "printedPage": -8,
                "lines": ["CHEMICAL PROPERTIES HANDBOOK"],
            },
            {"djvuPage": 2, "printedPage": -7, "lines": ["CONTENTS"]},
        ],
        ref_key="Yaws1999",
    )
    assert doc["kind"] == "frontMatter"
    assert doc["lines"] == ["CHEMICAL PROPERTIES HANDBOOK", "CONTENTS"]
    assert list(doc.keys())[-1] == "lines"


def test_migrate_nested_appendix_json_flattens(tmp_path: Path):
    nested_cas = tmp_path / "appendix" / "cas-index" / CAS_INDEX_JSON_NAME
    nested_syn = tmp_path / "appendix" / "synonyms" / SYNONYM_INDEX_JSON_NAME
    nested_cas.parent.mkdir(parents=True)
    nested_syn.parent.mkdir(parents=True)
    nested_cas.write_text('{"kind":"casIndex"}', encoding="utf-8")
    nested_syn.write_text('{"kind":"synonymIndex"}', encoding="utf-8")
    moves = migrate_nested_appendix_json(tmp_path)
    assert len(moves) == 2
    assert (tmp_path / CAS_INDEX_FINAL_REL).is_file()
    assert (tmp_path / SYNONYM_INDEX_FINAL_REL).is_file()
    assert not nested_cas.exists()
    assert not nested_syn.exists()


def test_purge_appendix_scratch_moves_to_reports(tmp_path: Path):
    scratch = tmp_path / "appendix" / "scratch"
    scratch.mkdir(parents=True)
    (scratch / "page-0037.q8.dpi200.json").write_text("{}", encoding="utf-8")
    reports = tmp_path / "reports"
    n = purge_appendix_scratch(tmp_path, reports)
    assert n == 1
    assert not scratch.exists()
    assert (reports / "variants" / "page-0037.q8.dpi200.json").is_file()


def test_retire_consolidated_pages_moves_to_report_intermediates(tmp_path: Path):
    pages = tmp_path / "processed" / CAS_INDEX_PAGES_REL
    pages.mkdir(parents=True)
    (pages / "page-0638.json").write_text('{"kind":"casIndex"}', encoding="utf-8")
    (tmp_path / "processed" / CAS_INDEX_FINAL_REL).write_text("{}", encoding="utf-8")
    reports = tmp_path / "reports"
    n = retire_consolidated_pages(
        pages, report_dir=reports, rel=CAS_INDEX_PAGES_REL,
    )
    assert n == 1
    assert not pages.exists()
    retired = reports / "intermediates" / CAS_INDEX_PAGES_REL / "page-0638.json"
    assert retired.is_file()

    copied = materialize_pages_from_intermediates(tmp_path / "processed", reports)
    assert copied == 1
    assert (pages / "page-0638.json").is_file()


def test_retire_all_skips_when_final_missing(tmp_path: Path):
    pages = tmp_path / CAS_INDEX_PAGES_REL
    pages.mkdir(parents=True)
    (pages / "page-0638.json").write_text("{}", encoding="utf-8")
    assert retire_all_consolidated_pages(tmp_path, tmp_path / "reports") == 0
    assert (pages / "page-0638.json").is_file()


def test_write_then_retire_removes_chapter_pages(tmp_path: Path):
    span = next(s for s in default_chapters() if s.number == 2)
    chapter_dir = tmp_path / "chapters" / span.dirname
    pages = chapter_dir / "pages"
    pages.mkdir(parents=True)
    (pages / "page-0033.json").write_text(
        json.dumps(
            {
                "kind": "page",
                "djvuPage": 33,
                "printedPage": 24,
                "lines": ["Chapter 2"],
            }
        ),
        encoding="utf-8",
    )
    written = write_chapter_datasets(
        tmp_path, chapters=default_chapters(), ref_key="Yaws1999",
    )
    assert written
    reports = tmp_path / "reports"
    n = retire_all_consolidated_pages(tmp_path, reports)
    assert n == 1
    flat = chapter_final_path(tmp_path, span.dirname)
    assert flat.is_file()
    assert not pages.exists()
    assert not chapter_dir.exists()
    assert (
        reports / "intermediates" / f"chapters/{span.dirname}/pages" / "page-0033.json"
    ).is_file()
