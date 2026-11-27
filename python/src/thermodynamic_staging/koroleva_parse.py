"""Parse Koroleva et al. (2017) tables + regressions from Modal Surya OCR.

Refs:
  [68] Koroleva2017

Reads ``tmp/reports/python/minerals-thermodynamic/koroleva-2017/ocr/page-NNNN.txt``.
Table 1 (silicates) → page 4; Table 2 (borates) → pages 5–6; eqs (6)(7) → page 3;
eqs (10)(11) → pages 5–6. Prefer OCR over pdftotext (equations are image-like).
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

_NUM = r"[-+]?(?:\d+\.?\d*|\.\d+)"

_SILICATE_FORMULAS: tuple[str, ...] = (
    "Li2SiO3",
    "Li2Si2O5",
    "Na2SiO3",
    "Na2Si2O5",
    "K2SiO3",
    "K2Si2O5",
    "Na4SiO4",
    "K2Si4O9",
    "Na6Si2O7",
    "Na2Si3O7",
    "Li4SiO4",
    "Li4Si3O8",
    "Na2Si4O9",
    "Na4Si3O8",
)

_BORATE_FORMULAS: tuple[str, ...] = (
    "LiBO2",
    "Li2B4O7",
    "Li2B6O10",
    "Li2B8O13",
    "NaBO2",
    "Na2B4O7",
    "Na2B6O10",
    "Na2B8O13",
    "KBO2",
    "K2B4O7",
    "K2B6O10",
    "K2B8O13",
)

# OCR sometimes writes metaborate as K2BO2.
_FORMULA_ALIASES: dict[str, str] = {
    "K2BO2": "KBO2",
}

_LATEX_REPLACEMENTS: tuple[tuple[str, str], ...] = (
    (r"\\text\{([^}]*)\}", r"\1"),
    (r"\\mathrm\{([^}]*)\}", r"\1"),
    (r"\\quad", " "),
    (r"\\circ", ""),
    (r"\\Delta", "Delta"),
    (r"\\cdot", "*"),
    (r"\\,", " "),
    (r"\$", ""),
)


def _soften_latex(text: str) -> str:
    t = text.replace("−", "-").replace("–", "-")
    for pat, repl in _LATEX_REPLACEMENTS:
        t = re.sub(pat, repl, t)
    t = re.sub(r"_\{([^}]*)\}", r"\1", t)
    t = re.sub(r"\^\{([^}]*)\}", r"\1", t)
    t = re.sub(r"_([0-9A-Za-z.]+)", r"\1", t)
    t = re.sub(r"\^([0-9A-Za-z.+-]+)", r"\1", t)
    t = t.replace("{", "").replace("}", "")
    # OCR leaves bare ``H^`` / ``S^`` after stripping \\circ
    t = re.sub(r"([A-Za-z])\^(?=\s*\()", r"\1", t)
    # ``- 738.059`` / ``- -625`` → attach signs to numbers
    t = re.sub(r"-\s+-", "-", t)
    t = re.sub(r"([=\s])-\s+(\d)", r"\1-\2", t)
    return "\n".join(re.sub(r"[ \t]+", " ", line).strip() for line in t.splitlines())


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


def _normalize_formula(raw: str) -> str:
    key = raw.replace(" ", "")
    return _FORMULA_ALIASES.get(key, key)


def _parse_this_work_table(
    text: str,
    *,
    formulas: tuple[str, ...],
    table: int,
    family: str,
) -> dict[str, dict[str, Any]]:
    """Pull S298 / Hf298 from 'This work' rows for known formulas."""
    soft = _soften_latex(text)
    # Allow OCR aliases in the match set.
    alias_to_canon = {f: f for f in formulas}
    for alias, canon in _FORMULA_ALIASES.items():
        if canon in formulas:
            alias_to_canon[alias] = canon
    names = sorted(alias_to_canon.keys(), key=len, reverse=True)
    formula_re = re.compile(r"(?<![A-Za-z0-9])(" + "|".join(names) + r")(?![A-Za-z0-9])")
    matches = list(formula_re.finditer(soft))
    phases: dict[str, dict[str, Any]] = {}
    for i, fm in enumerate(matches):
        canon = alias_to_canon[fm.group(1)]
        chunk = soft[fm.start() : matches[i + 1].start() if i + 1 < len(matches) else len(soft)]
        # Only numbers immediately followed by "This work".
        nums = [
            float(m.group(1))
            for m in re.finditer(rf"({_NUM})\s+This work", chunk, re.I)
        ]
        s_vals = [v for v in nums if abs(v) < 900.0]
        h_vals = [-abs(v) for v in nums if abs(v) >= 900.0]
        if not s_vals and not h_vals:
            continue
        row: dict[str, Any] = {
            "formula": canon,
            "family": family,
            "ref": "Koroleva2017",
            "table": table,
            "note": f"This work regression-matched values from Table {table}",
            "status": "ok",
            "convention": "formation_298",
        }
        if s_vals:
            row["S298_JmolK"] = s_vals[-1]
        if h_vals:
            row["Hf298_kJmol"] = h_vals[-1]
        phases[canon] = row
    return phases


def _coeff_map(expr: str, oxides: tuple[str, ...]) -> dict[str, float]:
    """Extract ``coef * x(Oxide)`` terms for named oxides."""
    out: dict[str, float] = {}
    for ox in oxides:
        m = re.search(
            rf"({_NUM})\s*\*?\s*x\s*\(\s*{re.escape(ox)}\s*\)",
            expr,
            re.I,
        )
        if m:
            out[ox] = float(m.group(1))
    return out


def _parse_regressions(text: str) -> dict[str, Any]:
    soft = _soften_latex(text)
    sil_ox = ("SiO2", "Li2O", "Na2O", "K2O")
    bor_ox = ("B2O3", "Li2O", "Na2O", "K2O")

    def _eq_body(num: int) -> str:
        # Capture from property symbol through ``(N)``.
        m = re.search(
            rf"(?:S|Delta_?f\s*H)\s*\([^\n]{{0,240}}?=([^\n]+)\(\s*{num}\s*\)",
            soft,
            re.I,
        )
        if not m:
            # Fallback: line containing ``(N)`` after a long equation.
            m = re.search(rf"([^\n]{{40,500}})\(\s*{num}\s*\)", soft)
        return m.group(1) if m else ""

    s6 = _coeff_map(_eq_body(6), sil_ox)
    h7 = _coeff_map(_eq_body(7), sil_ox)
    h10 = _coeff_map(_eq_body(10), bor_ox)
    s11 = _coeff_map(_eq_body(11), bor_ox)

    excess_sil: dict[str, float] = {}
    for ox in ("Li2O", "Na2O", "K2O"):
        m = re.search(
            rf"b_?{re.escape(ox)}\s*\(?\s*Ex\s*\)?\s*=\s*({_NUM})",
            soft,
            re.I,
        )
        if m:
            excess_sil[ox] = float(m.group(1))

    excess_bor: dict[str, float] = {}
    # Equation (10) excess block sits before Table 2 / eq (11).
    block10 = soft
    m10 = re.search(
        r"excess functions of contributions of alkali metal oxides to equation \(10\)(.*?)(?:Table 2|equation \(11\)|Conclusions)",
        soft,
        re.S | re.I,
    )
    if m10:
        block10 = m10.group(1)
    for ox in ("Li2O", "Na2O", "K2O"):
        m = re.search(
            rf"b_?{re.escape(ox)}\s*\(?\s*Ex\s*\)?\s*=\s*({_NUM})",
            block10,
            re.I,
        )
        if m:
            excess_bor[ox] = float(m.group(1))

    # Silicate excess is on page 3 near eq (7); re-parse that slice to avoid
    # overwriting with borate values when both are in the same soft text.
    m7 = re.search(
        r"excess functions of contributions of alkali metal oxides to equation \(7\)(.*?)(?:Therefore|Alkali metal borates|Table 1)",
        soft,
        re.S | re.I,
    )
    if m7:
        excess_sil = {}
        for ox in ("Li2O", "Na2O", "K2O"):
            m = re.search(
                rf"b_?{re.escape(ox)}\s*\(?\s*Ex\s*\)?\s*=\s*({_NUM})",
                m7.group(1),
                re.I,
            )
            if m:
                excess_sil[ox] = float(m.group(1))

    return {
        "silicate_S298": {
            "equation": 6,
            "T_K": 298.15,
            "units": "J/(mol·K)",
            "form": "sum b_i * x(oxide); oxides = SiO2, Li2O, Na2O, K2O",
            "coeffs": s6,
            "ref": "Koroleva2017",
            "page": 3,
        },
        "silicate_Hf298": {
            "equation": 7,
            "T_K": 298.15,
            "units": "kJ/mol",
            "form": "sum b_i * x(oxide); oxides = SiO2, Li2O, Na2O, K2O",
            "coeffs": h7,
            "excess_kJmol": excess_sil,
            "ref": "Koroleva2017",
            "page": 3,
        },
        "borate_Hf298": {
            "equation": 10,
            "T_K": 298.15,
            "units": "kJ/mol",
            "form": "sum b_i * x(oxide); oxides = B2O3, Li2O, Na2O, K2O",
            "coeffs": h10,
            "excess_kJmol": excess_bor,
            "ref": "Koroleva2017",
            "page": 5,
        },
        "borate_S298": {
            "equation": 11,
            "T_K": 298.15,
            "units": "J/(mol·K)",
            "form": "sum b_i * x(oxide); oxides = B2O3, Li2O, Na2O, K2O",
            "coeffs": s11,
            "ref": "Koroleva2017",
            "page": 6,
        },
    }


def parse_koroleva_ocr(ocr_dir: Path) -> dict[str, Any]:
    """Build Koroleva phases + regression coeffs from Surya OCR dumps."""
    if not ocr_dir.is_dir():
        raise FileNotFoundError(f"Koroleva OCR dir missing: {ocr_dir}")
    raw = _read_ocr_pages(ocr_dir)
    if not raw.strip():
        raise FileNotFoundError(f"no Koroleva OCR pages under {ocr_dir}")

    silicates = _parse_this_work_table(
        _read_ocr_pages(ocr_dir, [4]) or raw,
        formulas=_SILICATE_FORMULAS,
        table=1,
        family="silicate",
    )
    borates = _parse_this_work_table(
        _read_ocr_pages(ocr_dir, [5, 6]) or raw,
        formulas=_BORATE_FORMULAS,
        table=2,
        family="borate",
    )
    phases = {**silicates, **borates}
    regressions = _parse_regressions(raw)
    return {
        "source": "Koroleva2017",
        "convention": "formation_298",
        "ref": "Koroleva2017",
        "nPhases": len(phases),
        "phases": phases,
        "regressions": regressions,
        "units": {"S298": "J/(mol·K)", "Hf298": "kJ/mol"},
        "note": (
            "Table 1 silicates + Table 2 borates (This work) and regression "
            "eqs (6)(7)(10)(11) from Modal Surya OCR"
        ),
    }
