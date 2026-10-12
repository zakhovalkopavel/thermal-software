"""
nasa_thermo.utils — Low-level number-parsing helpers for NASA thermo files.

NASA-7 uses standard E-notation; NASA-9 uses Fortran D-notation (D±nn). Both give the element
counts of a species in fixed-width slots (``parse_element_slots``).
"""
from __future__ import annotations


def parse_e(s: str) -> float:
    """Parse an E-notation float (NASA-7 format)."""
    return float(s.strip())


def parse_d(s: str) -> float:
    """Parse a D-notation float (NASA-9 Fortran format: 1.23D+04 → 1.23E+04)."""
    return float(s.strip().upper().replace("D", "E", 1))


def parse_element_slots(text: str, slots: int, width: int) -> dict[str, float]:
    """
    Element counts from fixed-width (symbol A2, count) slots, e.g. NASA-7 ``C  1.H  4.``
    (4 × 5 chars) or NASA-9 ``C   1.00H   4.00`` (5 × 8 chars).

    Symbols are title-cased (``AL`` → ``Al``, ``E`` stays the electron); empty and zero slots are skipped.
    """
    counts: dict[str, float] = {}
    for i in range(slots):
        slot = text[i * width:(i + 1) * width]
        symbol = slot[:2].strip()
        try:
            count = float(slot[2:].strip() or 0)
        except ValueError:
            continue
        if symbol and count:
            symbol = symbol[0].upper() + symbol[1:].lower()
            counts[symbol] = counts.get(symbol, 0.0) + count
    return counts


def slice_e15(line: str, n: int) -> list[float]:
    """
    Extract *n* consecutive E15.8 coefficients from *line* starting at column 0.

    Each coefficient occupies exactly 15 characters.
    """
    return [parse_e(line[i * 15:(i + 1) * 15]) for i in range(n)]

