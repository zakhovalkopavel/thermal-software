"""
pubchem.pubchem_view — One section of a PubChem compound page (PUG View).

``GET {PUBCHEM_VIEW_API}/data/compound/{CID}/JSON?heading=<heading>``. Two headings are asked:

- ``Experimental Properties``: stored slim as ``values`` (heading + ``citation`` list with
  ``refCode`` / ``refNumber`` / ``refPage``); detailed sources go to ``pubchem-references.jsonl``.
  Legacy lines may still hold the raw ``body`` until re-fetched.
- ``CAS``: the CAS numbers each source gives, kept as the raw ``body`` for ``casNumbers``.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from pubchem.experimental_value import ExperimentalProperty
from pubchem.parsers.experimental_properties import parse_experimental


@dataclass(frozen=True)
class PubchemView:
    """``retrieved`` is an ISO 8601 UTC time.

    Experimental answers use ``values`` (no raw ``body``). CAS answers and legacy experimental lines use
    ``body``. ``references`` are detail rows collected when an experimental body is slimmed; they are
    written to the references file, not into the compound JSON line.
    """

    cid: int
    retrieved: str
    http_status: int
    url: str
    body: Optional[dict[str, Any]] = None
    values: tuple[ExperimentalProperty, ...] = ()
    references: tuple[dict[str, Any], ...] = field(default=(), compare=False, repr=False)

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> PubchemView:
        """Inverse of ``to_json`` (compound-log shape; ``references`` are never in the line)."""
        values = tuple(ExperimentalProperty.from_json(v) for v in data.get("values", []))
        return cls(data["cid"], data["retrieved"], data["httpStatus"], data["url"], data.get("body"), values)

    @classmethod
    def from_experimental_response(cls, cid: int, retrieved: str, http_status: int, url: str,
                                   body: Optional[dict[str, Any]]) -> PubchemView:
        """Slim a PUG View Experimental Properties answer; 404 → empty values."""
        if http_status != 200 or not body:
            return cls(cid, retrieved, http_status, url)
        values, refs = parse_experimental(body, cid)
        return cls(cid, retrieved, http_status, url, values=tuple(values), references=tuple(refs))

    def to_json(self) -> dict[str, Any]:
        """One item of a record's ``experimental`` or ``casNumbers`` list."""
        out: dict[str, Any] = {
            "cid": self.cid, "retrieved": self.retrieved, "httpStatus": self.http_status, "url": self.url,
        }
        if self.values or self.body is None:
            out["values"] = [v.to_json() for v in self.values]
        else:
            out["body"] = self.body
        return out
