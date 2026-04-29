"""
nasa_thermo — NASA thermodynamic database parser package.

Provides importable parsers and models for converting NASA-7 (SP-273/1971)
and NASA-9 (RP-1311/1996, Burcat ANL-05/20) text databases into structured
Python objects and JSON output.

Sub-modules
-----------
  nasa_thermo.nasa7_coeffs   — Nasa7Coeffs dataclass
  nasa_thermo.nasa7_equation — Nasa7Equation dataclass
  nasa_thermo.nasa7_species  — Nasa7Species dataclass
  nasa_thermo.nasa9_coeffs   — Nasa9Coeffs dataclass
  nasa_thermo.nasa9_range    — Nasa9Range dataclass
  nasa_thermo.nasa9_equation — Nasa9Equation dataclass
  nasa_thermo.nasa9_species  — Nasa9Species dataclass
  nasa_thermo.utils          — Number-parsing helpers (E / D notation)
  nasa_thermo.parsers.nasa7  — NASA-7 parser
  nasa_thermo.parsers.nasa9  — NASA-9 parser (origin + Burcat new format)
  nasa_thermo.writers        — JSON serialisation helpers

Spec
----
  docs/scripts/NASA_THERMO_PARSER_SPEC.md

Refs
----
  docs/REFERENCES.md  [8] NASA7, [9] Burcat2005, [23] NASA9
"""

from nasa_thermo.nasa7_coeffs   import Nasa7Coeffs
from nasa_thermo.nasa7_equation import Nasa7Equation
from nasa_thermo.nasa7_species  import Nasa7Species
from nasa_thermo.nasa9_coeffs   import Nasa9Coeffs
from nasa_thermo.nasa9_range    import Nasa9Range
from nasa_thermo.nasa9_equation import Nasa9Equation
from nasa_thermo.nasa9_species  import Nasa9Species
from nasa_thermo.parsers.nasa7  import parse_nasa7
from nasa_thermo.parsers.nasa9  import parse_nasa9

__all__ = [
    "Nasa7Coeffs",
    "Nasa7Equation",
    "Nasa7Species",
    "Nasa9Coeffs",
    "Nasa9Range",
    "Nasa9Equation",
    "Nasa9Species",
    "parse_nasa7",
    "parse_nasa9",
]

