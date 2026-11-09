"""
yaws1999.surya_ocr — OCR one Yaws DjVu page with Surya (same stack as NBS ``nbs-index``).

Renders the page with ``ddjvu``, runs Surya full-page recognition, prefers the largest
``<table>`` HTML block, and flattens each row to a single space-separated line for
``row_parser``. Non-table blocks (title, equation) are kept as plain lines above the table.

Requires ``surya-ocr`` and ``llama-server`` (``LLAMA_CPP_BINARY``), as for NSRDS-NBS 61.
"""
from __future__ import annotations

import re
from html.parser import HTMLParser
from pathlib import Path

import numpy as np
from PIL import Image

from yaws1999.djvu_renderer import render_page

_DPI = 400


def ocr_djvu_page(
    djvu_path: Path | str,
    page: int,
    cache_dir: Path | str | None = None,
    dpi: int = _DPI,
    predictor: object | None = None,
) -> list[str]:
    """Render + OCR one DjVu page; return reading-order text lines."""
    image = render_page(djvu_path, page, dpi=dpi, cache_dir=cache_dir, cache_stem="yaws")
    return ocr_page_lines(image, predictor=predictor)


def ocr_page_lines(image: np.ndarray, predictor: object | None = None) -> list[str]:
    """Surya full-page OCR → title/equation lines + flattened table rows."""
    from phase_diagrams.nbs.nbs_surya_ocr import ensure_llama_env, _recognition_predictor

    ensure_llama_env()
    picture = Image.fromarray(image if image.ndim == 2 else np.asarray(Image.fromarray(image).convert("RGB")))
    if picture.mode != "RGB":
        picture = picture.convert("RGB")
    recognizer = predictor or _recognition_predictor()
    prediction = recognizer([picture], full_page=True)[0]
    return lines_from_prediction(prediction)


def lines_from_prediction(prediction: object) -> list[str]:
    """Flatten one Surya page/strip prediction into reading-order text lines."""
    preamble: list[str] = []
    table_lines: list[str] = []
    best_table = ""
    for block in getattr(prediction, "blocks", []) or []:
        if getattr(block, "skipped", False) or not getattr(block, "html", None):
            continue
        html = block.html
        if "<table>" in html.lower():
            if len(html) > len(best_table):
                best_table = html
            continue
        plain = _plain_line(html)
        if plain:
            preamble.append(plain)

    if best_table:
        table_lines = table_html_to_lines(best_table)
    return preamble + table_lines


def table_html_to_lines(html: str) -> list[str]:
    """Flatten Surya ``<table>`` HTML: one space-separated line per row."""
    lines: list[str] = []
    for cells in _parse_table_rows(html):
        parts = [_cell_text(cell) for cell in cells]
        parts = [p for p in parts if p]
        if parts:
            lines.append(" ".join(parts))
    return lines


def _cell_text(raw: str) -> str:
    """Promote ``<sub>`` / ``<sup>`` digits, strip other tags, collapse spaces."""
    text = re.sub(r"<sub>\s*([^<]*?)\s*</sub>", r"\1", raw, flags=re.I)
    text = re.sub(r"<sup>\s*([^<]*?)\s*</sup>", r"\1", text, flags=re.I)
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = (
        text.replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("–", "-")
        .replace("—", "-")
        .replace("−", "-")
    )
    return re.sub(r"\s+", " ", text).strip()


def _plain_line(html: str) -> str:
    return _cell_text(html)


class _TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.rows: list[list[str]] = []
        self._row: list[str] | None = None
        self._cell: list[str] | None = None
        self._in_cell = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        low = tag.lower()
        if low == "tr":
            self._row = []
        elif low in ("td", "th") and self._row is not None:
            self._cell = []
            self._in_cell = True
        elif low == "br" and self._in_cell and self._cell is not None:
            self._cell.append(" ")
        elif low in ("sub", "sup") and self._in_cell and self._cell is not None:
            self._cell.append(f"<{low}>")

    def handle_endtag(self, tag: str) -> None:
        low = tag.lower()
        if low in ("td", "th") and self._row is not None and self._cell is not None:
            self._row.append("".join(self._cell))
            self._cell = None
            self._in_cell = False
        elif low == "tr" and self._row is not None:
            if self._row:
                self.rows.append(self._row)
            self._row = None
        elif low in ("sub", "sup") and self._in_cell and self._cell is not None:
            self._cell.append(f"</{low}>")

    def handle_data(self, data: str) -> None:
        if self._in_cell and self._cell is not None:
            self._cell.append(data)


def _parse_table_rows(html: str) -> list[list[str]]:
    parser = _TableParser()
    parser.feed(html)
    parser.close()
    return parser.rows
