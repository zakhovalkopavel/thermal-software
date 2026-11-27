"""Parse Mao et al. 2006 CaO–Al2O3–SiO2 assessment (J. Am. Ceram. Soc.).

Refs:
  [70] Mao2006

Source PDF: ``shared/sources/minerals-thermodynamic/mao-papers/Mao_2606.pdf``
Prefer Modal/Surya OCR under ``tmp/reports/.../mao-2006-cas/ocr/`` (Table I + III).
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


def _load_ocr_text(ocr_dir: Path) -> str:
    parts: list[str] = []
    for path in sorted(ocr_dir.glob("page-*.txt")):
        if path.name.endswith(".pdftotext.txt"):
            continue
        parts.append(path.read_text(encoding="utf-8", errors="replace"))
    return "\n".join(parts)


def _norm(s: str) -> str:
    s = (
        s.replace("\u0001", "-")
        .replace("", "-")
        .replace("−", "-")
        .replace("–", "-")
        .replace("—", "-")
        .replace("×", "*")
        .replace("·", "*")
    )
    # Collapse LaTeX-ish wrappers from Surya
    s = re.sub(r"\\text\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\ln\s*", "ln ", s)
    s = s.replace("^{", "^").replace("_{", "_")
    return s


def _floats(s: str) -> list[float]:
    return [float(x) for x in re.findall(_NUM, _norm(s))]


def _parse_poly_expr(expr: str) -> dict[str, Any]:
    """Best-effort coefficient bag from a °G polynomial string."""
    e = _norm(expr)
    e = e.replace("T-1", "T^(-1)").replace("T^2", "T2").replace("T^3", "T3")
    return {
        "expressionRaw": expr.strip()[:400],
        "numbers": _floats(e)[:16],
    }


def _table_i_from_ocr(text: str) -> dict[str, Any]:
    phases: dict[str, Any] = {}
    flat = {
        "anorthite": (r"Anorthite\s*\([^)\n]{0,40}\)\s*([-+0-9.].{10,200})", "CaAl2Si2O8"),
        "gehlenite": (r"Gehlenite\s*\([^)\n]{0,40}\)\s*([-+0-9.].{10,200})", "Ca2Al2SiO7"),
        "grossular": (r"(?:\u2020|\u2020|†)?Grossular\s*\([^)\n]{0,40}\)\s*([-+0-9.].{10,200})", "Ca3Al2Si3O12"),
        "clinopyroxene": (r"(?:\u2020|†)?Clinopyroxene\s*\([^)\n]{0,40}\)\s*([-+0-9.].{10,200})", "CaAl2SiO6"),
    }
    blob = _norm(text)
    for phase_id, (pat, formula) in flat.items():
        m = re.search(pat, blob)
        if not m:
            continue
        expr = m.group(1).strip()
        # Stop at next compound name if glued
        expr = re.split(r"(?:Gehlenite|Grossular|Clinopyroxene|Table II)\b", expr)[0].strip()
        parsed = _parse_poly_expr(expr)
        n = len(parsed["numbers"])
        phases[phase_id] = {
            "phaseId": phase_id,
            "formula": formula,
            "state": "solid",
            "property": "Gm_minus_HSER",
            **parsed,
            "ref": "Mao2006",
            "convention": "SER",
            "page": "Table I",
            "status": "ok" if n >= 5 else "partial",
            "note": (
                "From Wang et al. (high-P) in Mao Table I"
                if phase_id in ("grossular", "clinopyroxene")
                else None
            ),
        }
    return phases


def _table_iii_from_ocr(text: str) -> dict[str, Any]:
    blob = _norm(text)
    # Footnote "All parameter values…" sits under the caption — do not cut there.
    m = re.search(
        r"Table III\.?\s*Thermodynamic Property of Liquid.*?"
        r"(°GAl2O3\s*-?\s*HSER.*?)(?=Table IV\.|$)",
        blob,
        re.S | re.I,
    )
    if not m:
        return {}
    body = m.group(1)

    oxide_g: dict[str, Any] = {}
    for label, key in (("GAl2O3", "Al2O3"), ("GSiO2", "SiO2"), ("GCaO", "CaO")):
        block_m = re.search(
            rf"°?{label}\s*-?\s*HSER(.*?)(?=°?G(?:Al2O3|SiO2|CaO)|°?GAl\+|°?GCa\+|0L|\dL|$)",
            body,
            re.S | re.I,
        )
        if not block_m:
            continue
        rows: list[dict[str, Any]] = []
        for rm in re.finditer(
            rf"({_NUM})\s*<\s*T\s*<\s*({_NUM})\s+(.+?)(?=\n|{_NUM}\s*<\s*T\s*<|$)",
            block_m.group(1),
            re.S,
        ):
            expr = re.sub(r"\s+", " ", rm.group(3)).strip()
            parsed = _parse_poly_expr(expr)
            rows.append(
                {
                    "Tmin_K": float(rm.group(1)),
                    "Tmax_K": float(rm.group(2)),
                    **parsed,
                    "status": "ok" if len(parsed["numbers"]) >= 3 else "partial",
                }
            )
        if rows:
            oxide_g[key] = {
                "phaseId": f"liquid_{key}",
                "formula": key,
                "state": "liquid",
                "property": "G_minus_HSER",
                "ranges": rows,
                "ref": "Mao2006",
                "convention": "SER",
                "page": "Table III",
                "status": "ok" if all(r["status"] == "ok" for r in rows) else "partial",
            }

    endmembers: list[dict[str, Any]] = []
    for em in re.finditer(
        r"°?(G(?:Al|Ca)[^:\n]{2,30}:[^\s]{2,30})\s+(2?°?G[^\n]{3,120})",
        body,
    ):
        endmembers.append(
            {
                "parameter": re.sub(r"\s+", "", em.group(1)),
                "expressionRaw": re.sub(r"\s+", " ", em.group(2)).strip()[:200],
                "ref": "Mao2006",
                "page": "Table III",
                "status": "ok",
            }
        )

    interactions: list[dict[str, Any]] = []
    for lm in re.finditer(
        rf"([0-3])L([A-Za-z0-9+,\-\s:]+?)\s+({_NUM}(?:[^\n]{{0,60}})?)",
        body,
    ):
        rhs = lm.group(3).strip()
        # Skip dangling references like "23LCa..." false positives — require numeric start
        if not re.match(rf"{_NUM}", rhs):
            continue
        name = "L" + re.sub(r"\s+", "", lm.group(2))
        nums = _floats(rhs)
        # a + bT style
        a = nums[0] if nums else None
        b = None
        tm = re.search(rf"([-+]?{_NUM})\s*([+-])\s*({_NUM})\s*T\b", rhs)
        if tm:
            a = float(tm.group(1))
            b = float(tm.group(3)) * (1 if tm.group(2) == "+" else -1)
        else:
            tm = re.search(rf"^({_NUM})\s*T\b", rhs)
            if tm:
                b = float(tm.group(1))
                a = 0.0

        interactions.append(
            {
                "order": int(lm.group(1)),
                "parameter": name,
                "expressionRaw": rhs,
                "a": a,
                "b": b,
                "numbers": nums[:6],
                "ref": "Mao2006",
                "page": "Table III",
                "status": "ok" if a is not None else "partial",
            }
        )

    liquid: dict[str, Any] = {
        "phaseId": "liquid_ionic_CAS",
        "model": "(Al+3,Ca+2)_P (AlO2-1, O-2, SiO4-4, SiO2)_Q",
        "system": "CaO-Al2O3-SiO2",
        "oxideG": oxide_g,
        "endmembers": endmembers,
        "interactions": interactions,
        "ref": "Mao2006",
        "convention": "SER",
        "page": "Table III",
        "status": "ok"
        if oxide_g and interactions and all(i.get("status") == "ok" for i in interactions)
        else "partial",
        "note": "Ionic two-sublattice liquid from Surya OCR of Table III.",
    }
    return {"liquid_ionic_CAS": liquid}


def parse_mao_2006_cas(
    pdf: Path | None = None,
    *,
    ocr_dir: Path | None = None,
) -> dict[str, Any]:
    """Build compact staging dataset; prefer OCR dumps when present."""
    if ocr_dir and ocr_dir.is_dir() and any(ocr_dir.glob("page-*.txt")):
        text = _load_ocr_text(ocr_dir)
        source_note = f"OCR {ocr_dir}"
    elif pdf is not None and pdf.is_file():
        text = _pdftotext(pdf)
        source_note = f"pdftotext {pdf.name}"
    else:
        raise FileNotFoundError(ocr_dir or pdf or Path("mao-2006-cas"))

    phases: dict[str, Any] = {}
    phases.update(_table_i_from_ocr(text))
    phases.update(_table_iii_from_ocr(text))
    ok = sum(1 for p in phases.values() if p.get("status") == "ok")
    partial = sum(1 for p in phases.values() if p.get("status") == "partial")
    return {
        "source": "Mao2006",
        "convention": "SER",
        "ref": "Mao2006",
        "nPhases": len(phases),
        "phases": phases,
        "status": "dataset" if ok and not partial else "partial",
        "note": (
            f"J. Am. Ceram. Soc. 89 (2006) 298–308 — CaO–Al2O3–SiO2; "
            f"{ok} ok / {partial} partial from {source_note}."
        ),
    }
