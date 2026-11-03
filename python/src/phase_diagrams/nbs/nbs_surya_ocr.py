"""
phase_diagrams.nbs.nbs_surya_ocr — OCR NSRDS-NBS 61 Table I pages with Surya.

Surya returns layout blocks; the Table block’s HTML keeps real subscripts
(``BF<sub>3</sub>-N<sub>2</sub>O``). That HTML is flattened to the double-spaced
line dump ``build_nbs_index`` already parses.

Requires ``surya-ocr`` and a ``llama-server`` binary (``LLAMA_CPP_BINARY``).

Spec: docs/scripts/phase-diagrams/NBS.md § Text index
"""
from __future__ import annotations

import os
import re
from collections.abc import Callable
from html.parser import HTMLParser
from pathlib import Path

import numpy as np
from PIL import Image

from phase_diagrams.rendering.pdf_renderer import render_page

_DPI = 400
_DEFAULT_LLAMA_BIN = Path("/opt/llama-cpp/llama-server")
# Dev fallback while the python image has not been rebuilt with llama-server yet.
_FALLBACK_LLAMA_BINS = (
    Path("/app/reports/phase-diagrams/nbs/llama-cpp/llama-server"),
    Path("/app/reports/phase-diagrams/nbs/ocr-trial/llama-cpp/llama-b12061/llama-server"),
)


def dump_nbs_table_ocr(
    pdf_path: Path | str,
    first_page: int,
    last_page: int,
    cache_dir: Path | str | None = None,
    dpi: int = _DPI,
    progress: Callable[[int, int], None] | None = None,
) -> str:
    """OCR Table I pages ``first_page``…``last_page`` (1-based); pages separated by ``\\f``."""
    ensure_llama_env()
    pages: list[str] = []
    for page in range(first_page, last_page + 1):
        if progress:
            progress(page, last_page)
        image = render_page(pdf_path, page, dpi=dpi, cache_dir=cache_dir, cache_stem="nbs-table")
        if page == first_page and first_page > 1:
            pages.extend([""] * (first_page - 1))
        pages.append(ocr_page_text(image))
    return "\f".join(pages) + "\f"


def ocr_page_text(image: np.ndarray) -> str:
    """One rendered page → NBS dump lines (locator, system, mol%, T, refs)."""
    html = ocr_page_table_html(image)
    if not html:
        return ""
    return "\n".join(table_html_to_lines(html))


def ocr_page_table_html(image: np.ndarray) -> str:
    """Run Surya full-page OCR and return the first ``<table>…</table>`` HTML block."""
    from surya.recognition import RecognitionPredictor

    picture = Image.fromarray(image if image.ndim == 2 else np.asarray(Image.fromarray(image).convert("RGB")))
    if picture.mode != "RGB":
        picture = picture.convert("RGB")
    prediction = RecognitionPredictor()([picture], full_page=True)[0]
    tables = [
        block.html
        for block in prediction.blocks
        if not block.skipped and block.html and "<table>" in block.html.lower()
    ]
    if tables:
        # Prefer the largest table (Table I body, not a tiny fragment).
        return max(tables, key=len)
    # Fallback: any block HTML that mentions a locator-like row.
    for block in prediction.blocks:
        if block.html and re.search(r"<td>\s*\d{1,4}\s*</td>", block.html, re.I):
            return block.html
    return ""


def table_html_to_lines(html: str) -> list[str]:
    """Flatten Surya table HTML to ``build_nbs_index`` lines (fields separated by two spaces)."""
    rows = _parse_table_rows(html)
    lines: list[str] = []
    for cells in rows:
        if len(cells) < 4:
            continue
        locator = _plain(cells[0]).strip().rstrip(".")
        if not locator.isdigit():
            continue
        system = _formula_cell(cells[1])
        composition = _composition_cell(cells[2])
        temperature = _temperature_cell(cells[3])
        references = _plain(cells[4]).strip() if len(cells) > 4 else ""
        # Double spaces → column split in nbs_entry_index.
        parts = [locator, system, composition, temperature]
        line = "  ".join(p for p in parts if p)
        if references:
            line = f"{line}  {references}"
        lines.append(line)
    return lines


def ensure_llama_env() -> None:
    """Point Surya at ``llama-server`` (image path, env, or reports fallback)."""
    candidates = [
        Path(os.environ["LLAMA_CPP_BINARY"]) if os.environ.get("LLAMA_CPP_BINARY") else None,
        _DEFAULT_LLAMA_BIN,
        *_FALLBACK_LLAMA_BINS,
    ]
    binary: Path | None = next((p for p in candidates if p is not None and p.is_file()), None)
    if binary is None:
        tried = [str(p) for p in candidates if p is not None]
        raise FileNotFoundError(
            "llama-server not found. Tried: "
            + ", ".join(tried)
            + ". Rebuild the python image (Dockerfile installs /opt/llama-cpp) "
            "or set LLAMA_CPP_BINARY."
        )
    os.environ["LLAMA_CPP_BINARY"] = str(binary)
    lib_dir = str(binary.resolve().parent)
    existing = os.environ.get("LD_LIBRARY_PATH", "")
    if lib_dir not in existing.split(":"):
        os.environ["LD_LIBRARY_PATH"] = f"{lib_dir}:{existing}" if existing else lib_dir


def _formula_cell(raw: str) -> str:
    """``BF<sub>3</sub>-N<sub>2</sub>O`` → ``BF3-N2O``."""
    text = raw
    text = re.sub(r"<sub>\s*([^<]*?)\s*</sub>", r"\1", text, flags=re.I)
    text = re.sub(r"<sup>\s*([^<]*?)\s*</sup>", r"\1", text, flags=re.I)
    text = _plain(text)
    text = text.replace("–", "-").replace("—", "-").replace("−", "-")
    text = re.sub(r"\s+", "", text)
    return text


def _composition_cell(raw: str) -> str:
    text = _plain(raw).strip()
    text = text.replace("–", "-").replace("—", "-")
    text = text.replace("SERSOLIDSOL", "SER SOLID SOL")
    text = re.sub(r"(?<=\d)(?=APP\b)", " ", text, flags=re.I)
    text = re.sub(r"(?<=[\d.])(?=SER\b)", " ", text, flags=re.I)
    text = re.sub(r"(?<=\d)(?=LT\b)", " ", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _temperature_cell(raw: str) -> str:
    text = _plain(raw).strip()
    text = text.replace("–", "-").replace("—", "-").replace("−", "-")
    # ``-138.0±.25`` / ``-59.0APP`` → tokens the entry index already understands.
    text = re.sub(r"(?<=\d)\s*±\s*", " +", text)
    text = re.sub(r"(?<=\d|\.)(?=APP\b)", " ", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _plain(raw: str) -> str:
    text = re.sub(r"<br\s*/?>", " ", raw, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return text.replace("&nbsp;", " ").replace("&amp;", "&")


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
            # Keep tags so _formula_cell can promote subscripts to digits.
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
