"""Parse Jung et al. (2009) Table 1 from page-ocr (Surya) dumps.

Refs:
  [65] Jung2009AlTiO

Reads ``tmp/reports/python/minerals-thermodynamic/jung-2009/ocr/page-NNNN.txt``
(Modal/local page-ocr). Table 1 lives on PDF page 2; all pages are scanned for
robustness. Parses MQM ``Δg°`` / ``q^{0i}`` per binary, Henrian SS shifts, and
stoichiometric Al2TiO5 / Al4TiO8.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

_NUM = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[Ee][-+]?\d+)?"

# Light cleanup that keeps line structure (needed to stop binary captures).
_LATEX_REPLACEMENTS: tuple[tuple[str, str], ...] = (
    (r"\\text\{([^}]*)\}", r"\1"),
    (r"\\mathrm\{([^}]*)\}", r"\1"),
    (r"\\quad", " "),
    (r"\\circ", ""),
    (r"\\Delta", "Delta"),
    (r"\\times", "*"),
    (r"\\,", " "),
    (r"\$", ""),
)


def _soften_latex(text: str) -> str:
    """Normalize LaTeX-ish OCR without joining all lines into one blob."""
    t = text.replace("−", "-").replace("–", "-")
    for pat, repl in _LATEX_REPLACEMENTS:
        t = re.sub(pat, repl, t)
    t = re.sub(r"10\^\{([+-]?\d+)\}", r"10e\1", t)
    t = re.sub(r"10\^([+-]?\d+)", r"10e\1", t)
    t = re.sub(r"_\{([^}]*)\}", r"\1", t)
    t = re.sub(r"\^\{([^}]*)\}", r"\1", t)
    t = re.sub(r"_([0-9A-Za-z.]+)", r"\1", t)
    t = re.sub(r"\^([0-9A-Za-z.+-]+)", r"\1", t)
    t = t.replace("{", "").replace("}", "")
    # Collapse spaces inside a line only
    t = "\n".join(re.sub(r"[ \t]+", " ", line).strip() for line in t.splitlines())
    return t


def _floats(s: str) -> list[float]:
    return [float(x) for x in re.findall(_NUM, s)]


def _read_ocr_pages(ocr_dir: Path, pages: list[int] | None = None) -> str:
    """Load Surya ``page-NNNN.txt`` dumps (skip ``*.pdftotext.txt``)."""
    chunks: list[str] = []
    if pages is None:
        paths = sorted(
            p
            for p in ocr_dir.glob("page-*.txt")
            if not p.name.endswith(".pdftotext.txt")
        )
    else:
        paths = [ocr_dir / f"page-{page:04d}.txt" for page in pages]
    for path in paths:
        if path.is_file():
            chunks.append(path.read_text(encoding="utf-8", errors="replace"))
    return "\n".join(chunks)


def _parse_cp(expr: str) -> dict[str, Any]:
    """Parse Berman–Brown-style ``a - b·10^n T^-2 - c T^-0.5 + d·10^m T^-3``."""
    e = re.sub(r"\s+", " ", expr)
    e = re.sub(r"10\^\{([+-]?\d+)\}", r"10e\1", e)
    e = re.sub(r"10\^([+-]?\d+)", r"10e\1", e)
    e = e.replace("×", "*").replace("·", "*")
    e = re.sub(r"T\^\{-2\}|T\^{-2}|T-2", "T-2", e)
    e = re.sub(r"T\^\{-0\.5\}|T\^{-0\.5}|T-0\.5", "T-0.5", e)
    e = re.sub(r"T\^\{-3\}|T\^{-3}|T-3", "T-3", e)
    m = re.search(
        rf"({_NUM})\s*-\s*({_NUM})\s*\*\s*10e([+-]?\d+)\s*T-2"
        rf"\s*-\s*({_NUM})\s*T-0\.5"
        rf"\s*\+\s*({_NUM})\s*\*\s*10e([+-]?\d+)\s*T-3",
        e,
    )
    if not m:
        return {"form": "raw", "raw": expr.strip(), "units": "J/(mol·K)"}
    a = float(m.group(1))
    b = -abs(float(m.group(2))) * (10 ** int(m.group(3)))
    c = -abs(float(m.group(4)))
    d = abs(float(m.group(5))) * (10 ** int(m.group(6)))
    return {
        "form": "a + b*T^-2 + c*T^-0.5 + d*T^-3",
        "a": a,
        "b": b,
        "c": c,
        "d": d,
        "units": "J/(mol·K)",
        "raw": expr.strip(),
    }


def _parse_mqm_binary_line(line: str) -> dict[str, Any] | None:
    """Extract Δg° and q01..q03 from one Table 1 liquid binary line."""
    # Example OCR (after soften):
    # Ti2O3-TiO2 binary:[12] Delta gTiO1.5, TiO2 = -19246.4, qTiO1.5, TiO201 = -112366.0, ...
    dg_m = re.search(
        rf"Delta\s*g[^:=]*=\s*({_NUM})",
        line,
        re.I,
    )
    if not dg_m:
        return None
    row: dict[str, Any] = {
        "dg0_Jmol": float(dg_m.group(1)),
        "raw": line.strip(),
        "ref": "Jung2009AlTiO",
    }
    # q … 01 =, q … 02 =, q … 03 = (OCR often glues the order digit to the species)
    for order in (1, 2, 3):
        qm = re.search(
            rf"q[^:=]*0?{order}\s*=\s*({_NUM})",
            line,
            re.I,
        )
        if qm:
            row[f"q0{order}_Jmol"] = float(qm.group(1))
    return row


def _parse_liquid_binaries(text: str) -> dict[str, dict[str, Any]]:
    binaries: dict[str, dict[str, Any]] = {}
    specs = (
        (r"Ti2O3\s*-\s*TiO2\s*binary", "Ti2O3-TiO2"),
        (r"Al2O3\s*-\s*TiO2\s*binary", "Al2O3-TiO2"),
        (r"Al2O3\s*-\s*Ti2O3\s*binary", "Al2O3-Ti2O3"),
    )
    for pat, key in specs:
        m = re.search(pat + r"\s*:[^\n]*", text, re.I)
        if not m:
            # Fallback: same line may use en-dash already softened
            m = re.search(pat + r"[^\n]{0,400}", text, re.I)
        if not m:
            continue
        parsed = _parse_mqm_binary_line(m.group(0))
        if parsed:
            binaries[key] = parsed
    return binaries


def _parse_henrian_shifts(text: str) -> dict[str, float]:
    solid_sol: dict[str, float] = {}
    m = re.search(
        rf"G_?Al2O3\(ilmenite\)[^=]*=\s*G_?Al2O3\(corundum\)[^\d+\-]*\+\s*({_NUM})",
        text,
        re.I,
    )
    if m:
        solid_sol["Al2O3_ilmenite_deltaG_Jmol"] = float(m.group(1))
    m = re.search(
        rf"G_?Ti2O3\(corundum\)[^=]*=\s*G_?Ti2O3\(ilmenite\)[^\d+\-]*\+\s*({_NUM})",
        text,
        re.I,
    )
    if m:
        solid_sol["Ti2O3_corundum_deltaG_Jmol"] = float(m.group(1))
    return solid_sol


def _parse_stoichiometric(text: str) -> dict[str, Any]:
    phases: dict[str, Any] = {}
    for formula, phase_id, name in (
        ("Al2TiO5", "tialite", "tialite"),
        ("Al4TiO8", "Al4TiO8", "Al4TiO8"),
    ):
        m = re.search(
            rf"{formula}\s*:\s*Delta\s*H[^=]*=\s*({_NUM})\s*"
            rf"S[^=]*=\s*({_NUM})\s*C_?p\s*=\s*(.+?)(?:Magn|Al4TiO8|$)",
            text,
            re.I | re.S,
        )
        if not m:
            continue
        # Keep Cp expression on one logical line
        cp_expr = re.sub(r"\s+", " ", m.group(3)).strip()
        cp_expr = re.split(r"\bMagn", cp_expr, maxsplit=1)[0].strip()
        cp = _parse_cp(cp_expr)
        phases[phase_id] = {
            "phaseId": phase_id,
            "formula": formula,
            "name": name,
            "Hf298_Jmol": float(m.group(1)),
            "S298_JmolK": float(m.group(2)),
            "cp": cp,
            "convention": "formation_298",
            "ref": "Jung2009AlTiO",
            "table": 1,
            "pdfPage": 2,
            "status": "ok" if "a" in cp else "partial",
        }
    return phases


def parse_jung_table1(ocr_dir: Path) -> dict[str, Any]:
    """Build compact Al–Ti–O dataset from Jung page-ocr Table 1 dumps."""
    raw = _read_ocr_pages(ocr_dir)
    if not raw.strip():
        # Backward-compatible: older calls expected pages 2–4 only
        raw = _read_ocr_pages(ocr_dir, [2, 3, 4])
    if not raw.strip():
        raise FileNotFoundError(f"no Jung OCR pages under {ocr_dir}")

    text = _soften_latex(raw)
    phases: dict[str, Any] = {}
    phases.update(_parse_stoichiometric(text))

    binaries = _parse_liquid_binaries(text)
    if binaries:
        # Status ok only when each binary has dg0 and at least q01
        complete = all(
            "dg0_Jmol" in row and "q01_Jmol" in row for row in binaries.values()
        )
        phases["liquid_MQM"] = {
            "phaseId": "liquid_MQM",
            "formula": "AlO1.5-TiO1.5-TiO2",
            "model": "modified_quasichemical",
            "ternaryApproximation": "Toop-like with TiO2 asymmetric",
            "ternaryParameters": None,
            "parameters": {"binaries": binaries},
            "convention": "SER",
            "ref": "Jung2009AlTiO",
            "table": 1,
            "pdfPage": 2,
            "status": "ok" if complete else "partial",
            "note": "MQM Δg° and q0i from Table 1 (page-ocr); no ternary L.",
        }

    solid_sol = _parse_henrian_shifts(text)
    if solid_sol:
        phases["corundum_ilmenite_ss"] = {
            "phaseId": "corundum_ilmenite_ss",
            "parameters": solid_sol,
            "convention": "SER",
            "ref": "Jung2009AlTiO",
            "table": 1,
            "pdfPage": 2,
            "status": "ok",
        }

    return {
        "source": "Jung2009AlTiO",
        "convention": "formation_298",
        "ref": "Jung2009AlTiO",
        "nPhases": len(phases),
        "phases": phases,
        "note": (
            "Table 1 from page-ocr (Surya) of ISIJ Int. 49 (2009) p.1291; "
            "Cp Berman/Brown; liquid MQM binaries + Henrian SS shifts."
        ),
    }
