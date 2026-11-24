"""
chemicals_tables.label_variant — Polymorph or variant named in a source label.

CRC labels end with the modification in parentheses: ``Aluminum oxide (α)`` → ``α``,
``Sulfur (monoclinic)`` → ``monoclinic``. Oxidation states inside the name (``Iron(III) oxide``)
are not trailing and are ignored.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import re
from typing import Optional

_TRAILING = re.compile(r"\s\(([^()]+)\)\s*$")


def label_variant(label: Optional[str]) -> Optional[str]:
    """Text of a trailing ``(...)`` group preceded by a space, else None."""
    if not label:
        return None
    match = _TRAILING.search(label)
    return match[1].strip() if match else None
