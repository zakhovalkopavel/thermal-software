"""
compound_data.constants.viscosity_gas_priority — Gas-viscosity equation order and per-CAS defaults.

Overall order is the MAPE ranking of each source against the Huber 2019 dilute-gas table
(``shared/sources/viscosity-gases-huber-2019.json``). Per-CAS defaults pick the single equation
(type + ref) with the lowest MAPE for that compound; see ``shared/sources/viscosity-gas-defaults.json``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [51] Huber2019, [34] Perry8, [6] Yaws1999, [41] VDI2010, [20] White3
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Optional

from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.equation_value import EquationValue
from references import RefKey

VISCOSITY_GAS_DEFAULTS_FILE = "shared/sources/viscosity-gas-defaults.json"

# Lower is preferred. Ranked by overall MAPE vs Huber2019 (Perry 1.0 %, Yaws 1.6 %, VDI 1.7 %, White 3.3 %).
VISCOSITY_GAS_SOURCE_PRIORITY: tuple[RefKey, ...] = (
    RefKey.Perry8,
    RefKey.Yaws1999,
    RefKey.VDI2010,
    RefKey.White3,
)

# Within one source that has several types (White3), prefer the lower overall MAPE type.
VISCOSITY_GAS_TYPE_PRIORITY: dict[str, int] = {
    EquationType.dipprN102.value: 0,
    EquationType.quadratic.value: 1,
    EquationType.quartic.value: 2,
    EquationType.sutherland.value: 3,
    EquationType.powerLaw.value: 4,
}


@dataclass(frozen=True)
class ViscosityGasDefault:
    """Preferred gas-viscosity equation for one CAS, with Huber2019 precision scores."""

    cas: str
    ref: RefKey
    type: str
    formula: Optional[str] = None
    compound_id: Optional[str] = None
    mape_pct: Optional[float] = None
    max_abs_pct: Optional[float] = None
    n_compared: Optional[int] = None

    def precision_fields(self) -> dict:
        """Fields stored on the Huber2019 ``raw`` viscosity values (pct rounded to 2 decimals)."""
        out: dict = {
            "bestEquation": {"ref": self.ref.value, "type": self.type},
        }
        if self.mape_pct is not None:
            out["mape_pct"] = round(float(self.mape_pct), 2)
        if self.max_abs_pct is not None:
            out["max_abs_pct"] = round(float(self.max_abs_pct), 2)
        if self.n_compared is not None:
            out["nCompared"] = int(self.n_compared)
        return out


def viscosity_gas_rank(value: EquationValue) -> tuple[int, int]:
    """Sort key for ``equations.viscosity.gas``: source MAPE order, then type order."""
    try:
        ref_i = VISCOSITY_GAS_SOURCE_PRIORITY.index(value.ref)
    except ValueError:
        ref_i = 100 + _fallback_ref_rank(value.ref)
    type_i = VISCOSITY_GAS_TYPE_PRIORITY.get(value.type.value, 50)
    return (ref_i, type_i)


def _fallback_ref_rank(ref: RefKey) -> int:
    from compound_data.constants.source_priority import SOURCE_PRIORITY
    try:
        return SOURCE_PRIORITY.index(ref)
    except ValueError:
        return 50


@lru_cache(maxsize=1)
def viscosity_gas_defaults(path: Optional[Path] = None) -> dict[str, ViscosityGasDefault]:
    """CAS → preferred equation, loaded from ``viscosity-gas-defaults.json``."""
    file = path or Path(VISCOSITY_GAS_DEFAULTS_FILE)
    if not file.is_file():
        # Inside the python container the workspace root is /app.
        alt = Path("/app") / VISCOSITY_GAS_DEFAULTS_FILE
        file = alt if alt.is_file() else file
    if not file.is_file():
        return {}
    data = json.loads(file.read_text(encoding="utf-8"))
    out: dict[str, ViscosityGasDefault] = {}
    for row in data.get("defaults", []):
        cas = row.get("cas")
        ref_key = row.get("ref")
        type_ = row.get("type")
        if not cas or not ref_key or not type_:
            continue
        try:
            ref = RefKey(ref_key)
        except ValueError:
            continue
        mape = row.get("mape_pct")
        max_abs = row.get("max_abs_pct")
        out[cas] = ViscosityGasDefault(
            cas=cas, ref=ref, type=type_,
            formula=row.get("formula"), compound_id=row.get("compoundId"),
            mape_pct=None if mape is None else round(float(mape), 2),
            max_abs_pct=None if max_abs is None else round(float(max_abs), 2),
            n_compared=row.get("nCompared"),
        )
    return out


def preferred_viscosity_gas_index(values: list[EquationValue], cas: Optional[str]) -> Optional[int]:
    """Index of the per-CAS preferred equation, or ``None`` to keep the list-head default."""
    if not cas:
        return None
    pref = viscosity_gas_defaults().get(cas)
    if pref is None:
        return None
    for i, value in enumerate(values):
        if value.ref == pref.ref and value.type.value == pref.type:
            return i
    return None
