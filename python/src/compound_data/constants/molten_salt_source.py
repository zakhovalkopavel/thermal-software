"""
compound_data.constants.molten_salt_source — Pure-salt rows of the NIST molten-salts extract.

Former SRD 27, not maintained since 1991. Density, surface tension and viscosity of a single salt
(composition 100, name with no hyphen) become liquid equations on a compound record. A mixture
(a hyphenated name, no CAS) is written to its own dataset, including electrical conductivity.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [48] NISTMoltenSalts
"""
from __future__ import annotations

from pathlib import Path

from chemicals_tables.table_spec import TableSpec
from references import RefKey

MOLTEN_SALT_DIR = Path("shared/sources/NIST-molten-salts")

# The database writes +E and E1 with this gas constant, not the CODATA value.
MOLTEN_SALT_R = 8.31441

# (file name, property, file key, table name, scale onto the record unit)
MOLTEN_SALT_FILES: tuple[tuple[str, str, str, str, float], ...] = (
    ("density-csv.csv", "density", "moltenSaltDensity", "Molten salt density", 1000.0),
    ("s-tension-csv.csv", "surfaceTension", "moltenSaltSurfaceTension", "Molten salt surface tension", 0.001),
    ("viscosity-csv.txt", "viscosity", "moltenSaltViscosity", "Molten salt viscosity", 0.001),
)
"""g/cm³ → kg/m³, mN/m → N/m, mN·s/m² → Pa·s. The scale is the equation ``k``."""

# Conductivity is Ω⁻¹·cm⁻¹. It has no compound property, so only a mixture stores it, as S/m.
MOLTEN_SALT_CONDUCTIVITY = (
    "conductivity-csv.txt", "electricalConductivity", "moltenSaltConductivity",
    "Molten salt electrical conductivity", 100.0,
)


def molten_salt_table(directory: Path, file_name: str, table_name: str, key: str) -> TableSpec:
    """File key for the ``ref`` tuple and ``sources.json``."""
    return TableSpec(table_name, key, (directory / file_name).as_posix(), RefKey.NISTMoltenSalts)
