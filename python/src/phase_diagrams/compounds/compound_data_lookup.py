"""
phase_diagrams.compounds.compound_data_lookup — Melting points of an oxide in shared/processed/compound-data.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § New ternary system
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from phase_diagrams.models.melting_candidate import MeltingCandidate

_KELVIN = 273.15


def hill_formula(formula: str) -> str:
    """Hill order of ``formula`` (C, H, then alphabetical; alphabetical without C): TiO2 → O2Ti."""
    counts: dict[str, int] = {}
    for element, count in re.findall(r"([A-Z][a-z]?)(\d*)", formula):
        counts[element] = counts.get(element, 0) + (int(count) if count else 1)
    order = ["C", "H", *sorted(e for e in counts if e not in ("C", "H"))] if "C" in counts else sorted(counts)
    return "".join(e + (str(counts[e]) if counts[e] > 1 else "") for e in order if e in counts)


def melting_candidates(formula: str, compound_data: Path) -> list[MeltingCandidate]:
    """Every ``meltingPoint`` of the entries of ``formula`` (index.json ``byFormula``), highest first.

    The highest is the polymorph stable at melting (rutile before anatase).
    Values are converted from K to °C, rounded to 0.1 °C.
    """
    index_path = compound_data / "index.json"
    if not index_path.exists():
        return []
    index = json.loads(index_path.read_text(encoding="utf-8"))
    found: list[MeltingCandidate] = []
    files: dict[str, dict] = {}
    for cas in index.get("byFormula", {}).get(hill_formula(formula), []):
        relative = index["compounds"][cas]["file"]
        if relative not in files:
            files[relative] = json.loads((compound_data / relative).read_text(encoding="utf-8"))
        entry = files[relative]["entries"][cas]
        for value in entry.get("properties", {}).get("meltingPoint", []):
            ref, line, table = value["ref"]
            celsius = round(value["value"] - _KELVIN, 1)
            found.append(MeltingCandidate(formula=formula, temperature_C=int(celsius) if celsius.is_integer() else celsius,
                                          kelvin=value["value"], variant=value.get("variant"), name=entry["name"],
                                          cas=cas, ref=ref, line=line, table=table, file=relative))
    return sorted(found, key=lambda c: -c.temperature_C)
