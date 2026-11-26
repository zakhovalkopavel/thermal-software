"""Parse USGS Bulletin 2131 mineral-name index pages into a compound catalog.

Refs:
  [60] RobieHemingway1995

Index pages list printed table pages (298 K, Cp coeffs, high-T) per substance.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

PRINTED_TO_PDF_OFFSET = 6

# Two-column index rows: Name + up to ~4 page ints, then optional second entry
_ENTRY = re.compile(
    r"([A-Za-z][A-Za-z0-9\-\(\)\/\.,' ]{1,45}?)"
    r"(?:\s+(\d{1,3}(?:\s+\d{1,3}){0,4}))?"
)


def _clean_name(raw: str) -> str | None:
    name = re.sub(r"\s+", " ", raw).strip(" .")
    if len(name) < 3:
        return None
    low = name.lower()
    if low in {
        "page",
        "index of names",
        "thermodynamic properties of minerals and related substances",
        "references cited",
    }:
        return None
    # Drop pure OCR garbage / lone ions without chemistry later filtered by pages
    if not re.search(r"[A-Za-z]{3,}", name):
        return None
    return name


def _pages(nums: str | None) -> list[int]:
    if not nums:
        return []
    return [int(x) for x in nums.split()]


def parse_index_text(text: str) -> list[dict[str, Any]]:
    """Return unique index entries with printed / PDF page lists."""
    by_name: dict[str, dict[str, Any]] = {}
    for line in text.splitlines():
        line = line.replace("·", " ").replace("∼", " ")
        # Split rough two-column layout at large mid-line gaps
        parts = re.split(r"\s{2,}", line.strip())
        chunks: list[str] = []
        buf = ""
        for part in parts:
            if re.fullmatch(r"\d{1,3}(?:\s+\d{1,3}){0,4}", part.strip()):
                buf = f"{buf} {part}".strip() if buf else part
                chunks.append(buf)
                buf = ""
            else:
                if buf:
                    chunks.append(buf)
                buf = part
        if buf:
            chunks.append(buf)

        # Re-pair name + following page group when split oddly
        i = 0
        while i < len(chunks):
            chunk = chunks[i]
            m = re.match(
                r"^(.+?)\s+(\d{1,3}(?:\s+\d{1,3}){0,4})$",
                chunk.strip(),
            )
            if m:
                name = _clean_name(m.group(1))
                pages = _pages(m.group(2))
            else:
                name = _clean_name(chunk)
                pages = []
                if i + 1 < len(chunks) and re.fullmatch(
                    r"\d{1,3}(?:\s+\d{1,3}){0,4}", chunks[i + 1].strip()
                ):
                    pages = _pages(chunks[i + 1])
                    i += 1
            i += 1
            if not name:
                continue
            key = name.casefold()
            row = by_name.get(key)
            if row is None:
                by_name[key] = {
                    "name": name,
                    "printedPages": sorted(set(pages)),
                    "pdfPages": sorted({p + PRINTED_TO_PDF_OFFSET for p in pages}),
                }
            else:
                row["printedPages"] = sorted(set(row["printedPages"]) | set(pages))
                row["pdfPages"] = sorted(
                    {p + PRINTED_TO_PDF_OFFSET for p in row["printedPages"]}
                )
    return sorted(by_name.values(), key=lambda r: r["name"].casefold())


def parse_index_ocr(ocr_dir: Path, pages: list[int] | None = None) -> dict[str, Any]:
    pages = pages or list(range(460, 471))
    chunks: list[str] = []
    for page in pages:
        pt = ocr_dir / f"page-{page:04d}.pdftotext.txt"
        ocr = ocr_dir / f"page-{page:04d}.txt"
        if pt.is_file():
            chunks.append(pt.read_text(encoding="utf-8", errors="replace"))
        elif ocr.is_file():
            chunks.append(ocr.read_text(encoding="utf-8", errors="replace"))
    entries = parse_index_text("\n".join(chunks))
    return {
        "source": "RobieHemingway1995",
        "kind": "mineralIndex",
        "indexPdfPages": pages,
        "nEntries": len(entries),
        "entries": entries,
        "ref": "RobieHemingway1995",
    }
