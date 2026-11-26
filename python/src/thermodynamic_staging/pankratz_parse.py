"""Parse Pankratz (1982) USBM Bull. 672 OCR pages into calculable oxide rows.

Refs:
  [64] Pankratz1982

Tables are cal/mol and kcal/mol at 298.15 K; converted to SI in the dataset.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

_NUM = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[Ee][-+]?\d+)?"

# PDF page → compound meta for Priority / extra oxides
TARGET_PAGES: dict[int, dict[str, str]] = {
    111: {"phaseId": "ceria", "formula": "CeO2", "name": "cerium dioxide"},
    112: {"phaseId": "Ce2O3", "formula": "Ce2O3", "name": "cerium sesquioxide"},
    220: {"phaseId": "La2O3", "formula": "La2O3", "name": "lanthanum sesquioxide"},
    238: {"phaseId": "manganosite", "formula": "MnO", "name": "manganese monoxide"},
    239: {"phaseId": "pyrolusite", "formula": "MnO2", "name": "manganese dioxide"},
    240: {"phaseId": "Mn2O3", "formula": "Mn2O3", "name": "manganese sesquioxide"},
    241: {"phaseId": "hausmannite", "formula": "Mn3O4", "name": "hausmannite"},
    481: {"phaseId": "yttria", "formula": "Y2O3", "name": "yttrium sesquioxide"},
}

CAL_TO_J = 4.184
KCAL_TO_KJ = 4.184


def _norm(s: str) -> str:
    return (
        s.replace("−", "-")
        .replace("–", "-")
        .replace("·", ".")
        .replace(",", "")
        .replace("°", "")
        .replace("\\text", "")
        .replace("{", "")
        .replace("}", "")
        .replace("$", "")
    )


def _floats(line: str) -> list[float]:
    return [float(x) for x in re.findall(_NUM, _norm(line))]


def _parse_298_row(text: str) -> dict[str, float] | None:
    """Extract the tabulated 298.15 K data row (not Cp-equation range headers)."""
    best: dict[str, float] | None = None
    for line in text.splitlines():
        nline = _norm(line).strip()
        # Exact table row starts with 298.15 (optional * footnote) then whitespace
        # (not 298.15-1500 equation ranges).
        if not re.match(r"^298\.15\*?\s+", nline):
            continue
        if re.match(r"^298\.15\*?\s*[-–]", nline):
            continue
        nums = _floats(nline)
        # T Cp S gef Hrel Hf Gf [logK]
        if len(nums) < 7:
            continue
        if abs(nums[0] - 298.15) > 0.05:
            continue
        cp, s298, gef, hrel = nums[1], nums[2], nums[3], nums[4]
        # Hrel at 298 is ~0; Hf/Gf are large (often negative for oxides)
        hf, gf = nums[5], nums[6]
        logk = nums[7] if len(nums) > 7 else None
        # Sanity: Cp and S positive and modest; |Hf| typically >> 10 kcal
        if not (0 < cp < 200 and 0 < s298 < 200):
            continue
        if abs(hrel) > 5:
            continue
        row: dict[str, float] = {
            "Cp298_cal_molK": cp,
            "S298_cal_molK": s298,
            "Gef298_cal_molK": gef,
            "Hrel298_kcal_mol": hrel,
            "Hf298_kcal_mol": hf,
            "Gf298_kcal_mol": gf,
        }
        if logk is not None:
            row["logKf298"] = logk
        best = row
        break
    return best


def _parse_cp_equation(text: str) -> dict[str, Any] | None:
    """First heat-capacity polynomial near 298 K when present."""
    # Cp° = a + b x 10^-3 T - c x 10^5 T^-2
    m = re.search(
        rf"Cp[^\n=]*=\s*({_NUM})\s*\+\s*({_NUM})\s*x?\s*10\^?\s*([+-]?\d+)\s*T"
        rf"[^\n]*?-\s*({_NUM})\s*x?\s*10\^?\s*([+-]?\d+)\s*T",
        _norm(text),
        re.I,
    )
    if not m:
        return None
    a = float(m.group(1))
    b = float(m.group(2)) * (10 ** int(m.group(3)))
    c = -abs(float(m.group(4))) * (10 ** int(m.group(5)))
    return {
        "form": "a + b*T + c*T^-2",
        "a_cal_molK": a,
        "b_cal_molK2": b,
        "c_cal_molK": c,
        "a_JmolK": a * CAL_TO_J,
        "b_JmolK2": b * CAL_TO_J,
        "c_JmolK": c * CAL_TO_J,
        "units": "converted to J/(mol·K) with 1 cal = 4.184 J",
    }


def parse_pankratz_ocr(ocr_dir: Path) -> dict[str, Any]:
    phases: dict[str, Any] = {}
    for page, meta in TARGET_PAGES.items():
        path = ocr_dir / f"page-{page:04d}.txt"
        if not path.is_file():
            if page == 241:
                path = ocr_dir / "page-0242.txt"
            if not path.is_file():
                continue
        text = path.read_text(encoding="utf-8", errors="replace")
        row = _parse_298_row(text)
        cp_eq = _parse_cp_equation(text)
        if not row:
            phases[meta["phaseId"]] = {
                **meta,
                "pdfPage": page,
                "ref": "Pankratz1982",
                "convention": "formation_298",
                "status": "partial",
                "note": "OCR present but 298.15 table row not parsed",
                "cpEquation": cp_eq,
            }
            continue
        phase: dict[str, Any] = {
            **meta,
            "pdfPage": page,
            "ref": "Pankratz1982",
            "convention": "formation_298",
            "unitsSource": "cal/mol and kcal/mol (Bulletin 672)",
            "Cp298_JmolK": row["Cp298_cal_molK"] * CAL_TO_J,
            "S298_JmolK": row["S298_cal_molK"] * CAL_TO_J,
            "Hf298_kJmol": row["Hf298_kcal_mol"] * KCAL_TO_KJ,
            "Gf298_kJmol": row["Gf298_kcal_mol"] * KCAL_TO_KJ,
            "status": "ok",
            "raw298": row,
        }
        if "logKf298" in row:
            phase["logKf298"] = row["logKf298"]
        if cp_eq:
            phase["cpEquation"] = cp_eq
        phases[meta["phaseId"]] = phase

    return {
        "source": "Pankratz1982",
        "convention": "formation_298",
        "ref": "Pankratz1982",
        "nPhases": len(phases),
        "phases": phases,
        "note": (
            "298.15 K rows from Modal Surya OCR of selected USBM Bull. 672 pages; "
            "SI conversions use 1 cal = 4.184 J. Texts remain in tmp."
        ),
    }
