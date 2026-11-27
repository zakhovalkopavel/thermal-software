"""OCR name aliases → stable phaseId (and optional formula override).

Refs:
  [60] RobieHemingway1995
"""

from __future__ import annotations

# Uppercase printed / OCR variants → phaseId (+ optional formula when next-line OCR fails).
MINERAL_ALIASES: dict[str, dict[str, str]] = {
    "QUARTZ": {"phaseId": "quartz", "formula": "SiO2"},
    "CRISTOBALITE": {"phaseId": "cristobalite", "formula": "SiO2"},
    "TRIDYMITE": {"phaseId": "tridymite", "formula": "SiO2"},
    "LIME": {"phaseId": "lime", "formula": "CaO"},
    "PERICLASE": {"phaseId": "periclase", "formula": "MgO"},
    "CORUNDUM": {"phaseId": "corundum", "formula": "Al2O3"},
    "BOEHMITE": {"phaseId": "boehmite", "formula": "AlO(OH)"},
    "DIASPORE": {"phaseId": "diaspore", "formula": "AlO(OH)"},
    "GIBBSITE": {"phaseId": "gibbsite", "formula": "Al(OH)3"},
    "MULLITE": {"phaseId": "mullite", "formula": "Al6Si2O13"},
    "GEHLENITE": {"phaseId": "gehlenite", "formula": "Ca2Al2SiO7"},
    "ANORTHITE": {"phaseId": "anorthite", "formula": "CaAl2Si2O8"},
    "WOLLASTONITE": {"phaseId": "wollastonite", "formula": "CaSiO3"},
    "MOLLASTONITE": {"phaseId": "wollastonite", "formula": "CaSiO3"},
    "WLLASTONITE": {"phaseId": "wollastonite", "formula": "CaSiO3"},
    "PSEUDOWOLLASTONITE": {"phaseId": "pseudowollastonite", "formula": "CaSiO3"},
    "PSEUDOMOLLASTONITE": {"phaseId": "pseudowollastonite", "formula": "CaSiO3"},
    "PSBJ)QWOLLASTONITE": {"phaseId": "pseudowollastonite", "formula": "CaSiO3"},
    "LARNITE": {"phaseId": "larnite", "formula": "Ca2SiO4"},
    "BREDIGITE": {"phaseId": "bredigite", "formula": "Ca2SiO4"},
    "CALCIO-OLIVINE": {"phaseId": "calcio-olivine", "formula": "Ca2SiO4"},
    "HATURITE": {"phaseId": "haturite", "formula": "Ca3SiO5"},
    "HATURITE (ALITE)": {"phaseId": "haturite", "formula": "Ca3SiO5"},
    "RANKINITE": {"phaseId": "rankinite", "formula": "Ca3Si2O7"},
    "DIOPSIDE": {"phaseId": "diopside", "formula": "CaMgSi2O6"},
    "ENSTATITE": {"phaseId": "enstatite", "formula": "MgSiO3"},
    "FORSTERITE": {"phaseId": "forsterite", "formula": "Mg2SiO4"},
    "CORDIERITE": {"phaseId": "cordierite", "formula": "Mg2Al4Si5O18"},
    "AKERMANITE": {"phaseId": "akermanite", "formula": "Ca2MgSi2O7"},
    "MONTICELLITE": {"phaseId": "monticellite", "formula": "CaMgSiO4"},
    "MERWINITE": {"phaseId": "merwinite", "formula": "Ca3MgSi2O8"},
    "ALBITE": {"phaseId": "albite", "formula": "NaAlSi3O8"},
    "SANIDINE": {"phaseId": "sanidine", "formula": "KAlSi3O8"},
    "LEUCITE": {"phaseId": "leucite", "formula": "KAlSi2O6"},
    "NEPHELINE": {"phaseId": "nepheline", "formula": "NaAlSiO4"},
    "KALSILITE": {"phaseId": "kalsilite", "formula": "KAlSiO4"},
    "KALIOPHILLITE": {"phaseId": "kalsilite", "formula": "KAlSiO4"},
    "KALIOPHILITE": {"phaseId": "kalsilite", "formula": "KAlSiO4"},
    "KALIOPHILLITE (KALSILITE)": {"phaseId": "kalsilite", "formula": "KAlSiO4"},
    "KALIOPHILLITE (ICALSILITE)": {"phaseId": "kalsilite", "formula": "KAlSiO4"},
    "ILMENITE": {"phaseId": "ilmenite", "formula": "FeTiO3"},
    "SPINEL": {"phaseId": "spinel", "formula": "MgAl2O4"},
    "ZIRCON": {"phaseId": "zircon", "formula": "ZrSiO4"},
}
