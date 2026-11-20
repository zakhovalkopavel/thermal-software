"""Load raw metal-data tables into AlloyRecord objects."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable, Optional

from metal_data.classify import PURE_METAL_FILES, classify_file
from metal_data.composition import normalize_composition
from metal_data.ids import match_keys_from_row, material_id, normalize_sae, normalize_uns, slug
from metal_data.models import AlloyRecord
from metal_data.temperature import (
    celsius_to_kelvin,
    density_to_si,
    resistivity_to_si,
    values_map_to_series,
)


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _find_or_create(
    registry: dict[str, AlloyRecord],
    key_index: dict[str, str],
    *,
    group: str,
    family: Optional[str],
    row: dict[str, Any],
    default_name: str,
    id_kwargs: dict[str, Any],
) -> AlloyRecord:
    keys = match_keys_from_row(row)
    mid: Optional[str] = None
    for k in keys:
        if k in key_index:
            mid = key_index[k]
            break
    if mid is None:
        mid = material_id(**id_kwargs)
        # Avoid collisions
        base = mid
        n = 2
        while mid in registry and registry[mid].group != group:
            mid = f"{base}-{n}"
            n += 1
        if mid not in registry:
            registry[mid] = AlloyRecord(
                material_id=mid,
                name=default_name,
                group=group,
                family=family,
            )
    rec = registry[mid]
    if family and rec.family is None:
        rec.family = family
    for k in keys:
        key_index[k] = mid
        rec.match_keys.add(k)
    uns = normalize_uns(row.get("uns_number") or row.get("uns"))
    sae = normalize_sae(
        row.get("sae_isi_number")
        or row.get("aisi_sae_grade")
        or row.get("sae_designation")
        or row.get("sae_ps_number")
        or row.get("type")
    )
    if uns:
        rec.aliases["uns"] = uns
    if sae:
        rec.aliases.setdefault("sae", sae)
    trade = row.get("alloy") or row.get("designation_or_trade_name")
    if trade:
        rec.aliases.setdefault("trade", str(trade))
    return rec


def _comp_from_row(row: dict[str, Any]) -> dict[str, float]:
    for key in (
        "chemical_composition_percent",
        "nominal_composition",
        "composition",
        "chemical_composition",
    ):
        if key in row:
            return normalize_composition(row[key])
    return {}


def ingest_raw_tables(raw_dir: Path) -> tuple[dict[str, AlloyRecord], list[str]]:
    """Ingest all alloy raw tables. Returns (registry, warnings)."""
    registry: dict[str, AlloyRecord] = {}
    key_index: dict[str, str] = {}
    warnings: list[str] = []

    for path in sorted(raw_dir.glob("*.json")):
        if path.name in PURE_METAL_FILES:
            continue
        classified = classify_file(path.name)
        if classified is None:
            warnings.append(f"unclassified file skipped: {path.name}")
            continue
        group, family = classified
        try:
            data = _load_json(path)
        except json.JSONDecodeError as exc:
            warnings.append(f"invalid JSON {path.name}: {exc}")
            continue
        rows = _iter_rows(data)
        for row in rows:
            _ingest_row(
                registry,
                key_index,
                path.name,
                data,
                row,
                group=group,
                family=family,
                warnings=warnings,
            )
    return registry, warnings


def _iter_rows(data: dict[str, Any]) -> Iterable[dict[str, Any]]:
    if "data" in data and isinstance(data["data"], list):
        # high_mn_steel is a single alloy with T-series rows
        if "chemical_composition" in data and all(
            isinstance(r, dict) and "temperature" in r for r in data["data"]
        ):
            yield {
                "_series_table": True,
                "chemical_composition": data["chemical_composition"],
                "condition": data.get("condition"),
                "units": data.get("units", {}),
                "rows": data["data"],
                "name": "13% Mn steel",
                "alloy": "13Mn",
            }
            return
        yield from data["data"]
        return
    if "tables" in data:
        for table in data["tables"]:
            for row in table.get("data", []):
                enriched = dict(row)
                enriched["_table_title"] = table.get("table_title")
                enriched["_units"] = table.get("units", {})
                yield enriched


def _ingest_row(
    registry: dict[str, AlloyRecord],
    key_index: dict[str, str],
    filename: str,
    table: dict[str, Any],
    row: dict[str, Any],
    *,
    group: str,
    family: Optional[str],
    warnings: list[str],
) -> None:
    units = table.get("units") or row.get("_units") or {}

    if row.get("_series_table"):
        rec = _find_or_create(
            registry,
            key_index,
            group=group,
            family=family or "high-mn",
            row={"alloy": "13Mn", "type": "13Mn"},
            default_name=str(row.get("name") or "13% Mn steel"),
            id_kwargs={"trade": "13Mn", "prefix": "steel"},
        )
        rec.condition = row.get("condition") or rec.condition
        rec.merge_composition(normalize_composition(row.get("chemical_composition")))
        _ingest_high_mn_series(rec, row, filename, units)
        return

    name = (
        row.get("alloy")
        or row.get("designation_or_trade_name")
        or row.get("steel")
        or row.get("type")
        or row.get("sae_isi_number")
        or row.get("aisi_sae_grade")
        or row.get("sae_designation")
        or row.get("sae_ps_number")
        or "unknown"
    )
    name = str(name)
    fam = family
    if fam is None and group == "steel":
        fam = _infer_steel_family(name, filename)

    id_kwargs: dict[str, Any] = {
        "uns": row.get("uns_number") or row.get("uns"),
        "sae": (
            row.get("sae_isi_number")
            or row.get("aisi_sae_grade")
            or row.get("sae_designation")
            or row.get("sae_ps_number")
            or row.get("type")
        ),
        "trade": row.get("alloy") or row.get("designation_or_trade_name") or name,
    }
    rec = _find_or_create(
        registry,
        key_index,
        group=group,
        family=fam,
        row=row,
        default_name=name,
        id_kwargs=id_kwargs,
    )
    if row.get("treatment_or_condition") and not rec.condition:
        rec.condition = str(row["treatment_or_condition"])
    if row.get("condition") and not rec.condition:
        rec.condition = str(row["condition"])
    if row.get("form") and "form" not in rec.aliases:
        rec.aliases["form"] = row["form"]
    if row.get("group") and group == "superalloy":
        rec.aliases.setdefault("base", row["group"])

    rec.merge_composition(_comp_from_row(row))
    rec.source_files.add(filename)

    # Composition-only tables
    if "chemical_composition_percent" in row or (
        "nominal_composition" in row and "values" not in row and "thermal_conductivity" not in row
    ):
        # Still may have density etc.
        pass

    if "values" in row and isinstance(row["values"], dict):
        prop, range_mode, unit = _property_from_filename(filename, units)
        if prop:
            series = values_map_to_series(row["values"], range_mode=range_mode)
            if prop == "electricalResistivity":
                u = units.get("electrical_resistivity") or units.get("resistivity") or "µΩ·m"
                series = [
                    {**p, "value": resistivity_to_si(p["value"], u)}
                    for p in series
                ]
                unit = "Ω·m"
            rec.merge_series(prop, series, source=filename, unit=unit)

    # Stainless multi-property row
    if filename == "stainless_steel.json":
        _ingest_stainless(rec, row, filename, units)

    # Heat-resistant
    if filename == "heat_resistent_steel.json":
        _ingest_heat_resistant(rec, row, filename, units)

    # Superalloy physical props
    if filename == "superalloys.json":
        _ingest_superalloy_physical(rec, row, filename, units)

    # Tool steel expansion + density
    if filename == "tool_steel_thermal_expansion_and_density.json":
        _ingest_tool_expansion(rec, row, filename, units)

    # Stellite
    if filename == "stellite.json":
        _ingest_stellite(rec, row, filename, units)

    # ODS props
    if filename == "oxide_dispersion_strengthened_superalloys.json":
        _ingest_ods(rec, row, filename, units)

    # Density on composition ODS file
    if filename == "supperalloy_oxide_dispersion.json" and row.get("density") is not None:
        try:
            dens = density_to_si(float(row["density"]), "g/cm3")
            rec.merge_series(
                "density",
                [{"T_K": 298.15, "value": dens, "T_C": 25.0}],
                source=filename,
                unit="kg/m³",
            )
        except (TypeError, ValueError):
            pass

    # Mechanical tables — store under mechanical, not thermal properties
    if filename in {
        "superalloys2.json",
        "superalloy3.json",
        "1000h_strength.json",
        "superalloys_mechanical_properties.json",
        "rene_95_superalloy.json",
    }:
        rec.mechanical.setdefault(filename, row)


def _property_from_filename(filename: str, units: dict[str, Any]) -> tuple[Optional[str], str, str]:
    if filename == "thermal_conductivity.json" or filename == "tools_steel_thermal_conductivity.json":
        return "thermalConductivity", "mid", "W/(m·K)"
    if filename == "specific_heat.json":
        return "specificHeat", "mid", "J/(kg·K)"
    if filename == "steel_thermal_expansion.json":
        return "thermalExpansion", "high", "1e-6/K"
    if filename == "electrical_resistivity.json":
        return "electricalResistivity", "mid", "Ω·m"
    if filename == "superalloy3.json":
        return "elasticModulus", "mid", "GPa"
    return None, "mid", ""


def _infer_steel_family(name: str, filename: str) -> str:
    s = name.upper().replace(" ", "")
    if s.startswith(("W", "S", "O", "A", "D", "H", "T", "M", "P", "L")) and len(s) <= 4:
        if filename.startswith("tool"):
            return "tool"
    # SAE 1xxx carbon, 11xx/12xx free-cutting, 13xx+ low-alloy, etc.
    digits = "".join(ch for ch in s if ch.isdigit())
    if digits.startswith("1") and len(digits) == 4:
        if digits.startswith(("11", "12")):
            return "free-cutting"
        if digits.startswith("15"):
            return "high-mn"
        return "carbon"
    if digits.startswith(("13", "23", "25", "31", "40", "41", "43", "46", "47", "48", "50", "51", "52", "61", "86", "87", "92", "93", "94", "98")):
        return "low-alloy"
    if s in {"201", "202", "301", "302", "303", "304", "304L", "309", "310", "316", "316L", "321", "347", "410", "420", "430", "440", "446"} or s.startswith(("15-5", "17-4", "17-7", "13-8")):
        return "stainless"
    return "carbon"


def _ingest_high_mn_series(
    rec: AlloyRecord,
    row: dict[str, Any],
    filename: str,
    units: dict[str, Any],
) -> None:
    k_pts, cp_pts, cte_pts, rho_pts = [], [], [], []
    for r in row.get("rows", []):
        t_c = float(r["temperature"])
        t_k = celsius_to_kelvin(t_c)
        if r.get("thermal_conductivity") is not None:
            k_pts.append({"T_K": t_k, "T_C": t_c, "value": float(r["thermal_conductivity"])})
        if r.get("mean_apparent_specific_heat") is not None:
            cp_pts.append({"T_K": t_k, "T_C": t_c, "value": float(r["mean_apparent_specific_heat"])})
        if r.get("mean_coefficient_of_thermal_expansion") is not None:
            cte_pts.append(
                {"T_K": t_k, "T_C": t_c, "value": float(r["mean_coefficient_of_thermal_expansion"])}
            )
        if r.get("electrical_resistivity") is not None:
            u = units.get("electrical_resistivity", "nΩ·m")
            rho_pts.append(
                {
                    "T_K": t_k,
                    "T_C": t_c,
                    "value": resistivity_to_si(float(r["electrical_resistivity"]), u),
                }
            )
    rec.merge_series("thermalConductivity", k_pts, source=filename, unit="W/(m·K)")
    rec.merge_series("specificHeat", cp_pts, source=filename, unit="J/(kg·K)")
    rec.merge_series("thermalExpansion", cte_pts, source=filename, unit="1e-6/K")
    rec.merge_series("electricalResistivity", rho_pts, source=filename, unit="Ω·m")


def _ingest_stainless(
    rec: AlloyRecord, row: dict[str, Any], filename: str, units: dict[str, Any]
) -> None:
    if row.get("density") is not None:
        try:
            dens = density_to_si(float(row["density"]), units.get("density", "g/cm3"))
            rec.merge_series(
                "density",
                [{"T_K": 298.15, "T_C": 25.0, "value": dens}],
                source=filename,
                unit="kg/m³",
            )
        except (TypeError, ValueError):
            pass
    if isinstance(row.get("thermal_conductivity"), dict):
        series = values_map_to_series(row["thermal_conductivity"])
        rec.merge_series("thermalConductivity", series, source=filename, unit="W/(m·K)")
    if isinstance(row.get("mean_cte"), dict):
        series = values_map_to_series(row["mean_cte"], range_mode="high")
        rec.merge_series("thermalExpansion", series, source=filename, unit="1e-6/K")
    if row.get("specific_heat_0_to_100") is not None:
        try:
            rec.merge_series(
                "specificHeat",
                [{"T_K": celsius_to_kelvin(50), "T_C": 50.0, "value": float(row["specific_heat_0_to_100"])}],
                source=filename,
                unit="J/(kg·K)",
            )
        except (TypeError, ValueError):
            pass
    if row.get("electrical_resistivity") is not None:
        try:
            u = units.get("electrical_resistivity", "nΩ·m")
            rec.merge_series(
                "electricalResistivity",
                [
                    {
                        "T_K": 298.15,
                        "T_C": 25.0,
                        "value": resistivity_to_si(float(row["electrical_resistivity"]), u),
                    }
                ],
                source=filename,
                unit="Ω·m",
            )
        except (TypeError, ValueError):
            pass


def _ingest_heat_resistant(
    rec: AlloyRecord, row: dict[str, Any], filename: str, units: dict[str, Any]
) -> None:
    if isinstance(row.get("thermal_conductivity"), dict):
        rec.merge_series(
            "thermalConductivity",
            values_map_to_series(row["thermal_conductivity"]),
            source=filename,
            unit="W/(m·K)",
        )
    if isinstance(row.get("mean_coefficient_of_thermal_expansion"), dict):
        rec.merge_series(
            "thermalExpansion",
            values_map_to_series(row["mean_coefficient_of_thermal_expansion"], range_mode="high"),
            source=filename,
            unit="1e-6/K",
        )
    elif isinstance(row.get("mean_cte"), dict):
        rec.merge_series(
            "thermalExpansion",
            values_map_to_series(row["mean_cte"], range_mode="high"),
            source=filename,
            unit="1e-6/K",
        )


def _ingest_superalloy_physical(
    rec: AlloyRecord, row: dict[str, Any], filename: str, units: dict[str, Any]
) -> None:
    if row.get("density") is not None:
        try:
            dens = density_to_si(float(row["density"]), units.get("density", "g/cm3"))
            rec.merge_series(
                "density",
                [{"T_K": 298.15, "T_C": 25.0, "value": dens}],
                source=filename,
                unit="kg/m³",
            )
        except (TypeError, ValueError):
            pass
    for key, prop, mode in (
        ("thermal_conductivity", "thermalConductivity", "mid"),
        ("specific_heat", "specificHeat", "mid"),
        ("mean_coefficient_of_thermal_expansion", "thermalExpansion", "high"),
        ("electrical_resistivity", "electricalResistivity", "mid"),
    ):
        if isinstance(row.get(key), dict):
            series = values_map_to_series(row[key], range_mode=mode)
            unit = "W/(m·K)"
            if prop == "specificHeat":
                unit = "J/(kg·K)"
            elif prop == "thermalExpansion":
                unit = "1e-6/K"
            elif prop == "electricalResistivity":
                u = units.get("electrical_resistivity", "nΩ·m")
                series = [{**p, "value": resistivity_to_si(p["value"], u)} for p in series]
                unit = "Ω·m"
            rec.merge_series(prop, series, source=filename, unit=unit)


def _ingest_tool_expansion(
    rec: AlloyRecord, row: dict[str, Any], filename: str, units: dict[str, Any]
) -> None:
    if row.get("density") is not None:
        try:
            dens = density_to_si(float(row["density"]), units.get("density", "g/cm3"))
            rec.merge_series(
                "density",
                [{"T_K": 298.15, "T_C": 25.0, "value": dens}],
                source=filename,
                unit="kg/m³",
            )
        except (TypeError, ValueError):
            pass
    vals = row.get("thermal_expansion_values") or row.get("values")
    if isinstance(vals, dict):
        rec.merge_series(
            "thermalExpansion",
            values_map_to_series(vals, range_mode="high"),
            source=filename,
            unit="1e-6/K",
        )


def _ingest_stellite(
    rec: AlloyRecord, row: dict[str, Any], filename: str, units: dict[str, Any]
) -> None:
    if row.get("density") is not None:
        try:
            dens = density_to_si(float(row["density"]), units.get("density", "g/cm3"))
            rec.merge_series(
                "density",
                [{"T_K": 298.15, "T_C": 25.0, "value": dens}],
                source=filename,
                unit="kg/m³",
            )
        except (TypeError, ValueError):
            pass
    te = row.get("thermal_expansion")
    if isinstance(te, dict):
        rec.merge_series(
            "thermalExpansion",
            values_map_to_series(te, range_mode="high"),
            source=filename,
            unit="1e-6/K",
        )
    rec.mechanical.setdefault("stellite", {
        k: row[k]
        for k in (
            "ultimate_tensile_strength",
            "elongation",
            "hardness",
            "transverse_rupture_strength_at_22_C",
            "melting_range_deg_C",
        )
        if k in row
    })


def _ingest_ods(
    rec: AlloyRecord, row: dict[str, Any], filename: str, units: dict[str, Any]
) -> None:
    if row.get("density") is not None:
        try:
            dens = density_to_si(float(row["density"]), units.get("density", "g/cm3"))
            rec.merge_series(
                "density",
                [{"T_K": 298.15, "T_C": 25.0, "value": dens}],
                source=filename,
                unit="kg/m³",
            )
        except (TypeError, ValueError):
            pass
    # Nested thermal conductivity if present
    for key in ("thermal_conductivity", "k"):
        if isinstance(row.get(key), dict):
            rec.merge_series(
                "thermalConductivity",
                values_map_to_series(row[key]),
                source=filename,
                unit="W/(m·K)",
            )
