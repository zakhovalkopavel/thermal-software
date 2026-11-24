"""Table header detection on plain page text."""
from __future__ import annotations

from yaws1999.table_catalog import header_on_page


def test_header_on_page_strips_continued():
    text = "Table 2-1 HEAT CAPACITY OF GAS - ORGANIC COMPOUNDS (continued)\nNO FORMULA\n"
    assert header_on_page(text) == ("2-1", "HEAT CAPACITY OF GAS - ORGANIC COMPOUNDS")


def test_header_on_page_ignores_chapter_prose():
    text = "Results for enthalpy of combustion are presented for major organic chemicals. The results are\n"
    assert header_on_page(text) is None
