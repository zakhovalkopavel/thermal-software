"""
pubchem.pubchem_query — What is asked of PubChem: a CAS number, a formula or a name.

- ``cas``: ``compound/name/{CAS}`` (PubChem resolves the CAS through its synonyms); key = the CAS.
- ``formula``: ``compound/fastformula/{Hill}`` (every compound with exactly that formula, ions and isotope
  variants included); key = ``formula:<Hill>``. Used for compound-data records without a CAS and for new
  compounds (a phase-diagram compound, a line of a query file).
- ``name``: ``compound/name/{name}``; key = ``name:<lower-case name>``.

``parse`` picks the kind from the text: a valid CAS number, else a formula ``chemical_formula`` reads
(no spaces, starts with an element), else a name.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional
from urllib.parse import quote

from chemical_formula.formula_cleaner import clean_formula
from chemical_formula.formula_elements import formula_elements
from chemical_formula.hill_formula import hill_formula
from pubchem.cas_number import is_cas
from pubchem.constants.pubchem import (
    PUBCHEM_API, PUBCHEM_BY_CAS, PUBCHEM_BY_FORMULA, PUBCHEM_BY_NAME, PUBCHEM_PROPERTIES,
)

_FORMULA_START = re.compile(r"^(\d+\s*)?[A-Z(\[]")
_DECIMAL = re.compile(r"\d[.,]\d")


@dataclass(frozen=True)
class PubchemQuery:
    """``text`` is what the user or the source gave; ``hill`` the formula a formula query asks for."""

    key: str
    by: str
    text: str
    hill: Optional[str] = None

    @classmethod
    def cas(cls, cas: str) -> PubchemQuery:
        return cls(cas, PUBCHEM_BY_CAS, cas)

    @classmethod
    def formula(cls, text: str) -> PubchemQuery:
        """Raises ValueError when ``text`` is not a formula or has fractional counts (``K3AlF6·3.5H2O``)."""
        hill = _hill(text)
        if hill is None:
            raise ValueError(f"not a formula: {text!r}")
        if _DECIMAL.search(text) or "." in hill:
            raise ValueError(f"fractional formula: {text!r}")
        return cls(f"formula:{hill}", PUBCHEM_BY_FORMULA, text, hill)

    @classmethod
    def name(cls, text: str) -> PubchemQuery:
        text = " ".join(text.split())
        return cls(f"name:{text.lower()}", PUBCHEM_BY_NAME, text)

    @classmethod
    def parse(cls, text: str, by: Optional[str] = None) -> PubchemQuery:
        """Query of kind ``by``, or the kind ``text`` looks like."""
        text = text.strip()
        if by == PUBCHEM_BY_CAS or (by is None and is_cas(text)):
            return cls.cas(text)
        if by == PUBCHEM_BY_FORMULA or (by is None and " " not in text and _FORMULA_START.match(text)
                                        and _hill(text) is not None):
            return cls.formula(text)
        return cls.name(text)

    @classmethod
    def from_key(cls, key: str, text: Optional[str] = None) -> PubchemQuery:
        """Inverse of ``key`` (``text`` defaults to the key's own text)."""
        if key.startswith("formula:"):
            hill = key.removeprefix("formula:")
            return cls(key, PUBCHEM_BY_FORMULA, text or hill, hill)
        if key.startswith("name:"):
            return cls(key, PUBCHEM_BY_NAME, text or key.removeprefix("name:"))
        return cls(key, PUBCHEM_BY_CAS, key)

    @property
    def url(self) -> str:
        """Property request (an answer stored with another URL predates ``PUBCHEM_PROPERTIES``)."""
        if self.by == PUBCHEM_BY_FORMULA:
            path = f"fastformula/{quote(self.hill or '', safe='')}"
        else:
            path = f"name/{quote(self.text, safe='')}"
        return f"{PUBCHEM_API}/compound/{path}/property/{','.join(PUBCHEM_PROPERTIES)}/JSON"


def _hill(text: str) -> Optional[str]:
    try:
        formula = clean_formula(text)
        return hill_formula(formula_elements(formula)) if formula else None
    except ValueError:
        return None
