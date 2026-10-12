"""
chemical_formula.organic_bonds — Does a structure have the bonds that make a carbon compound organic?

Organic: a carbon atom bonded to H (D, T), to a halogen, or, when the structure has no metal, to another
carbon (cyanogen, carbon suboxide), to an N that carries H (urea, guanidine, melamine), or in a ring with at
least two carbons (cyanuric triazide). So halocarbons (CCl4, C2F6) are organic, while carbonates, bicarbonates,
cyanides, cyanates, carbides (B4C, whose one carbon sits in a boron cage; acetylides such as LaC2), metal
oxalates, metal carbonyls, CO, CO2 and CS2 are not. RDKit; not imported by the package ``__init__``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from typing import Optional

from rdkit import Chem, RDLogger

from chemical_formula.constants.element_groups import HALOGENS, NONMETALS


def has_organic_bond(smiles: Optional[str]) -> Optional[bool]:
    """True / False from the SMILES; None without SMILES or when it doesn't parse."""
    if not smiles:
        return None
    RDLogger.DisableLog("rdApp.*")
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    has_metal = any(atom.GetSymbol() not in NONMETALS for atom in mol.GetAtoms())
    carbon_ring_atoms = set() if has_metal else _carbon_ring_atoms(mol)
    for atom in mol.GetAtoms():
        if atom.GetSymbol() != "C":
            continue
        if atom.GetTotalNumHs(includeNeighbors=True) or atom.GetIdx() in carbon_ring_atoms:
            return True
        for neighbor in atom.GetNeighbors():
            symbol = neighbor.GetSymbol()
            if symbol in HALOGENS:
                return True
            if not has_metal and (
                symbol == "C" or (symbol == "N" and neighbor.GetTotalNumHs(includeNeighbors=True))
            ):
                return True
    return False


def _carbon_ring_atoms(mol: Chem.Mol) -> set[int]:
    """Atoms of the rings that hold at least two carbons."""
    atoms: set[int] = set()
    for ring in mol.GetRingInfo().AtomRings():
        if sum(mol.GetAtomWithIdx(i).GetSymbol() == "C" for i in ring) >= 2:
            atoms.update(ring)
    return atoms
