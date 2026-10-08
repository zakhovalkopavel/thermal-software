"""
phase_diagrams.builders.new_system_checklist — What the dataset already has and still lacks for a new system.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § New ternary system
"""
from __future__ import annotations

from phase_diagrams.figures.formula_letters import formula_letters
from phase_diagrams.figures.formula_molar_mass import formula_molar_mass


def new_system_checklist(components: list[str], compounds: list[dict]) -> list[str]:
    """Lines on the molar masses of ``components`` and their phases in ``compounds`` (the compounds.json list).

    A compound belongs to the system when each oxide of its ``oxideMoles`` has the
    letters of a component (``formula_letters``: Fe2O3 and FeO count for FeOx). A
    component without a fixed formula (FeOx) has no molar mass, so compound rings
    and mol% conversion skip it. A component with no single-oxide phase is listed as
    missing: phases named in the system file must exist in compounds.json (PD004).
    """
    letters = {formula_letters(c): c for c in components}
    masses = {c: formula_molar_mass(c) for c in components}
    lines = ["molar masses: " + ", ".join(f"{c} {m:.3f} g/mol" if m else f"{c} none (no fixed formula)"
                                          for c, m in masses.items())]
    phases, single = [], {c: [] for c in components}
    for compound in compounds:
        oxides = compound.get("oxideMoles") or {}
        if not oxides or any(formula_letters(o) not in letters for o in oxides):
            continue
        phases.append(f"{compound['id']} ({compound.get('formula') or '+'.join(oxides)})")
        if len(oxides) == 1:
            single[letters[formula_letters(next(iter(oxides)))]].append(compound["id"])
    lines.append("phases in compounds.json: " + (", ".join(phases) if phases else "none"))
    for component, ids in single.items():
        if not ids:
            lines.append(f"missing in compounds.json: a {component} phase (id, formula, oxideMoles, melting with its "
                         "source) before the system file names it (PD004)")
    return lines
