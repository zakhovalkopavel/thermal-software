"""
pubchem.experimental_value — Experimental property as stored in the compound log.

One heading with a ``citation`` list. Each item keeps the original printed ``text`` and, separately,
parsed ``values`` as ``{spec?, number, unit}``. Catalog pointers: ``refCode``, ``refNumber``, optional
``refPage``. Source names live in ``pubchem-references.jsonl``.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass(frozen=True)
class ExperimentalQuantity:
    """One parsed magnitude: optional ``spec`` (what was measured / condition), then number and unit."""

    number: float
    unit: str
    spec: Optional[str] = None

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> ExperimentalQuantity:
        return cls(float(data["number"]), str(data["unit"]), data.get("spec"))

    def to_json(self) -> dict[str, Any]:
        out: dict[str, Any] = {}
        if self.spec is not None:
            out["spec"] = self.spec
        out["number"] = self.number
        out["unit"] = self.unit
        return out


@dataclass(frozen=True)
class ExperimentalCitation:
    """One original printed string, its parsed quantities, and a sources-catalog pointer.

    ``source`` is provisional (for ``register_sources``) and never written to JSON.
    """

    text: str
    values: tuple[ExperimentalQuantity, ...] = ()
    ref_code: Optional[str] = None
    ref_number: Optional[int] = None
    ref_page: Optional[str] = None
    source: Optional[str] = field(default=None, compare=False, repr=False)

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> ExperimentalCitation:
        text = data["text"] if "text" in data else data["value"]
        if "values" in data:
            values = tuple(ExperimentalQuantity.from_json(v) for v in data.get("values", []))
        else:
            from pubchem.parsers.experimental_properties import parse_quantities
            values = tuple(parse_quantities(text))
        return cls(text, values, data.get("refCode"), data.get("refNumber"), data.get("refPage"))

    def to_json(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "text": self.text,
            "values": [v.to_json() for v in self.values],
        }
        if self.ref_code is not None:
            out["refCode"] = self.ref_code
        if self.ref_number is not None:
            out["refNumber"] = self.ref_number
        if self.ref_page is not None:
            out["refPage"] = self.ref_page
        return out


@dataclass(frozen=True)
class ExperimentalProperty:
    """One Experimental Properties heading and its citation rows."""

    heading: str
    citation: tuple[ExperimentalCitation, ...] = ()

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> ExperimentalProperty:
        if "citation" in data:
            citations = tuple(ExperimentalCitation.from_json(c) for c in data.get("citation", []))
            return cls(data["heading"], citations)
        # Legacy flat row: {heading, value|text, refCode, refNumber, page|refPage, source?}
        text = data["text"] if "text" in data else data["value"]
        page = data.get("refPage", data.get("page"))
        cite = ExperimentalCitation.from_json({
            "text": text, "refCode": data.get("refCode"), "refNumber": data.get("refNumber"),
            "refPage": page, **({"values": data["values"]} if "values" in data else {}),
        })
        if data.get("source"):
            cite = ExperimentalCitation(
                cite.text, cite.values, cite.ref_code, cite.ref_number, cite.ref_page, data["source"],
            )
        return cls(data["heading"], (cite,))

    def to_json(self) -> dict[str, Any]:
        return {"heading": self.heading, "citation": [c.to_json() for c in self.citation]}
