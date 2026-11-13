"""PAGE= / --page selection helpers for parse_yaws1999."""
from __future__ import annotations

from pathlib import Path

import pytest

from yaws1999.chapters import default_chapters
from yaws1999.parse_tables import _freeform_page_path, _normalize_pages, _variant_tag
from yaws1999.row_parser import collect_equations


def test_normalize_pages_none():
    assert _normalize_pages(None) is None
    assert _normalize_pages([]) is None


def test_normalize_pages_unique():
    assert _normalize_pages([37, 37, 38]) == {37, 38}


def test_normalize_pages_rejects_zero():
    with pytest.raises(ValueError, match="page must be >= 1"):
        _normalize_pages([0])


def test_variant_tag_includes_quant_and_dpi():
    assert _variant_tag("q8", 200) == "q8.dpi200"
    assert _variant_tag("bf16", 400) == "bf16.dpi400"


def test_freeform_page_path_chapter_layout(tmp_path: Path):
    chapters = default_chapters()
    doc = {"kind": "page", "printedPage": 24, "djvuPage": 33}
    primary = _freeform_page_path(
        tmp_path,
        33,
        document=doc,
        tag="q8.dpi400",
        no_replace=False,
        chapters=chapters,
    )
    assert primary is not None
    rel = str(primary).replace("\\", "/")
    assert "chapters/ch02-" in rel
    assert "/pages/page-0033.json" in rel
    assert primary.name == "page-0033.json"
    primary.write_text("{}", encoding="utf-8")

    reports = tmp_path / "reports"
    alt = _freeform_page_path(
        tmp_path,
        33,
        document=doc,
        tag="q8.dpi200",
        no_replace=True,
        chapters=chapters,
        report_dir=reports,
    )
    assert alt is not None
    assert "variants" in str(alt).replace("\\", "/")
    assert "appendix/scratch" not in str(alt).replace("\\", "/")
    alt.write_text("{}", encoding="utf-8")
    assert (
        _freeform_page_path(
            tmp_path,
            33,
            document=doc,
            tag="q8.dpi200",
            no_replace=True,
            chapters=chapters,
            report_dir=reports,
        )
        is None
    )


def test_freeform_page_path_cas_appendix(tmp_path: Path):
    doc = {"kind": "casIndex", "printedPage": 629, "djvuPage": 638}
    path = _freeform_page_path(
        tmp_path,
        638,
        document=doc,
        tag=None,
        no_replace=False,
        chapters=default_chapters(),
    )
    assert path is not None
    assert str(path).replace("\\", "/").endswith(
        "appendix/cas-index/pages/page-0638.json"
    )


def test_freeform_page_path_synonym_appendix(tmp_path: Path):
    doc = {"kind": "synonymIndex", "printedPage": 669, "djvuPage": 678}
    path = _freeform_page_path(
        tmp_path,
        678,
        document=doc,
        tag=None,
        no_replace=False,
        chapters=default_chapters(),
    )
    assert path is not None
    assert str(path).replace("\\", "/").endswith(
        "appendix/synonyms/pages/page-0678.json"
    )


def test_collect_equations_dedupes():
    lines = [
        "Cp = A + B T + C T^2  (CP-joule/(mol K), T - K)",
        "noise",
        "Cp = A + B T + C T^2  (CP-joule/(mol K), T - K)",
    ]
    eqs = collect_equations(lines)
    assert len(eqs) == 1
    assert "Cp = A" in eqs[0]
