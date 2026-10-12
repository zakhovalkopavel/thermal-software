"""
pubchem.pubchem_response — One PUG REST answer: HTTP status, JSON body and throttling headers.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class PubchemResponse:
    """``data`` is set for 200 only; ``throttling`` is the raw ``X-Throttling-Control`` header."""

    status: int
    data: Optional[dict[str, Any]] = None
    throttling: Optional[str] = None
    retry_after: Optional[float] = None
