"""
chemicals_tables.raw_value — Source row kept verbatim because it cannot become an equation.

Used for the Perry 2-151 rows without Tmin/Tmax (monatomic gases, Cp = 4.97 cal/(mol K)).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from chemicals_tables.source_link import SourceLink
from references import RefKey


@dataclass
class RawValue:
    """Verbatim coefficients of one source row, with the property and phase they describe."""

    property: str
    phase: str
    ref: RefKey
    values: dict[str, Any]
    source: SourceLink

    def to_dict(self) -> dict:
        return {
            "property": self.property,
            "phase": self.phase,
            "values": self.values,
            **self.source.extra_fields(),
            "ref": self.source.to_ref(),
        }
