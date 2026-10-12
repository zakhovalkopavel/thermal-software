"""
pubchem.pubchem_cache_writer — Write the PubChem identifier cache, sorted by CAS.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from pathlib import Path
from typing import Iterable

from pubchem.constants.pubchem import PUBCHEM_CACHE_COLUMNS
from pubchem.pubchem_result import PubchemResult


def write_pubchem_cache(path: Path, results: Iterable[PubchemResult]) -> Path:
    """Replace ``path`` atomically; cells never contain tabs or newlines."""
    lines = ["\t".join(PUBCHEM_CACHE_COLUMNS)]
    for result in sorted(results, key=lambda r: r.cas):
        lines.append("\t".join(c.replace("\t", " ").replace("\n", " ") for c in result.to_row()))
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text("\n".join(lines) + "\n", encoding="utf-8")
    tmp.replace(path)
    return path
