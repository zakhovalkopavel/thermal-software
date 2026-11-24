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
    "waterSolubility": "1",
}
"""Result unit of each equation property (after ``k``); equations take T in ``TEMPERATURE_UNIT``."""

# Scalars written by the Yaws1999 importer (not present in chemicals table columns).
YAWS1999_PROPERTY_UNITS: dict[str, str] = {
    "solubilityParameter": "Pa^0.5",
    "liquidMolarVolume": "m3/mol",
    "vdwArea": "m2/mol",
    "vdwVolume": "m3/mol",
    "waterSolubility": "1",
    "logKow": "1",
    "lowerExplosionLimit": "1",
    "upperExplosionLimit": "1",
    "flashPoint": "K",
    "autoignitionTemperature": "K",
    "enthalpyCombustion": "J/mol",
    "tlvAcgih": "kg/m3",
    "pelOsha": "kg/m3",
    "relNiosh": "kg/m3",
    "makDfg": "kg/m3",
    "tlvAcgihPpm": "1",
    "pelOshaPpm": "1",
    "relNioshPpm": "1",
    "makDfgPpm": "1",
}

TRANSPORT_UNITS: dict[str, str] = {
    "sigma": "m",
    "epsilonToKb": "K",
    "delta": "1",
    "alpha": "1",
    "rhoStar": "1",
    "V0Star": "1",
    "AStar": "1",
    "Z": "1",
    "TminK": "K",
    "TmaxK": "K",
    "prandtlCalculatedToK": "K",
    "ratioFixedAboveK": "K",
    "matchTemperatureK": "K",
    "electronPressureAtm": "atm",
}
"""Units of the numeric fields of ``transport`` methods (records) and ``interactions.json``."""
