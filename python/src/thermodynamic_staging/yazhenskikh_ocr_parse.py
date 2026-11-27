"""Parse Yazhenskikh GTT workshop OCR into staging inventories.

Refs:
  [71] Yazhenskikh2007
  [72] Yazhenskikh2008
  [73] Yazhenskikh2009

Workshop slides list associate species and systems but do **not** print numeric
interaction ``L`` coefficients (often “by request”). Staging rows are therefore
``partial`` inventories suitable for scope tracking, not G-minimization.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

_REF_BY_YEAR = {
    2007: "Yazhenskikh2007",
    2008: "Yazhenskikh2008",
    2009: "Yazhenskikh2009",
}


def _load_ocr(ocr_dir: Path) -> str:
    parts: list[str] = []
    for path in sorted(ocr_dir.glob("page-*.txt")):
        if path.name.endswith(".pdftotext.txt"):
            continue
        parts.append(path.read_text(encoding="utf-8", errors="replace"))
    return "\n".join(parts)


def _soften(text: str) -> str:
    t = text.replace("−", "-").replace("–", "-").replace("·", "*")
    t = re.sub(r"\\text\{([^}]*)\}", r"\1", t)
    t = re.sub(r"_\{([^}]*)\}", r"\1", t)
    t = re.sub(r"\^\{([^}]*)\}", r"\1", t)
    t = re.sub(r"_([0-9A-Za-z]+)", r"\1", t)
    t = t.replace("{", "").replace("}", "").replace("$", "")
    return t


def _unique(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        key = re.sub(r"\s+", "", item)
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def _extract_species(text: str) -> list[str]:
    """Pull oxide / silicate formulae that look like associate or compound species."""
    # Prefer explicit Na/K silicate / aluminate patterns from slides
    pats = [
        r"Na4SiO4(?:\s*\*\s*2/5|\s*·\s*2/5)?",
        r"Na2SiO3(?:\s*\*\s*2/3|\s*·\s*2/3)?",
        r"Na2Si2O5(?:\s*\*\s*1/2|\s*·\s*1/2)?",
        r"K2SiO3(?:\s*\*\s*2/3|\s*·\s*2/3)?",
        r"K2Si2O5(?:\s*\*\s*1/2|\s*·\s*1/2)?",
        r"K2Si4O9(?:\s*\*\s*1/3|\s*·\s*1/3)?",
        r"NaAlO2",
        r"KAlO2",
        r"NaAlSiO4",
        r"KAlSiO4",
        r"NaAlSi2O6",
        r"KAlSi2O6(?:\s*[·*]\s*1/2)?",
        r"Na2Al4O7(?:\s*[·*]\s*1/3)?",
        r"Al6Si2O13(?:\s*[·*]\s*1/4)?",
        r"Na2O",
        r"K2O",
        r"Al2O3",
        r"SiO2",
    ]
    found: list[str] = []
    for pat in pats:
        for m in re.finditer(pat, text):
            found.append(re.sub(r"\s+", "", m.group(0)))
    return _unique(found)


def _extract_systems(text: str) -> list[str]:
    systems: list[str] = []
    for m in re.finditer(
        r"((?:Na2O|K2O|Al2O3|SiO2|Me2O)(?:\s*-\s*(?:Na2O|K2O|Al2O3|SiO2|Me2O)){1,3})",
        text,
        re.I,
    ):
        sys = re.sub(r"\s+", "", m.group(1)).replace("Me2O", "Me2O")
        systems.append(sys)
    return _unique(systems)


def parse_yazhenskikh_ocr(ocr_dir: Path, *, year: int) -> dict[str, Any]:
    """Build a partial staging dataset from one Yazhenskikh workshop OCR dir."""
    if year not in _REF_BY_YEAR:
        raise ValueError(f"unsupported Yazhenskikh year: {year}")
    if not ocr_dir.is_dir():
        raise FileNotFoundError(ocr_dir)
    ref = _REF_BY_YEAR[year]
    text = _soften(_load_ocr(ocr_dir))
    species = _extract_species(text)
    systems = _extract_systems(text)
    has_l_numbers = bool(
        re.search(r"L_\{[^}]+\}[^=]{0,20}=\s*[-+]?\d", text)
        or re.search(r"\bL[^=]{0,40}=\s*[-+]?\d{3,}", text)
    )

    phases: dict[str, Any] = {
        "liquid_associate_scope": {
            "phaseId": "liquid_associate_scope",
            "model": "associate_redlich_kister",
            "systems": systems,
            "species": species,
            "numericLPrinted": has_l_numbers,
            "convention": "SER",
            "ref": ref,
            "status": "partial",
            "note": (
                "Associate-species inventory from workshop OCR. "
                "Numeric interaction L coefficients are not printed on the slides."
                if not has_l_numbers
                else "Numeric L candidates detected — review OCR before use."
            ),
        }
    }
    # One row per named solid solution mentioned
    for name, phase_id in (
        ("Nepheline", "nepheline"),
        ("Carnegieite", "carnegieite"),
        ("Mullite", "mullite"),
    ):
        if re.search(name, text, re.I):
            phases[phase_id] = {
                "phaseId": phase_id,
                "name": name,
                "convention": "SER",
                "ref": ref,
                "status": "partial",
                "note": f"Mentioned in {year} workshop slides; no °G coeffs in OCR.",
            }

    return {
        "source": ref,
        "convention": "SER",
        "ref": ref,
        "nPhases": len(phases),
        "phases": phases,
        "status": "partial",
        "note": (
            f"Yazhenskikh {year} GTT workshop — OCR inventory "
            f"({len(species)} species, {len(systems)} system labels)."
        ),
    }
