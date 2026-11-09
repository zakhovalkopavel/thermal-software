"""
compound_data.constants.formula_overrides — Formulas corrected by CAS, each with a cited reason.

Includes hand overrides and the accepted name→formula proposals
(``accepted_name_formulas.json``: standard + Hill for each CAS).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [37] CRC95
"""
from __future__ import annotations

import json
from pathlib import Path

from compound_data.formula_override import FormulaOverride

_ACCEPTED_PATH = Path(__file__).with_name("accepted_name_formulas.json")


def _load_accepted() -> dict[str, FormulaOverride]:
    """CAS → override from the verified name→formula proposals (standard + hill)."""
    data = json.loads(_ACCEPTED_PATH.read_text(encoding="utf-8"))
    out: dict[str, FormulaOverride] = {}
    for cas, row in data.items():
        parse = row["formula"]
        display = row.get("display_formula") or parse
        out[cas] = FormulaOverride(
            formula=parse,
            reason=row.get("reason", "accepted name→formula proposal"),
            # Always keep the conventional/standard form for dual formula output.
            display_formula=display,
        )
    return out


# Hand corrections take precedence over the bulk accepted file.
_HAND: dict[str, FormulaOverride] = {
    "12004-39-6": FormulaOverride(
        formula="Al2TiO5",
        reason=(
            'CRC name "Aluminum titanate" and pubchem synonym "al2tio5"; '
            "pubchem's own formula Al2O7Ti2 is a different stoichiometry"
        ),
        display_formula="Al2TiO5",
    ),
}

FORMULA_OVERRIDES: dict[str, FormulaOverride] = {**_load_accepted(), **_HAND}
