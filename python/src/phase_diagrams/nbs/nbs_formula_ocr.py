"""
phase_diagrams.nbs.nbs_formula_ocr — Rebuild a salt formula from NSRDS-NBS 61 OCR text.

No compound whitelist: walk the token with ``ELEMENTS``. Real subscript digits from
page OCR (geometry in ``nbs_page_ocr``) are kept as-is. Punctuation / ``s`` → digit
heuristics apply only when Tesseract still emitted a comma/period/``s`` for a
subscript (``Cl``/``CI``/``C1``, ``0``/``°`` as oxygen). Used by ``NbsTextNormalizer.component``.

Spec: docs/scripts/phase-diagrams/NBS.md § Text index
"""
from __future__ import annotations

import re

from chemical_formula.formula_elements import ELEMENTS

# Punctuation (and OCR ``5``→``s``) standing in for a subscript after an element or ``)``.
_SUBSCRIPT_PUNCT = {",": "3", ".": "4", "'": "4", "s": "5", "S": "5"}
# When OCR uses ``,`` for every Clₙ, prefer the usual chloride count for that metal.
_CHLORIDE_COMMA = {
    "B": "3", "P": "3", "As": "3", "Sb": "5", "Bi": "3", "Al": "3", "Ga": "3", "In": "3",
    "Fe": "3", "V": "3", "Cr": "3", "Au": "3", "Rh": "3", "Ir": "3", "Y": "3", "Sc": "3",
    "Ge": "4", "Si": "4", "Te": "4", "Ti": "4", "Sn": "4", "C": "4", "Pb": "4", "Se": "4",
    "Zr": "4", "Hf": "4", "Pt": "4", "Pd": "4", "U": "4", "Th": "4",
    "Nb": "5", "Ta": "5", "Mo": "5", "W": "6", "Re": "5",
}
# Same idea for Brₙ (``GeBr,`` → ``GeBr4``; ``S2Br,`` → ``S2Br2``).
_BROMIDE_COMMA = {
    "B": "3", "P": "3", "As": "3", "Al": "3", "Ga": "3", "In": "3", "Sb": "3", "Bi": "3",
    "Ge": "4", "Si": "4", "Sn": "4", "Ti": "4", "Pb": "4",
}
# Oxychloride Clₙ after ``MOCl,`` (``VOCl,`` → 3, ``ReOCl,`` → 4).
_OXYCHLORIDE_COMMA = {"V": "3", "P": "3", "Nb": "3", "Ta": "3", "Re": "4", "W": "4", "Mo": "4"}
# Two-letter OCR spellings → real symbol (tried before plain ELEMENTS).
_OCR_SYMBOLS: tuple[tuple[str, str], ...] = (
    ("CI", "Cl"), ("C1", "Cl"), ("Cl", "Cl"),
    ("AI", "Al"), ("A1", "Al"), ("AJ", "Al"), ("Al", "Al"),
    ("T1", "Tl"), ("Tl", "Tl"),
    ("Br", "Br"),
    ("TI", "Tl"),  # → Ti when the rest looks like a titanium tetrahalide
)
_TWO = tuple(sorted({e for e in ELEMENTS if len(e) == 2}, key=lambda e: (-len(e), e)))
_ONE = frozenset(e for e in ELEMENTS if len(e) == 1)


def normalize_formula(raw: str) -> str:
    """``'NaN° 3'`` → ``'NaNO3'``, ``'BCI 3'`` → ``'BCl3'``, ``'TI2C03'`` → ``'Tl2CO3'``."""
    token = _compact(raw)
    if not token:
        return token
    out: list[str] = []
    pos = 0
    while pos < len(token):
        char = token[pos]
        if char in "()":
            out.append(char)
            pos += 1
            if pos < len(token) and token[pos] in _SUBSCRIPT_PUNCT and char == ")":
                out.append(_SUBSCRIPT_PUNCT[token[pos]])
                pos += 1
            continue
        if char in "123456789":
            end = pos + 1
            while end < len(token) and token[end].isdigit():
                end += 1
            out.append(token[pos:end])
            pos = end
            continue
        if char == "R" and out and _bromide_r_context(out):
            out.append("Br")
            pos += 1
            pos = _take_subscript(token, pos, out)
            continue
        symbol, width = _symbol_at(token, pos)
        if symbol is None:
            pos += 1
            continue
        out.append(symbol)
        pos += width
        pos = _take_subscript(token, pos, out)
    return "".join(out)


