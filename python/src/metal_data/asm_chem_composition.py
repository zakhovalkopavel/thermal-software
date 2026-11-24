"""ASM Vol. 1 chem-composition PDF → inventory, OCR dumps, gap raw-tables."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from typing import Any, Optional


PDF_NAME = (
    "ASM Handbook - Irons, Steels, and High Performance Alloys, "
    "Vol 01_chem_composition.pdf"
)

SOURCE_CITATION = (
    "ASM Handbook (2005), Volume 1: Properties and Selection: "
    "Irons, Steels, and High-Performance Alloys"
)

# Known composition tables already in raw-tables (by title substring / table id).
KNOWN_RAW_MATCHES: list[tuple[str, str]] = [
    ("Table 12 Carbon steel compositions", "carbon_steel.json"),
    ("Table 13 Carbon steel compositions", "catbon_steel2.json"),
    ("Table 14 Composition ranges and limits for merchant quality steels", "merchant_quality_steel.json"),
    ("Table 15 Free-cutting (resulfurized) carbon steel compositions", "Free-cutting (resulfurized) carbon steel.json"),
    ("Table 16 Free-cutting (rephosphorized and resulfurized) carbon steel compositions", "Free-cutting (rephosphorized and resulfurized) carbon steel.json"),
    ("Table 17 High-manganese carbon steel compositions", "High-manganese carbon steel.json"),
    ("Table 18 High-manganese carbon steel compositions", "High-manganese carbon steel 2.json"),
    ("Table 19 Low-alloy steel compositions", "low-alloy_steel.json"),
    ("Table 20 SAE potential standard steel compositions", "potential_standart_steel.json"),
    ("Table 21 Composition ranges and limits for SAE HSLA steels", "hsla_steel.json"),
    ("Table 23 Chemical compositions for typical low-alloy steels", "steel1.json"),
    ("Table 25 Nominal chemical compositions for heat-resistant chromium-molybdenum steels", "steel1.json"),
    ("Table 12 Chemical compositions of some nickel-base superalloys produced by powder metallurgy", "super_alloys_composition_powder_metallurgy.json"),
]

# Gap tables we intend to extract (title → output filename).
GAP_TARGETS: dict[str, str] = {
    "Table 1 Composition limits of principal types of tool steels": "tool_steel_composition.json",
    "Table 1 Nominal compositions of wrought iron-base heat-resistant alloys": "stainless_heat_resistant_composition.json",
    "Table 22 Composition ranges and limits for former standard SAE steels": "former_sae_steel_composition.json",
    "Table 3 Compositions of tool steels no longer in common use": "tool_steel_composition_obsolete.json",
}

_TABLE_RE = re.compile(
    r"Table\s+(\d+[a-z]?)\s+([^\n]{10,160})",
    re.IGNORECASE,
)
_PAGE_RE = re.compile(r"Page\s+(\d+)\s*$", re.MULTILINE | re.IGNORECASE)
_COMPOSITIONISH = re.compile(
    r"compos|chem|UNS|stainless|tool|heat.?resist|ACI|HSLA|"
    r"alloy steel|carbon steel|merchant|free-cut|manganese|potential|former",
    re.IGNORECASE,
)


def default_pdf_path(repo_root: Path) -> Path:
    return repo_root / "shared" / "sources" / "steel" / PDF_NAME


def default_report_dir(repo_root: Path) -> Path:
    # Container mounts ./tmp/reports/python → /app/reports
    if repo_root.name == "app" or (repo_root / "reports").is_dir():
        return repo_root / "reports" / "metal-data" / "asm-chem-composition"
    return repo_root / "tmp" / "reports" / "python" / "metal-data" / "asm-chem-composition"


def render_pdf_pages(pdf: Path, renders_dir: Path, *, dpi: int = 150) -> list[Path]:
    """Render all PDF pages to PNG via pdftoppm. Returns sorted page image paths."""
    renders_dir.mkdir(parents=True, exist_ok=True)
    # Clear old renders
    for old in renders_dir.glob("page-*.png"):
        old.unlink()
    prefix = renders_dir / "page"
    subprocess.run(
        ["pdftoppm", "-png", "-r", str(dpi), str(pdf), str(prefix)],
        check=True,
    )
    return sorted(renders_dir.glob("page-*.png"))


def tesseract_image(image: Path) -> str:
    proc = subprocess.run(
        ["tesseract", str(image), "stdout", "-l", "eng", "--psm", "6"],
        check=True,
        capture_output=True,
        text=True,
    )
    return proc.stdout


def pdftotext_page(pdf: Path, page: int) -> str:
    proc = subprocess.run(
        ["pdftotext", "-f", str(page), "-l", str(page), "-layout", str(pdf), "-"],
        check=True,
        capture_output=True,
        text=True,
    )
    return proc.stdout


def match_raw_file(title: str) -> Optional[str]:
    title_n = " ".join(title.split())
    for key, fname in KNOWN_RAW_MATCHES:
        if key.lower() in title_n.lower() or title_n.lower().startswith(key.lower()[:40]):
            return fname
    return None


def is_gap_target(title: str) -> Optional[str]:
    title_n = " ".join(title.split())
    for key, out in GAP_TARGETS.items():
        if key.lower() in title_n.lower() or title_n.lower().startswith(key.lower()[:50]):
            return out
    return None


def build_inventory(
    pdf: Path,
    report_dir: Path,
    *,
    dpi: int = 150,
    use_tesseract: bool = True,
) -> dict[str, Any]:
    """Render + tesseract all pages; build table-inventory.json."""
    report_dir.mkdir(parents=True, exist_ok=True)
    tess_dir = report_dir / "tesseract"
    tess_dir.mkdir(parents=True, exist_ok=True)
    renders_dir = report_dir / "renders"

    images = render_pdf_pages(pdf, renders_dir, dpi=dpi)
    tables: list[dict[str, Any]] = []
    pages_meta: list[dict[str, Any]] = []

    for img in images:
        # page-01.png → 1
        m = re.search(r"page-(\d+)\.png$", img.name)
        pdf_page = int(m.group(1)) if m else 0
        text_layer = pdftotext_page(pdf, pdf_page)
        if use_tesseract:
            tess_text = tesseract_image(img)
            (tess_dir / f"page-{pdf_page:02d}.txt").write_text(tess_text, encoding="utf-8")
        else:
            tess_text = ""
        # Prefer text layer for structured inventory (more accurate table titles)
        combined = text_layer if text_layer.strip() else tess_text
        printed = None
        pm = _PAGE_RE.search(combined)
        if pm:
            printed = int(pm.group(1))
        pages_meta.append(
            {
                "pdfPage": pdf_page,
                "printedPage": printed,
                "render": str(img.relative_to(report_dir)) if img.is_relative_to(report_dir) else str(img),
                "tesseractDump": f"tesseract/page-{pdf_page:02d}.txt" if use_tesseract else None,
            }
        )
        for tm in _TABLE_RE.finditer(combined):
            table_id = tm.group(1)
            rest = tm.group(2).strip()
            title = f"Table {table_id} {rest}"
            title = re.sub(r"\s+", " ", title)
            if not _COMPOSITIONISH.search(title):
                continue
            matched = match_raw_file(title)
            gap_out = is_gap_target(title)
            needed = matched is None and (
                gap_out is not None
                or bool(re.search(r"tool steel|stainless|former standard SAE|heat-resistant", title, re.I))
            )
            tables.append(
                {
                    "pdfPage": pdf_page,
                    "printedPage": printed,
                    "tableId": table_id,
                    "title": title,
                    "matchedRawFile": matched,
                    "gapOutputFile": gap_out,
                    "neededForGap": bool(needed or gap_out),
                }
            )

    inventory = {
        "sourcePdf": str(pdf),
        "pageCount": len(images),
        "pages": pages_meta,
        "tables": tables,
    }
    out = report_dir / "table-inventory.json"
    out.write_text(json.dumps(inventory, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return inventory


def select_gap_ranges(inventory: dict[str, Any]) -> dict[str, Any]:
    """Collapse needed tables into contiguous PDF page ranges for Surya."""
    needed = [t for t in inventory["tables"] if t.get("neededForGap")]
    # Group by gapOutputFile
    by_file: dict[str, list[dict[str, Any]]] = {}
    for t in needed:
        key = t.get("gapOutputFile") or f"unassigned-table-{t['tableId']}-p{t['pdfPage']}.json"
        by_file.setdefault(key, []).append(t)

    selections: list[dict[str, Any]] = []
    for out_file, rows in sorted(by_file.items()):
        pdf_pages = sorted({r["pdfPage"] for r in rows})
        # Expand tool table 1 which spans multiple pages without repeating title
        if out_file == "tool_steel_composition.json":
            start = min(pdf_pages)
            # Include following pages until next major section / Table 2 cross-ref end
            end = max(start + 4, max(pdf_pages))  # 1166–1170 ≈ 5 pages
            pdf_pages = list(range(start, end + 1))
        if out_file == "stainless_heat_resistant_composition.json":
            start = min(pdf_pages)
            end = max(start + 2, max(pdf_pages))
            pdf_pages = list(range(start, end + 1))

        printed = [r["printedPage"] for r in rows if r.get("printedPage") is not None]
        # Look up printed pages from inventory pages meta
        page_meta = {p["pdfPage"]: p.get("printedPage") for p in inventory["pages"]}
        printed_span = [page_meta.get(p) for p in pdf_pages if page_meta.get(p) is not None]
        selections.append(
            {
                "outputFile": out_file,
                "titles": sorted({r["title"] for r in rows}),
                "pdfPages": pdf_pages,
                "printedPages": {
                    "start": min(printed_span) if printed_span else None,
                    "end": max(printed_span) if printed_span else None,
                },
                "matchedRawFile": rows[0].get("matchedRawFile"),
            }
        )

    # ACI residual note
    residual = {
        "aciCastHeatResistant": {
            "reason": "ACI HA–HX cast chemistry not present in this chem-composition PDF extract",
            "existingPropsFile": "heat_resistent_steel.json",
        }
    }
    result = {"selections": selections, "residuals": residual}
    return result
