"""
pubchem.pubchem_view_text — The values of a PUG View section as text, e.g. every "Melting Point" string.

A section nests ``Section`` lists down to ``Information`` items whose ``Value`` is
``StringWithMarkup`` (text) or ``Number`` with a ``Unit``. Nothing is parsed into numbers: the strings
are as the sources print them ("1600 °C", "MP: 1,605 °C").

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

from typing import Any, Optional


def view_strings(body: Optional[dict[str, Any]], heading: Optional[str] = None) -> list[str]:
    """Values under the sections titled ``heading`` (all values when None), in page order."""
    record = (body or {}).get("Record")
    if not record:
        return []
    found: list[str] = []
    _walk(record, heading, heading is None, found)
    return found


def _walk(section: dict[str, Any], heading: Optional[str], inside: bool, found: list[str]) -> None:
    inside = inside or section.get("TOCHeading") == heading
    if inside:
        for info in section.get("Information", []):
            value = info.get("Value", {})
            found += [m["String"] for m in value.get("StringWithMarkup", []) if m.get("String")]
            if value.get("Number"):
                unit = value.get("Unit", "")
                found += [f"{n:g} {unit}".strip() for n in value["Number"]]
    for child in section.get("Section", []):
        _walk(child, heading, inside, found)
