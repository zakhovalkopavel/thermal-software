"""
pubchem.cas_number — Is a text a CAS registry number (format and check digit)?

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import re

_CAS = re.compile(r"^(\d{2,7})-(\d{2})-(\d)$")


def is_cas(text: str) -> bool:
    """``7647-14-5`` → True; a wrong check digit → False."""
    match = _CAS.match(text)
    if not match:
        return False
    digits = (match.group(1) + match.group(2))[::-1]
    return sum((i + 1) * int(d) for i, d in enumerate(digits)) % 10 == int(match.group(3))
