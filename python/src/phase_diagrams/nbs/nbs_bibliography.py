"""
phase_diagrams.nbs.nbs_bibliography — Parse NSRDS-NBS 61 Part I Bibliography.

Two-column pages (PDF ``bibliographyPages``) are extracted with ``pdftotext
-layout``, split into left then right columns, then split on ``[n]`` markers.

Spec: docs/scripts/phase-diagrams/NBS.md
"""
from __future__ import annotations

import re
import statistics
import subprocess
from pathlib import Path

# Allow spaces / newlines inside brackets (weak text layer: ``[   1416]``, ``[\n 1186]``).
_REF_MARK = re.compile(r"\[\s*(\d+)\s*\]", re.MULTILINE)
_FOOTER_LINE = re.compile(
    r"(?im)^\s*(?:Bibliography\s*|"
    r"\d{1,3}\s*|"
    r"s?H?J?\.?\s*U\.?\s*S\.?\s+GOVERNMENT\b.*)$"
)
_GPO_TAIL = re.compile(
    r"(?i)\s+\S*\.?\s*GOVERNMENT\s+PRINTING\s+OFFICE\b.*$"
)


def extract_bibliography_text(
    pdf_path: Path | str,
    first_page: int,
    last_page: int,
) -> str:
    """``pdftotext -layout`` for ``first_page``…``last_page`` (1-based inclusive)."""
    pdf = Path(pdf_path)
    if not pdf.is_file():
        raise FileNotFoundError(pdf)
    if last_page < first_page:
        raise ValueError(f"last page {last_page} < first page {first_page}")
    result = subprocess.run(
        [
            "pdftotext",
            "-f", str(first_page),
            "-l", str(last_page),
            "-layout",
            str(pdf),
            "-",
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def linearize_bibliography_pages(text: str) -> str:
    """Reorder each page as left column then right column (reading order)."""
    pages = text.split("\f")
    chunks: list[str] = []
    for page in pages:
        if not page.strip():
            continue
        page = _collapse_broken_markers(page)
        left, right = split_two_columns(page)
        for column in (left, right):
            cleaned = _strip_footer_lines(column)
            if cleaned.strip():
                chunks.append(cleaned.strip())
    return "\n".join(chunks)


def _collapse_broken_markers(page: str) -> str:
    """Normalize ``[  1416]`` / ``[\\n 1186]`` to ``[1416]`` before column split."""
    return _REF_MARK.sub(lambda m: f"[{m.group(1)}]", page)


def split_two_columns(page_text: str) -> tuple[str, str]:
    """Split a layout page into ``(left, right)`` using the gutter before the right ``[n]``."""
    lines = page_text.splitlines()
    split_x = _column_split_x(lines)
    left_parts: list[str] = []
    right_parts: list[str] = []
    for line in lines:
        left, right = _split_line(line, split_x)
        left_parts.append(left)
        right_parts.append(right)
    return "\n".join(left_parts), "\n".join(right_parts)


def parse_bibliography(text: str) -> tuple[dict[str, str], list[int]]:
    """Return ``({id: citation}, missing_ids)`` for ids between min and max found.

    ``text`` may be raw ``pdftotext`` output (pages with ``\\f``) or already linearized.
    Citations are whitespace-normalized single-line strings.
    """
    if "\f" in text:
        linear = linearize_bibliography_pages(text)
    else:
        linear = _strip_footer_lines(text)
    entries: dict[str, str] = {}
    parts = _REF_MARK.split(linear)
    if len(parts) < 3:
        return {}, []
    for i in range(1, len(parts) - 1, 2):
        number = parts[i]
        body = _normalize_citation(parts[i + 1])
        if not body:
            continue
        entries[number] = body
    missing = _missing_ids(entries)
    return entries, missing


def merge_bibliography(
    prior: dict[str, str],
    parsed: dict[str, str],
    *,
    force: bool = False,
) -> dict[str, str]:
    """Merge parsed citations into prior. ``force`` keeps only ``parsed``."""
    if force:
        return dict(sorted(parsed.items(), key=lambda kv: int(kv[0])))
    merged = dict(prior)
    merged.update(parsed)
    return dict(sorted(merged.items(), key=lambda kv: int(kv[0])))


def _column_split_x(lines: list[str]) -> int:
    starts: list[int] = []
    for line in lines:
        marks = list(_REF_MARK.finditer(line))
        if len(marks) >= 2:
            starts.append(marks[1].start())
    if starts:
        return int(statistics.median(starts))
    # Single-mark lines: right-column refs sit far to the right.
    rightish = [
        m.start()
        for line in lines
        for m in _REF_MARK.finditer(line)
        if m.start() > 40
    ]
    if rightish:
        return int(statistics.median(rightish))
    widths = [len(line.rstrip()) for line in lines if line.strip()]
    return max(widths) // 2 if widths else 80


def _split_line(line: str, split_x: int) -> tuple[str, str]:
    """Assign one layout line to left/right without cutting through ``[n]``."""
    marks = list(_REF_MARK.finditer(line))
    if len(marks) >= 2:
        # Prefer the second marker as the right-column head (true two-column row).
        sx = marks[1].start()
        return line[:sx].rstrip(), line[sx:].strip()
    if len(marks) == 1:
        mark = marks[0]
        # Lone marker at/after the gutter belongs to the right column.
        if mark.start() >= max(0, split_x - 8):
            return line[: mark.start()].rstrip(), line[mark.start() :].strip()
        return line.rstrip(), ""
    sx = split_x
    if len(line) <= sx:
        return line.rstrip(), ""
    return line[:sx].rstrip(), line[sx:].strip()


def _strip_footer_lines(column: str) -> str:
    kept: list[str] = []
    for line in column.splitlines():
        stripped = line.strip()
        if not stripped:
            kept.append(line)
            continue
        if _FOOTER_LINE.match(stripped) and not _REF_MARK.search(stripped):
            continue
        kept.append(line)
    return "\n".join(kept)


def _normalize_citation(raw: str) -> str:
    text = _REF_MARK.split(raw, maxsplit=1)[0]
    text = text.replace("\u00ad", "")
    text = _GPO_TAIL.sub("", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s*\n\s*", " ", text)
    text = re.sub(r"\s+", " ", text).strip(" \t\n\r")
    text = text.strip(".,;")
    text = re.sub(r"\s+\d{1,3}$", "", text).strip()
    return text


def _missing_ids(entries: dict[str, str]) -> list[int]:
    if not entries:
        return []
    numbers = sorted(int(k) for k in entries)
    lo, hi = numbers[0], numbers[-1]
    present = set(numbers)
    return [n for n in range(lo, hi + 1) if n not in present]
