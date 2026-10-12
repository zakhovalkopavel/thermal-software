"""
chemicals_tables.coefficient_spec — How the rows of one coefficient table become equations.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.property_column import PropertyColumn


@dataclass(frozen=True)
class CoefficientSpec:
    """Equation type, property, phase and the mapping of vars to source columns.

    ``table`` is a key of ``SOURCE_TABLES``. ``scalars`` are extra columns stored as
    properties (Poling ``Cpg``/``Cpl``, TRC ``Hfg``). ``tc_from`` names a table whose ``Tc``
    column supplies ``vars.Tc`` when the coefficient table has none (DIPPR 114).
    """

    table: str
    type: EquationType
    property: str
    phase: str
    vars: dict[str, str]
    k: Optional[float] = None
    tmin_column: str = "Tmin"
    tmax_column: str = "Tmax"
    scalars: dict[str, PropertyColumn] = field(default_factory=dict)
    tc_from: Optional[str] = None
