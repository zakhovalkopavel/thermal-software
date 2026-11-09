"""
yaws1999.word_box — Word boxes from ``djvutxt --detail=word``.

The DjVu text layer stores table cells in column order. Word bounding boxes let
``page_lines`` rebuild left-to-right, top-to-bottom reading order.
"""
from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass
from pathlib import Path


_WORD = re.compile(
    r'\(word\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+"((?:\\.|[^"\\])*)"\)',
)


@dataclass(frozen=True)
class WordBox:
    """One word from the DjVu text layer; coordinates use DjVu's bottom-left origin."""

    x0: int
    y0: int
    x1: int
    y1: int
    text: str

    @property
    def cx(self) -> float:
        return (self.x0 + self.x1) / 2.0

    @property
    def cy(self) -> float:
        return (self.y0 + self.y1) / 2.0

    @property
    def height(self) -> int:
        return max(1, self.y1 - self.y0)

    @property
    def width(self) -> int:
        return max(1, self.x1 - self.x0)


def extract_page_words(djvu: Path | str, page: int) -> list[WordBox]:
    """Run ``djvutxt --page=N --detail=word`` and return the word boxes."""
    path = Path(djvu)
    if not path.is_file():
        raise FileNotFoundError(path)
    if page < 1:
        raise ValueError(f"page must be >= 1, got {page}")
    result = subprocess.run(
        ["djvutxt", f"--page={page}", "--detail=word", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return parse_word_sexp(result.stdout)


def parse_word_sexp(text: str) -> list[WordBox]:
    """Parse ``djvutxt --detail=word`` S-expression output into word boxes."""
    words: list[WordBox] = []
    for match in _WORD.finditer(text):
        raw = match.group(5)
        # djvutxt escapes " and \ inside the quoted token.
        token = raw.replace(r"\"", '"').replace(r"\\", "\\")
        words.append(
            WordBox(
                x0=int(match.group(1)),
                y0=int(match.group(2)),
                x1=int(match.group(3)),
                y1=int(match.group(4)),
                text=token,
            )
        )
    return words