def _compact(raw: str) -> str:
    token = re.sub(r"\s+", "", raw).strip("\"'`")
    token = token.replace("°", "O").replace("<", "(").replace(">", ")")
    token = re.sub(r"(?<=[A-Za-z])[•·]", "4", token)  # ``N2H•`` → ``N2H4``
    token = token.replace("•", "").replace("·", "").replace("—", "-").replace("–", "-")
    token = re.sub(r"C[)}\]]", "Cl", token)  # ``PC)`` / ``VOC}`` → ``PCl`` / ``VOCl``
    token = re.sub(r"(?<![A-Za-z])eG(?=[A-Z(])", "Ge", token)  # ``eGCl`` → ``GeCl``
    token = re.sub(r"(?<![A-Za-z])(?:lA|IA|1A|LA|I6A)(?=[A-Z(]|$)", "Al", token)  # ``lABr`` / ``I6ABr``
    token = re.sub(r"(?<![A-Za-z])A[53](?=[A-Z(])", "As", token)  # ``A5Br`` / ``A3Cl`` → ``As``
    token = re.sub(r"(?<![A-Za-z])O5(?=[A-Z(])", "Os", token)  # ``O5Cl`` → ``OsCl``
    token = re.sub(r"(?<![A-Za-z])C5F\b", "CsF", token)
    token = re.sub(r"(?<![A-Za-z])FH\b", "HF", token)
    token = re.sub(r"(?<![A-Za-z])HN(?=[O0,\d]|$)", "NH", token)  # ``HN3`` → ``NH3``
    token = re.sub(r"(?<![A-Za-z])NKH", "KNH", token)  # ``NKH2`` → ``KNH2``
    token = re.sub(r"(?<![A-Za-z])PbR", "PBr", token)  # ``PbR3`` OCR of ``PBr3``
    # ``Ba(BHJ2`` → ``Ba(BH4)2`` (``J`` as 4 and the lost ``)`` before the outer count)
    token = re.sub(r"\(([^()]*?)J(\d+)$", r"(\g<1>4)\2", token)
    token = re.sub(r"(?<=[A-Za-z)])J(?=\d|$|[(),.'sS])", "4", token)
    return token


def _take_subscript(token: str, pos: int, out: list[str]) -> int:
    """Digits ``1–9…``, or one punctuation / ``s`` stand-in, after a symbol or ``)``.

    A leading ``0`` is left for oxygen (``N03`` → ``NO3``), not a zero subscript.
    """
    if pos >= len(token):
        return pos
    if token[pos] in "123456789":
        end = pos + 1
        while end < len(token) and token[end].isdigit():
            end += 1
        out.append(token[pos:end])
        return end
    if token[pos] in _SUBSCRIPT_PUNCT:
        out.append(_subscript_digit(token[pos], out, token, pos))
        return pos + 1
    return pos


