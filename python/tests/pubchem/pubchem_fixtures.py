"""Shared PubChem answers for pubchem tests."""
from __future__ import annotations

from pubchem.pubchem_answer import PubchemAnswer
from pubchem.pubchem_query import PubchemQuery
from pubchem.pubchem_record import PubchemRecord
from pubchem.pubchem_view import PubchemView

DAY = "2026-10-12"
RETRIEVED = "2026-10-14T09:30:00+00:00"
AL4C3 = {"CID": 16685054, "MolecularFormula": "C3Al4", "MolecularWeight": "143.96", "SMILES": "[C-4].[Al+3]",
         "InChIKey": "CAVCGVPGBKGDTG-UHFFFAOYSA-N", "IUPACName": "tetraaluminum;methanetetrayl",
         "Title": "Aluminum carbide (Al4C3)"}
AG2S = {"CID": 166738, "MolecularFormula": "Ag2S", "MolecularWeight": "247.80", "Title": "Silver sulfide",
        "AnnotationTypeCount": 9, "LiteratureCount": 1200, "PatentCount": 3000}


def property_answer(query: PubchemQuery, props: list[dict], retrieved: str = RETRIEVED) -> PubchemAnswer:
    """A 200 answer with ``props``, or a 404 when ``props`` is empty."""
    body = {"PropertyTable": {"Properties": props}} if props else {"Fault": {"Code": "PUGREST.NotFound"}}
    return PubchemAnswer(retrieved, 200 if props else 404, query.url, body)


def pubchem_record(cas: str, compound_class: str, props: list[dict], retrieved: str = RETRIEVED,
                   experimental: tuple[PubchemView, ...] = ()) -> PubchemRecord:
    """Record of a CAS query."""
    query = PubchemQuery.cas(cas)
    return PubchemRecord(query, compound_class, property_answer(query, props, retrieved), experimental)


def search_record(formula: str, compound_class: str, props: list[dict], retrieved: str = RETRIEVED,
                  experimental: tuple[PubchemView, ...] = (), cas_numbers: tuple[PubchemView, ...] = ()) -> PubchemRecord:
    """Record of a formula query."""
    query = PubchemQuery.formula(formula)
    return PubchemRecord(query, compound_class, property_answer(query, props, retrieved), experimental, cas_numbers)


def section_body(heading: str, strings: list[str], cid: int = 1) -> dict:
    """PUG View body with one ``heading`` section holding ``strings``, as PubChem nests it."""
    info = [{"Value": {"StringWithMarkup": [{"String": s}]}} for s in strings]
    return {"Record": {"RecordNumber": cid, "Section": [
        {"TOCHeading": "Chemical and Physical Properties", "Section": [
            {"TOCHeading": "Experimental Properties", "Section": [{"TOCHeading": heading, "Information": info}]}]},
    ]}}


def view(cid: int, body: dict | None, status: int = 200) -> PubchemView:
    return PubchemView(cid, "2026-10-14T10:00:00+00:00", status, f"https://x/{cid}", body)
