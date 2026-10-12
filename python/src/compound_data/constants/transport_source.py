"""
compound_data.constants.transport_source — Tables of ``shared/sources/transport-parameters.json``.

The file is a hand transcription of White (Viscous Fluid Flow), NASA TN D-481, Mamedov & Somuncu 2014
and Svehla 1995 (NASA TM-4647), with the printed units. Each table gets its own file key, so the ref
tuple ``[RefKey, line, fileKey]`` keeps one RefKey per key; the line is the row's first line in the file.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [20] White3, [43] Svehla1962, [44] Itean1961, [45] Svehla1995, [46] Mamedov2014
"""
from __future__ import annotations

from chemicals_tables.property_column import PropertyColumn
from chemicals_tables.table_spec import TableSpec
from references import RefKey

TRANSPORT_FILE = "shared/sources/transport-parameters.json"

ANGSTROM = 1e-10
"""[m] per Å."""
DEBYE = 3.33564e-30
"""[C m] per debye."""

TRANSPORT_TABLES: dict[str, TableSpec] = {
    "white-table-1-2": TableSpec("White Table 1-2", "white12", TRANSPORT_FILE, RefKey.White3),
    "white-table-1-3": TableSpec("White Table 1-3", "white13", TRANSPORT_FILE, RefKey.White3),
    "white-table-a-6": TableSpec("White Table A-6", "whiteA6", TRANSPORT_FILE, RefKey.White3),
    "white-table-a-7": TableSpec("White Table A-7", "whiteA7", TRANSPORT_FILE, RefKey.White3),
    "itean1961-table-3": TableSpec("TN D-481 Table III", "itean1961T3", TRANSPORT_FILE, RefKey.Itean1961),
    "mamedov2014-table-1": TableSpec("Mamedov 2014 Table 1", "mamedov2014T1", TRANSPORT_FILE, RefKey.Mamedov2014),
    "svehla1995-table-1": TableSpec("Svehla 1995 Table I", "svehla1995T1", TRANSPORT_FILE, RefKey.Svehla1995),
}
"""Table id in the file → spec (file key, ref)."""

ORIGINAL_REFS: dict[str, RefKey] = {
    "white-table-1-2": RefKey.NBS1955,
    "white-table-a-7": RefKey.Svehla1962,
}
"""Tables that White took from a registered reference; written as ``originalRef``."""

TRANSPORT_COLUMNS: dict[str, PropertyColumn] = {
    "collisionDiameter": PropertyColumn("collisionDiameter", "m", scale=ANGSTROM),
    "epsilonToKb": PropertyColumn("epsilonToKb", "K"),
    "stockmayerDelta": PropertyColumn("stockmayerDelta", "1"),
    "dipoleMoment": PropertyColumn("dipoleMoment", "C m", scale=DEBYE),
    "rhoStar": PropertyColumn("rhoStar", "1"),
    "V0Star": PropertyColumn("V0Star", "1"),
}
"""Scalar properties written from the potential parameters (source unit × scale = SI)."""

SVEHLA_PROPERTIES = {"viscosity": "viscosity", "conductivity": "thermalConductivity"}
"""Svehla 1995 property → dataset property of the ``transport`` block; diffusion rows are pairs."""

POTENTIALS = ("lennardJones", "stockmayer", "correspondingStates")
"""Svehla 1995 methods whose σ and ε/k become ``collisionDiameter`` / ``epsilonToKb`` values."""
