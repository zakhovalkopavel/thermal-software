"""
pubchem.pubchem_fetch — Build or complete the record of one query, asking PubChem only what is missing.

1. the property request, unless ``stored`` has an answer made with the same URL (``refresh`` asks again);
2. for an ``ok`` formula or name search, the "CAS" section of the chosen compound;
3. with ``experimental``, the "Experimental Properties" of every compound of ``experimental_cids``
   that ``stored`` lacks.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

from dataclasses import replace
from typing import Optional

from chemical_formula.compound_class import classify_compound
from chemical_formula.formula_elements import formula_elements
from pubchem.constants.pubchem import PUBCHEM_UNCLASSIFIED
from pubchem.pubchem_client import PubchemClient
from pubchem.pubchem_query import PubchemQuery
from pubchem.pubchem_record import PubchemRecord


def fetch_pubchem_record(
    client: PubchemClient, query: PubchemQuery, compound_class: Optional[str] = None,
    stored: Optional[PubchemRecord] = None, experimental: bool = True, refresh: bool = False,
) -> Optional[PubchemRecord]:
    """The record of ``query``; None when PubChem gave an unexpected 4xx to the property request.

    ``stored`` must be read with its experimental bodies (they are written again). ``compound_class``
    defaults to the stored class, else the class of the found formula (``unclassified`` without one).
    Raises ``PubchemBlockedError`` when PubChem blocks or keeps refusing.
    """
    if stored is not None and not refresh and stored.answer.url == query.url:
        if stored.light:
            raise ValueError(f"{query.key}: stored record read without experimental bodies")
        record = replace(stored, query=query, compound_class=compound_class or stored.compound_class)
    else:
        answer = client.answer(query)
        if answer is None:
            return None
        record = PubchemRecord(query, compound_class or PUBCHEM_UNCLASSIFIED, answer)
        if compound_class is None:
            record = replace(record, compound_class=_class_of(record.result.formula or query.hill))
    cid = record.missing_cas_cid
    if cid is not None:
        view = client.cas_numbers(cid)
        if view is not None:
            record = replace(record, cas_numbers=(*record.cas_numbers, view))
    if experimental:
        found = [view for view in (client.experimental(c) for c in record.missing_cids) if view is not None]
        record = replace(record, experimental=(*record.experimental, *found))
    return record


def _class_of(formula: Optional[str]) -> str:
    try:
        return classify_compound(formula_elements(formula))[0] if formula else PUBCHEM_UNCLASSIFIED
    except ValueError:
        return PUBCHEM_UNCLASSIFIED
