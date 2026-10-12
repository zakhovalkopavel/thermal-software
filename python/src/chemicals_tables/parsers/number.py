"""
chemicals_tables.parsers.number — Parse a numeric table cell, keeping integers as integers.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import math
import re
from typing import Optional, Union

_INT = re.compile(r"^[+-]?\d+$")
_EMPTY = {"", "none", "nan", "-"}


def parse_number(text: Optional[str]) -> Optional[Union[int, float]]:
    """``"273"`` → 273, ``"7.65E5"`` → 765000.0, empty / ``None`` / ``nan`` → None.

    Raises ValueError for any other non-numeric text.
    """
    if text is None:
        return None
    text = text.strip()
    if text.lower() in _EMPTY:
        return None
    if _INT.match(text):
        return int(text)
    value = float(text)
    if not math.isfinite(value):
        return None
    return value
