"""
compound_data.constants.source_priority — Order of equation values per property and phase.

Perry, then Poling, then VDI, then CRC; other sources follow in this order. The first value whose
type the backend implements becomes ``def``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [34] Perry8, [7] Poling5, [41] VDI2010, [37] CRC95, [40] TRC1994,
      [32] NISTWebBook, [39] Zabransky1996
"""
from __future__ import annotations

from references import RefKey

SOURCE_PRIORITY: tuple[RefKey, ...] = (
    RefKey.Perry8,
    RefKey.Poling5,
    RefKey.VDI2010,
    RefKey.CRC95,
    RefKey.TRC1994,
    RefKey.NISTWebBook,
    RefKey.Zabransky1996,
)
