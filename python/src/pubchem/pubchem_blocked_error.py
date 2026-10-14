"""
pubchem.pubchem_blocked_error — PubChem blocks or keeps refusing requests; the run must stop.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations


class PubchemBlockedError(Exception):
    """HTTP 403, throttling status Black, or still busy after the allowed pauses."""
