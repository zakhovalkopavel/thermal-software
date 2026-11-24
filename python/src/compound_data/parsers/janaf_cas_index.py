"""
compound_data.parsers.janaf_cas_index — CAS numbers of the JANAF tables (chemicals ``janaf_tables_index.csv``).

The file has no table id; ``CAS Number,Formula,Name,State`` rows match a table by
(Hill formula, state, name), e.g. ``1344-28-1,Al2O3,"Aluminum Oxide, Alpha",cr`` → ``Al-096``.
The CSV formulas are mostly but not always in Hill order (``H14B10``), so they are normalised.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

import csv
import re
from pathlib import Path

from chemical_formula.formula_elements import ISOTOPES, formula_elements
from chemical_formula.hill_formula import hill_formula
from chemicals_tables.parsers.cas import parse_cas

_CHARGE = re.compile(r"[+-]\d*$")
_SYMBOL = re.compile(r"[A-Z][a-z]?")


def read_janaf_cas_index(path: Path) -> dict[tuple[str, str, str], tuple[str, int]]:
    """(Hill formula, state, name) → (CAS, line).

    Rows without a valid CAS, ions and deuterium species (never matched) are left out.
    """
    out: dict[tuple[str, str, str], tuple[str, int]] = {}
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            cas = parse_cas(row["CAS Number"])
            formula = row["Formula"].strip()
            if not cas or _CHARGE.search(formula) or any(s in ISOTOPES for s in _SYMBOL.findall(formula)):
                continue
            try:
                formula = hill_formula(formula_elements(formula))
            except ValueError:
                pass
            out.setdefault((formula, row["State"].strip(), row["Name"].strip()), (cas, reader.line_num))
    return out
