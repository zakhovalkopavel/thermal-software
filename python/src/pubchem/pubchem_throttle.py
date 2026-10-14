"""
pubchem.pubchem_throttle — Statuses of a PubChem ``X-Throttling-Control`` header.

    "Request Count status: Green (0%), Request Time status: Yellow (61%), Service status: Green (23%)"
    → worst "Yellow"; per counter {"Request Count": "Green", "Request Time": "Yellow", "Service": "Green"}

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import re
from typing import Optional

from pubchem.constants.pubchem import PUBCHEM_THROTTLE_LEVELS

_STATUS = re.compile(r"([A-Za-z ]+?)\s+status:\s*(" + "|".join(PUBCHEM_THROTTLE_LEVELS) + r")")


def throttle_statuses(header: Optional[str]) -> dict[str, str]:
    """Counter name → Green / Yellow / Red / Black; empty when the header is missing or has no status."""
    return {name.strip(" ,"): level for name, level in _STATUS.findall(header or "")}


def throttle_level(header: Optional[str]) -> Optional[str]:
    """Worst status of all counters; None when the header is missing or has no status."""
    levels = throttle_statuses(header).values()
    return max(levels, key=PUBCHEM_THROTTLE_LEVELS.index) if levels else None
