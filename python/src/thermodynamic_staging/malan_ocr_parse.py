"""Parse Malan et al. (2019) Table 3 solution parameters from page-ocr.

Refs:
  [66] Malan2019

Source OCR: ``tmp/reports/python/minerals-thermodynamic/malan-2019/ocr/``.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

_NUM = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[Ee][-+]?\d+)?"


def _load_ocr(ocr_dir: Path) -> str:
    parts: list[str] = []
    for path in sorted(ocr_dir.glob("page-*.txt")):
        if path.name.endswith(".pdftotext.txt"):
            continue
        parts.append(path.read_text(encoding="utf-8", errors="replace"))
    return "\n".join(parts)


def _soften(text: str) -> str:
    t = text.replace("−", "-").replace("–", "-")
    t = re.sub(r"\\text\{([^}]*)\}", r"\1", t)
    t = re.sub(r"\\mathrm\{([^}]*)\}", r"\1", t)
    t = t.replace("\\circ", "").replace("\\Delta", "Delta").replace("\\times", "*")
    t = t.replace("\\,", " ").replace("$", "")
    t = re.sub(r"_\{([^}]*)\}", r"\1", t)
    t = re.sub(r"\^\{([^}]*)\}", r"\1", t)
    t = re.sub(r"_([0-9A-Za-z]+)", r"\1", t)
    t = t.replace("{", "").replace("}", "")
    t = re.sub(r"[ \t]+", " ", t)
    return t


def parse_malan_ocr(ocr_dir: Path) -> dict[str, Any]:
    """Build Table 3 liquid / SS parameter rows from Malan page-ocr."""
    if not ocr_dir.is_dir():
        raise FileNotFoundError(ocr_dir)
    text = _soften(_load_ocr(ocr_dir))
    phases: dict[str, Any] = {}

    liquid_params: list[dict[str, Any]] = []
    # Δg°_Fe3+–Ti4+ = 152411 - 92.6727 * T
    # OCR often keeps carets: Delta gFe3+ - Ti^4+ = 152411 - 92.6727 * T
    m = re.search(
        rf"Delta\s*g[^\\n=]{{0,40}}Fe\^?3\+[^\\n=]{{0,20}}Ti\^?4\+\s*=\s*"
        rf"({_NUM})\s*-\s*({_NUM})\s*\*\s*T",
        text,
        re.I,
    )
    if m:
        liquid_params.append(
            {
                "parameter": "dg0_Fe3+_Ti4+",
                "binary": "TiO2-Fe2O3",
                "model": "quasichemical",
                "a": float(m.group(1)),
                "b": -float(m.group(2)),
                "expressionRaw": f"{m.group(1)}-{m.group(2)}*T",
                "ref": "Malan2019",
                "page": "Table 3",
                "status": "ok",
            }
        )

    if liquid_params:
        phases["liquid_quasichemical"] = {
            "phaseId": "liquid_quasichemical",
            "formula": "FeO-Fe2O3-TiO2-Ti2O3-V2O5",
            "model": "quasichemical",
            "parameters": liquid_params,
            "adoptedFrom": [
                "Degterov FeO-Fe2O3",
                "Kang TiO2-Ti2O3",
                "Eriksson TixOx-FeO",
                "Malan V2O5 binaries",
            ],
            "convention": "SER",
            "ref": "Malan2019",
            "page": "Table 3",
            "status": "ok",
            "note": "Only Fe3+–Ti4+ Δg° optimised in this work; other binaries adopted.",
        }

    # G_TiO2(s)-Hem = G_TiO2(s) - 12200.36 - 37.9927T ...
    hm = re.search(
        rf"G_?TiO2\(s\)\s*-\s*Hem[^=]*=\s*G_?TiO2\(s\)\s*"
        rf"-\s*({_NUM})\s*-\s*({_NUM})\s*T",
        text,
        re.I,
    )
    if hm:
        phases["hematite_ss"] = {
            "phaseId": "hematite_ss",
            "formula": "Fe2O3-TiO2-V2O5",
            "parameters": [
                {
                    "parameter": "G_TiO2_in_hematite_shift",
                    "a": -float(hm.group(1)),
                    "b": -float(hm.group(2)),
                    "expressionRaw": f"-{hm.group(1)}-{hm.group(2)}T",
                    "ref": "Malan2019",
                    "page": "Table 3",
                    "status": "ok",
                }
            ],
            "convention": "SER",
            "ref": "Malan2019",
            "status": "ok",
        }

    # G_V2O5(s)-Rut = G_V2O5(s) + 171607 - 32.96704T
    rv = re.search(
        rf"G_?V2O5\(s\)\s*-\s*Rut[^=]*=\s*G_?V2O5\(s\)\s*"
        rf"\+\s*({_NUM})\s*-\s*({_NUM})\s*T",
        text,
        re.I,
    )
    # L_V2O5-Fe2TiO5^10 = 72366.5 - 62.3082T
    fl = re.search(
        rf"L_?V2O5\s*-\s*Fe2TiO5[^=]{{0,30}}=\s*({_NUM})\s*-\s*({_NUM})\s*T",
        text,
        re.I,
    )
    rutile_rows: list[dict[str, Any]] = []
    if rv:
        rutile_rows.append(
            {
                "parameter": "G_V2O5_in_rutile_shift",
                "a": float(rv.group(1)),
                "b": -float(rv.group(2)),
                "expressionRaw": f"+{rv.group(1)}-{rv.group(2)}T",
                "ref": "Malan2019",
                "page": "Table 3",
                "status": "ok",
            }
        )
    if rutile_rows:
        phases["rutile_ss"] = {
            "phaseId": "rutile_ss",
            "formula": "TiO2-Fe2O3-V2O5",
            "parameters": rutile_rows,
            "convention": "SER",
            "ref": "Malan2019",
            "status": "ok",
        }

    if fl:
        phases["ferricpseudobrookite_ss"] = {
            "phaseId": "ferricpseudobrookite_ss",
            "formula": "Fe2TiO5-V2O5",
            "parameters": [
                {
                    "parameter": "L10_V2O5_Fe2TiO5",
                    "a": float(fl.group(1)),
                    "b": -float(fl.group(2)),
                    "expressionRaw": f"{fl.group(1)}-{fl.group(2)}T",
                    "ref": "Malan2019",
                    "page": "Table 3",
                    "status": "ok",
                }
            ],
            "convention": "SER",
            "ref": "Malan2019",
            "status": "ok",
        }

    return {
        "source": "Malan2019",
        "convention": "SER",
        "ref": "Malan2019",
        "nPhases": len(phases),
        "phases": phases,
        "note": "Table 3 optimised solution parameters from page-ocr (Surya).",
    }
