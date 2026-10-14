"""
pubchem.pubchem_answer — The full answer of the property request of one query (CAS, formula or name).

The whole JSON body: every compound the query resolves to with every ``PUBCHEM_PROPERTIES`` field, or
PubChem's ``Fault`` for a 404. Stored in the ``properties`` block of a ``PubchemRecord``.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class PubchemAnswer:
    """``retrieved`` is an ISO 8601 UTC time; ``body`` is the JSON body as PubChem sent it."""

    retrieved: str
    http_status: int
    url: str
    body: Optional[dict[str, Any]] = None

    @property
    def properties(self) -> list[dict[str, Any]]:
        """``PropertyTable.Properties``: one dict per compound, empty for a 404."""
        return (self.body or {}).get("PropertyTable", {}).get("Properties", [])

    @property
    def cids(self) -> list[int]:
        """Every compound id of the answer, in PubChem's order."""
        return [p["CID"] for p in self.properties if isinstance(p.get("CID"), int)]

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> PubchemAnswer:
        """Inverse of ``to_json``."""
        return cls(data["retrieved"], data["httpStatus"], data["url"], data.get("body"))

    def to_json(self) -> dict[str, Any]:
        """The ``properties`` block of a record line."""
        return {"retrieved": self.retrieved, "httpStatus": self.http_status, "url": self.url, "body": self.body}
