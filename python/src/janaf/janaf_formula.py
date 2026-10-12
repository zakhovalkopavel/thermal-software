"""
janaf.janaf_formula — Element counts and charge of a JANAF header formula (``O2Ti1``, ``Al1Cl2+``).

Spec: docs/scripts/JANAF_PARSER_SPEC.md
Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

import re
from typing import Optional

from chemical_formula.formula_elements import ELEMENTS, ISOTOPES

_CHARGE = re.compile(r"[+-]\d*$")
_ELEMENT_COUNT = re.compile(r"([A-Z][a-z]?)(\d+(?:\.\d+)?)")
_ELEMENT_COUNTS = re.compile(r"(?:[A-Z][a-z]?\d+(?:\.\d+)?)+")


def janaf_charge(janaf_formula: str) -> str:
    """Trailing charge: ``"+"`` for ``Al1+``, ``"-"`` for ``Al1-``; ``""`` when neutral."""
    match = _CHARGE.search(janaf_formula)
    return match[0] if match else ""


def janaf_counts(janaf_formula: str) -> Optional[dict[str, float]]:
    """``O2Ti1`` → ``{"O": 2, "Ti": 1}``, ``Mo1O2.750`` → ``{"Mo": 1, "O": 2.75}``; None if not element counts.

    The charge is ignored. JANAF formulas are plain symbol-count pairs (no adducts), so a dot is always
    a decimal point. Isotope symbols (``D``) are kept as they are; ``e1-`` (electron gas) gives None.
    """
    neutral = _CHARGE.sub("", janaf_formula)
    if _ELEMENT_COUNTS.fullmatch(neutral) is None:
        return None
    counts: dict[str, float] = {}
    for symbol, count in _ELEMENT_COUNT.findall(neutral):
        if symbol not in ELEMENTS and symbol not in ISOTOPES:
            return None
        counts[symbol] = counts.get(symbol, 0.0) + float(count)
    return {e: counts[e] for e in sorted(counts)}
