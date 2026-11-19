"""
compound_data.constants.viscosity_gases_source — Huber 2019 CRC dilute-gas viscosity table.

Recommended μ(T) at 100–600 K (Pa·s). Null source cells are omitted. Joined as ``raw`` viscosity /
gas rows (no closed-form equation type yet). File key ``huber2019Viscosity``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [51] Huber2019
"""
from __future__ import annotations

from chemicals_tables.table_spec import TableSpec
from references import RefKey

VISCOSITY_GASES_FILE = "shared/sources/viscosity-gases-huber-2019.json"

VISCOSITY_GASES_TABLES: dict[str, TableSpec] = {
    "huber2019Viscosity": TableSpec(
        "Huber — Viscosity of Gases (CRC Handbook, 2019)",
        "huber2019Viscosity",
        VISCOSITY_GASES_FILE,
        RefKey.Huber2019,
    ),
}
"""Table id in the file (= file key) → spec."""
