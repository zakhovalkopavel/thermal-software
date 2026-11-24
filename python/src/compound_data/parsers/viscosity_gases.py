"""
compound_data.parsers.viscosity_gases — ``shared/sources/viscosity-gases-huber-2019.json`` → raw rows.

Each row is a dilute-gas viscosity table (μ vs T, Pa·s) stored as ``RawValue`` under property
``viscosity`` / phase ``gas``. Null source cells are already omitted from the file. Air has no
compound-data record and is not in the source file.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [51] Huber2019
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from decimal import Decimal
from pathlib import Path
from typing import Any, Optional

from chemical_formula.formula_elements import formula_elements
from chemicals_tables.raw_value import RawValue
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_entry import SourceEntry
from chemicals_tables.source_link import SourceLink
from chemicals_tables.table_spec import TableSpec
from compound_data.constants.viscosity_gas_priority import viscosity_gas_defaults
from compound_data.constants.viscosity_gases_source import VISCOSITY_GASES_TABLES


@dataclass
class ViscosityGases:
    """Parsed raw viscosity entries, report issues and the tables that were read."""

    entries: list[SourceEntry] = field(default_factory=list)
    issues: list[dict[str, Any]] = field(default_factory=list)
    tables: list[TableSpec] = field(default_factory=list)


def parse_viscosity_gases(path: Path) -> ViscosityGases:
    """Read the Huber 2019 viscosity-of-gases table."""
    data = json.loads(path.read_text(encoding="utf-8"))
    out = ViscosityGases()
    for table in data.get("tables", []):
        table_id = table.get("id")
        spec = VISCOSITY_GASES_TABLES.get(table_id)
        if spec is None:
            out.issues.append(report_issue(
                "viscosityGasesUnknownTable", table_id, None, None, table.get("title"),
            ))
            continue
        out.tables.append(spec)
        pressure = table.get("pressure_Pa")
        unit = table.get("unit") or "Pa s"
        for row in table.get("rows", []):
            entry = _row(spec, row, pressure, unit)
            if entry is None:
                out.issues.append(report_issue(
                    "viscosityGasesRowSkipped", spec.name, row.get("line"), row.get("cas"),
                    row.get("name") or row.get("formula"),
                ))
                continue
            out.entries.append(entry)
    return out


def _row(
    spec: TableSpec, row: dict[str, Any], pressure_Pa: Optional[float], unit: str,
) -> Optional[SourceEntry]:
    cas = row.get("cas")
    formula = _formula(row.get("formula"))
    points = row.get("points")
    if not cas or not formula or not isinstance(points, list) or not points:
        return None
    cleaned: list[dict[str, float | int]] = []
    for point in points:
        if not isinstance(point, dict):
            return None
        T, mu = point.get("T"), point.get("mu")
        if T is None or mu is None:
            continue
        # Huber table prints 1 decimal in μPa·s; keep T as int when whole.
        t = float(T)
        u_pa = round(Decimal(str(mu)) * Decimal(10) ** 6, 1)
        cleaned.append({
            "T": int(t) if t == int(t) else t,
            "mu": float(u_pa / Decimal(10) ** 6),
        })
    if not cleaned:
        return None
    cleaned.sort(key=lambda p: p["T"])
    label = row.get("name") or formula
    values: dict[str, Any] = {
        "points": cleaned,
        "unit": unit,
        "p0": bool(row.get("p0")),
        "moreAccurate": bool(row.get("moreAccurate")),
    }
    if pressure_Pa is not None:
        values["pressure_Pa"] = pressure_Pa
    source_refs = row.get("sourceRefs")
    if isinstance(source_refs, list) and source_refs:
        values["sourceRefs"] = [int(n) for n in source_refs]
    # Optional row-level precision (tests / hand edits); else from viscosity-gas-defaults.json.
    if isinstance(row.get("bestEquation"), dict) and row.get("mape_pct") is not None:
        values["bestEquation"] = {
            "ref": row["bestEquation"].get("ref"),
            "type": row["bestEquation"].get("type"),
        }
        values["mape_pct"] = round(float(row["mape_pct"]), 2)
        if row.get("max_abs_pct") is not None:
            values["max_abs_pct"] = round(float(row["max_abs_pct"]), 2)
        if row.get("nCompared") is not None:
            values["nCompared"] = int(row["nCompared"])
    else:
        pref = viscosity_gas_defaults().get(cas)
        if pref is not None:
            values.update(pref.precision_fields())
    link = SourceLink(
        table=spec.name, key=spec.key, url="", ref=spec.ref, line=row.get("line"), label=label,
    )
    return SourceEntry(
        cas=cas, formula=formula, label=label, property="viscosity", phase="gas",
        value=RawValue("viscosity", "gas", spec.ref, values, link),
    )


def _formula(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    try:
        formula_elements(text)
    except ValueError:
        return None
    return text
