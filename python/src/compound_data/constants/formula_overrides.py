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
    "10043-01-3": FormulaOverride(
        formula="Al2(SO4)3",
        reason="conventional aluminum sulfate formula; not expanded Al2S3O12 / Al2O12S3",
        display_formula="Al2(SO4)3",
    ),
    "62-74-8": FormulaOverride(
        formula="C2H2FNaO2",
        reason="sodium fluoroacetate; keep PubChem/API formula (Yaws OCR had C2H2F2Na)",
        display_formula="C2H2FNaO2",
    ),
    "16842-03-8": FormulaOverride(
        formula="C4HO4Co",
        reason="cobalt hydrocarbonyl monomer; conventional display HCo(CO)4 (reject PubChem C4CoO4)",
        display_formula="HCo(CO)4",
    ),
    "8022-00-2": FormulaOverride(
        formula="C6H15O3PS2",
        reason="methyl demeton monomer (Yaws); reject PubChem dimer C12H30O6P2S4",
        display_formula="C6H15O3PS2",
    ),
    "1189-85-1": FormulaOverride(
        formula="C8H18CrO4",
        reason=(
            "di-tert-butyl chromate CrO2(OC(CH3)3)2 = C8H18CrO4; "
            "reject PubChem C8H22CrO4"
        ),
        display_formula="C8H18CrO4",
    ),
    "3383-96-8": FormulaOverride(
        formula="C16H20O6P2S3",
        reason=(
            "temephos; take PubChem C16H20O6P2S3 "
            "(Yaws OCR dropped two S)"
        ),
        display_formula="C16H20O6P2S3",
    ),
    "16962-07-5": FormulaOverride(
        formula="AlB3H12",
        reason="aluminum borohydride; Hill AlB3H12, conventional Al(BH4)3",
        display_formula="Al(BH4)3",
    ),
    "12075-68-2": FormulaOverride(
        formula="C6H15Al2Cl3",
        reason="ethylaluminum sesquichloride; strip OCR trailing ETHYL",
        display_formula="C6H15Al2Cl3",
    ),
    "14096-82-3": FormulaOverride(
        formula="Co(CO)3NO",
        reason="cobalt nitrosyl tricarbonyl; Yaws OCR Conc3O4",
        display_formula="Co(CO)3NO",
    ),
    "20816-12-0": FormulaOverride(
        formula="OsO4",
        reason="osmium tetroxide; Yaws OCR Oso4",
        display_formula="OsO4",
    ),
    "3811-73-2": FormulaOverride(
        formula="C5H4NNaOS",
        reason="sodium pyrithione; take API/CD (Yaws C5H5NOSna)",
        display_formula="C5H4NNaOS",
    ),
    "999-97-3": FormulaOverride(
        formula="C6H19NSi2",
        reason="hexamethyldisilazane; Yaws OCR Nsi2 → NSi2",
        display_formula="C6H19NSi2",
    ),
    "1344-95-2": FormulaOverride(
        formula="CaH6O8Si2",
        reason=(
            "calcium silicate umbrella CAS; take PubChem hydrate CaH6O8Si2 "
            "(not CaSiO3 metasilicate or Ca2SiO4 orthosilicate)"
        ),
        display_formula="CaH6O8Si2",
    ),
    "19624-22-7": FormulaOverride(
        formula="B5H9",
        reason="pentaborane B5H9; reject wrong PubChem hit C14H14NO4PS",
        display_formula="B5H9",
    ),
    "52896-91-0": FormulaOverride(
        formula="C10H22",
        reason="3-ethyl-4-methylheptane; reject wrong PubChem CID formula C12H10ClNO2",
        display_formula="C10H22",
    ),
}

FORMULA_OVERRIDES: dict[str, FormulaOverride] = {**_load_accepted(), **_HAND}
