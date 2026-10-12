"""
pubchem.parsers.cas_list — CAS numbers to look up: one per line, ``#`` starts a comment.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from pathlib import Path


def read_cas_list(path: Path) -> list[str]:
    """CAS numbers in file order, without blanks, comments and duplicates."""
    seen: dict[str, None] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        cas = line.split("#", 1)[0].strip()
        if cas:
            seen.setdefault(cas, None)
    return list(seen)
