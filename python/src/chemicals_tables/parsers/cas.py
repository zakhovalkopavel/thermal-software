"""
chemicals_tables.parsers.cas — Normalise a CAS cell.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import re
from typing import Optional

_CAS = re.compile(r"^\d{2,7}-\d{2}-\d$")


def parse_cas(text: Optional[str]) -> Optional[str]:
    """``"702-79-4 "`` → ``"702-79-4"``; empty, ``None`` or malformed → None."""
    if text is None:
        return None
    text = text.strip()
    return text if _CAS.match(text) else None
