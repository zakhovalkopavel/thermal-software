"""
pubchem.pubchem_view — One section of a PubChem compound page (PUG View), as PubChem sent it.

``GET {PUBCHEM_VIEW_API}/data/compound/{CID}/JSON?heading=<heading>``. Two headings are asked:

- ``Experimental Properties`` ("Chemical and Physical Properties → Experimental Properties": melting and
  boiling point, density, decomposition, vapour pressure, solubility … as text with their sources), for
  the ``experimental`` list of a ``PubchemRecord``;
- ``CAS`` (the CAS numbers each source gives), for the ``casNumbers`` list of a search record: a formula
  or name answer carries no CAS.

``body`` is the JSON as sent (``Record`` with its ``Reference`` list), or PubChem's ``Fault`` for a 404
(the compound has no such section).

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class PubchemView:
    """``retrieved`` is an ISO 8601 UTC time."""

    cid: int
    retrieved: str
    http_status: int
    url: str
    body: Optional[dict[str, Any]] = None

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> PubchemView:
        """Inverse of ``to_json``."""
        return cls(data["cid"], data["retrieved"], data["httpStatus"], data["url"], data.get("body"))

    def to_json(self) -> dict[str, Any]:
        """One item of a record's ``experimental`` or ``casNumbers`` list."""
        return {"cid": self.cid, "retrieved": self.retrieved, "httpStatus": self.http_status, "url": self.url,
                "body": self.body}
