"""
phase_diagrams.nbs.nbs_text_normalizer — Fix recurrent OCR noise of the NSRDS-NBS 61 text layer.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Text index
"""
from __future__ import annotations

import re


class NbsTextNormalizer:
    """Normalizes system names, numbers and uncertainties of Table I lines.

    Oxide names are recognised by patterns tolerant to the OCR confusions seen
    in the text layer (``,`` / ``.`` / ``'`` / ``J`` for subscripts, ``0`` for
    ``O``, ``I`` / ``J`` for ``l``). Other components are returned with spaces
    removed.
    """

    OXIDE_PATTERNS: tuple[tuple[str, re.Pattern], ...] = (
        ("Al2O3", re.compile(r"^A[lIJ1][,.2]?[O0][,.3J'sS]?$")),
        ("SiO2", re.compile(r"^S[i1l][O0][,.2]?$")),
        ("MgO", re.compile(r"^(Mg|Ylg|M9)[O0o]+$")),
        ("CaO", re.compile(r"^Ca[O0]$")),
        ("K2O", re.compile(r"^K[,.2]?[O0]$")),
        ("Na2O", re.compile(r"^Na[,.2]?[O0]$")),
    )

    @classmethod
    def component(cls, raw: str) -> str:
        token = re.sub(r"\s+", "", raw).strip("\"'`,.")
        for name, pattern in cls.OXIDE_PATTERNS:
            if pattern.match(token):
                return name
        return token

    @classmethod
    def system(cls, raw: str) -> list[str]:
        """Components of a system field, e.g. ``'Al,03-MgO'`` → ``['Al2O3', 'MgO']``."""
        return [cls.component(part) for part in raw.split("-") if part.strip()]

    @staticmethod
    def number(raw: str) -> float | None:
        """Parse a numeric token with OCR digit confusions (``%`` = 96, ``S`` = 5, ``O`` = 0, ``l``/``I`` = 1, ``,``/``;`` = decimal point)."""
        token = raw.strip().replace("%", "96")
        token = re.sub(r"(?<=\d)[,;](?=\d)", ".", token)
        token = token.translate(str.maketrans({"S": "5", "s": "5", "O": "0", "o": "0", "l": "1", "I": "1"}))
        token = token.rstrip("~.,'")
        if not re.fullmatch(r"\d+(\.\d+)?", token):
            return None
        return float(token)

    @staticmethod
    def reference(raw: str) -> str:
        """Reference number with OCR digit confusions fixed (``II43`` → ``1143``)."""
        return raw.replace("%", "96").translate(str.maketrans({"I": "1", "l": "1", "O": "0", "o": "0", "S": "5"}))

    @classmethod
    def uncertainty(cls, raw: str) -> float | None:
        """Uncertainty column: any leading ``±`` look-alike (``±``, ``~``, ``=``, ``:t``, ``:!:``, ``Z``) then a number."""
        match = re.match(r"^[^\dSO]*([\dSO][\dSO.]*)", raw.strip())
        if not match:
            return None
        value = cls.number(match.group(1))
        return value if value else None
