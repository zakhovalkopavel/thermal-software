"""
pubchem.pubchem_transient_error — PubChem unreachable; the client pauses and asks again.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations


class PubchemTransientError(Exception):
    """Network failure or timeout (no HTTP answer)."""
