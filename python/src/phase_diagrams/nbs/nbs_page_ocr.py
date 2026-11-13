"""
phase_diagrams.nbs.nbs_page_ocr — NSRDS-NBS 61 Table I page OCR helpers.

``dump_nbs_table_ocr`` uses page-ocr VLM (``nbs_vlm_ocr``). The Tesseract char-box path
below remains for tests and as ``engine="tesseract"`` fallback.

Spec: docs/scripts/phase-diagrams/NBS.md § Text index
"""
from __future__ import annotations

import re
import subprocess
import tempfile
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from statistics import median

import numpy as np
from PIL import Image, ImageOps

from source_extract.diagrams.rendering.pdf_renderer import render_page

_DPI = 400
_PSM = "--psm 6"
_LINE_BAND = 0.55  # fraction of median letter height to cluster lines
_WORD_GAP = 1.4    # × median letter width → new word
_COLUMN_GAP = 3.5  # × median letter width → two spaces (entry-index field split)
_SUB_HEIGHT = 0.78
_SUB_DROP = 0.12
_SUB_SCALE = 4
_SUB_PAD = 3
_DIGIT_LIKE = set(",.'°`")
# Tesseract often emits the two letters of Al/Ge in reverse on one overlapping pair of boxes.
_INVERTED_ELEMENTS: dict[tuple[str, str], str] = {
    ("e", "G"): "Ge",
    ("l", "A"): "Al",
    ("I", "A"): "Al",
    ("1", "A"): "Al",
    ("L", "A"): "Al",
}
# Chlorine ``l`` misread as a bracket / tall I after ``C``.
_CL_TAIL = set(")}]/I1|")


@dataclass(frozen=True)
class CharBox:
    """One Tesseract character box; ``bottom``/``top`` use Tesseract's bottom-left origin."""

    char: str
    left: int
    bottom: int
    right: int
    top: int

    @property
    def height(self) -> int:
        return max(1, self.top - self.bottom)

    @property
    def width(self) -> int:
        return max(1, self.right - self.left)

    @property
    def cy(self) -> float:
        return (self.top + self.bottom) / 2.0


def dump_nbs_table_ocr(
    pdf_path: Path | str,
    first_page: int,
    last_page: int,
    cache_dir: Path | str | None = None,
    dpi: int = _DPI,
    progress: Callable[[int, int], None] | None = None,
    engine: str = "vlm",
) -> str:
    """OCR Table I pages ``first_page``…``last_page`` (1-based); pages separated by ``\\f``.

    Default ``engine="vlm"`` (full-page VLM HTML via page-ocr). ``engine="tesseract"``
    keeps the char-box path.
    """
    if engine == "vlm":
        from phase_diagrams.nbs.nbs_vlm_ocr import dump_nbs_table_ocr as _vlm_dump

        return _vlm_dump(pdf_path, first_page, last_page, cache_dir=cache_dir, dpi=dpi, progress=progress)
    if engine != "tesseract":
        raise ValueError(f"unknown NBS OCR engine {engine!r} (expected 'vlm' or 'tesseract')")
    pages: list[str] = []
    for page in range(first_page, last_page + 1):
        if progress:
            progress(page, last_page)
        image = render_page(pdf_path, page, dpi=dpi, cache_dir=cache_dir, cache_stem="nbs-table")
        # Pad leading empty pages so build_nbs_index pdf_page matches the real PDF page.
        if page == first_page and first_page > 1:
            pages.extend([""] * (first_page - 1))
        pages.append(ocr_page_text_tesseract(image))
    return "\f".join(pages) + "\f"


def ocr_page_text(image: np.ndarray) -> str:
    """Full page text via page-ocr VLM (preferred) with Tesseract fallback if unavailable."""
    try:
        from phase_diagrams.nbs.nbs_vlm_ocr import ocr_page_text as _vlm_page

        return _vlm_page(image)
    except Exception:
        return ocr_page_text_tesseract(image)


def ocr_page_text_tesseract(image: np.ndarray) -> str:
    """Full page text with subscript digits recovered from Tesseract glyph crops."""
    chars = read_char_boxes(image)
    if not chars:
        return ""
    page = image if image.ndim == 2 else np.asarray(Image.fromarray(image).convert("L"))
    lines = _cluster_lines(chars)
    return "\n".join(assemble_line(line, page) for line in lines if line)


