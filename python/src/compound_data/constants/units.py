"""
compound_data.constants.units — Units of the compound-data values not given by the table columns.

Scalar property units come from the ``PropertyColumn`` of each table (``compound_units``).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

MOLAR_MASS_UNIT = "kg/mol"
TEMPERATURE_UNIT = "K"

EQUATION_UNITS: dict[str, str] = {
    "heatCapacity": "J/(mol K)",
    "viscosity": "Pa s",
    "thermalConductivity": "W/(m K)",
    "density": "kg/m3",
    "enthalpyVaporization": "J/mol",
    "surfaceTension": "N/m",
    "vaporPressure": "Pa",
}
"""Result unit of each equation property (after ``k``); equations take T in ``TEMPERATURE_UNIT``."""
