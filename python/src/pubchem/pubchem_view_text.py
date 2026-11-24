"""
pubchem.pubchem_view_text — The values of a PUG View section as text, e.g. every "Melting Point" string.

Slim experimental items expose ``values`` with ``citation`` lists; legacy / CAS answers still nest
``Section`` → ``Information`` with ``StringWithMarkup`` or ``Number``+``Unit``. Nothing is parsed into
numbers: the strings are as the sources print them ("1600 °C", "MP: 1,605 °C").

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

from typing import Any, Optional, Union

from pubchem.pubchem_view import PubchemView


def view_strings(source: Union[Optional[dict[str, Any]], PubchemView], heading: Optional[str] = None) -> list[str]:
    """Values under the sections titled ``heading`` (all values when None), in page order."""
    if isinstance(source, PubchemView):
        if source.values:
            return [
                c.text
                for prop in source.values if heading is None or prop.heading == heading
                for c in prop.citation
            ]
        body = source.body
    else:
        body = source
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
