"""
compound_data.compound_units — Content of ``units.json``: the unit of every value in the dataset.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from typing import Any

from chemicals_tables.constants.coefficient_tables import COEFFICIENT_TABLES
from chemicals_tables.constants.source_tables import SOURCE_TABLES
from compound_data.constants.units import EQUATION_UNITS, MOLAR_MASS_UNIT, TEMPERATURE_UNIT


def property_units() -> dict[str, str]:
    """Scalar property → SI unit, from the table columns; raises if two columns disagree."""
    units: dict[str, str] = {}
    columns = [c for t in SOURCE_TABLES.values() for c in t.columns.values()]
    columns += [c for spec in COEFFICIENT_TABLES for c in spec.scalars.values()]
    for column in columns:
        known = units.setdefault(column.property, column.unit)
        if known != column.unit:
            raise ValueError(f"{column.property}: units {known} and {column.unit}")
    return dict(sorted(units.items()))


def compound_units() -> dict[str, Any]:
    return {
        "$comment": "Units of shared/processed/compound-data (SI). Raw rows keep their source unit in values.unit.",
        "Mr": MOLAR_MASS_UNIT,
        "temperature": TEMPERATURE_UNIT,
        "properties": property_units(),
        "equations": EQUATION_UNITS,
    }
