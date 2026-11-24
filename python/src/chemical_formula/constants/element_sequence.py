"""
chemical_formula.constants.element_sequence — Citation order of the elements in an inorganic formula.

IUPAC Nomenclature of Inorganic Chemistry, Recommendations 2005 (Red Book), IR-4.4.2.1 and Table VI:
the more electropositive element is cited first. Within a group the heavier element comes first;
groups run from the metals to group 17, with H between groups 15 and 16 (NH3, H2S, AlH3, [SiAs4], S2Cl2,
O2Cl, OF2 are the Red Book examples). Group 18 is cited first, so xenon fluorides read XeF2.
The isotope symbols D and T follow H.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

ELEMENT_SEQUENCE: tuple[str, ...] = tuple("""
Rn Xe Kr Ar Ne He
Fr Cs Rb K Na Li
Ra Ba Sr Ca Mg Be
Lr No Md Fm Es Cf Bk Cm Am Pu Np U Pa Th Ac
Lu Yb Tm Er Ho Dy Tb Gd Eu Sm Pm Nd Pr Ce La Y Sc
Rf Hf Zr Ti
Db Ta Nb V
Sg W Mo Cr
Bh Re Tc Mn
Hs Os Ru Fe
Mt Ir Rh Co
Ds Pt Pd Ni
Rg Au Ag Cu
Cn Hg Cd Zn
Nh Tl In Ga Al B
Fl Pb Sn Ge Si C
Mc Bi Sb As P N
H D T
Lv Po Te Se S O
Ts At I Br Cl F
""".split())
