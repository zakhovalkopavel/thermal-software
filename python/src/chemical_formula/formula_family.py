"""
chemical_formula.formula_family — Organic family from the formula alone, for compounds without a usable SMILES.

Answers only when every structure of the formula gets the same first match in ``ORGANIC_FAMILIES``:
- no N, and no O unless the compound has one carbon and no H: then none of the O/N families
  (acids, esters, amides, nitriles, nitro, aldehydes, ketones, phenols, alcohols, amines, ethers) can match;
- then S → sulfur, Si → organosilicon, an element outside the organic set → organometallic,
  F/Cl/Br/I → halogenated (CCl3F, CF2, C2Cl4F2, CF8S → sulfur, CFO → halogenated);
- hydrocarbons: CnH2n+2 → alkanes (CH4, C16H34), C2H4 → alkenes, C2H2 → alkynes.
Everything else (radicals such as CH3, C2H, CHO; CnH2n with n > 2) gives None.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from typing import Mapping, Optional

from chemical_formula.formula_elements import ISOTOPES

_ORGANIC_SET = frozenset({"H", "B", "C", "N", "O", "F", "Si", "P", "S", "Cl", "Br", "I"})
_FAMILY_HALOGENS = frozenset({"F", "Cl", "Br", "I"})
_ETHENE_ETHYNE = {4: "alkenes", 2: "alkynes"}


def formula_family(counts: Mapping[str, float]) -> Optional[str]:
    """The family ``OrganicFamilyClassifier.group`` would give for any structure of ``counts``, else None."""
    totals: dict[str, float] = {}
    for symbol, n in counts.items():
        element = ISOTOPES.get(symbol, symbol)
        totals[element] = totals.get(element, 0) + n
    carbons, hydrogens = totals.get("C", 0), totals.get("H", 0)
    if not carbons or "N" in totals or ("O" in totals and (carbons > 1 or hydrogens)):
        return None
    if "S" in totals:
        return "sulfur"
    if "Si" in totals:
        return "organosilicon"
    if set(totals) - _ORGANIC_SET:
        return "organometallic"
    if set(totals) & _FAMILY_HALOGENS:
        return "halogenated"
    if set(totals) == {"C", "H"}:
        if hydrogens == 2 * carbons + 2:
            return "alkanes"
        if carbons == 2:
            return _ETHENE_ETHYNE.get(int(hydrogens))
    return None
