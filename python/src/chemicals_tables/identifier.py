"""
chemicals_tables.identifier — Identity of a CAS number from the chemicals identifier databases.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from chemicals_tables.source_link import SourceLink


@dataclass
class Identifier:
    """Formula (Hill notation), molar mass, SMILES, InChIKey, name and PubChem CID of one CAS number."""

    cas: str
    formula: str
    mw: Optional[float]
    smiles: Optional[str]
    inchikey: Optional[str]
    name: Optional[str]
    source: SourceLink
    cid: Optional[int] = None
