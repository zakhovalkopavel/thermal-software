"""
pubchem.pubchem_result — PubChem answer for one CAS number, as stored in the identifier cache.

Statuses: ``ok`` (one compound, or several with one Hill formula: the first uncharged one is used),
``notFound``, ``ambiguous`` (compounds with different formulas) and ``charged`` (the CAS names only
an ion, e.g. Perry's Mg 22537-22-0 → Mg+2). Only ``ok`` rows are used by the compound data build.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Optional

from chemical_formula.formula_elements import formula_elements
from chemical_formula.hill_formula import hill_formula
from pubchem.constants.pubchem import PUBCHEM_AMBIGUOUS, PUBCHEM_CHARGED, PUBCHEM_NOT_FOUND, PUBCHEM_OK

_CHARGE = re.compile(r"[+-]\d*$")


@dataclass
class PubchemResult:
    """Status, first compound's identifiers and every candidate as ``CID:formula``."""

    cas: str
    status: str
    retrieved: str
    cid: Optional[int] = None
    formula: Optional[str] = None
    mw: Optional[float] = None
    smiles: Optional[str] = None
    inchikey: Optional[str] = None
    iupac_name: Optional[str] = None
    title: Optional[str] = None
    candidates: list[str] = field(default_factory=list)

    @classmethod
    def from_properties(cls, cas: str, properties: list[dict[str, Any]], retrieved: str) -> PubchemResult:
        """Classify a PUG REST ``PropertyTable.Properties`` list (empty → ``notFound``)."""
        if not properties:
            return cls(cas, PUBCHEM_NOT_FOUND, retrieved)
        candidates = [f"{p.get('CID')}:{p.get('MolecularFormula', '')}" for p in properties]
        hills = [_hill(p.get("MolecularFormula")) for p in properties]
        if None in hills or len(set(hills)) > 1:
            return cls(cas, PUBCHEM_AMBIGUOUS, retrieved, candidates=candidates)
        first = next((p for p in properties if not _CHARGE.search(p["MolecularFormula"])), properties[0])
        formula = first["MolecularFormula"]
        mw = first.get("MolecularWeight")
        return cls(
            cas, PUBCHEM_CHARGED if _CHARGE.search(formula) else PUBCHEM_OK, retrieved,
            cid=first.get("CID"), formula=formula, mw=float(mw) if mw is not None else None,
            smiles=first.get("SMILES") or None, inchikey=first.get("InChIKey") or None,
            iupac_name=first.get("IUPACName") or None, title=first.get("Title") or None,
            candidates=candidates if len(candidates) > 1 else [],
        )

    @classmethod
    def from_row(cls, cells: list[str]) -> PubchemResult:
        """Inverse of ``to_row``."""
        cells = [*cells, *[""] * (11 - len(cells))]
        return cls(
            cas=cells[0], status=cells[1], cid=int(cells[2]) if cells[2] else None, formula=cells[3] or None,
            mw=float(cells[4]) if cells[4] else None, smiles=cells[5] or None, inchikey=cells[6] or None,
            iupac_name=cells[7] or None, title=cells[8] or None,
            candidates=cells[9].split("|") if cells[9] else [], retrieved=cells[10],
        )

    def to_row(self) -> list[str]:
        """Cells in ``PUBCHEM_CACHE_COLUMNS`` order."""
        return [
            self.cas, self.status, "" if self.cid is None else str(self.cid), self.formula or "",
            "" if self.mw is None else repr(self.mw), self.smiles or "", self.inchikey or "",
            self.iupac_name or "", self.title or "", "|".join(self.candidates), self.retrieved,
        ]

    @property
    def name(self) -> Optional[str]:
        """PubChem title, else the IUPAC name."""
        return self.title or self.iupac_name


def _hill(formula: Optional[str]) -> Optional[str]:
    if not formula:
        return None
    try:
        return hill_formula(formula_elements(formula))
    except ValueError:
        return None
