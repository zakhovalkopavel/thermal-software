"""
yaws1999.page_lines — Rebuild reading-order lines from DjVu word boxes.

Words are clustered by vertical center (band = fraction of median glyph height),
then sorted left-to-right within each cluster. Same idea as the NBS Tesseract
char-box line assembly, but using the existing text layer instead of OCR.
"""
from __future__ import annotations

from statistics import mean, median

from yaws1999.word_box import WordBox

_LINE_BAND = 0.55  # fraction of median word height → same line


def reconstruct_lines(words: list[WordBox], band_fraction: float = _LINE_BAND) -> list[str]:
    """Join word boxes into top-to-bottom, left-to-right text lines."""
    if not words:
        return []
    med_h = median(w.height for w in words)
    band = max(1.0, med_h * band_fraction)
    ordered = sorted(words, key=lambda w: (-w.cy, w.x0))
    rows: list[list[WordBox]] = []
    current: list[WordBox] = []
    current_cy: float | None = None
    for word in ordered:
        if current_cy is None or abs(word.cy - current_cy) <= band:
            current.append(word)
            current_cy = mean(w.cy for w in current)
        else:
            rows.append(sorted(current, key=lambda w: w.x0))
            current = [word]
            current_cy = word.cy
    if current:
        rows.append(sorted(current, key=lambda w: w.x0))
    return [_join_row(row) for row in rows]


def _join_row(row: list[WordBox]) -> str:
    return " ".join(w.text for w in row).strip()
