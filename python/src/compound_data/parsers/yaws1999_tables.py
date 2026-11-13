"""
compound_data.parsers.yaws1999_tables — Processed Yaws 1999 JSON tables → ``SourceEntry`` values.

Maps handbook tables onto compound-data scalars, T-equations, or ``RawValue`` rows (salt-water
solubility and adsorption capacity, which are not T-dependent).

Spec: tmp/spec/02_yaws1999_compound_data_update.md
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.raw_value import RawValue
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_entry import SourceEntry
from chemicals_tables.source_link import SourceLink
from chemicals_tables.table_spec import TableSpec
from compound_data.constants.yaws1999_source import YAWS1999_DIR, yaws1999_table_spec
from compound_data.parsers.yaws1999_identity import (
    YawsIdentityIndex, hill_of, load_yaws1999_identity,
)
from pubchem.cas_number import is_cas
from references import RefKey

logger = logging.getLogger(__name__)

# Exact handbook unit conversions used by Yaws equation emitters.
_MMHG_TO_PA = 133.322387415
_CP_TO_PA_S = 1e-3
_G_ML_TO_KG_M3 = 1000.0
_PPM_WT_TO_MASS_FRAC = 1e-6
_J_CM3_SQRT_TO_PA_SQRT = 1000.0  # (J/cm³)^0.5 → Pa^0.5
_CM3_MOL_TO_M3_MOL = 1e-6
_CM2_MOL_TO_M2_MOL = 1e-4
_MG_M3_TO_KG_M3 = 1e-6
_VOL_PCT_TO_FRAC = 0.01
_PPM_TO_FRAC = 1e-6

RowEmitter = Callable[[dict[str, Any], SourceLink, str, Optional[str]], list[SourceEntry]]


@dataclass
class Yaws1999Tables:
    """Parsed entries, issues, table specs and match statistics."""

    entries: list[SourceEntry] = field(default_factory=list)
    issues: list[dict[str, Any]] = field(default_factory=list)
    tables: list[TableSpec] = field(default_factory=list)
    unmatched: list[dict[str, Any]] = field(default_factory=list)
    counts: dict[str, int] = field(default_factory=dict)
    identity: Optional[YawsIdentityIndex] = None


def parse_yaws1999_tables(processed_dir: Path) -> Yaws1999Tables:
    """Read ``processed_dir`` (``shared/processed/yaws1999``) into source entries."""
    out = Yaws1999Tables()
    index_path = processed_dir / "index.json" if processed_dir.name != "index.json" else processed_dir
    if index_path.name != "index.json":
        index_path = processed_dir / "index.json"
    if not index_path.is_file():
        out.issues.append(report_issue("yaws1999MissingIndex", str(index_path), None, None, None))
        return out

    identity = load_yaws1999_identity(
        processed_dir / "appendix" / "CAS_Compound_Index.json",
        processed_dir / "appendix" / "Name_and_Synonym_Index.json",
    )
    out.identity = identity
    out.issues.extend(identity.issues)

    index = json.loads(index_path.read_text(encoding="utf-8"))
    counts = {
        "yaws1999Tables": 0,
        "yaws1999Rows": 0,
        "yaws1999Entries": 0,
        "yaws1999Matched": 0,
        "yaws1999Unmatched": 0,
        "yaws1999SkippedUnsupported": 0,
    }
    for meta in index.get("tables", []):
        table_id = meta.get("id")
        rel = meta.get("file")
        if not table_id or not rel:
            continue
        path = processed_dir / rel
        if not path.is_file():
            out.issues.append(report_issue("yaws1999MissingTable", table_id, None, None, rel))
            continue
        emitter = _EMITTERS.get(table_id)
        if emitter is None:
            # Front-matter / appendix-only tables are not property sources.
            counts["yaws1999SkippedUnsupported"] += 1
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        title = data.get("title") or meta.get("title") or table_id
        spec = yaws1999_table_spec(table_id, title, str(path).replace("\\", "/"))
        # Prefer repo-relative path when under shared/
        for marker in ("shared/processed/yaws1999/",):
            text = str(path)
            if marker in text:
                spec = yaws1999_table_spec(table_id, title, text[text.index(marker):])
                break
        out.tables.append(spec)
        counts["yaws1999Tables"] += 1
        for row in data.get("rows", []):
            counts["yaws1999Rows"] += 1
            entries, status = _row_entries(identity, emitter, spec, row)
            if status != "matched" and status != "formula_only":
                counts["yaws1999Unmatched"] += 1
                out.unmatched.append({
                    "tableId": table_id, "rowId": row.get("id"), "name": row.get("name"),
                    "formula": row.get("formula"), "status": status,
                })
                if status == "bad_formula":
                    out.issues.append(report_issue(
                        "yaws1999BadFormula", table_id, row.get("id"), None, row.get("formula"),
                    ))
                continue
            if not entries:
                continue
            counts["yaws1999Matched"] += 1
            counts["yaws1999Entries"] += len(entries)
            out.entries.extend(entries)
    out.counts = counts
    logger.info(
        "[yaws1999] %d tables, %d rows → %d entries (%d matched rows, %d unmatched)",
        counts["yaws1999Tables"], counts["yaws1999Rows"], counts["yaws1999Entries"],
        counts["yaws1999Matched"], counts["yaws1999Unmatched"],
    )
    return out


def parse_yaws1999_default() -> Yaws1999Tables:
    """Parse from the default processed path."""
    root = Path(YAWS1999_DIR)
    if not root.is_dir():
        # Host vs container
        alt = Path("/app") / YAWS1999_DIR
        root = alt if alt.is_dir() else root
    return parse_yaws1999_tables(root)


def _row_entries(
    identity: YawsIdentityIndex,
    emitter: RowEmitter,
    spec: TableSpec,
    row: dict[str, Any],
) -> tuple[list[SourceEntry], str]:
    row_cas = row.get("CAS_No") or row.get("cas")
    if row_cas and is_cas(str(row_cas)):
        hill = hill_of(row.get("formula"))
        if row.get("formula") and hill is None:
            return [], "bad_formula"
        cas, status = str(row_cas), "matched"
    else:
        cas, hill, status = identity.resolve(row.get("name"), row.get("formula"))
    if status in {"bad_formula", "no_match", "ambiguous"}:
        return [], status
    formula = hill or row.get("formula")
    # Provenance in the dataset is only ``ref: [Yaws1999, rowId, fileKey]``.
    link = SourceLink(
        table=spec.name, key=spec.key, url="", ref=RefKey.Yaws1999,
        line=row.get("id") if isinstance(row.get("id"), int) else None,
        label=row.get("name") or formula,
    )
    return emitter(row, link, formula, cas), status


def _num(row: dict[str, Any], *keys: str) -> Optional[float]:
    for key in keys:
        if key not in row:
            continue
        value = row[key]
        if value is None or value == "":
            continue
        try:
            return float(value)
        except (TypeError, ValueError):
            continue
    return None


def _prop(
    row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str],
    property_name: str, *keys: str, scale: float = 1.0, phase: Optional[str] = None,
) -> list[SourceEntry]:
    value = _num(row, *keys)
    if value is None:
        return []
    return [SourceEntry(
        cas=cas, formula=formula, label=row.get("name") or formula, property=property_name, phase=phase,
        value=PropertyValue(value=value * scale, ref=RefKey.Yaws1999, source=link, phase=phase),
    )]


def _eq(
    row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str],
    property_name: str, phase: str, type_: EquationType, vars_: dict[str, Any],
    *, k: Optional[float] = None, tmin_keys: tuple[str, ...] = ("Tmin", "TMIN"),
    tmax_keys: tuple[str, ...] = ("Tmax", "TMAX"),
) -> list[SourceEntry]:
    if any(v is None for v in vars_.values()):
        return []
    return [SourceEntry(
        cas=cas, formula=formula, label=row.get("name") or formula, property=property_name, phase=phase,
        value=EquationValue(
            type=type_, ref=RefKey.Yaws1999, vars=vars_,
            min=_num(row, *tmin_keys), max=_num(row, *tmax_keys), source=link, k=k,
        ),
    )]


def _critical(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out: list[SourceEntry] = []
    out += _prop(row, link, formula, cas, "meltingPoint", "Tf")
    out += _prop(row, link, formula, cas, "boilingPoint", "Tb")
    out += _prop(row, link, formula, cas, "criticalTemperature", "Tc")
    out += _prop(row, link, formula, cas, "criticalPressure", "Pc", scale=1e5)
    out += _prop(row, link, formula, cas, "criticalVolume", "Vc", scale=1e-6)
    out += _prop(row, link, formula, cas, "acentricFactor", "omega")
    return out


def _cp_gas(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    return _eq(
        row, link, formula, cas, "heatCapacity", "gas", EquationType.quartic,
        {"a": _num(row, "A"), "b": _num(row, "B"), "c": _num(row, "C"), "d": _num(row, "D"), "e": _num(row, "E")},
        k=1.0,
    )


def _cp_liquid(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out = _eq(
        row, link, formula, cas, "heatCapacity", "liquid", EquationType.cubic,
        {"a": _num(row, "A"), "b": _num(row, "B"), "c": _num(row, "C"), "d": _num(row, "D")},
        k=1.0,
    )
    out += _prop(row, link, formula, cas, "heatCapacity298", "C_p_at_25_C", "Cp_at_25_C", phase="liquid")
    return out


def _cp_solid(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out = _eq(
        row, link, formula, cas, "heatCapacity", "solid", EquationType.quadratic,
        {"a": _num(row, "A"), "b": _num(row, "B"), "c": _num(row, "C")},
        k=1.0,
    )
    out += _prop(row, link, formula, cas, "heatCapacity298", "Cp_at_25_C", "C_p_at_25_C", phase="solid")
    return out


def _hvap(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out = _eq(
        row, link, formula, cas, "enthalpyVaporization", "liquid", EquationType.dipprN106,
        {
            "Tc": _num(row, "Tc"), "c1": _num(row, "A"), "c2": _num(row, "n"),
            "c3": 0.0, "c4": 0.0, "c5": 0.0,
        },
        k=1000.0,
    )
    out += _prop(row, link, formula, cas, "boilingPoint", "Tb")
    return out


def _fusion(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out = _prop(row, link, formula, cas, "meltingPoint", "Tf")
    out += _prop(row, link, formula, cas, "heatOfFusion", "Hfus_kjoule_mol", "Hfus", scale=1000.0)
    return out


def _density_liquid(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out = _eq(
        row, link, formula, cas, "density", "liquid", EquationType.yawsLiquidDensity,
        {
            "a": _num(row, "A"), "b": _num(row, "B"), "n": _num(row, "n"),
            "Tc": _num(row, "Tc"),
        },
        k=_G_ML_TO_KG_M3,
    )
    out += _prop(row, link, formula, cas, "density", "density_at_25_C", scale=_G_ML_TO_KG_M3, phase="liquid")
    return out


def _vapor_pressure(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    return _eq(
        row, link, formula, cas, "vaporPressure", "liquid", EquationType.yawsVaporPressure,
        {
            "a": _num(row, "A"), "b": _num(row, "B"), "c": _num(row, "C"),
            "d": _num(row, "D"), "e": _num(row, "E"),
        },
        k=_MMHG_TO_PA,
    )


def _solubility_parameter(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out = _prop(
        row, link, formula, cas, "solubilityParameter", "solubility_parameter",
        scale=_J_CM3_SQRT_TO_PA_SQRT, phase="liquid",
    )
    out += _prop(
        row, link, formula, cas, "liquidMolarVolume", "liquid_volume",
        scale=_CM3_MOL_TO_M3_MOL, phase="liquid",
    )
    out += _prop(row, link, formula, cas, "vdwArea", "vdw_area", scale=_CM2_MOL_TO_M2_MOL)
    out += _prop(row, link, formula, cas, "vdwVolume", "vdw_volume", scale=_CM3_MOL_TO_M3_MOL)
    return out


def _water_octanol(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out = _prop(
        row, link, formula, cas, "waterSolubility", "S_at_T_ppm_wt",
        scale=_PPM_WT_TO_MASS_FRAC, phase="liquid",
    )
    out += _prop(row, link, formula, cas, "logKow", "log10_Kow")
    return out


def _salt_water_solubility(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    # Not T-dependent (X = salt ppm wt); keep coefficients as RawValue.
    a, b, c = _num(row, "A"), _num(row, "B"), _num(row, "C")
    if a is None or b is None or c is None:
        return []
    values: dict[str, Any] = {
        "a": a, "b": b, "c": c,
        "equation": "log10(S/ppm wt) = A + B X + C X^2",
        "X_unit": "ppm wt NaCl",
        "S_unit": "ppm wt",
    }
    for key in ("S_at_X_0", "S_at_X_34_472", "Tb", "MW"):
        if (n := _num(row, key)) is not None:
            values[key] = n
    return [SourceEntry(
        cas=cas, formula=formula, label=row.get("name") or formula,
        property="saltWaterSolubility", phase="liquid",
        value=RawValue("saltWaterSolubility", "liquid", RefKey.Yaws1999, values, link),
    )]


def _water_solubility_eq(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out = _eq(
        row, link, formula, cas, "waterSolubility", "liquid", EquationType.yawsWaterSolubility,
        {"a": _num(row, "A"), "b": _num(row, "B"), "c": _num(row, "C")},
        k=_PPM_WT_TO_MASS_FRAC,
    )
    out += _prop(
        row, link, formula, cas, "waterSolubility", "S_at_25_C",
        scale=_PPM_WT_TO_MASS_FRAC, phase="liquid",
    )
    out += _prop(row, link, formula, cas, "boilingPoint", "Tb")
    return out


def _adsorption_capacity(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    # Adsorption vs gas concentration (ppmv), not T; keep as RawValue.
    a, b, c = _num(row, "A"), _num(row, "B"), _num(row, "C")
    if a is None or b is None or c is None:
        return []
    values: dict[str, Any] = {
        "a": a, "b": b, "c": c,
        "equation": "log10(Q) = A + B log10(y) + C [log10(y)]^2",
        "Q_unit": "g/100g carbon",
        "y_unit": "ppmv",
    }
    for key in ("ymin", "ymax", "Q_at_10_ppmv", "Q_at_100_ppmv", "Q_at_1000_ppmv"):
        if (n := _num(row, key)) is not None:
            values[key] = n
    return [SourceEntry(
        cas=cas, formula=formula, label=row.get("name") or formula,
        property="adsorptionCapacity", phase="gas",
        value=RawValue("adsorptionCapacity", "gas", RefKey.Yaws1999, values, link),
    )]


def _visc_liquid(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out = _eq(
        row, link, formula, cas, "viscosity", "liquid", EquationType.yawsLiquidViscosity,
        {
            "a": _num(row, "A"), "b": _num(row, "B"), "c": _num(row, "C"), "d": _num(row, "D"),
        },
        k=_CP_TO_PA_S,
    )
    out += _prop(
        row, link, formula, cas, "viscosity", "n_liq_at_25_C",
        scale=_CP_TO_PA_S, phase="liquid",
    )
    return out


def _k_liquid(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out = _eq(
        row, link, formula, cas, "thermalConductivity", "liquid", EquationType.yawsLiquidConductivity,
        {"a": _num(row, "A"), "b": _num(row, "B"), "c": _num(row, "C")},
        k=1.0,
    )
    out += _prop(
        row, link, formula, cas, "thermalConductivity", "k_liq_at_25_C",
        scale=1.0, phase="liquid",
    )
    return out


def _explosion_flash(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out = _prop(
        row, link, formula, cas, "lowerExplosionLimit", "LEL",
        scale=_VOL_PCT_TO_FRAC, phase="gas",
    )
    out += _prop(
        row, link, formula, cas, "upperExplosionLimit", "UEL",
        scale=_VOL_PCT_TO_FRAC, phase="gas",
    )
    flash_f = _fahrenheit_like(row.get("flash_point_F"), row.get("flash_point_code"))
    if flash_f is not None:
        out += _prop(
            {**row, "flash_point_K": (flash_f - 32.0) * 5.0 / 9.0 + 273.15},
            link, formula, cas, "flashPoint", "flash_point_K",
        )
    auto_f = _fahrenheit_like(row.get("autoignition_F"), row.get("autoignition_code"))
    if auto_f is not None:
        out += _prop(
            {**row, "autoignition_K": (auto_f - 32.0) * 5.0 / 9.0 + 273.15},
            link, formula, cas, "autoignitionTemperature", "autoignition_K",
        )
    return out


def _enthalpy_combustion(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    phase = _phase(row.get("State") or row.get("state"))
    return _prop(
        row, link, formula, cas, "enthalpyCombustion", "Hc_kjoule_mol",
        scale=1000.0, phase=phase,
    )


def _exposure_limits(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out: list[SourceEntry] = []
    out += _prop(row, link, formula, cas, "tlvAcgih", "TLV_ACGIH_mg_m3", scale=_MG_M3_TO_KG_M3)
    out += _prop(row, link, formula, cas, "pelOsha", "PEL_OSHA_mg_m3", scale=_MG_M3_TO_KG_M3)
    out += _prop(row, link, formula, cas, "relNiosh", "REL_NIOSH_mg_m3", scale=_MG_M3_TO_KG_M3)
    out += _prop(row, link, formula, cas, "makDfg", "MAK_DFG_mg_m3", scale=_MG_M3_TO_KG_M3)
    out += _prop(row, link, formula, cas, "tlvAcgihPpm", "TLV_ACGIH_ppm", scale=_PPM_TO_FRAC)
    out += _prop(row, link, formula, cas, "pelOshaPpm", "PEL_OSHA_ppm", scale=_PPM_TO_FRAC)
    out += _prop(row, link, formula, cas, "relNioshPpm", "REL_NIOSH_ppm", scale=_PPM_TO_FRAC)
    out += _prop(row, link, formula, cas, "makDfgPpm", "MAK_DFG_ppm", scale=_PPM_TO_FRAC)
    return out


def _fahrenheit_like(*candidates: Any) -> Optional[float]:
    """Pick a Fahrenheit temperature from OCR columns that often swap code ↔ °F."""
    nums: list[float] = []
    for value in candidates:
        if value is None or value == "":
            continue
        try:
            nums.append(float(value))
        except (TypeError, ValueError):
            continue
    # Codes are small integers (typically 1–5); prefer real temperatures.
    temps = [n for n in nums if abs(n) > 5 or (n != int(n))]
    if temps:
        return temps[0]
    return None


def _surface_tension(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    return _eq(
        row, link, formula, cas, "surfaceTension", "liquid", EquationType.dipprN106,
        {
            "Tc": _num(row, "Tc"), "c1": _num(row, "A"), "c2": _num(row, "n"),
            "c3": 0.0, "c4": 0.0, "c5": 0.0,
        },
        k=1e-3,
    )


def _dipole(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    return _prop(row, link, formula, cas, "dipoleMoment", "dipole_moment", scale=3.33564e-30)


def _entropy298(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    return _prop(row, link, formula, cas, "entropy298", "S_at_298_K", phase="gas")


def _hf_gas(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    return _prop(row, link, formula, cas, "enthalpyFormation298", "Hf_at_298_K", scale=1000.0, phase="gas")


def _hf_state(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    phase = _phase(row.get("State") or row.get("state"))
    out = _prop(row, link, formula, cas, "enthalpyFormation298", "Hf_at_298_K", scale=1000.0, phase=phase)
    out += _prop(row, link, formula, cas, "entropy298", "S_at_298_K", phase=phase)
    return out


def _gf_gas(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    return _prop(row, link, formula, cas, "gibbsEnergy298", "Gf_at_298_K", scale=1000.0, phase="gas")


def _gf_state(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    phase = _phase(row.get("State") or row.get("state"))
    return _prop(row, link, formula, cas, "gibbsEnergy298", "Gf_at_298_K", scale=1000.0, phase=phase)


def _henry_temps(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    out = _prop(row, link, formula, cas, "meltingPoint", "Tf")
    out += _prop(row, link, formula, cas, "boilingPoint", "Tb")
    return out


def _soil_mp(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    value = _num(row, "melting_point")
    if value is None:
        return []
    return _prop({**row, "melting_point_K": value + 273.15}, link, formula, cas, "meltingPoint", "melting_point_K")


def _visc_gas(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    return _eq(
        row, link, formula, cas, "viscosity", "gas", EquationType.quadratic,
        {"a": _num(row, "A"), "b": _num(row, "B"), "c": _num(row, "C")},
        k=1e-7,
    )


def _k_gas(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    return _eq(
        row, link, formula, cas, "thermalConductivity", "gas", EquationType.quadratic,
        {"a": _num(row, "A"), "b": _num(row, "B"), "c": _num(row, "C")},
        k=1.0,
    )


def _k_phase(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    phase = _phase(row.get("Phase") or row.get("phase")) or "solid"
    return _eq(
        row, link, formula, cas, "thermalConductivity", phase, EquationType.quadratic,
        {"a": _num(row, "A"), "b": _num(row, "B"), "c": _num(row, "C")},
        k=1.0,
    )


def _expansion_density(row: dict[str, Any], link: SourceLink, formula: str, cas: Optional[str]) -> list[SourceEntry]:
    return _prop(
        row, link, formula, cas, "density", "density_liq_at_25_C", "density_at_25_C",
        scale=1000.0, phase="liquid",
    )


def _phase(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    key = str(text).strip().casefold()
    if key in {"g", "gas", "vap", "vapor", "vapour"}:
        return "gas"
    if key in {"l", "liq", "liquid"}:
        return "liquid"
    if key in {"s", "c", "cr", "solid", "crystal", "crystals"}:
        return "solid"
    return None


_EMITTERS: dict[str, RowEmitter] = {
    "1-1": _critical,
    "1-2": _critical,
    "2-1": _cp_gas,
    "2-2": _cp_gas,
    "3-1": _cp_liquid,
    "3-2": _cp_liquid,
    "4-1": _cp_solid,
    "4-2": _cp_solid,
    "5-1": _hvap,
    "5-2": _hvap,
    "6-1": _fusion,
    "6-2": _fusion,
    "7-1": _vapor_pressure,
    "7-2": _vapor_pressure,
    "8-1": _density_liquid,
    "8-2": _density_liquid,
    "9-1": _surface_tension,
    "9-2": _surface_tension,
    "10-1": _dipole,
    "10-2": _dipole,
    "11-1": _entropy298,
    "11-2": _entropy298,
    "12-1": _hf_gas,
    "12-2": _hf_state,
    "13-1": _gf_gas,
    "13-2": _gf_state,
    "14-1": _solubility_parameter,
    "14-2": _solubility_parameter,
    "15-1": _water_octanol,
    "16-1": _salt_water_solubility,
    "17-1": _water_solubility_eq,
    "18-1": _henry_temps,
    "19-1": _adsorption_capacity,
    "20-1": _soil_mp,
    "21-1": _visc_gas,
    "21-2": _visc_gas,
    "22-1": _visc_liquid,
    "22-2": _visc_liquid,
    "23-1": _k_gas,
    "23-2": _k_gas,
    "24-1": _k_liquid,
    "24-2": _k_phase,
    "25-1": _explosion_flash,
    "25-2": _explosion_flash,
    "26-1": _enthalpy_combustion,
    "27-1": _exposure_limits,
    "27-2": _exposure_limits,
    "28-1": _expansion_density,
    "28-2": _expansion_density,
}
