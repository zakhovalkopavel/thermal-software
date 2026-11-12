"""PAGE= / --page selection helpers for parse_yaws1999."""
from __future__ import annotations

from pathlib import Path

import pytest

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


def test_freeform_page_path_no_replace(tmp_path: Path):
    primary = tmp_path / "page-0650.json"
    primary.write_text("{}", encoding="utf-8")
    assert _freeform_page_path(tmp_path, 650, tag="q8.dpi400", no_replace=False) == primary
    alt = _freeform_page_path(tmp_path, 650, tag="q8.dpi200", no_replace=True)
    assert alt == tmp_path / "page-0650.q8.dpi200.json"
    (tmp_path / "page-0650.q8.dpi200.json").write_text("{}", encoding="utf-8")
    assert _freeform_page_path(tmp_path, 650, tag="q8.dpi200", no_replace=True) is None
    assert _freeform_page_path(tmp_path, 650, tag="q8.dpi400", no_replace=True) == (
        tmp_path / "page-0650.q8.dpi400.json"
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
