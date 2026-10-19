"""
pubchem.cas_cids — Pull CID lists out of PubChem PUG REST JSON (compound or substance).

``IdentifierList.CID`` (compound xref) or ``InformationList.Information[].CID`` (substance → compound).

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

from typing import Any, Optional


def cids_from_body(body: Optional[dict[str, Any]]) -> list[int]:
    """Unique CIDs in PubChem's order; empty when the body has none."""
    if not body:
        return []
    found: list[int] = []
    seen: set[int] = set()
    for cid in (body.get("IdentifierList") or {}).get("CID") or []:
        if isinstance(cid, int) and cid not in seen:
            seen.add(cid)
            found.append(cid)
    for info in (body.get("InformationList") or {}).get("Information") or []:
        for cid in info.get("CID") or []:
            if isinstance(cid, int) and cid not in seen:
                seen.add(cid)
                found.append(cid)
    return found
