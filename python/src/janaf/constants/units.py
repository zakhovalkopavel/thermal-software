"""
janaf.constants.units — Units of the JANAF row columns (content of ``units.json``).

Spec: docs/scripts/JANAF_PARSER_SPEC.md
Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

JANAF_UNITS: dict[str, str] = {
    "T": "K",
    "Cp": "J/(mol K)",
    "S": "J/(mol K)",
    "gef": "J/(mol K)",
    "dH": "kJ/mol",
    "dfH": "kJ/mol",
    "dfG": "kJ/mol",
    "logKf": "1",
}
