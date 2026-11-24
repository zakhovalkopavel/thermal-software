"""
phase_diagrams.models.melting_candidate — One melting point of an oxide in shared/processed/compound-data.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class MeltingCandidate:
    """``meltingPoint`` of one compound-data entry (CAS), converted to °C.

    ``ref``, ``line`` and ``table`` are the compound-data reference
    (``["CRC95", 282, "crcConstants"]``); ``file`` is relative to compound-data.
    """

    formula: str
    temperature_C: float
    kelvin: float
    variant: str | None
    name: str
    cas: str
    ref: str
    line: int
    table: str
    file: str

    def label(self) -> str:
        variant = f" {self.variant}" if self.variant else ""
        return f"{self.formula}{variant} {self.temperature_C:g} °C ({self.ref}, {self.name}, CAS {self.cas})"

    def source(self) -> dict:
        variant = f" ({self.variant})" if self.variant else ""
        return {"ref": self.ref, "table": self.table, "line": self.line,
                "read": f"meltingPoint {self.kelvin:g} K{variant}; compound-data {self.file}, entry {self.cas}"}
