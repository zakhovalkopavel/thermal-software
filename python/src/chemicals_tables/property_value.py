"""
chemicals_tables.property_value — One scalar property value from one source row.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from chemicals_tables.source_link import SourceLink
from references import RefKey


@dataclass
class PropertyValue:
    """Scalar value in SI units, e.g. a melting point or ΔfH° at 298.15 K.

    The unit is fixed per property name (backend ``CompoundDataProperties``), so it is not written.
    """

    value: float
    ref: Optional[RefKey]
    source: SourceLink
    phase: Optional[str] = None

    def to_dict(self) -> dict:
        out: dict = {"value": self.value}
        if self.phase is not None:
            out["phase"] = self.phase
        out.update(self.source.extra_fields())
        out["ref"] = self.source.to_ref()
        return out
