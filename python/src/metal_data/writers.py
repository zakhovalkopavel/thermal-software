"""Write synthesized alloy JSON, index, units, sources, and reports."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

from metal_data.classify import alloy_relpath
from metal_data.models import AlloyRecord

UNITS = {
    "temperature": "K",
    "thermalConductivity": "W/(m·K)",
    "specificHeat": "J/(kg·K)",
    "thermalExpansion": "1e-6/K",
    "electricalResistivity": "Ω·m",
    "density": "kg/m³",
    "elasticModulus": "GPa",
    "composition": "wt%",
}

SOURCES = {
    "asmHandbook2005Vol1": {
        "citation": (
            "ASM Handbook (2005), Volume 1: Properties and Selection: "
            "Irons, Steels, and High-Performance Alloys"
        ),
        "rawDir": "shared/sources/metal-data/raw-tables",
    },
    "abuEishah2001": {
        "citation": (
            "Abu-Eishah, S.I. — Correlations for the Thermal Conductivity of Metals "
            "as a Function of Temperature. Int. J. Thermophys. 22(6), 2001."
        ),
        "rawDir": "shared/sources/metal-data/raw-tables",
        "note": "Pure-metal correlations join compound-data, not alloy records.",
    },
}


def _dump(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def clear_alloys_dir(out_dir: Path) -> None:
    alloys = out_dir / "alloys"
    if alloys.exists():
        shutil.rmtree(alloys)
    alloys.mkdir(parents=True, exist_ok=True)


def record_to_json(rec: AlloyRecord) -> dict[str, Any]:
    props: dict[str, Any] = {}
    donors: dict[str, Any] = {}
    for name, series in sorted(rec.properties.items()):
        entry: dict[str, Any] = {
            "unit": series.unit or UNITS.get(name, ""),
            "sources": series.sources,
            "points": [
                {"T_K": round(p["T_K"], 6), "value": p["value"]}
                for p in series.points
            ],
        }
        if series.donor:
            donors[name] = series.donor
        if series.approximation:
            entry["approximation"] = series.approximation
        props[name] = entry

    out: dict[str, Any] = {
        "materialId": rec.material_id,
        "name": rec.name,
        "group": rec.group,
        "family": rec.family,
        "aliases": rec.aliases,
        "composition": rec.composition,
        "condition": rec.condition,
        "properties": props,
        "sourceFiles": sorted(rec.source_files),
    }
    if rec.critical_temperatures:
        out["criticalTemperatures"] = rec.critical_temperatures
    if donors:
        out["provenance"] = {"donors": donors}
    if rec.mechanical:
        out["mechanical"] = rec.mechanical
    return out


def write_dataset(
    out_dir: Path,
    registry: dict[str, AlloyRecord],
    *,
    donor_report: list[dict[str, Any]],
    approximation_report: list[dict[str, Any]],
    warnings: list[str],
    report_dir: Path,
) -> dict[str, Any]:
    clear_alloys_dir(out_dir)
    index: dict[str, Any] = {"materials": {}, "byGroup": {}, "byFamily": {}}

    for mid, rec in sorted(registry.items()):
        if not rec.family and rec.group == "steel":
            rec.family = "carbon"
        rel = alloy_relpath(rec.group, rec.family, rec.material_id)
        path = out_dir / rel
        payload = record_to_json(rec)
        _dump(path, payload)

        available = [
            p for p, s in rec.properties.items() if s.points or s.donor
        ]
        approximated = [
            p for p, s in rec.properties.items() if s.approximation
        ]
        meta = {
            "path": rel,
            "name": rec.name,
            "group": rec.group,
            "family": rec.family,
            "availableProperties": available,
            "approximatedProperties": approximated,
            "hasDonorFill": bool(payload.get("provenance")),
            "compositionElements": sorted(rec.composition.keys()),
        }
        index["materials"][mid] = meta
        index["byGroup"].setdefault(rec.group, []).append(mid)
        fam_key = f"{rec.group}/{rec.family or '_'}"
        index["byFamily"].setdefault(fam_key, []).append(mid)

    _dump(out_dir / "index.json", index)
    _dump(out_dir / "units.json", UNITS)
    _dump(out_dir / "sources.json", SOURCES)

    report_dir.mkdir(parents=True, exist_ok=True)
    summary = {
        "alloyCount": len(registry),
        "donorFills": len(donor_report),
        "approximations": len(approximation_report),
        "warnings": warnings,
        "byGroup": {g: len(v) for g, v in index["byGroup"].items()},
        "byFamily": {f: len(v) for f, v in index["byFamily"].items()},
    }
    _dump(report_dir / "report.json", summary)
    _dump(report_dir / "donor-fill.json", donor_report)
    _dump(report_dir / "approximations.json", approximation_report)
    return summary
