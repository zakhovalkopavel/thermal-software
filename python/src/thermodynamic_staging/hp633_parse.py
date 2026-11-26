"""Parse Holland & Powell TC-DS633 Perple_X datafile (hp633ver.dat).

Refs:
  [61] HollandPowell2011

Formalism: HSC apparent Gibbs (G0 = Hf298 - Tr*S298); Cp = c1 + c2*T + c3/T^2 + c5/√T.
Parses every ``EoS=`` endmember block; ``ENDMEMBER_MAP`` only enriches known ids.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from references import RefKey

# Perple_X short name → compounds.json / report phase id (optional enrichment)
ENDMEMBER_MAP: dict[str, dict[str, str]] = {
    "q": {"phaseId": "quartz", "formula": "SiO2", "name": "quartz"},
    "trd": {"phaseId": "tridymite", "formula": "SiO2", "name": "tridymite"},
    "crst": {"phaseId": "cristobalite", "formula": "SiO2", "name": "cristobalite"},
    "cor": {"phaseId": "corundum", "formula": "Al2O3", "name": "corundum"},
    "lime": {"phaseId": "lime", "formula": "CaO", "name": "lime"},
    "per": {"phaseId": "periclase", "formula": "MgO", "name": "periclase"},
    "geh": {"phaseId": "gehlenite", "formula": "Ca2Al2SiO7", "name": "gehlenite"},
    "an": {"phaseId": "anorthite", "formula": "CaAl2Si2O8", "name": "anorthite"},
    "wo": {"phaseId": "wollastonite", "formula": "CaSiO3", "name": "wollastonite"},
    "pswo": {"phaseId": "pseudowollastonite", "formula": "CaSiO3", "name": "pseudowollastonite"},
    "rnk": {"phaseId": "rankinite", "formula": "Ca3Si2O7", "name": "rankinite"},
    "larn": {"phaseId": "larnite", "formula": "Ca2SiO4", "name": "larnite-bredigite"},
    "ak": {"phaseId": "akermanite", "formula": "Ca2MgSi2O7", "name": "akermanite"},
    "mont": {"phaseId": "monticellite", "formula": "CaMgSiO4", "name": "monticellite"},
    "merw": {"phaseId": "merwinite", "formula": "Ca3MgSi2O8", "name": "merwinite"},
    "crd": {"phaseId": "cordierite", "formula": "Mg2Al4Si5O18", "name": "cordierite"},
    "di": {"phaseId": "diopside", "formula": "CaMgSi2O6", "name": "diopside"},
    "spr4": {"phaseId": "sapphirine", "formula": "Mg4Al8Si2O20", "name": "sapphirine-spr4"},
    "spr5": {"phaseId": "sapphirine", "formula": "Mg3.5Al9Si1.5O20", "name": "sapphirine-spr5"},
    "san": {"phaseId": "sanidine", "formula": "KAlSi3O8", "name": "sanidine"},
    "lc": {"phaseId": "leucite", "formula": "KAlSi2O6", "name": "leucite"},
    "kals": {"phaseId": "kalsilite", "formula": "KAlSiO4", "name": "kalsilite"},
    "ab": {"phaseId": "albite", "formula": "NaAlSi3O8", "name": "albite"},
    "ne": {"phaseId": "nepheline", "formula": "NaAlSiO4", "name": "nepheline"},
    "fa": {"phaseId": "fayalite", "formula": "Fe2SiO4", "name": "fayalite"},
    "fo": {"phaseId": "forsterite", "formula": "Mg2SiO4", "name": "forsterite"},
    "herc": {"phaseId": "hercynite", "formula": "FeAl2O4", "name": "hercynite"},
    "ilm": {"phaseId": "ilmenite", "formula": "FeTiO3", "name": "ilmenite"},
    "teph": {"phaseId": "tephroite", "formula": "Mn2SiO4", "name": "tephroite"},
    "rhod": {"phaseId": "rhodonite", "formula": "MnSiO3", "name": "rhodonite"},
    "mang": {"phaseId": "manganosite", "formula": "MnO", "name": "manganosite"},
    "zrc": {"phaseId": "zircon", "formula": "ZrSiO4", "name": "zircon"},
    "anL": {"phaseId": "anorthite", "formula": "CaAl2Si2O8", "name": "anorthite-liquid", "state": "liquid"},
    "diL": {"phaseId": "diopside", "formula": "CaMgSi2O6", "name": "diopside-liquid", "state": "liquid"},
    "abL": {"phaseId": "albite", "formula": "NaAlSi3O8", "name": "albite-liquid", "state": "liquid"},
    "faL": {"phaseId": "fayalite", "formula": "Fe2SiO4", "name": "fayalite-liquid", "state": "liquid"},
    "qL": {"phaseId": "silica", "formula": "SiO2", "name": "silica-liquid", "state": "liquid"},
    "corL": {"phaseId": "corundum", "formula": "Al2O3", "name": "alumina-liquid", "state": "liquid"},
    "perL": {"phaseId": "periclase", "formula": "MgO", "name": "periclase-liquid", "state": "liquid"},
}

_BLOCK_START = re.compile(
    r"^(?P<key>[A-Za-z][A-Za-z0-9_]*)\s+EoS\s*=\s*(?P<eos>\d+)\s*"
    r"(?P<rest>.*)$",
    re.M,
)
_NUM = r"([-+]?(?:\d+\.?\d*|\.\d+)(?:[Ee][-+]?\d+)?)"
_H_IN_REST = re.compile(rf"\|\s*H=\s*{_NUM}")
_NAMED_FORMULA = re.compile(
    r"\|\s*(?P<name>[A-Z][A-Za-z0-9 \-]*)\s+(?P<formula>[A-Za-z0-9()\.]+)\s+ref:",
)
_REF = RefKey.HollandPowell2011.value


def _float(s: str | None) -> float | None:
    if s is None or s.strip() == "":
        return None
    return float(s)


def _field(block: str, name: str) -> float | None:
    m = re.search(rf"\b{name}\s*=\s*{_NUM}", block)
    return _float(m.group(1)) if m else None


def _oxide_line(block: str) -> str | None:
    for line in block.splitlines()[1:4]:
        stripped = line.strip()
        if not stripped or "EoS" in stripped or stripped.startswith("GH") or stripped.startswith("G0"):
            continue
        if "=" in stripped:
            continue
        if re.search(r"[A-Za-z]+\d*\(", stripped) or re.search(
            r"^[A-Za-z0-9()]+\s*$", stripped
        ):
            return stripped
    return None


def _meta_for(key: str, rest: str, eos: int, oxide: str | None) -> dict[str, str]:
    mapped = ENDMEMBER_MAP.get(key)
    if mapped:
        return dict(mapped)
    name = key
    formula = oxide or ""
    named = _NAMED_FORMULA.search(rest)
    if named:
        name = named.group("name").strip().title()
        formula = named.group("formula").strip()
    state = "liquid" if key.endswith("L") or eos == 9 else "solid"
    return {
        "phaseId": key,
        "name": name,
        "formula": formula,
        "state": state,
    }


def _phase_status(phase: dict[str, Any]) -> str:
    h = phase.get("H_Jmol")
    g = phase.get("GH_Jmol") if phase.get("GH_Jmol") is not None else phase.get("G0_Jmol")
    s = phase.get("S0_JmolK")
    cp = phase.get("cp") or {}
    has_cp = any(cp.get(k) is not None for k in ("c1", "c2", "c3", "c4", "c5"))
    if (h is not None or g is not None) and s is not None and has_cp:
        return "ok"
    return "partial"


def parse_hp633(path: Path, *, keys: set[str] | None = None) -> dict[str, Any]:
    """Parse all (or filtered) endmember blocks from ``hp633ver.dat``."""
    text = path.read_text(encoding="utf-8", errors="replace")
    phases: dict[str, Any] = {}
    for m in _BLOCK_START.finditer(text):
        key = m.group("key")
        if keys is not None and key not in keys:
            continue
        start = m.start()
        end_m = re.search(r"^end\s*$", text[start:], re.M)
        if not end_m:
            continue
        block = text[start : start + end_m.end()]
        rest = m.group("rest") or ""
        eos = int(m.group("eos"))
        oxide = _oxide_line(block)
        meta = _meta_for(key, rest, eos, oxide)
        h_m = _H_IN_REST.search(rest)
        phase: dict[str, Any] = {
            "endmember": key,
            "phaseId": meta.get("phaseId", key),
            "name": meta.get("name", key),
            "formula": meta.get("formula") or "",
            "state": meta.get("state", "solid"),
            "eos": eos,
            "oxideCompositionLine": oxide,
            "H_Jmol": _float(h_m.group(1)) if h_m else None,
            "GH_Jmol": _field(block, "GH"),
            "G0_Jmol": _field(block, "G0"),
            "S0_JmolK": _field(block, "S0"),
            "V0_Jbar": _field(block, "V0"),
            "cp": {
                "form": "c1 + c2*T + c3/T^2 + c4*T^2 + c5/T^0.5",
                "c1": _field(block, "c1"),
                "c2": _field(block, "c2"),
                "c3": _field(block, "c3"),
                "c4": _field(block, "c4"),
                "c5": _field(block, "c5"),
                "units": "J/(mol·K); T in K",
            },
            "ref": _REF,
            "sourceFile": "hp633ver.dat",
        }
        phase["status"] = _phase_status(phase)
        phases[key] = phase

    n_ok = sum(1 for p in phases.values() if p.get("status") == "ok")
    n_partial = sum(1 for p in phases.values() if p.get("status") == "partial")
    return {
        "source": "HollandPowell2011",
        "datafile": "hp633ver.dat",
        "convention": "HSC",
        "ref": _REF,
        "note": (
            "All EoS endmember blocks from hp633ver.dat; "
            "G0 = Hf298 - Tr*S298; do not mix with SER CALPHAD without alignment. "
            f"{n_ok} ok / {n_partial} partial."
        ),
        "nPhases": len(phases),
        "phases": phases,
    }
