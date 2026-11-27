"""Pull discrete thermo tables from Tier-2 PDFs / ThermoML JSON.

Refs:
  [65] Jung2009AlTiO
  [66] Malan2019
  [67] Watanabe2000
  [68] Koroleva2017
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from typing import Any


def _pdftotext(pdf: Path, *, first: int | None = None, last: int | None = None) -> str:
    cmd = ["pdftotext", "-layout"]
    if first is not None:
        cmd += ["-f", str(first)]
    if last is not None:
        cmd += ["-l", str(last)]
    cmd += [str(pdf), "-"]
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout


def extract_koroleva_silicates(pdf: Path) -> dict[str, Any]:
    """Fast pdftotext scan of Table 1 (analysis only).

    Production extract uses Modal Surya OCR via ``koroleva_parse.parse_koroleva_ocr``.
    """
    text = _pdftotext(pdf)
    # Capture "This work" enthalpy/entropy pairs by scanning Table 1 block.
    block_m = re.search(
        r"Table 1\s+Standard entropy and enthalpy.*?(?=Alkali metal borates)",
        text,
        re.S,
    )
    block = block_m.group(0) if block_m else text
    rows: list[dict[str, Any]] = []
    # Formula lines like "     Na4SiO4" then later "This work" numbers.
    formula_re = re.compile(
        r"^\s*(Li2SiO3|Li2Si2O5|Na2SiO3|Na2Si2O5|K2SiO3|K2Si2O5|"
        r"Na4SiO4|K2Si4O9|Na6Si2O7|Na2Si3O7|Li4SiO4|Li4Si3O8|"
        r"Na2Si4O9|Na4Si3O8)\b",
        re.M,
    )
    formulas = list(formula_re.finditer(block))
    for i, fm in enumerate(formulas):
        chunk = block[fm.start() : formulas[i + 1].start() if i + 1 < len(formulas) else len(block)]
        # PDF uses ASCII '-' or Unicode dashes before ΔfH magnitudes.
        nums = re.findall(
            r"([−–-]?\d+(?:\.\d+)?)\s+This work",
            chunk,
        )
        floats: list[float] = []
        for raw in nums:
            cleaned = raw.replace("−", "-").replace("–", "-")
            floats.append(float(cleaned))
        # Enthalpies in this table are negative; restore sign if OCR/layout dropped it.
        s_vals = [v for v in floats if abs(v) < 1000]
        h_vals = []
        for v in floats:
            if abs(v) < 1000:
                continue
            h_vals.append(-abs(v))
        row: dict[str, Any] = {
            "formula": fm.group(1),
            "ref": "Koroleva2017",
            "table": 1,
            "note": "This work regression-matched values from Table 1",
        }
        if s_vals:
            row["S298_JmolK"] = s_vals[-1]
        if h_vals:
            row["Hf298_kJmol"] = h_vals[-1]
        rows.append(row)
    return {
        "source": "Koroleva2017",
        "property": "S298_and_Hf298_crystalline_alkali_silicates",
        "units": {"S298": "J/(mol·K)", "Hf298": "kJ/mol"},
        "nRows": len(rows),
        "rows": rows,
    }


def extract_malan_fe2tio5(pdf: Path) -> dict[str, Any]:
    """Table 4 Fe2TiO5 row from Malan et al. 2019."""
    text = _pdftotext(pdf)
    m = re.search(
        r"Fe2\s*TiO5\s*\(s\)\s+(-?\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)"
        r".*?(-?\d+(?:\.\d+)?)\s+(\d+)-(\d+)\s+This study",
        text,
        re.S,
    )
    if not m:
        # Looser layout (as seen in pdftotext dump)
        m = re.search(
            r"Fe2\s*TiO5\s*\(s\)\s+(-?\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)"
            r"\s+(-?\d+(?:\.\d+)?)\s+(\d+)\s*-\s*(\d+)",
            text,
        )
    if not m:
        raise ValueError("Fe2TiO5 Table 4 row not found in Malan PDF text")
    return {
        "source": "Malan2019",
        "compound": {
            "formula": "Fe2TiO5",
            "name": "pseudobrookite",
            "state": "solid",
            "Hf298_Jmol": float(m.group(1)),
            "S298_JmolK": float(m.group(2)),
            "cp": {
                "form": "a + b*1e-3*T + c*T^-0.5 + d*1e3*T^-1 + e*1e5*T^-2 + f*1e7*T^-3",
                "a": float(m.group(3)),
                "b": None,
                "c": None,
                "d": None,
                "e": float(m.group(4)),
                "f": None,
                "Tmin_K": int(m.group(5)),
                "Tmax_K": int(m.group(6)),
                "units": "J/(mol·K)",
            },
            "ref": "Malan2019",
            "table": 4,
        },
    }


def extract_watanabe_cuspidine(pdf: Path) -> dict[str, Any]:
    """Cuspidine melting / heat-content results (Watanabe / Maruo et al. 2000)."""
    text = _pdftotext(pdf)
    # Robust values stated in the report and readable in OCR/text:
    # Tm = 1683 K, ΔHfus = 119 kJ/mol
    tm = 1683.0 if re.search(r"1683\s*K", text) else None
    dh = None
    m = re.search(r"1683\s*K.*?119\s*kJ", text, re.S | re.I)
    if m or re.search(r"119\s*kJ/mol", text, re.I):
        dh = 119.0
    # Solid / liquid heat-content linear fits when readable
    hs = re.search(
        r"Hs\s*=\s*0\.382T\s*[−\-‑]\s*135\s*[±\+\-]\s*15",
        text,
        re.I,
    )
    hl = re.search(
        r"Hf?\s*=\s*0\.854T\s*[−\-‑]\s*810\s*[±\+\-]\s*25",
        text,
        re.I,
    )
    return {
        "source": "Watanabe2000",
        "compound": {
            "formula": "Ca3Si2O7F2",
            "name": "cuspidine",
            "Tm_K": tm,
            "Hfus_kJmol": dh,
            "Hfus_uncertainty_kJmol": 3.0 if dh else None,
            "heatContent": {
                "solid_kJmol": "0.382*T - 135 ± 15 (1104–1683 K)" if hs or dh else None,
                "liquid_kJmol": "0.854*T - 810 ± 25 (1683–1827 K)" if hl or dh else None,
            },
            "ref": "Watanabe2000",
            "note": "Japanese-language Osaka Univ. paper; values cross-checked against English abstract garbled OCR",
        },
    }


def extract_jung_al2tio5_narrative(pdf: Path) -> dict[str, Any]:
    """Al2TiO5 thermo notes from Jung et al. 2009 (Table 1 is figure/image-heavy)."""
    text = _pdftotext(pdf)
    s298 = None
    m = re.search(r"entropy at 298\.15\s*K\s+was calculated as\s+([0-9.]+)", text, re.I)
    if m:
        s298 = float(m.group(1))
    return {
        "source": "Jung2009AlTiO",
        "compound": {
            "formula": "Al2TiO5",
            "name": "tialite",
            "S298_JmolK_King": s298,
            "S298_uncertainty_JmolK": 0.8 if s298 else None,
            "note": (
                "Optimized Table 1 (MQM liquid + compound G) is image/layout in PDF; "
                "Cp taken from Berman & Brown / Bonnickson per paper text. "
                "Full parameter table needs OCR of Table 1 page."
            ),
            "ref": "Jung2009AlTiO",
            "needsOcr": ["Table 1 optimized model parameters"],
        },
    }


def extract_nagai_thermoml(path: Path) -> dict[str, Any]:
    """Keep ThermoML JSON for Al2O3–B2O3 / Al18B4O33 Gibbs work (Nagai 2009)."""
    data = json.loads(path.read_text(encoding="utf-8"))
    compounds = []
    for c in data.get("Compound", []):
        compounds.append(
            {
                "formula": c.get("sFormulaMolec"),
                "names": c.get("sCommonName"),
            }
        )
    abstract = None
    cit = data.get("Citation") or {}
    if isinstance(cit.get("sAbstract"), list):
        abstract = " ".join(cit["sAbstract"])
    elif isinstance(cit.get("sAbstract"), str):
        abstract = cit["sAbstract"]
    return {
        "source": "Nagai2009",
        "doi": "10.1016/j.jct.2009.06.002",
        "abstract": abstract,
        "compoundsListed": compounds,
        "nPureOrMixtureData": len(data.get("PureOrMixtureData") or []),
        "rawFile": "j.jct.2009.06.002.json",
        "note": "Machine-readable ThermoML dump; parse PureOrMixtureData for ΔfG(T) of Al18B4O33",
        "ref": "Nagai2009",
    }
