"""Parse Huahai Mao (2005) thesis / papers into a compact staging dataset.

Refs:
  [63] Mao2005

The kappa PDF currently in ``shared/sources/minerals-thermodynamic/`` is the thesis
front matter only (no appended Papers I–V coefficient tables). When a paper
PDF with numeric tables is present under the OCR/report texts dir, those
rows are preferred.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path
from typing import Any

_NUM = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[Ee][-+]?\d+)?"


def _pdftotext(pdf: Path) -> str:
    return subprocess.run(
        ["pdftotext", "-layout", str(pdf), "-"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout


def _floats(s: str) -> list[float]:
    s = s.replace("−", "-").replace("–", "-")
    return [float(x) for x in re.findall(_NUM, s)]


def _parse_paper_tables(text: str) -> dict[str, Any]:
    """Best-effort extract of °G / L parameters when a paper PDF is available."""
    phases: dict[str, Any] = {}
    # Look for °G = a + bT + cTlnT ... style blocks with named phases
    for m in re.finditer(
        rf"(Y3Al5O12|YAG|YAlO3|YAM|Y4Al2O9|mullite|cordierite|sapphirine)"
        rf".{{0,80}}?(?:H298|°G|G\s*=)\s*[^\n]{{0,120}}",
        text,
        re.I,
    ):
        nums = _floats(m.group(0))
        if len(nums) < 2:
            continue
        key = re.sub(r"\W+", "", m.group(1)).lower()
        phases[key] = {
            "phaseId": key,
            "snippet": m.group(0)[:200],
            "numbers": nums[:12],
            "ref": "Mao2005",
            "convention": "SER",
            "status": "partial",
        }
    return phases


def parse_mao_sources(
    thesis_pdf: Path,
    *,
    paper_pdfs: list[Path] | None = None,
    ocr_dir: Path | None = None,
) -> dict[str, Any]:
    """Build Mao staging dataset from thesis + optional paper PDFs / OCR."""
    phases: dict[str, Any] = {}
    notes: list[str] = []

    if thesis_pdf.is_file():
        text = _pdftotext(thesis_pdf)
        # Confirm it is the Mao kappa (not a wrong file)
        is_mao = bool(re.search(r"HuaHai\s+MAO|Huahai\s+Mao", text, re.I))
        has_papers = bool(re.search(r"Paper\s+V\.?\s+Thermodynamic assessment", text, re.I))
        # Kappa lists assessed systems but not coefficient tables
        systems = []
        for label in [
            "Al2O3-SiO2",
            "CaO-Al2O3",
            "MgO-Al2O3",
            "CaO-Al2O3-SiO2",
            "MgO-Al2O3-SiO2",
            "Y2O3-Al2O3-SiO2",
        ]:
            if label.replace("–", "-") in text.replace("–", "-"):
                systems.append(label)
        notes.append(
            "Thesis kappa PDF present; Papers I–V coefficient tables are not "
            "embedded in this file."
            if is_mao and not re.search(r"PARAMETER\s+G\(", text)
            else "Thesis text scanned."
        )
        phases["assessment_scope"] = {
            "phaseId": "assessment_scope",
            "systems": systems,
            "hasAppendedPapers": has_papers,
            "liquidModel": "ionic_two_sublattice_with_AlO2-1",
            "ref": "Mao2005",
            "convention": "SER",
            "status": "partial",
            "note": (
                "Scope metadata from thesis narrative only — not calculable "
                "endmember coefficients. Add Paper I–V PDFs or OCR dumps to upgrade."
            ),
        }

    for pdf in paper_pdfs or []:
        if not pdf.is_file():
            continue
        extracted = _parse_paper_tables(_pdftotext(pdf))
        for k, v in extracted.items():
            v["sourceFile"] = pdf.name
            phases[k] = v
        notes.append(f"Parsed candidate rows from {pdf.name}")

    if ocr_dir and ocr_dir.is_dir():
        blob = []
        for p in sorted(ocr_dir.glob("page-*.txt")):
            blob.append(p.read_text(encoding="utf-8", errors="replace"))
        extracted = _parse_paper_tables("\n".join(blob))
        for k, v in extracted.items():
            v["sourceFile"] = "ocr"
            phases[k] = v

    ok = sum(1 for p in phases.values() if p.get("status") == "ok")
    status = "dataset" if ok else "partial"
    return {
        "source": "Mao2005",
        "convention": "SER",
        "ref": "Mao2005",
        "nPhases": len(phases),
        "phases": phases,
        "status": status,
        "note": " ".join(notes)
        or "No Mao sources parsed.",
    }