def _subscript_digit(punct: str, out: list[str], token: str, pos: int) -> str:
    """Usual stand-ins: ``.``/``'``→4, ``s``→5; ``,``→3 after halogen/``H``/``O``, else →2.

    ``H,`` before ``)2`` is amide ``H2``; ``H,`` before ``).`` or bare ``NH,`` is ``H3``.
    ``BH,`` is borohydride ``BH4``. ``S.Br`` / ``S,Br,`` → ``S2Br2``.
    ``WCl.`` / ``Si2OCl.`` use ``.``→6 (hexahalides in this table).
    """
    prev = out[-1] if out else ""
    if punct == "." and prev == "Cl" and _hexachloride(out):
        return "6"
    if punct in ".,'" and prev == "S":
        return "2"  # ``S.Br`` / ``S,Br`` → ``S2Br…``
    if punct == "," and prev == "Cl" and len(out) >= 3 and out[-2] == "O" and out[-3] in _OXYCHLORIDE_COMMA:
        return _OXYCHLORIDE_COMMA[out[-3]]
    if punct == "," and prev == "Cl" and len(out) >= 2 and out[-2] in _CHLORIDE_COMMA:
        return _CHLORIDE_COMMA[out[-2]]
    if punct == "," and prev == "Br" and len(out) >= 2 and out[-2] in _BROMIDE_COMMA:
        return _BROMIDE_COMMA[out[-2]]
    if punct == "," and prev == "Br" and len(out) >= 3 and out[-2] == "2" and out[-3] == "S":
        return "2"  # ``S2Br,`` → ``S2Br2``
    if punct != ",":
        return _SUBSCRIPT_PUNCT[punct]
    if prev == "H":
        before = out[-2] if len(out) >= 2 else ""
        if before == "B":
            return "4"  # ``NaBH,`` → ``NaBH4``
        if pos + 1 < len(token) and token[pos + 1] == ")":
            after = token[pos + 2:] if pos + 2 <= len(token) else ""
            if after[:1] in "123456789":
                return "2"
            return "3"
        return "3"
    if prev == "N" and pos + 1 < len(token) and token[pos + 1] in "O0":
        return "2"  # ``N,O`` → ``N2O``
    if prev in ("Cl", "Br", "I", "F") and len(out) == 1:
        return "2"  # elemental ``Br,`` / ``Cl,`` → ``Br2`` / ``Cl2``
    if prev == "O":
        before = out[-2] if len(out) >= 2 else ""
        return "2" if before == "S" else "3"  # ``SO,`` → ``SO2``; ``NO,``/``CO,`` → ``NO3``/``CO3``
    if prev in (
        "Cl", "Br", "I", "F", "B", "N", "P", "As", "Sb", "Bi", "Al", "Ga", "In", "Tl",
        "Fe", "Ti", "V", "Nb", "Ta", "Mo", "W", "U", "Sn", "Ge", "Si", "Pb", "Zn", "Cd",
    ):
        return "3"
    return "2"


def _hexachloride(out: list[str]) -> bool:
    """``WCl.`` / ``Si2OCl.`` → subscript 6."""
    body = "".join(out[:-1])
    return body.endswith("W") or body.endswith("Si2O")


def _symbol_at(token: str, pos: int) -> tuple[str | None, int]:
    """Next element symbol at ``pos``, or oxygen from ``0``, or None."""
    for raw, symbol in _OCR_SYMBOLS:
        if not token.startswith(raw, pos):
            continue
        if raw == "TI" and _titanium_halide(token, pos + 2):
            return "Ti", 2
        return symbol, len(raw)
    # Exact case only (``Na``, ``Cl``). ``NO`` must not become Nobelium ``No``.
    # Two-letter symbols (``Os``, ``As``) before the ``O``/``0`` → oxygen shortcut.
    for symbol in _TWO:
        if token.startswith(symbol, pos):
            return symbol, 2
    if token[pos] in "0O":
        return "O", 1
    if token[pos] in _ONE:
        return token[pos], 1
    upper = token[pos].upper()
    if upper in _ONE:
        return upper, 1
    return None, 0


def _titanium_halide(token: str, after: int) -> bool:
    """``TI`` is titanium when the rest looks like ``TiCl4`` / ``TiBr.``, not ``TlNO3`` / ``TlCl``."""
    rest = token[after:]
    return bool(re.match(r"(?:Cl|CI|C1|Br|I|F)(?:[4.]|\d)", rest))


def _bromide_r_context(out: list[str]) -> bool:
    """Bare ``R`` is OCR for ``Br`` after a metal fragment (``PbR,``)."""
    if not out:
        return False
    prev = out[-1]
    return prev[0].isalpha() and prev[0].isupper()
