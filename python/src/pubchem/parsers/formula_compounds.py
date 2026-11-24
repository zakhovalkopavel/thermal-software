"""
pubchem.parsers.formula_compounds — The compound-data records without a CAS, to be searched by formula.

Reads ``index.json`` of the compound data build as a plain file: the ``compounds`` keyed
``formula:<source formula>`` (``formula:Ag2S``, ``formula:2KCl·SnCl4``; 162 records, mostly JANAF gas
species, Perry double salts and hydrates), with their Hill formula and class.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import json
from pathlib import Path


def read_formula_compounds(path: Path) -> dict[str, str]:
    """Hill formula → class of the records keyed ``formula:…`` (one Hill formula is one record)."""
    index = json.loads(path.read_text(encoding="utf-8"))
    return {compound["hill"]: compound["class"]
            for key, compound in index.get("compounds", {}).items() if key.startswith("formula:")}
