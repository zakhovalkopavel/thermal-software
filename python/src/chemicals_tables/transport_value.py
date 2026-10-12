"""
chemicals_tables.transport_value — How one source row obtained a transport property of a pure species.

Used for the Svehla 1995 Table I rows (``shared/sources/transport-parameters.json``): the methods
(potential with its parameters, modified Eucken, experimental fits, Prandtl extrapolation, ...) with
their temperature limits, and the temperature where low- and high-temperature data were joined.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

from chemicals_tables.source_link import SourceLink
from references import RefKey


@dataclass
class TransportValue:
    """Methods of one row, in SI units (σ in m), with ``ref`` like every other value."""

    ref: RefKey
    methods: list[dict[str, Any]]
    source: SourceLink
    match_temperature: Optional[float] = None

    def to_dict(self) -> dict:
        out: dict[str, Any] = {"methods": self.methods}
        if self.match_temperature is not None:
            out["matchTemperatureK"] = self.match_temperature
        out.update(self.source.extra_fields())
        out["ref"] = self.source.to_ref()
        return out
