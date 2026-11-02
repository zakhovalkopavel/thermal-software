"""
compound_data.constants.nbs_source — The corrected NBS thermodynamic tables the build reads.

Wagman et al., J. Phys. Chem. Ref. Data 11, Suppl. 2 (1982), with the 1989 erratum. The CSV is the
NIST digitization (mds2-2124). It is not the Hilsenrath gas-transport tables (``NBS1955``).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [47] NBS1982
"""
from __future__ import annotations

from pathlib import Path

from chemicals_tables.table_spec import TableSpec
from references import RefKey

NBS_FILE = Path("shared/sources/NBS/NBS_Tables_with_ErratumValues.csv")

# kJ/mol → J/mol. S° and Cp are already J/(mol·K).
NBS_KJ = 1000.0

NBS_PROPERTIES: tuple[tuple[int, str, float], ...] = (
    (7, "enthalpyFormation298", NBS_KJ),
    (8, "gibbsEnergy298", NBS_KJ),
    (10, "entropy298", 1.0),
    (11, "heatCapacity298", 1.0),
)
"""CSV column, property name, scale. ΔfH°(0 K) and H°(298.15)−H°(0) have no property."""


def nbs_table(path: Path) -> TableSpec:
    """File key ``nbsTables`` for the ``ref`` tuple and ``sources.json``."""
    return TableSpec("NBS tables", "nbsTables", path.as_posix(), RefKey.NBS1982)
