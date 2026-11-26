"""Parse Abdul et al. CCR CaO–SiO2 paper tables (OCR + pdftotext sidecars).

Refs:
  [62] Abdul2023

Companion to the thesis Appendix B TDB staged under ``abdul-2023/``.
Prefers ``*.pdftotext.txt`` sidecars for Table 8/9 numbers (Surya often
drops two-column table bodies); falls back to Surya ``page-*.txt`` then PDF.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path
from typing import Any

_NUM = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[Ee][-+]?\d+)?"


def _soften(text: str) -> str:
    t = text.replace("−", "-").replace("–", "-").replace("→", "->").replace("◦", "")
    t = t.replace("α′", "a'").replace("α'", "a'").replace("α", "a").replace("β", "b")
    t = t.replace("γ", "g").replace("′", "'")
    t = re.sub(r"\\text\{([^}]*)\}", r"\1", t)
    t = re.sub(r"[ \t]+", " ", t)
    # Collapse spaces around math operators so Table 8 coeffs match reliably.
    t = re.sub(r"\s*([=+\-*/])\s*", r"\1", t)
    t = re.sub(r"GSiO2\s*,", "GSiO2,", t)
    t = re.sub(r"GCaO\s*,", "GCaO,", t)
    t = re.sub(r"C2\s+S", "C2S", t)
    t = re.sub(r"GC2\s*S", "GC2S", t)
    return t

def _load_pdftotext_sidecars(ocr_dir: Path) -> str:
    parts: list[str] = []
    for path in sorted(ocr_dir.glob("page-*.pdftotext.txt")):
        parts.append(path.read_text(encoding="utf-8", errors="replace"))
    return "\n".join(parts)


def _load_ocr(ocr_dir: Path) -> str:
    parts: list[str] = []
    for path in sorted(ocr_dir.glob("page-*.txt")):
        if path.name.endswith(".pdftotext.txt"):
            continue
        parts.append(path.read_text(encoding="utf-8", errors="replace"))
    return "\n".join(parts)


def _pdftotext(pdf: Path) -> str:
    return subprocess.run(
        ["pdftotext", "-layout", str(pdf), "-"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout


def _resolve_text(
    *,
    ocr_dir: Path | None,
    pdf: Path | None,
) -> tuple[str, str]:
    if ocr_dir and ocr_dir.is_dir():
        side = _load_pdftotext_sidecars(ocr_dir)
        ocr = _load_ocr(ocr_dir)
        if side.strip():
            # Sidecars first for numeric tables; append OCR for captions/keywords.
            return _soften(side + "\n" + ocr), f"OCR+pdftotext {ocr_dir}"
        if ocr.strip():
            return _soften(ocr), f"OCR {ocr_dir}"
    if pdf is not None and pdf.is_file():
        return _soften(_pdftotext(pdf)), f"pdftotext {pdf.name}"
    raise FileNotFoundError(ocr_dir or pdf or Path("abdul-2023-ccr"))


def _parse_ab_term(expr: str) -> tuple[float | None, float | None]:
    """Parse ``a + b*T`` / ``a - b*T`` / ``a`` / ``b*T`` into (a, b)."""
    e = expr.strip().rstrip(".").replace(" ", "")
    if not e:
        return None, None
    m = re.fullmatch(rf"({_NUM})\*T", e)
    if m:
        return 0.0, float(m.group(1))
    m = re.fullmatch(rf"-({_NUM})\*T", e)
    if m:
        return 0.0, -float(m.group(1))
    m = re.fullmatch(
        rf"({_NUM})([+-])({_NUM})\*T",
        e,
    )
    if m:
        a = float(m.group(1))
        b = float(m.group(3))
        if m.group(2) == "-":
            b = -b
        return a, b
    m = re.fullmatch(rf"({_NUM})", e)
    if m:
        return float(m.group(1)), 0.0
    return None, None


def _norm_species(token: str) -> str:
    t = re.sub(r"\s+", "", token.upper())
    t = t.replace("C2S", "C2S").replace("C2 S", "C2S")
    return t


def _parse_melt_associates(text: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    # GC2S=2GCaO,Liquid+GSiO2,Liquid-185132.188472035-1.6*T
    specs = (
        (
            "G_C2S_associate",
            "C2S",
            rf"GC2S=2GCaO,?Liquid\+GSiO2,?Liquid(({_NUM})([+-]{_NUM}\*T)?)",
        ),
        (
            "G_CS_associate",
            "CS",
            rf"GCS=GCaO,?Liquid\+GSiO2,?Liquid(({_NUM})([+-]{_NUM}\*T)?)",
        ),
    )
    for param, species, pat in specs:
        m = re.search(pat, text, re.I)
        if not m:
            continue
        a, b = _parse_ab_term(m.group(1))
        if a is None:
            continue
        rows.append(
            {
                "parameter": param,
                "species": species,
                "a": a,
                "b": b if b is not None else 0.0,
                "expressionRaw": m.group(0)[:160],
                "ref": "Abdul2023",
                "page": "Table 8",
                "status": "ok",
            }
        )
    return rows


def _parse_melt_l_params(text: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    # LCS,S,0=206415.92-107.04*T | LC,C2S,1=5490.98 | LC2S,S,0=-3*T
    pat = re.compile(
        rf"L([A-Za-z0-9]+),([A-Za-z0-9]+),(\d+)=({_NUM}\*T|{_NUM}(?:[+-]{_NUM}\*T)?(?!\*))",
        re.I,
    )
    seen: set[str] = set()
    for m in pat.finditer(text):
        left = _norm_species(m.group(1))
        right = _norm_species(m.group(2))
        order = int(m.group(3))
        key = f"L_{left}_{right}_{order}"
        if key in seen:
            continue
        expr = m.group(4)
        if expr.startswith("+"):
            expr = expr[1:]
        a, b = _parse_ab_term(expr)
        if a is None and b is None:
            continue
        seen.add(key)
        rows.append(
            {
                "parameter": key,
                "pair": f"{left}-{right}",
                "order": order,
                "a": a if a is not None else 0.0,
                "b": b if b is not None else 0.0,
                "expressionRaw": m.group(0)[:160],
                "ref": "Abdul2023",
                "page": "Table 8",
                "status": "ok",
            }
        )
    return rows

def _parse_invariants(text: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    pat = re.compile(
        rf"(Liquid[^\n]{{0,60}}?)\s+({_NUM})\s+\(({_NUM})\)[^\n]{{0,40}}?"
        rf"({_NUM})\s+\(({_NUM})\)",
        re.I,
    )
    for m in pat.finditer(text):
        reaction = re.sub(r"\s+", " ", m.group(1)).strip()
        if "->" not in reaction and "→" not in m.group(0):
            # already softened → to ->
            pass
        rows.append(
            {
                "reaction": reaction[:120],
                "T_K": float(m.group(2)),
                "T_exp_K": float(m.group(3)),
                "xSiO2": float(m.group(4)),
                "xSiO2_exp": float(m.group(5)),
                "ref": "Abdul2023",
                "page": "Table 9",
                "status": "ok",
            }
        )
    return rows


def _table_snippets(text: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for m in re.finditer(r"(Table\s+\d+[A-Za-z.]*(?:[^\n]{0,120}))", text, re.I):
        caption = re.sub(r"\s+", " ", m.group(1)).strip()
        window = text[m.end() : m.end() + 800]
        nums = [float(x) for x in re.findall(_NUM, window)[:24]]
        if len(nums) < 3:
            continue
        rows.append(
            {
                "caption": caption[:200],
                "numbers": nums,
                "snippet": re.sub(r"\s+", " ", window)[:400],
                "ref": "Abdul2023",
                "status": "partial",
            }
        )
    return rows


def parse_abdul_ccr(
    *,
    ocr_dir: Path | None = None,
    pdf: Path | None = None,
) -> dict[str, Any]:
    """Build CCR companion dataset: Table 8 melt + Table 9 invariants."""
    text, source_note = _resolve_text(ocr_dir=ocr_dir, pdf=pdf)
    associates = _parse_melt_associates(text)
    l_params = _parse_melt_l_params(text)
    invariants = _parse_invariants(text)
    tables = _table_snippets(text)

    phases: dict[str, Any] = {}
    if associates or l_params:
        phases["liquid_associate"] = {
            "phaseId": "liquid_associate",
            "formula": "CaO-SiO2",
            "model": "associate_redlich_kister",
            "species": ["C", "C2S", "CS", "S"],
            "associates": associates,
            "parameters": l_params,
            "convention": "SER",
            "ref": "Abdul2023",
            "page": "Table 8",
            "status": "ok" if associates and l_params else "partial",
            "note": (
                "C/S end-members from Deffrennes/Bajenova; C2S and CS associates "
                "plus RK L terms from CCR Table 8 (cross-check vs thesis TDB)."
            ),
        }
    if invariants:
        phases["invariants"] = {
            "phaseId": "invariants",
            "system": "CaO-SiO2",
            "reactions": invariants,
            "ref": "Abdul2023",
            "page": "Table 9",
            "status": "ok",
        }
    phases["ccr_tables"] = {
        "phaseId": "ccr_tables",
        "tables": tables,
        "convention": "SER",
        "ref": "Abdul2023",
        "status": "partial",
        "note": "Caption/numeric windows for remaining tables (A.1 solids live in TDB).",
    }

    melt = phases.get("liquid_associate")
    melt_ok = bool(
        melt
        and len(associates) >= 2
        and len(l_params) >= 5
        and melt["status"] == "ok"
    )
    if melt and not melt_ok:
        melt["status"] = "partial"
    return {
        "source": "Abdul2023",
        "convention": "SER",
        "ref": "Abdul2023",
        "nPhases": len(phases),
        "phases": phases,
        "status": "ok" if melt_ok else "partial",
        "note": (
            f"Abdul CCR CaO–SiO2 from {source_note}; "
            f"{len(associates)} associates, {len(l_params)} L params, "
            f"{len(invariants)} invariants, {len(tables)} table windows."
        ),
    }
