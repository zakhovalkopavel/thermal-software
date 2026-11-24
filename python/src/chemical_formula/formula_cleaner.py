"""
chemical_formula.formula_cleaner — Strip footnote prefixes and spaces from a source formula.

Perry 2-151 prefixes some formulas with a footnote number and a space (``22 SO2``). A leading
multiplier without a space (``4Al2O3·3SiO2``) is part of the formula and is kept.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import re
from typing import Optional

_FOOTNOTE = re.compile(r"^\d+\s+")


def clean_formula(text: Optional[str]) -> Optional[str]:
    """``" 22 SO2 "`` → ``"SO2"``; empty → None."""
    if text is None:
        return None
    text = _FOOTNOTE.sub("", text.strip()).strip()
    return text or None