def read_char_boxes(image: np.ndarray) -> list[CharBox]:
    """Tesseract character boxes for a grey page image."""
    picture = Image.fromarray(image if image.ndim == 2 else np.asarray(Image.fromarray(image).convert("L")))
    raw = _tesseract_boxes(picture)
    boxes: list[CharBox] = []
    for line in raw.splitlines():
        parts = line.split()
        if len(parts) < 5:
            continue
        char, left, bottom, right, top = parts[0], int(parts[1]), int(parts[2]), int(parts[3]), int(parts[4])
        if char == "~":
            continue
        boxes.append(CharBox(char=char, left=left, bottom=bottom, right=right, top=top))
    return boxes


def assemble_line(chars: list[CharBox], page: np.ndarray | None = None) -> str:
    """One reading-order line: words separated by spaces; wide gaps become two spaces for columns."""
    if not chars:
        return ""
    letters = [c for c in chars if c.char.isalpha()]
    med_w = median(c.width for c in letters) if letters else median(c.width for c in chars)
    words: list[list[CharBox]] = [[chars[0]]]
    gaps: list[int] = []
    for prev, cur in zip(chars, chars[1:]):
        gap = cur.left - prev.right
        force = (
            prev.char.isdigit() and cur.char in "+±"
        ) or (
            prev.char.isdigit() and cur.char == "A"
        )
        if force or gap > _WORD_GAP * med_w:
            gaps.append(int(_WORD_GAP * med_w) + 1 if force else gap)
            words.append([cur])
        else:
            words[-1].append(cur)
    parts: list[str] = [assemble_word(words[0], page)]
    for gap, word in zip(gaps, words[1:]):
        parts.append("  " if gap > _COLUMN_GAP * med_w else " ")
        parts.append(assemble_word(word, page))
    return _repair_line_spaces("".join(parts))


def assemble_word(chars: list[CharBox], page: np.ndarray | None = None) -> str:
    """Rewrite subscript-sized glyphs to digits (re-OCR when the page image is available)."""
    if not chars:
        return ""
    letters = [c for c in chars if c.char.isalpha()]
    if not letters:
        return _plain(chars)
    med_h = median(c.height for c in letters)
    baseline = median(c.cy for c in letters)
    out: list[str] = []
    i = 0
    while i < len(chars):
        glyph = chars[i]
        swapped = _inverted_element(chars, i)
        if swapped is not None:
            out.append(swapped)
            i += 2
            continue
        ch = glyph.char
        if ch in "—–−":
            out.append("-")
            i += 1
            continue
        if out and out[-1] == "C" and ch in _CL_TAIL and not _is_subscript(glyph, med_h, baseline):
            out.append("l")
            i += 1
            continue
        if _is_subscript(glyph, med_h, baseline):
            piece = _subscript_digit(glyph, page)
        else:
            piece = ch
        # ``As`` / ``Os``: second letter often OCR'd as ``5`` or marked as a subscript ``s``.
        if out and out[-1] in "AO" and piece in "5sS":
            piece = "s"
        out.append(piece)
        i += 1
    return "".join(out)


def read_subscript_digit(page: np.ndarray, glyph: CharBox) -> str | None:
    """Upscale a subscript crop and OCR with a digit whitelist; None if not a clear digit.

    Tiny subscript crops are unreliable under a single ``--psm``: sparse digits often
    need word/raw-line modes (8/13) rather than single-character mode (10). Try those
    first, then 10; accept the first single digit returned.

    Tall comma boxes (common after ``VOCl``) pull neighbouring ink — crop the lower
    portion of the glyph instead of the full box.
    """
    height = page.shape[0]
    left = max(0, glyph.left - _SUB_PAD)
    right = min(page.shape[1], glyph.right + _SUB_PAD)
    if glyph.height >= 32:
        mid_top = glyph.bottom + int(glyph.height * 0.55)
        upper = max(0, height - mid_top - _SUB_PAD)
        lower = min(height, height - glyph.bottom + _SUB_PAD)
        psms = ("10", "8", "13")
    else:
        upper = max(0, height - glyph.top - _SUB_PAD)
        lower = min(height, height - glyph.bottom + _SUB_PAD)
        psms = ("8", "13", "10")
    if right <= left or lower <= upper:
        return None
    crop = Image.fromarray(page[upper:lower, left:right])
    crop = crop.resize((max(1, crop.size[0] * _SUB_SCALE), max(1, crop.size[1] * _SUB_SCALE)), Image.Resampling.LANCZOS)
    crop = ImageOps.autocontrast(crop)
    arr = np.asarray(crop)
    for thr in (180, 160, 200):
        binary = Image.fromarray(np.where(arr < thr, 0, 255).astype(np.uint8))
        for psm in psms:
            text = _tesseract_string(binary, f"--psm {psm} -c tessedit_char_whitelist=0123456789")
            digits = "".join(c for c in text if c.isdigit())
            if digits:
                return digits[:1]
    return None


