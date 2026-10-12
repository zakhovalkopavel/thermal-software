"""
chemicals_tables.property_column — How one source column becomes a scalar property.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class PropertyColumn:
    """Property name, SI unit, optional phase and scale factor (source value × scale = SI value)."""

    property: str
    unit: str
    phase: Optional[str] = None
    scale: float = 1.0
