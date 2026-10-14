"""
phase_diagrams.compounds.oxide_compound_builder — compounds.json entries of single oxides from compound-data and the atlas.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § New ternary system
"""
from __future__ import annotations

import copy
import re

from phase_diagrams.constants.oxide_notation import OXIDE_NOTATION
from phase_diagrams.constants.status_tolerance import STATUS_TOLERANCE
from phase_diagrams.models.melting_candidate import MeltingCandidate

_ATLAS = "slag-atlas-1995"
KEEP_CHOICES = ("atlas", "compound-data", "conflict")


def default_compound_id(candidate: MeltingCandidate | None, formula: str) -> str:
    """The mineral variant (rutile), else the compound-data name without brackets (iron oxide (Fe2O3) → iron-oxide)."""
    if candidate is None:
        return formula.lower()
    if candidate.variant and re.fullmatch(r"[a-z]+", candidate.variant):
        return candidate.variant
    name = re.sub(r"\([^)]*\)", "", candidate.name).strip().lower()
    return re.sub(r"[^a-z0-9]+", "-", name).strip("-") or formula.lower()


def atlas_source(figure: dict, read: str = "printed label") -> dict:
    """Source node of a printed atlas value; ``figure`` is a figure-index entry."""
    return {"ref": _ATLAS, "figure": figure["figure"], "printedPage": figure["printedPage"],
            "pdfPage": figure["pdfPage"], "read": read}


def new_oxide_compound(compound_id: str, formula: str, atlas: tuple[float, dict] | None) -> dict:
    """Entry of a single oxide: the atlas value (°C, figure-index entry) when given, else melting ``missing``."""
    melting = {"behaviour": None, "temperature_C": None, "products": None, "status": "missing", "sources": []}
    if atlas is not None:
        melting.update(behaviour="congruent", temperature_C=atlas[0], status="extracted", sources=[atlas_source(atlas[1])])
    return {"id": compound_id, "notation": OXIDE_NOTATION.get(formula, formula), "formula": formula,
            "oxideMoles": {formula: 1}, "melting": melting}


def atlas_disagrees(compound: dict, candidate: MeltingCandidate) -> bool:
    """True when the entry's temperature and the compound-data value differ beyond ``STATUS_TOLERANCE``."""
    temperature = compound["melting"].get("temperature_C")
    return temperature is not None and abs(temperature - candidate.temperature_C) > STATUS_TOLERANCE["temperature_C"]


def merge_compound_data(compound: dict, candidate: MeltingCandidate, keep: str | None = None) -> dict:
    """``compound`` with the compound-data melting point merged in.

    No temperature yet: the compound-data value, status ``extracted``. Within the
    tolerance: its source is added. Beyond it, ``keep`` decides: ``atlas`` keeps the
    entry and notes the compound-data value; ``compound-data`` takes that value and
    source and notes the atlas value; ``conflict`` adds the source with status
    ``conflict``.
    """
    out = copy.deepcopy(compound)
    melting = out["melting"]
    source = candidate.source()
    if melting.get("temperature_C") is None:
        melting.update(behaviour=melting.get("behaviour") or "congruent", temperature_C=candidate.temperature_C,
                       status="extracted", sources=[*melting.get("sources", []), source])
        return out
    if not atlas_disagrees(compound, candidate):
        melting["sources"] = [*melting.get("sources", []), source]
        return out
    if keep not in KEEP_CHOICES:
        raise ValueError(f"{compound['id']}: {melting['temperature_C']} °C and compound-data {candidate.temperature_C} °C "
                         f"differ; keep must be one of {', '.join(KEEP_CHOICES)}")
    if keep == "atlas":
        _note(out, f"compound-data gives {candidate.label()}.")
    elif keep == "compound-data":
        figures = [s["figure"] for s in melting.get("sources", []) if s.get("ref") == _ATLAS and "figure" in s]
        printed = f" ({', '.join(figures)})" if figures else ""
        _note(out, f"Slag Atlas{printed} gives {melting['temperature_C']:g} °C; compound-data value used.")
        melting.update(temperature_C=candidate.temperature_C, status="extracted", sources=[source])
    else:
        melting.update(status="conflict", sources=[*melting.get("sources", []), source])
    return out


def _note(compound: dict, text: str) -> None:
    compound["notes"] = f"{compound['notes']} {text}" if compound.get("notes") else text
