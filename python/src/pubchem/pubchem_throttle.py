"""
pubchem.pubchem_throttle — Worst status in a PubChem ``X-Throttling-Control`` header.

    "Request Count status: Green (0%), Request Time status: Yellow (61%), Service status: Green (23%)"
    → "Yellow"

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import re
from typing import Optional

from pubchem.constants.pubchem import PUBCHEM_THROTTLE_LEVELS

_STATUS = re.compile(r"status:\s*(" + "|".join(PUBCHEM_THROTTLE_LEVELS) + r")")


def throttle_level(header: Optional[str]) -> Optional[str]:
    """Green / Yellow / Red / Black; None when the header is missing or has no status."""
    levels = _STATUS.findall(header or "")
    return max(levels, key=PUBCHEM_THROTTLE_LEVELS.index) if levels else None