def _tesseract_boxes(picture: Image.Image) -> str:
    try:
        import pytesseract
        return pytesseract.image_to_boxes(picture, config=_PSM)
    except ImportError:
        return _tesseract_cli(picture, "makebox", _PSM)


def _tesseract_string(picture: Image.Image, config: str) -> str:
    try:
        import pytesseract
        return pytesseract.image_to_string(picture, config=config).strip()
    except ImportError:
        return _tesseract_cli(picture, "stdout", config).strip()


def _tesseract_cli(picture: Image.Image, out_kind: str, config: str) -> str:
    """Host fallback when ``pytesseract`` is not installed (container uses pytesseract)."""
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "glyph.png"
        picture.save(path)
        extra = config.split()
        if out_kind == "makebox":
            return subprocess.check_output(["tesseract", str(path), "stdout", *extra, "makebox"], text=True)
        return subprocess.check_output(["tesseract", str(path), "stdout", *extra], text=True)


def _is_subscript(glyph: CharBox, med_h: float, baseline: float) -> bool:
    dropped = glyph.cy < baseline - _SUB_DROP * med_h
    small = glyph.height < _SUB_HEIGHT * med_h
    # Punctuation stand-ins for digits often get a full-height box; trust vertical drop.
    if glyph.char in _DIGIT_LIKE:
        return dropped
    return small and dropped


def _inverted_element(chars: list[CharBox], index: int) -> str | None:
    """``eG``/``lA``/``IA`` on overlapping boxes → ``Ge``/``Al``."""
    if index + 1 >= len(chars):
        return None
    first, second = chars[index], chars[index + 1]
    fixed = _INVERTED_ELEMENTS.get((first.char, second.char))
    if fixed is None:
        return None
    # Same origin or the first box swallows the second (typical Ge/Al mis-segmentation).
    if first.left == second.left or second.left < first.left + first.width * 0.35:
        return fixed
    return None


def _repair_line_spaces(line: str) -> str:
    """Restore spaces Tesseract drops inside known multi-word Table I remarks."""
    line = re.sub(r"^(\d{1,4})(?=[A-Za-z(])", r"\1 ", line)  # ``12NH3`` → ``12 NH3``
    line = re.sub(r"^(\d{1,4})\.(?=\s|[A-Za-z])", r"\1 ", line)  # ``17.NH3`` / ``53. A``
    line = line.replace("SERSOLIDSOL", "SER SOLID SOL")
    line = re.sub(r"(?<=[\d.])(?=SER SOLID SOL)", " ", line)
    line = re.sub(r"(?<=\d)(?=LT\b)", " ", line)
    line = re.sub(r"\bI6\s*ABr", "AlBr", line)
    return line


def _subscript_digit(glyph: CharBox, page: np.ndarray | None) -> str:
    """Prefer a digit from the glyph crop; fall back to the OCR char / digit-like punctuation."""
    if glyph.char.isdigit():
        return glyph.char
    if page is not None and (glyph.char in _DIGIT_LIKE or glyph.char in "sSoO"):
        digit = read_subscript_digit(page, glyph)
        if digit:
            return digit
    if glyph.char in "sS":
        return "5"
    if glyph.char in "oO":
        return "0"
    if glyph.char in _DIGIT_LIKE:
        return glyph.char
    return glyph.char


def _plain(chars: list[CharBox]) -> str:
    return "".join("-" if c.char in "—–−" else c.char for c in chars)


def _cluster_lines(chars: list[CharBox]) -> list[list[CharBox]]:
    """Group characters into lines (top of page first)."""
    letters = [c for c in chars if c.char.isalpha()]
    band = _LINE_BAND * (median(c.height for c in letters) if letters else 20)
    ordered = sorted(chars, key=lambda c: (-c.cy, c.left))
    lines: list[list[CharBox]] = []
    for glyph in ordered:
        placed = False
        for line in lines:
            if abs(median(c.cy for c in line) - glyph.cy) <= band:
                line.append(glyph)
                placed = True
                break
        if not placed:
            lines.append([glyph])
    for line in lines:
        line.sort(key=lambda c: c.left)
    return lines
