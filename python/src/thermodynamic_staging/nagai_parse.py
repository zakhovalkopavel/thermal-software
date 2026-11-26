"""Parse Nagai et al. (2009) ThermoML JSON into a calculable series dataset.

Refs:
  [69] Nagai2009
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def parse_nagai_thermoml(path: Path) -> dict[str, Any]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    compounds = []
    for c in raw.get("Compound") or []:
        compounds.append(
            {
                "formula": c.get("sFormulaMolec"),
                "names": c.get("sCommonName"),
            }
        )

    series: list[dict[str, Any]] = []
    props_meta: list[dict[str, Any]] = []
    for block in raw.get("PureOrMixtureData") or []:
        props = block.get("Property") or []
        if isinstance(props, dict):
            props = [props]
        for p in props:
            props_meta.append(
                {
                    "propName": p.get("ePropName") or p.get("Property-MethodName-PropertyGroup"),
                    "propNumber": p.get("nPropNumber"),
                    "units": p.get("PropUnitSIprefix") or p.get("nPropDigits"),
                }
            )
        for row in block.get("NumValues") or []:
            t_vals = []
            for v in row.get("VariableValue") or []:
                if isinstance(v, dict) and "nVarValue" in v:
                    t_vals.append(float(v["nVarValue"]))
            p_vals = []
            for v in row.get("PropertyValue") or []:
                if isinstance(v, dict) and "nPropValue" in v:
                    unc = None
                    cu = v.get("CombinedUncertainty") or {}
                    if isinstance(cu, dict):
                        unc = cu.get("nCombExpandUncertValue")
                    p_vals.append(
                        {
                            "value": float(v["nPropValue"]),
                            "uncertainty": float(unc) if unc is not None else None,
                            "propNumber": v.get("nPropNumber"),
                        }
                    )
            if t_vals and p_vals:
                series.append(
                    {
                        "T_K": t_vals[0],
                        "properties": p_vals,
                    }
                )

    formula = next((c.get("formula") for c in compounds if c.get("formula")), "Al2O3-B2O3")
    phase_id = str(formula).replace(" ", "")
    status = "ok" if series else "partial"
    return {
        "source": "Nagai2009",
        "doi": "10.1016/j.jct.2009.06.002",
        "convention": "experimental_series",
        "nPhases": 1 if series else 0,
        "nPoints": len(series),
        "phases": {
            phase_id: {
                "phaseId": phase_id,
                "formula": formula,
                "compounds": compounds,
                "propertyMeta": props_meta,
                "series": series,
                "nPoints": len(series),
                "convention": "experimental_series",
                "ref": "Nagai2009",
                "status": status,
            }
        },
        "ref": "Nagai2009",
        "note": (
            "Knudsen / vapor-pressure PureOrMixtureData from ThermoML; "
            "raw JSON stays in tmp."
        ),
    }
