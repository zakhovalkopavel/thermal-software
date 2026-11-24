"""
compound_data.label_normalize — Repair PDF/CID-font mojibake in compound names.

CRC / table extracts sometimes map ASCII punctuation to CJK or control-picture
glyphs (e.g. ``Lead共2⫹兲`` → ``Lead(2+)``, ``N-共2-Hydroxyethyl兲`` → ``N-(2-Hydroxyethyl)``),
and scramble relative-stereo locants (``(2RS'-Chloro-(3SR'-methylpentane`` →
``(2RS*,3SR*)-2-Chloro-3-methylpentane``).
"""
from __future__ import annotations

import re

# PDF font remaps seen in unresolved / CRC-style names.
_PDF_MOJIBAKE: dict[str, str] = {
    "\u5171": "(",   # 共
    "\u5172": ")",   # 兲
    "\u5173": "[",   # 关
    "\u5174": "]",   # 兴
    "\u2b18": "'",   # ⬘ diamond → prime/apostrophe
    "\u2af9": "+",   # ⫹
    "\u2afa": "-",   # ⫺ (if present)
    "\u2423": "α",   # ␣ OPEN BOX → Greek alpha (stereo locants)
    "\u2424": "β",   # ␤ SYMBOL FOR NEWLINE → Greek beta
    "\u2429": "η",   # SYMBOL FOR HORIZONTAL TABULATION → Greek eta
}

_TRANSLATE = str.maketrans(_PDF_MOJIBAKE)
_WS = re.compile(r"\s+")

# (2RS'-Chloro-(3SR'-methylpentane → (2RS*,3SR*)-2-Chloro-3-methylpentane
_STEREO_CHLORO_METHYLPENTANE = re.compile(
    r"^\((\d+)([RS]{1,2})\*?['\u2032\u2033]?-Chloro-"
    r"\((\d+)([RS]{1,2})\*?['\u2032\u2033]?-methylpentane\)?$",
    re.I,
)

# Relative stereo: (2RS' → (2RS*  (not N,N' chemical primes)
_STEREO_QUOTE_BARE = re.compile(r"(\(\d+[RS]{1,2})(['\u2032\u2033])(?![*\w])")


def normalize_label(label: str) -> str:
    """Replace PDF mojibake and repair known broken stereo-name patterns."""
    if not label:
        return label
    s = _WS.sub(" ", label.translate(_TRANSLATE).strip())

    m = _STEREO_CHLORO_METHYLPENTANE.match(s)
    if m:
        n1, st1, n2, st2 = m.group(1), m.group(2).upper(), m.group(3), m.group(4).upper()
        return f"({n1}{st1}*,{n2}{st2}*)-2-Chloro-3-methylpentane"

    # Relative stereo: (2RS' → (2RS*  (not N,N' chemical primes)
    return _STEREO_QUOTE_BARE.sub(r"\1*", s)
