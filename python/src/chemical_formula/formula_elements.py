"""
chemical_formula.formula_elements — Element counts of a formula.

Handles adduct separators (``·`` and ``.``), leading multipliers (``4Al2O3·3SiO2``,
``AlF3·3.5H2O``), nested parentheses and brackets, trailing ionic charges (``NH4+``), and isotopes
(``[18O]``, ``D``, ``T``), which count as their element.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import re

ELEMENTS: frozenset[str] = frozenset("""
H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr
Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb
Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr
Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og
""".split())
ISOTOPES = {"D": "H", "T": "H"}

_ADDUCT = re.compile(r"\s*[·•*]\s*")
_MULTIPLIER = re.compile(r"^(\d+(?:\.\d+)?)")
_CHARGE = re.compile(r"[+-]\d*$")
_ISOTOPE_LABEL = re.compile(r"\[\d+([A-Z][a-z]?)\]")
_TOKEN = re.compile(r"([A-Z][a-z]?)(\d*\.?\d*)|([(\[])|([)\]])(\d*\.?\d*)")


def formula_elements(formula: str) -> dict[str, float]:
    """``"2KCl·CuCl2.2H2O"`` → ``{"Cl": 4, "Cu": 1, "H": 4, "K": 2, "O": 2}`` (sorted keys).

    Raises ValueError for unknown symbols or unbalanced parentheses.
    """
    text = _ISOTOPE_LABEL.sub(r"\1", formula.strip().replace(" ", ""))
    if not text:
        raise ValueError("empty formula")
    total: dict[str, float] = {}
    for part in _split_adducts(text):
        multiplier = 1.0
        match = _MULTIPLIER.match(part)
        if match:
            multiplier = float(match[1])
            part = part[match.end():]
        part = _CHARGE.sub("", part)
        for element, count in _parse_group(part, formula).items():
            total[element] = total.get(element, 0.0) + count * multiplier
    return {e: total[e] for e in sorted(total)}


def _split_adducts(text: str) -> list[str]:
    """Split at ``·`` and at adduct dots; a dot after a leading multiplier or after a ``0`` count
    is a decimal point (``3.5H2O``, ``Fe0.947O``), any other dot separates (``CuCl2.2H2O``)."""
    parts: list[str] = []
    for chunk in _ADDUCT.split(text):
        start = 0
        for i, char in enumerate(chunk):
            if char != ".":
                continue
            j = i
            while j > start and chunk[j - 1].isdigit():
                j -= 1
            digits = chunk[j:i]
            if digits and (j == start or digits == "0"):
                continue
            parts.append(chunk[start:i])
            start = i + 1
        parts.append(chunk[start:])
    return [p for p in parts if p]


def _parse_group(text: str, formula: str) -> dict[str, float]:
    stack: list[dict[str, float]] = [{}]
    pos = 0
    while pos < len(text):
        match = _TOKEN.match(text, pos)
        if match is None:
            raise ValueError(f"cannot parse formula {formula!r} at {text[pos:]!r}")
        element, count, opening, closing, group_count = match.groups()
        if element:
            element = ISOTOPES.get(element, element)
            if element not in ELEMENTS:
                raise ValueError(f"unknown element {element!r} in {formula!r}")
            n = float(count) if count else 1.0
            stack[-1][element] = stack[-1].get(element, 0.0) + n
        elif opening:
            stack.append({})
        else:
            if len(stack) == 1:
                raise ValueError(f"unbalanced parentheses in {formula!r}")
            group = stack.pop()
            n = float(group_count) if group_count else 1.0
            for e, c in group.items():
                stack[-1][e] = stack[-1].get(e, 0.0) + c * n
        pos = match.end()
    if len(stack) != 1:
        raise ValueError(f"unbalanced parentheses in {formula!r}")
    if not stack[0]:
        raise ValueError(f"no elements in {formula!r}")
    return stack[0]
