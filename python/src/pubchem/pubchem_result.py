"""
pubchem.pubchem_result — Classification of the PubChem answer of one query (CAS, name or formula).

Statuses: ``ok``, ``notFound``, ``ambiguous`` and ``charged``. Only ``ok`` results are used by the
compound data build. Derived from the stored answer each time, so it is never stored itself.

- **CAS and name** (PubChem resolves them through synonyms): ``ok`` for one compound or several with one
  Hill formula (the first uncharged one is used); ``ambiguous`` for different formulas; ``charged`` when
  the query names only an ion (Perry's Mg 22537-22-0 → Mg+2).
- **Formula** (every compound with that formula): the candidates are the neutral compounds without
  isotope atoms whose Hill formula is the asked one. One candidate is ``ok``; of several, the one ahead
  on ``PUBCHEM_RANKING`` (annotation types, then literature and patent counts) is ``ok`` (Al2Cl6:
  CID 13848146 with 70 articles, not the 0-article duplicates). Several carbon compounds with H, a
  halogen or more than one C are isomers that a formula cannot tell apart: ``ambiguous``.

A CAS query's result carries the asked CAS; a name or formula result the CAS most sources give on the
chosen compound's page (its ``casNumbers`` view), or None.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Iterable, Optional

from chemical_formula.compound_class import classify_compound
from chemical_formula.formula_elements import formula_elements
from chemical_formula.hill_formula import hill_formula
from pubchem.cas_number import is_cas
from pubchem.constants.pubchem import (
    PUBCHEM_AMBIGUOUS, PUBCHEM_BY_CAS, PUBCHEM_BY_FORMULA, PUBCHEM_CHARGED, PUBCHEM_NOT_FOUND, PUBCHEM_OK,
    PUBCHEM_RANKING,
)
from pubchem.pubchem_answer import PubchemAnswer
from pubchem.pubchem_query import PubchemQuery
from pubchem.pubchem_view import PubchemView
from pubchem.pubchem_view_text import view_strings

_CHARGE = re.compile(r"[+-]\d*$")


@dataclass
class PubchemResult:
    """Status, the chosen compound's identifiers and every candidate as ``CID:formula``.

    ``answer`` is the full PubChem answer it was classified from.
    """

    cas: Optional[str]
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
    answer: Optional[PubchemAnswer] = field(default=None, compare=False, repr=False)

    @classmethod
    def from_properties(cls, cas: Optional[str], properties: list[dict[str, Any]], retrieved: str) -> PubchemResult:
        """Classify the answer of a CAS or name query (empty → ``notFound``)."""
        if not properties:
            return cls(cas, PUBCHEM_NOT_FOUND, retrieved)
        candidates = _labels(properties)
        hills = [_hill(p.get("MolecularFormula")) for p in properties]
        if None in hills or len(set(hills)) > 1:
            return cls(cas, PUBCHEM_AMBIGUOUS, retrieved, candidates=candidates)
        first = next((p for p in properties if not _charged(p)), properties[0])
        status = PUBCHEM_CHARGED if _charged(first) else PUBCHEM_OK
        return cls._chosen(cas, status, retrieved, first, candidates if len(candidates) > 1 else [])

    @classmethod
    def from_formula_search(cls, properties: list[dict[str, Any]], retrieved: str, hill: str) -> PubchemResult:
        """Classify the answer of a formula query for ``hill`` (no CAS yet)."""
        matches = cls.formula_matches(properties, hill)
        if not matches:
            return cls(None, PUBCHEM_NOT_FOUND, retrieved, candidates=_labels(properties))
        labels = _labels(matches) if len(matches) > 1 else []
        if len(matches) == 1:
            return cls._chosen(None, PUBCHEM_OK, retrieved, matches[0], labels)
        if classify_compound(formula_elements(hill))[0] == "organic":
            return cls(None, PUBCHEM_AMBIGUOUS, retrieved, candidates=labels)
        ranked = sorted(matches, key=_rank, reverse=True)
        if _rank(ranked[0]) == _rank(ranked[1]):
            return cls(None, PUBCHEM_AMBIGUOUS, retrieved, candidates=labels)
        return cls._chosen(None, PUBCHEM_OK, retrieved, ranked[0], labels)

    @classmethod
    def from_answer(cls, query: PubchemQuery, answer: PubchemAnswer,
                    cas_numbers: Iterable[PubchemView] = ()) -> PubchemResult:
        """Classification of a stored answer, with the answer attached."""
        retrieved = answer.retrieved[:10]
        if query.by == PUBCHEM_BY_FORMULA:
            result = cls.from_formula_search(answer.properties, retrieved, query.hill or "")
        else:
            result = cls.from_properties(query.key if query.by == PUBCHEM_BY_CAS else None, answer.properties,
                                         retrieved)
        if query.by != PUBCHEM_BY_CAS and result.cid is not None:
            result.cas = _most_cited_cas(cas_numbers, result.cid)
        result.answer = answer
        return result

    @staticmethod
    def formula_matches(properties: list[dict[str, Any]], hill: str) -> list[dict[str, Any]]:
        """Neutral compounds without isotope atoms whose Hill formula is ``hill``, in PubChem's order."""
        return [p for p in properties
                if not _charged(p) and not p.get("IsotopeAtomCount") and _hill(p.get("MolecularFormula")) == hill]

    @property
    def name(self) -> Optional[str]:
        """PubChem title, else the IUPAC name."""
        return self.title or self.iupac_name

    @classmethod
    def _chosen(cls, cas: Optional[str], status: str, retrieved: str, chosen: dict[str, Any],
                candidates: list[str]) -> PubchemResult:
        mw = chosen.get("MolecularWeight")
        return cls(
            cas, status, retrieved, cid=chosen.get("CID"), formula=chosen.get("MolecularFormula"),
            mw=float(mw) if mw is not None else None, smiles=chosen.get("SMILES") or None,
            inchikey=chosen.get("InChIKey") or None, iupac_name=chosen.get("IUPACName") or None,
            title=chosen.get("Title") or None, candidates=candidates,
        )


def _most_cited_cas(cas_numbers: Iterable[PubchemView], cid: int) -> Optional[str]:
    """The CAS most sources give on the page of ``cid`` (the first one on a tie)."""
    for view in cas_numbers:
        if view.cid == cid and view.http_status == 200:
            counts = Counter(s.strip() for s in view_strings(view.body) if is_cas(s.strip()))
            return counts.most_common(1)[0][0] if counts else None
    return None


def _labels(properties: list[dict[str, Any]]) -> list[str]:
    return [f"{p.get('CID')}:{p.get('MolecularFormula', '')}" for p in properties]


def _rank(properties: dict[str, Any]) -> tuple[int, ...]:
    return tuple(int(properties.get(k) or 0) for k in PUBCHEM_RANKING)


def _charged(properties: dict[str, Any]) -> bool:
    return bool(properties.get("Charge")) or bool(_CHARGE.search(properties.get("MolecularFormula") or ""))


def _hill(formula: Optional[str]) -> Optional[str]:
    if not formula:
        return None
    try:
        return hill_formula(formula_elements(formula))
    except ValueError:
        return None
