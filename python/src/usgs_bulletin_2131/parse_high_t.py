"""Parse USGS Bulletin 2131 high-T property tables (100 K steps).

Refs:
  [60] RobieHemingway1995

Each mineral block starts with an ALL-CAPS name line, then optional formula /
formation-fit lines, then rows: T, Cp, S, (H−H298)/T, −(G−H298)/T, ΔfH, ΔfG, log K.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from usgs_bulletin_2131.parse_tables import (
    _floats,
    _norm_minus,
    _page_text_sources,
    _resolve_meta,
)

_NUM = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[Ee][-+]?\d+)?"

_SKIP = {
    "THERMODYNAMIC PROPERTIES OF MINERALS AND RELATED SUBSTANCES",
    "THERMODYNAMIC PROPERTIES AT HIGH TEMPERATURE OF INDIVIDUAL PHASES",
    "FORMATION FROM THE ELEMENTS",
    "STATES FROM THE ELEMENTS",
}


def _is_title(line: str) -> str | None:
    raw = line.strip()
    if not raw or len(raw) < 3 or len(raw) > 60:
        return None
    upper = raw.upper()
    if upper in _SKIP or upper.startswith("TEMP"):
        return None
    if re.search(r"\d", raw) and not re.match(r"^[A-Z][A-Z\-\s\(\)]+$", raw):
        return None
    # Pure ALL-CAPS mineral title (no trailing numbers).
    if re.fullmatch(r"[A-Z][A-Z0-9\-\/\.\s\(\)']{2,50}", raw) and not re.search(
        r"\d{2,}", raw
    ):
        # Reject lines that are mostly formula-like
        if re.search(r"[A-Z][a-z]", raw):
            return None
        letters = sum(1 for c in raw if c.isalpha())
        if letters < 3:
            return None
        return upper.strip()
    return None


def _parse_abc(line: str) -> dict[str, float] | None:
    line = _norm_minus(line)
    found = re.findall(rf"([ABC])\s*=\s*({_NUM})", line, flags=re.I)
    if len(found) < 2:
        return None
    out: dict[str, float] = {}
    for k, v in found:
        out[k.upper()] = float(v)
    return out or None


def _parse_row(line: str) -> dict[str, float] | None:
    nums = _floats(line)
    if len(nums) < 7:
        return None
    t = nums[0]
    if not (250.0 <= t <= 3500.0):
        return None
    # Expected: T Cp S (H-H298)/T -(G-H298)/T Hf Gf logK
    return {
        "T_K": t,
        "Cp_JmolK": nums[1],
        "S_JmolK": nums[2],
        "H_minus_H298_over_T_JmolK": nums[3],
        "minus_G_minus_H298_over_T_JmolK": nums[4],
        "Hf_kJmol": nums[5],
        "Gf_kJmol": nums[6],
        "logKf": nums[7] if len(nums) > 7 else None,
    }


def parse_high_t_pages(ocr_dir: Path, pages: list[int]) -> dict[str, dict[str, Any]]:
    """Return phaseId → high-T block (rows + metadata) for scanned pages."""
    by_phase: dict[str, dict[str, Any]] = {}
    for page in pages:
        for text, tag in _page_text_sources(ocr_dir, page):
            lines = text.splitlines()
            current: dict[str, Any] | None = None
            i = 0
            while i < len(lines):
                line = lines[i]
                title = _is_title(line)
                if title:
                    meta = _resolve_meta(title)
                    key = meta["phaseId"]
                    current = {
                        "phaseId": key,
                        "name": title.title(),
                        "formula": meta.get("formula"),
                        "pdfPages": [page],
                        "textSource": tag,
                        "formationFit": None,
                        "formulaWeight": None,
                        "note": None,
                        "rows": [],
                        "ref": "RobieHemingway1995",
                    }
                    by_phase[key] = current
                    i += 1
                    continue
                if current is None:
                    i += 1
                    continue
                # Formula weight
                m_fw = re.search(rf"Formula\s*wt\.?\s*({_NUM})", line, flags=re.I)
                if m_fw:
                    current["formulaWeight"] = float(_norm_minus(m_fw.group(1)))
                    i += 1
                    continue
                abc = _parse_abc(line)
                if abc:
                    current["formationFit"] = {
                        **abc,
                        "note": "ΔfG≈A+B·T+C/T fit coefficients when printed",
                    }
                    i += 1
                    continue
                # Description / formula line before table
                if ":" in line and not line.strip().upper().startswith("TEMP"):
                    left = line.split(":", 1)[0].strip()
                    if re.match(r"^[A-Za-z0-9\(\)]+$", left.replace(" ", "")):
                        current["formula"] = current.get("formula") or left.replace(" ", "")
                    current["note"] = line.strip()
                    i += 1
                    continue
                row = _parse_row(line)
                if row:
                    current["rows"].append(row)
                    if page not in current["pdfPages"]:
                        current["pdfPages"].append(page)
                i += 1
    # Drop empty
    return {k: v for k, v in by_phase.items() if v.get("rows")}
