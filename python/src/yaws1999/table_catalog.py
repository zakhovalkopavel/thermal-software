"""
yaws1999.table_catalog — Discover handbook tables (``Table X-Y``) and their DjVu page spans.
"""
from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

_TABLE_HEADER = re.compile(
    r"(?im)^\s*Table\s+(\d+-\d+)\s+(.+?)\s*(?:\(continued\))?\s*$",
)
_CONTINUED = re.compile(r"\s*\(continued\)\s*$", re.I)


@dataclass(frozen=True)
class TableSpan:
    """One handbook table and the DjVu pages that carry its rows."""

    id: str
    title: str
    first_page: int
    last_page: int

    @property
    def page_count(self) -> int:
        return self.last_page - self.first_page + 1


def page_plain_text(djvu: Path | str, page: int) -> str:
    """Plain ``djvutxt`` for one page (enough to find the table header)."""
    path = Path(djvu)
    result = subprocess.run(
        ["djvutxt", f"--page={page}", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def header_on_page(text: str) -> tuple[str, str] | None:
    """Return ``(table_id, title)`` when the page opens a ``Table X-Y`` block."""
    for line in text.splitlines():
        match = _TABLE_HEADER.match(line.strip())
        if match:
            title = _CONTINUED.sub("", match.group(2)).strip(" -")
            return match.group(1), title
    return None


def build_table_catalog(djvu: Path | str, first_page: int = 1, last_page: int | None = None) -> list[TableSpan]:
    """Scan DjVu pages and return contiguous spans for every ``Table X-Y`` found."""
    path = Path(djvu)
    if not path.is_file():
        raise FileNotFoundError(path)
    if last_page is None:
        last_page = count_djvu_pages(path)
    if last_page < first_page:
        raise ValueError(f"last page {last_page} < first page {first_page}")

    order: list[str] = []
    spans: dict[str, list[object]] = {}  # id -> [title, first, last]
    for page in range(first_page, last_page + 1):
        found = header_on_page(page_plain_text(path, page))
        if found is None:
            continue
        table_id, title = found
        if table_id not in spans:
            order.append(table_id)
            spans[table_id] = [title, page, page]
        else:
            spans[table_id][2] = page
            if not spans[table_id][0]:
                spans[table_id][0] = title

    return [
        TableSpan(id=tid, title=str(spans[tid][0]), first_page=int(spans[tid][1]), last_page=int(spans[tid][2]))
        for tid in order
    ]


def count_djvu_pages(djvu: Path | str) -> int:
    """Page count from ``djvudump`` ``[PN]`` markers."""
    result = subprocess.run(
        ["djvudump", str(djvu)],
        check=True,
        capture_output=True,
        text=True,
    )
    pages = re.findall(r"\[P(\d+)\]", result.stdout)
    if not pages:
        raise ValueError(f"no pages found in {djvu}")
    return max(int(p) for p in pages)
