"""
pubchem.pubchem_record — Everything PubChem gave for one query: one line of a ``pubchem-<class>.jsonl`` file.

A CAS query (the compound data's missing CAS numbers):

    {"cas": "7647-14-5", "class": "inorganic",
     "properties": {"retrieved": …, "httpStatus": 200, "url": …, "body": {"PropertyTable": …}},
     "experimental": [{"cid": 5234, "retrieved": …, "httpStatus": 200, "url": …,
                       "values": [{"heading": "Melting Point", "value": "801 °C",
                                   "refCode": "HSDB", "refNumber": 24, "page": "4-57"}]}]}

A formula or name query (compound-data records without a CAS, new compounds) has ``key`` and ``search``
instead of ``cas``, and the PUG View "CAS" section of the chosen compound in ``casNumbers``:

    {"key": "formula:Ag2S", "search": {"by": "formula", "text": "Ag2S", "hill": "Ag2S"}, "class": "inorganic",
     "properties": {…}, "casNumbers": [{"cid": 166738, …, "body": {"Record": …}}],
     "experimental": [{"cid": 166738, "values": […]}, …]}

``properties`` is the property request (every compound of the answer, every ``PUBCHEM_PROPERTIES`` field),
``experimental`` the slim PUG View "Experimental Properties" of each compound the query stands for
(original strings + short refs; details in ``pubchem-references.jsonl``). The status, the chosen compound
and its CAS are derived (``result``), never stored.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from pubchem.constants.pubchem import PUBCHEM_BY_CAS, PUBCHEM_BY_FORMULA, PUBCHEM_OK
from pubchem.pubchem_answer import PubchemAnswer
from pubchem.pubchem_query import PubchemQuery
from pubchem.pubchem_result import PubchemResult
from pubchem.pubchem_view import PubchemView


@dataclass(frozen=True)
class PubchemRecord:
    """``compound_class`` is the class of the compound when it was fetched (inorganic / organic / unclassified);
    ``light`` marks a record read without its experimental bodies (it must not be written back)."""

    query: PubchemQuery
    compound_class: str
    answer: PubchemAnswer
    experimental: tuple[PubchemView, ...] = ()
    cas_numbers: tuple[PubchemView, ...] = ()
    light: bool = field(default=False, compare=False)

    @property
    def key(self) -> str:
        """The CAS, or ``formula:<Hill>`` / ``name:<name>``."""
        return self.query.key

    @property
    def result(self) -> PubchemResult:
        """Status, identifiers and (for a search) CAS of the answer."""
        return PubchemResult.from_answer(self.query, self.answer, self.cas_numbers)

    @property
    def experimental_cids(self) -> list[int]:
        """Compounds whose experimental properties belong to the record."""
        if self.query.by == PUBCHEM_BY_FORMULA:
            return [p["CID"] for p in PubchemResult.formula_matches(self.answer.properties, self.query.hill or "")]
        return self.answer.cids

    @property
    def missing_cids(self) -> list[int]:
        """``experimental_cids`` without experimental properties in this record."""
        done = {e.cid for e in self.experimental}
        return [cid for cid in self.experimental_cids if cid not in done]

    @property
    def missing_cas_cid(self) -> Optional[int]:
        """The chosen compound of an ``ok`` search when its CAS section is not in the record yet."""
        if self.query.by == PUBCHEM_BY_CAS:
            return None
        result = self.result
        if result.status != PUBCHEM_OK or result.cid is None or any(v.cid == result.cid for v in self.cas_numbers):
            return None
        return result.cid

    @classmethod
    def from_json(cls, data: dict[str, Any], experimental: bool = True) -> PubchemRecord:
        """Inverse of ``to_json``; ``experimental=False`` keeps only the CID and status of each experimental item."""
        if "cas" in data:
            query = PubchemQuery.cas(data["cas"])
        else:
            search = data["search"]
            query = PubchemQuery(data["key"], search["by"], search["text"], search.get("hill"))
        items = tuple(
            PubchemView.from_json(e) if experimental else PubchemView(e["cid"], e["retrieved"], e["httpStatus"], e["url"])
            for e in data.get("experimental", [])
        )
        cas_numbers = tuple(PubchemView.from_json(v) for v in data.get("casNumbers", []))
        return cls(query, data["class"], PubchemAnswer.from_json(data["properties"]), items, cas_numbers,
                   light=not experimental)

    def to_json(self) -> dict[str, Any]:
        """One line of the class file; raises ValueError for a ``light`` record."""
        if self.light:
            raise ValueError(f"{self.key}: record read without experimental bodies")
        if self.query.by == PUBCHEM_BY_CAS:
            head: dict[str, Any] = {"cas": self.key}
        else:
            search = {"by": self.query.by, "text": self.query.text}
            if self.query.hill:
                search["hill"] = self.query.hill
            head = {"key": self.key, "search": search}
        out = {**head, "class": self.compound_class, "properties": self.answer.to_json()}
        if self.query.by != PUBCHEM_BY_CAS:
            out["casNumbers"] = [v.to_json() for v in self.cas_numbers]
        out["experimental"] = [e.to_json() for e in self.experimental]
        return out
