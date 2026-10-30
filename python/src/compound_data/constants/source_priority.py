"""
compound_data.constants.source_priority — Which source wins when a property has several values.

Equations keep ``SOURCE_PRIORITY`` (Perry, then Poling, then VDI, then CRC). The first value whose
type the backend implements becomes ``def``.

Scalar properties use ``property_rank``: NIST-JANAF, then the NIST WebBook, then a PubChem
experimental value (``pubchem`` + catalog number), then the other sources in ``SOURCE_PRIORITY``,
and ``Physical Constants of Inorganic Compounds.csv`` last. NASA polynomial temperature bounds are
not property values.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [36] NISTJANAF, [32] NISTWebBook, [34] Perry8, [7] Poling5, [41] VDI2010,
      [37] CRC95, [40] TRC1994, [39] Zabransky1996
"""
from __future__ import annotations

from typing import Any

from chemicals_tables.constants.source_tables import SOURCE_TABLES
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

_CRC_CONSTANTS_KEY = next(
    spec.key for spec in SOURCE_TABLES.values()
    if spec.path.endswith("Physical Constants of Inorganic Compounds.csv")
)


def property_rank(value: Any) -> int:
    """Lower is preferred. See the module docstring."""
    ref_text = value.source.to_ref()
    if isinstance(ref_text, str) and ref_text.startswith("pubchem") and ref_text[7:].isdigit():
        return 2
    if value.source.key == _CRC_CONSTANTS_KEY:
        return 100
    if value.ref == RefKey.NISTJANAF:
        return 0
    if value.ref == RefKey.NISTWebBook:
        return 1
    try:
        return 10 + SOURCE_PRIORITY.index(value.ref)
    except ValueError:
        return 50
