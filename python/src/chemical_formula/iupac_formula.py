"""
chemical_formula.iupac_formula — Inorganic formula in IUPAC element order (TiO2, ZnB4O9, NH3).

The elements follow ``ELEMENT_SEQUENCE`` (Red Book 2005 Table VI, electropositive first), with three
conventional placements the Red Book allows for ternary and larger formulae (IR-4.4.2):
- halogen oxides and their acids put Cl, Br, I before O (ClO2, Cl2O7, HClO4, ClO3F; the strict 2005
  sequence gives O2Cl), as in the 1990 recommendations, and so do metal halates and perhalates (at least
  2 O per halogen: NaClO2, KClO4, AgBrO3, LiIO3); oxyhalides keep O first (TiOCl2, CrO2Cl2, POCl3);
- with oxygen and another non-metal, H comes right after the metals: oxoacids and acid salts
  (HNO3, H2SO4, H3BO3, NaHCO3, KH2PO4); so does H in metal-free inorganic carbon compounds, the
  pseudohalogen acids (HCN, HCNO); not for ammonium-type nitrogen (N with 3 or more H: NH4NO3 →
  N2H4O3, (NH4)2SO4 → N2H8SO4);
- hydroxides (metals, O and H only) put H after O: NaOH, Mg(OH)2 → MgO2H2.
Element counts carry no structure, so hydrates and double salts are not rebuilt (ZnBr2·6H2O → ZnH12O6Br2).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from chemical_formula.constants.element_groups import HALOGENS, HYDROGENS, NONMETALS
from chemical_formula.constants.element_sequence import ELEMENT_SEQUENCE
from chemical_formula.formula_text import formula_text

_RANK = {symbol: float(i) for i, symbol in enumerate(ELEMENT_SEQUENCE)}
_AMMONIUM_HYDROGENS = 3
_OXOANION_OXYGENS = 2


def iupac_formula(counts: dict[str, float]) -> str:
    """``{"O": 2, "Ti": 1}`` → ``"TiO2"``, ``{"H": 1, "N": 1, "O": 3}`` → ``"HNO3"``; unknown symbols go last."""
    rank = {s: _RANK.get(s, float(len(_RANK))) for s in counts}
    hydrogens = [s for s in HYDROGENS if s in counts]
    metals = {s for s in counts if s not in NONMETALS}
    others = set(counts) - metals - set(HYDROGENS) - {"O"}
    central = others - {"F"}
    if "O" in counts and central and others <= HALOGENS and (
        not metals or counts["O"] >= _OXOANION_OXYGENS * sum(counts[s] for s in central)
    ):
        for symbol in central:
            rank[symbol] = _RANK["O"] - 0.5
    if hydrogens:
        ammonium = "N" in counts and sum(counts[h] for h in hydrogens) >= _AMMONIUM_HYDROGENS
        acid = ("O" in counts and others) or (not metals and "C" in counts)
        if acid and not ammonium:
            first = min(rank[s] for s in others | {"O"} if s in counts)
            for i, h in enumerate(hydrogens):
                rank[h] = first - 0.5 + i * 0.01
        elif "O" in counts and not others and metals:
            for i, h in enumerate(hydrogens):
                rank[h] = _RANK["O"] + 0.5 + i * 0.01
    return formula_text(counts, sorted(counts, key=lambda s: (rank[s], s)))
