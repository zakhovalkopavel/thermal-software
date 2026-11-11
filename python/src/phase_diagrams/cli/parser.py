"""Argparse for extract_phase_diagram CLI."""
from __future__ import annotations

import argparse

from phase_diagrams.cli.common import _ATLAS

def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Extract phase-diagram data from the Slag Atlas and NSRDS-NBS 61.")
    p.add_argument("--dataset", default="shared/processed/phase-diagrams", help="Dataset folder")
    p.add_argument("--work-dir", default="reports/phase-diagrams", help="Working folder")
    p.add_argument("--compound-data", default="shared/processed/compound-data",
                   help="compound-data folder (melting points of single oxides for new)")
    p.add_argument("-v", "--verbose", action="store_true", help="Per-step log")
    sub = p.add_subparsers(dest="command", required=True, metavar="COMMAND")

    s = sub.add_parser("index-figures", help="Caption OCR → figure-index/<source>.json")
    s.add_argument("--source", default=_ATLAS)
    s.add_argument("--pages", default="40-200", help="PDF page range, e.g. 40-200")

    s = sub.add_parser("tile", help="Zoom tile with pixel rulers → tiles/")
    s.add_argument("--source", default=_ATLAS)
    s.add_argument("--page", type=int, required=True)
    s.add_argument("--box", type=int, nargs=4, required=True, metavar=("X0", "Y0", "X1", "Y1"))
    s.add_argument("--scale", type=float, default=1.0)
    s.add_argument("--overlay", metavar="SYSTEM", help="draw overlays/<SYSTEM>.png over the page (same page)")

    s = sub.add_parser("calibrate", help="Detect frame and ticks; print tick pixels and residuals; overlay")
    s.add_argument("system")

    s = sub.add_parser("extract", help="Binary config → candidates/<system>.json, overlay, review list, comparison")
    s.add_argument("system")

    s = sub.add_parser("new", help="New ternary: find its figure, calibrate the triangle → starting file + curves config")
    s.add_argument("system", help="system id, e.g. cao-feox-sio2")
    s.add_argument("--figure", help="figure number when the index has several, e.g. 3.226")
    s.add_argument("--triangle", type=int, help="triangle number when the page has several")
    s.add_argument("--corners", nargs=3, metavar=("TOP", "LEFT", "RIGHT"), help="corner components when the labels are not read")
    s.add_argument("--pubchem", action="store_true",
                   help="search PubChem by formula for components compound-data lacks (CID, CAS, melting point strings)")

    s = sub.add_parser("trace-curves", help="Ternary curves config → candidate with polyline_wt filled, overlay, review")
    s.add_argument("system")

    s = sub.add_parser("nodes", help="Numbered junctions, edge points, invariants and rings of a ternary → nodes/")
    s.add_argument("system")
    s.add_argument("--origin", type=float, nargs=2, metavar=("X", "Y"),
                   help="pixelOrigin (default: from the curves config, else 0 0)")

    s = sub.add_parser("detect-isotherms",
                       help="Isotherms found on the page (lines, fields, temperatures) → isotherms/: draft config entries, report, image")
    s.add_argument("system")
    s.add_argument("--step", type=float, default=100.0, help="interval between neighbouring isotherms, °C (default 100)")

    s = sub.add_parser("auto-overlay",
                       help="Overlay from automatic data only: detected isotherms, field approximation, compound rings → auto/")
    s.add_argument("system")
    s.add_argument("--step", type=float, default=100.0, help="interval between neighbouring isotherms, °C (default 100)")

    s = sub.add_parser("auto",
                       help="Fully automatic ternary from the page alone (triangle, boundaries, fields, temperatures, "
                            "isotherms) → auto-full/: system, overlay, report")
    s.add_argument("system")
    s.add_argument("--figure", help="figure number when the index has several, e.g. 3.196")
    s.add_argument("--triangle", type=int, help="triangle number (reading order) when the page has several")
    s.add_argument("--corners", nargs=3, metavar=("TOP", "LEFT", "RIGHT"), help="corner components when the labels are not read")
    s.add_argument("--step", type=float, default=100.0, help="interval between neighbouring isotherms, °C (default 100)")

    s = sub.add_parser("compare", help="Compare the candidate with the dataset file")
    s.add_argument("system")

    s = sub.add_parser("promote", help="Copy the candidate into the dataset if the dataset still validates")
    s.add_argument("system")

    s = sub.add_parser("nbs-index", help="OCR and parse NSRDS-NBS 61 Table I → nbs/")
    s.add_argument("--first", type=int, help="first PDF page (default: sources.json tablePages.first)")
    s.add_argument("--last", type=int, help="last PDF page (default: sources.json tablePages.last)")
    s.add_argument(
        "--engine", choices=("vlm", "hybrid", "tesseract"), default="vlm",
        help="page OCR: vlm=full VLM via page-ocr (default); hybrid=detect+Indra; tesseract=legacy",
    )
    s.add_argument(
        "--force", action="store_true",
        help="re-OCR pages even when the dump already has text for them",
    )

    s = sub.add_parser(
        "nbs-bibliography",
        help="pdftotext + parse NSRDS-NBS 61 Bibliography → nbs/*.bibliography.json",
    )
    s.add_argument(
        "--first", type=int,
        help="first PDF page (default: sources.json bibliographyPages.first)",
    )
    s.add_argument(
        "--last", type=int,
        help="last PDF page (default: sources.json bibliographyPages.last)",
    )
    s.add_argument(
        "--force", action="store_true",
        help="replace bibliography.json entirely from this parse (drop prior-only keys)",
    )

    s = sub.add_parser(
        "nbs-refs",
        help="Repair Table I refs in dump (pdftotext + rules) → txt then entries.json",
    )
    s.add_argument("--first", type=int, help="first PDF page (default: tablePages.first)")
    s.add_argument("--last", type=int, help="last PDF page (default: tablePages.last)")
    s.add_argument(
        "--force", action="store_true",
        help="prefer pdftotext refs even when the dump already has digits",
    )
    s.add_argument(
        "--ocr", action="store_true",
        help="hybrid OCR gap-fill for entries still missing refs after pdftotext",
    )

    s = sub.add_parser("nbs-suggest", help="Candidate NBS entries for exactly these components")
    s.add_argument("components", nargs="+", metavar="COMPONENT")

    s = sub.add_parser("validate", help="Validate the whole dataset (with --candidate: as if SYSTEM were promoted)")
    s.add_argument("--candidate", metavar="SYSTEM")
    return p


