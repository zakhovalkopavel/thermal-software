"""
yaws1999.column_schemas — Fixed column layouts for handbook tables with
stacked / OCR-ambiguous headers (approved from OCR HTML review).

When a table id is listed here, ``dataset._shape_columns`` uses this schema
instead of tokenizing ``headerRaw``. Value order must match the OCR value
cells after NO / FORMULA / NAME.

Naming: short symbols without underscore (Tc, Zc, Tf, Hf); spot keys keep
``*_at_*`` intact (Sf_at_298_K, Cp_at_Tmax, Koc_at_20_C).
"""
from __future__ import annotations

from typing import Any


def _col(key: str, header: str, unit: str | None = None) -> dict[str, str | None]:
    return {"key": key, "header": header, "unit": unit}


_ID = [
    _col("id", "NO"),
    _col("formula", "FORMULA"),
    _col("name", "NAME"),
]

TABLE_COLUMN_SCHEMAS: dict[str, list[dict[str, str | None]]] = {
    # Stacked header: MW TF TB TC PC VC RHOC over g/mol K K K bar cm3/mol g/cm3.
    "1-1": _ID
    + [
        _col("MW", "MW, g/mol", "g/mol"),
        _col("Tf", "Tf", "K"),
        _col("Tb", "Tb", "K"),
        _col("Tc", "Tc", "K"),
        _col("Pc", "Pc", "bar"),
        _col("Vc", "Vc", "cm3/mol"),
        _col("rhoc", "rhoc", "g/cm3"),
        _col("Zc", "Zc"),
        _col("omega", "omega"),
    ],
    "1-2": _ID
    + [
        _col("MW", "MW, g/mol", "g/mol"),
        _col("Tf", "Tf", "K"),
        _col("Tb", "Tb", "K"),
        _col("Tc", "Tc", "K"),
        _col("Pc", "Pc", "bar"),
        _col("Vc", "Vc", "cm3/mol"),
        _col("rhoc", "rhoc", "g/cm3"),
        _col("Zc", "Zc"),
        _col("omega", "omega"),
    ],
    "4-1": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("Cp_at_25_C", "Cp @ 25 C"),
        _col("Cp_at_Tmin", "Cp @ Tmin"),
        _col("Cp_at_Tmax", "Cp @ Tmax"),
    ],
    "4-2": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("Cp_at_25_C", "Cp @ 25 C"),
        _col("Cp_at_Tmin", "Cp @ Tmin"),
        _col("Cp_at_Tmax", "Cp @ Tmax"),
    ],
    "5-1": _ID
    + [
        _col("A", "A"),
        _col("Tc", "Tc", "K"),
        _col("n", "n"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("Tb", "Tb", "K"),
        _col("HVAP_at_Tb", "HVAP @ Tb"),
    ],
    "5-2": _ID
    + [
        _col("A", "A"),
        _col("Tc", "Tc", "K"),
        _col("n", "n"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("Tb", "Tb", "K"),
        _col("HVAP_at_Tb", "HVAP @ Tb"),
    ],
    "6-1": _ID
    + [
        _col("MW", "MW, g/mol", "g/mol"),
        _col("Tf", "Tf", "K"),
        _col("Hfus_kjoule_mol", "Hfus @ Tf, kjoule/mol", "kjoule/mol"),
        _col("Hfus_kjoule_kg", "Hfus, kjoule/kg", "kjoule/kg"),
        _col("Hfus_BTU_lb", "Hfus, BTU/lb", "BTU/lb"),
    ],
    "6-2": _ID
    + [
        _col("MW", "MW, g/mol", "g/mol"),
        _col("Tf", "Tf", "K"),
        _col("Hfus_kjoule_mol", "Hfus @ Tf, kjoule/mol", "kjoule/mol"),
        _col("Hfus_kjoule_kg", "Hfus, kjoule/kg", "kjoule/kg"),
        _col("Hfus_BTU_lb", "Hfus, BTU/lb", "BTU/lb"),
    ],
    "10-1": _ID
    + [
        _col("T", "T", "C"),
        _col("refractive_index", "Value @ T"),
        _col("State", "State"),
        _col("dipole_moment", "Dipole Moment, Debye", "Debye"),
        _col("radius_of_gyration", "Radius of Gyration, Angstrom", "Angstrom"),
    ],
    "10-2": _ID
    + [
        _col("T", "T", "C"),
        _col("refractive_index", "Value @ T"),
        _col("State", "State"),
        _col("dipole_moment", "Dipole Moment, Debye", "Debye"),
        _col("radius_of_gyration", "Radius of Gyration, Angstrom", "Angstrom"),
    ],
    "11-1": _ID
    + [
        _col("MW", "MW, g/mol", "g/mol"),
        _col("S_at_298_K", "S @ 298 K, joule/(mol K)", "joule/(mol K)"),
        _col("Sf_at_298_K", "Sf @ 298 K, joule/(mol K)", "joule/(mol K)"),
    ],
    "11-2": _ID
    + [
        _col("MW", "MW, g/mol", "g/mol"),
        _col("S_at_298_K", "S @ 298 K, joule/(mol K)", "joule/(mol K)"),
        _col("Sf_at_298_K", "Sf @ 298 K, joule/(mol K)", "joule/(mol K)"),
    ],
    "12-1": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("Hf_at_298_K", "Hf @ 298 K"),
        _col("Hf_at_500_K", "Hf @ 500 K"),
    ],
    "12-2": _ID
    + [
        _col("MW", "Molecular Weight, g/mol", "g/mol"),
        _col("State", "State"),
        _col("Hf_at_298_K", "Hf @ 298 K, kjoule/mol", "kjoule/mol"),
        _col("Uf_at_298_K", "Uf @ 298 K, kjoule/mol", "kjoule/mol"),
        _col("S_at_298_K", "S @ 298 K, joule/(mol K)", "joule/(mol K)"),
    ],
    "13-1": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("Gf_at_298_K", "Gf @ 298 K"),
        _col("Gf_at_500_K", "Gf @ 500 K"),
    ],
    "13-2": _ID
    + [
        _col("MW", "Molecular Weight, g/mol", "g/mol"),
        _col("State", "State"),
        _col("Gf_at_298_K", "Gf @ 298 K, kjoule/mol", "kjoule/mol"),
        _col("Af_at_298_K", "Af @ 298 K, kjoule/mol", "kjoule/mol"),
        _col("Sf_at_298_K", "Sf @ 298 K, joule/(mol K)", "joule/(mol K)"),
    ],
    "14-1": _ID
    + [
        _col("MW", "Weight, g/mol", "g/mol"),
        _col("solubility_parameter", "Solubility Parameter, (joule/cm3)^0.5", "(joule/cm3)^0.5"),
        _col("liquid_volume", "Liquid Volume, cm3/mol", "cm3/mol"),
        _col("vdw_area", "Van Der Waals Area, cm2/mol", "cm2/mol"),
        _col("vdw_volume", "Van Der Waals Volume, cm3/mol", "cm3/mol"),
    ],
    "14-2": _ID
    + [
        _col("MW", "Weight, g/mol", "g/mol"),
        _col("solubility_parameter", "Solubility Parameter, (joule/cm3)^0.5", "(joule/cm3)^0.5"),
        _col("liquid_volume", "Liquid Volume, cm3/mol", "cm3/mol"),
        _col("vdw_area", "Van Der Waals Area, cm2/mol", "cm2/mol"),
        _col("vdw_volume", "Van Der Waals Volume, cm3/mol", "cm3/mol"),
    ],
    # 15-1: cols 4–7 solubility in water; 8–9 octanol-water partition coefficient.
    "15-1": _ID
    + [
        _col("solubility_code", "Code"),
        _col("solubility_T", "T, C", "C"),
        _col("S_at_T_ppm_wt", "S @ T, ppm (wt)", "ppm (wt)"),
        _col("S_at_T_ppm_mol", "S @ T, ppm (mol)", "ppm (mol)"),
        _col("kow_code", "Code"),
        _col("log10_Kow", "log10 Kow"),
    ],
    "16-1": _ID
    + [
        _col("MW", "MW, g/mol", "g/mol"),
        _col("Tb", "Tb, K", "K"),
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("S_at_X_0", "S @ X=0"),
        _col("S_at_X_34_472", "S @ X=34,472"),
    ],
    "17-1": _ID
    + [
        _col("MW", "MW, g/mol", "g/mol"),
        _col("Tb", "Tb, K", "K"),
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("S_at_25_C", "S @ 25 C"),
        _col("S_at_100_C", "S @ 100 C"),
    ],
    "18-1": _ID
    + [
        _col("MW", "MW, g/mol", "g/mol"),
        _col("Tf", "Tf, K", "K"),
        _col("Tb", "Tb, K", "K"),
        _col("T", "T, C", "C"),
        _col("H_at_T_atm_mol_frac", "H @ T, atm/mol frac", "atm/mol frac"),
        _col("H_at_T_atm_mol_m3", "H @ T, atm/mol/m3", "atm/mol/m3"),
    ],
    "19-1": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("ymin", "ymin"),
        _col("ymax", "ymax"),
        _col("Q_at_10_ppmv", "Q @ 10 ppmv", "g/100 g carbon"),
        _col("Q_at_100_ppmv", "Q @ 100 ppmv", "g/100 g carbon"),
        _col("Q_at_1000_ppmv", "Q @ 1000 ppmv", "g/100 g carbon"),
    ],
    "20-1": _ID
    + [
        _col("MW", "Molecular Weight, g/mol", "g/mol"),
        _col("melting_point", "Melting Point, C", "C"),
        _col("Koc_at_20_C", "L/kg Koc @ 20 C", "L/kg"),
        _col("CODE", "CODE"),
    ],
    "21-1": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("n_gas_at_25_C", "n_gas @ 25 C"),
        _col("n_gas_at_Tmin", "n_gas @ Tmin"),
        _col("n_gas_at_Tmax", "n_gas @ Tmax"),
    ],
    "21-2": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("n_gas_at_25_C", "n_gas @ 25 C"),
        _col("n_gas_at_Tmin", "n_gas @ Tmin"),
        _col("n_gas_at_Tmax", "n_gas @ Tmax"),
    ],
    "22-1": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("D", "D"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("n_liq_at_25_C", "n_liq @ 25 C"),
        _col("n_liq_at_Tmax", "n_liq @ Tmax"),
    ],
    "22-2": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("D", "D"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("n_liq_at_25_C", "n_liq @ 25 C"),
        _col("n_liq_at_Tmax", "n_liq @ Tmax"),
    ],
    "23-1": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("k_gas_at_25_C", "k_gas @ 25 C"),
        _col("k_gas_at_Tmin", "k_gas @ Tmin"),
        _col("k_gas_at_Tmax", "k_gas @ Tmax"),
    ],
    "23-2": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("k_gas_at_25_C", "k_gas @ 25 C"),
        _col("k_gas_at_Tmin", "k_gas @ Tmin"),
        _col("k_gas_at_Tmax", "k_gas @ Tmax"),
    ],
    "24-1": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("k_liq_at_25_C", "k_liq @ 25 C"),
        _col("k_liq_at_Tmin", "k_liq @ Tmin"),
        _col("k_liq_at_Tmax", "k_liq @ Tmax"),
    ],
    "24-2": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("Phase", "Phase"),
        _col("k_at_25_C", "k @ 25 C"),
        _col("k_at_Tmin", "k @ Tmin"),
        _col("k_at_Tmax", "k @ Tmax"),
    ],
    "25-1": _ID
    + [
        _col("code", "Code"),
        _col("LEL", "LEL, vol %", "vol %"),
        _col("UEL", "UEL, vol %", "vol %"),
        _col("flash_point_code", "Flash Point Code"),
        _col("flash_point_F", "Flash Point, F", "F"),
        _col("autoignition_code", "Autoignition Temperature Code"),
        _col("autoignition_F", "Autoignition Temperature, F", "F"),
    ],
    "25-2": _ID
    + [
        _col("code", "Code"),
        _col("LEL", "LEL, vol %", "vol %"),
        _col("UEL", "UEL, vol %", "vol %"),
        _col("flash_point_code", "Flash Point Code"),
        _col("flash_point_F", "Flash Point, F", "F"),
        _col("autoignition_code", "Autoignition Temperature Code"),
        _col("autoignition_F", "Autoignition Temperature, F", "F"),
    ],
    "26-1": _ID
    + [
        _col("State", "State"),
        _col("Hc_kjoule_mol", "Hc, kjoule/mol", "kjoule/mol"),
        _col("Hc_kjoule_kg", "Hc, kjoule/kg", "kjoule/kg"),
        _col("Hc_BTU_lb", "Hc, BTU/lb", "BTU/lb"),
    ],
    # Stacked agency headers: each of TLV/PEL/REL/MAK has ppm (vol) + mg/m³.
    "27-1": _ID
    + [
        _col("CAS_No", "CAS No"),
        _col("TLV_ACGIH_ppm", "TLV (ACGIH), ppm (vol)", "ppm (vol)"),
        _col("TLV_ACGIH_mg_m3", "TLV (ACGIH), mg/m3", "mg/m3"),
        _col("PEL_OSHA_ppm", "PEL (OSHA), ppm (vol)", "ppm (vol)"),
        _col("PEL_OSHA_mg_m3", "PEL (OSHA), mg/m3", "mg/m3"),
        _col("REL_NIOSH_ppm", "REL (NIOSH), ppm (vol)", "ppm (vol)"),
        _col("REL_NIOSH_mg_m3", "REL (NIOSH), mg/m3", "mg/m3"),
        _col("MAK_DFG_ppm", "MAK (DFG), ppm (vol)", "ppm (vol)"),
        _col("MAK_DFG_mg_m3", "MAK (DFG), mg/m3", "mg/m3"),
    ],
    "27-2": _ID
    + [
        _col("CAS_No", "CAS No"),
        _col("TLV_ACGIH_ppm", "TLV (ACGIH), ppm (vol)", "ppm (vol)"),
        _col("TLV_ACGIH_mg_m3", "TLV (ACGIH), mg/m3", "mg/m3"),
        _col("PEL_OSHA_ppm", "PEL (OSHA), ppm (vol)", "ppm (vol)"),
        _col("PEL_OSHA_mg_m3", "PEL (OSHA), mg/m3", "mg/m3"),
        _col("REL_NIOSH_ppm", "REL (NIOSH), ppm (vol)", "ppm (vol)"),
        _col("REL_NIOSH_mg_m3", "REL (NIOSH), mg/m3", "mg/m3"),
        _col("MAK_DFG_ppm", "MAK (DFG), ppm (vol)", "ppm (vol)"),
        _col("MAK_DFG_mg_m3", "MAK (DFG), mg/m3", "mg/m3"),
    ],
    # 28-x: OCR turns B_liq / density_liq into Bllq, B_{llq}, density_{IIq}, …
    "28-1": _ID
    + [
        _col("a", "a"),
        _col("Tc", "Tc", "K"),
        _col("m", "m"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("B_liq_at_25_C", "B_liq @ 25 C", "1/C"),
        _col("density_liq_at_25_C", "density_liq @ 25 C", "g/cm3"),
    ],
    "28-2": _ID
    + [
        _col("a", "a"),
        _col("Tc", "Tc", "K"),
        _col("m", "m"),
        _col("Tmin", "Tmin", "K"),
        _col("Tmax", "Tmax", "K"),
        _col("B_liq_at_25_C", "B_liq @ 25 C", "1/C"),
        _col("density_liq_at_25_C", "density_liq @ 25 C", "g/cm3"),
    ],
}


def schema_for(table_id: str | None) -> list[dict[str, str | None]] | None:
    """Return a deep copy of the fixed schema for ``table_id``, or ``None``."""
    if not table_id:
        return None
    cols = TABLE_COLUMN_SCHEMAS.get(str(table_id))
    if cols is None:
        return None
    return [dict(c) for c in cols]


def schema_ids() -> frozenset[str]:
    return frozenset(TABLE_COLUMN_SCHEMAS)
