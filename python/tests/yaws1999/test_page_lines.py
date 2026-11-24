"""Reconstruct reading-order lines from DjVu word boxes."""
from __future__ import annotations

from yaws1999.page_lines import reconstruct_lines
from yaws1999.word_box import WordBox, parse_word_sexp


def test_parse_word_sexp_reads_quoted_tokens():
    sexp = '(page 0 0 100 100 (line 1 2 3 4 (word 10 20 30 40 "NO") (word 50 20 80 40 "FORMULA")))'
    words = parse_word_sexp(sexp)
    assert [(w.text, w.x0, w.y0) for w in words] == [("NO", 10, 20), ("FORMULA", 50, 20)]


def test_reconstruct_lines_orders_top_to_bottom_left_to_right():
    # DjVu y grows upward: higher cy is nearer the top of the page.
    words = [
        WordBox(0, 0, 10, 10, "bottom"),
        WordBox(20, 100, 40, 110, "B"),
        WordBox(0, 100, 10, 110, "A"),
        WordBox(0, 200, 40, 210, "title"),
    ]
    assert reconstruct_lines(words) == ["title", "A B", "bottom"]
