"""
chemical_formula.organic_family — Functional families of an organic compound from its SMILES (RDKit SMARTS).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from typing import Optional

from rdkit import Chem, RDLogger

from chemical_formula.constants.organic_families import ORGANIC_FAMILIES, UNCLASSIFIED

__all__ = ["OrganicFamilyClassifier", "UNCLASSIFIED"]


class OrganicFamilyClassifier:
    """Matches SMILES against ``ORGANIC_FAMILIES``; the file group is the first match."""

    def __init__(self, families: Optional[dict[str, str]] = None) -> None:
        RDLogger.DisableLog("rdApp.*")
        self._patterns: list[tuple[str, Chem.Mol]] = []
        for name, smarts in (families or ORGANIC_FAMILIES).items():
            pattern = Chem.MolFromSmarts(smarts)
            if pattern is None:
                raise ValueError(f"invalid SMARTS for {name}: {smarts}")
            self._patterns.append((name, pattern))

    def families(self, smiles: Optional[str]) -> list[str]:
        """Every matching family in ``ORGANIC_FAMILIES`` order; [] without SMILES or when it doesn't parse."""
        if not smiles:
            return []
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return []
        return [name for name, pattern in self._patterns if mol.HasSubstructMatch(pattern)]

    def group(self, smiles: Optional[str]) -> str:
        """First matching family, else ``unclassified``."""
        matches = self.families(smiles)
        return matches[0] if matches else UNCLASSIFIED
