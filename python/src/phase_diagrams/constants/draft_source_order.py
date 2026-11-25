"""Preferred order when multiple draft folders hold the same system id."""

from __future__ import annotations

# Richer / newer digitization first; empty auto-full must not shadow candidates.
DRAFT_SOURCE_ORDER = (
    "auto-full",
    "candidates",
    "systems",
    "starts",
)
