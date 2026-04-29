"""
nasa_thermo.utils — Low-level number-parsing helpers for NASA thermo files.

NASA-7 uses standard E-notation; NASA-9 uses Fortran D-notation (D±nn).
"""
from __future__ import annotations


def parse_e(s: str) -> float:
    """Parse an E-notation float (NASA-7 format)."""
    return float(s.strip())


def parse_d(s: str) -> float:
    """Parse a D-notation float (NASA-9 Fortran format: 1.23D+04 → 1.23E+04)."""
    return float(s.strip().upper().replace("D", "E", 1))


def slice_e15(line: str, n: int) -> list[float]:
    """
    Extract *n* consecutive E15.8 coefficients from *line* starting at column 0.

    Each coefficient occupies exactly 15 characters.
    """
    return [parse_e(line[i * 15:(i + 1) * 15]) for i in range(n)]

