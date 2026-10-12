"""
chemicals_tables.equation_value — Coefficient row in the backend ``EquationValue`` shape.

Mirrors backend/src/common/thermal/interfaces/equation-value.interface.ts
``{type, ref, vars, min, max, k?}``, except that ``ref`` is the tuple ``[RefKey, line, fileKey]``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.source_link import SourceLink
from references import RefKey


@dataclass
class EquationValue:
    """One equation, ready for ``Common.equation(type).calculate(T, vars, min, max, k)``.

    ``min``/``max`` are ``None`` when the source gives no range (VDI gas properties).
    """

    type: EquationType
    ref: RefKey
    vars: dict[str, Any]
    min: Optional[float]
    max: Optional[float]
    source: SourceLink
    k: Optional[float] = None
    raw: Optional[dict[str, Any]] = None

    def to_dict(self) -> dict:
        out: dict[str, Any] = {
            "type": self.type.value,
            "ref": self.source.to_ref(),
            "vars": self.vars,
            "min": self.min,
            "max": self.max,
        }
        if self.k is not None:
            out["k"] = self.k
        out.update(self.source.extra_fields())
        if self.raw is not None:
            out["raw"] = self.raw
        return out
