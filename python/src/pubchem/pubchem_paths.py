"""
pubchem.pubchem_paths — The PubChem files, one per compound class.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

from pathlib import Path

from pubchem.constants.pubchem import PUBCHEM_CAS_CLASSES, PUBCHEM_FILE


def pubchem_files(directory: Path) -> dict[str, Path]:
    """Class → ``<directory>/pubchem-<class>.jsonl``, in ``PUBCHEM_CAS_CLASSES`` order."""
    return {cls: directory / PUBCHEM_FILE.format(cls=cls) for cls in PUBCHEM_CAS_CLASSES}
