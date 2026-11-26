"""Page map for USGS Bulletin 2131 (printed page + 6 → PDF).

Refs:
  [60] RobieHemingway1995
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

# Printed page → PDF page offset used throughout Bulletin 2131.
PRINTED_TO_PDF_OFFSET = 6

# Priority-1 phases: (298 K, Cp coeffs, high-T start); None = not in bulletin / incomplete.
_PRIORITY_1: dict[str, tuple[int | None, int | None, int | None]] = {
    "quartz": (18, 49, 214),
    "cristobalite": (19, 50, 215),
    "tridymite": (19, None, None),
    "lime": (15, 47, 182),
    "periclase": (17, 48, 197),
    "mullite": (31, 58, 307),
    "anorthite": (36, 63, 362),
    "gehlenite": (31, 58, 314),
    "wollastonite": (34, 61, 342),
    "pseudowollastonite": (34, 61, 343),
    "larnite": (31, 58, 324),
    "bredigite": (32, 59, None),
    "haturite": (32, 59, 326),
    "rankinite": (32, 59, 327),
    "forsterite": (33, 60, 335),
    "cordierite": (33, 60, 334),
    "zircon": (33, 60, 341),
    "ilmenite": (21, 51, 235),
    "spinel": (21, 51, 237),
    "kalsilite": (37, 63, 369),
    "nepheline": (37, 64, 376),
}

_NOTES_PRINTED = (1, 2, 3)
_INDEX_PDF_PAGES = list(range(459, 471))

# Printed tables 4–70 (298.15 K + Cp A1–A5) → PDF pages 10–76.
_CORE_TABLE_PDF_PAGES = list(range(10, 77))

# High-T individual-phase tables sit between Cp tables and the mineral index.
_HIGH_T_PDF_PAGES = list(range(77, 459))


def _pdf_from_printed(printed: int) -> int:
    return printed + PRINTED_TO_PDF_OFFSET


def default_page_selections(*, include_high_t_continuation: bool = True) -> dict[str, Any]:
    """Full bulletin selections: notes, 298/Cp, all high-T pages, index, Priority-1 tags."""
    selections: list[dict[str, Any]] = [
        {
            "id": "equation-notes",
            "kind": "notes",
            "printedPages": list(_NOTES_PRINTED),
            "pdfPages": [_pdf_from_printed(p) for p in _NOTES_PRINTED],
        },
        {
            "id": "mineral-index",
            "kind": "index",
            "printedPages": [],
            "pdfPages": list(_INDEX_PDF_PAGES),
        },
        {
            "id": "core-298-cp-tables",
            "kind": "tables",
            "priority": 0,
            "printedPages": list(range(4, 71)),
            "pdfPages": list(_CORE_TABLE_PDF_PAGES),
            "note": "All 298.15 K and Cp coefficient tables (printed ≤70)",
        },
        {
            "id": "high-t-tables",
            "kind": "tables",
            "priority": 0,
            "printedPages": list(range(71, 453)),
            "pdfPages": list(_HIGH_T_PDF_PAGES),
            "note": "High-T property tables for individual phases (PDF 77–458)",
        },
    ]
    for slug, (p298, p_cp, p_ht) in _PRIORITY_1.items():
        printed: list[int] = []
        pdf: list[int] = []
        for p in (p298, p_cp, p_ht):
            if p is None:
                continue
            printed.append(p)
            pdf.append(_pdf_from_printed(p))
            if include_high_t_continuation and p is p_ht:
                printed.append(p + 1)
                pdf.append(_pdf_from_printed(p + 1))
        selections.append(
            {
                "id": slug,
                "kind": "phase",
                "priority": 1,
                "printedPages": printed,
                "pdfPages": sorted(set(pdf)),
            }
        )
    return {
        "source": "RobieHemingway1995",
        "printedToPdfOffset": PRINTED_TO_PDF_OFFSET,
        "scope": "full-bulletin-298-cp-high-t-index",
        "selections": selections,
    }


def all_pdf_pages(selections: dict[str, Any]) -> list[int]:
    """Sorted unique PDF page numbers from a selections document."""
    pages: set[int] = set()
    for item in selections.get("selections", []):
        for page in item.get("pdfPages", []):
            pages.add(int(page))
    return sorted(pages)


def core_table_pdf_pages() -> list[int]:
    """PDF pages covering printed 298 K + Cp tables (4–70)."""
    return list(_CORE_TABLE_PDF_PAGES)


def high_t_pdf_pages() -> list[int]:
    """PDF pages covering high-T individual-phase tables."""
    return list(_HIGH_T_PDF_PAGES)


def existing_ocr_pages(ocr_dir: Path) -> set[int]:
    """PDF page numbers that already have a non-empty ``page-NNNN.txt``."""
    found: set[int] = set()
    if not ocr_dir.is_dir():
        return found
    for path in ocr_dir.iterdir():
        if not path.is_file() or path.stat().st_size < 20:
            continue
        # page-0123.txt only (not .pdftotext.txt)
        name = path.name
        if not name.startswith("page-") or not name.endswith(".txt"):
            continue
        if ".pdftotext." in name:
            continue
        stem = name[len("page-") : -len(".txt")]
        if stem.isdigit():
            found.add(int(stem))
    return found


def missing_ocr_pages(
    ocr_dir: Path,
    selections: dict[str, Any] | None = None,
) -> list[int]:
    """Selection pages not yet OCR'd (skip existing dumps)."""
    want = set(all_pdf_pages(selections or default_page_selections()))
    have = existing_ocr_pages(ocr_dir)
    return sorted(want - have)
