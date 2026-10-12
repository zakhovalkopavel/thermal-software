"""
pubchem.parsers.pubchem_cache — Read the PubChem identifier cache (TSV with header).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from pathlib import Path

from pubchem.pubchem_result import PubchemResult


def read_pubchem_cache(path: Path) -> dict[str, tuple[PubchemResult, int]]:
    """CAS → (result, 1-based line); empty when the file does not exist."""
    if not path.is_file():
        return {}
    found: dict[str, tuple[PubchemResult, int]] = {}
    with path.open(encoding="utf-8") as fh:
        for line, text in enumerate(fh, start=1):
            if line == 1 or not text.strip():
                continue
            result = PubchemResult.from_row(text.rstrip("\n").split("\t"))
            found[result.cas] = (result, line)
    return found
