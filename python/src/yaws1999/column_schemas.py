"""
yaws1999.column_schemas — Fixed column layouts for handbook tables with
stacked / OCR-ambiguous headers (approved from OCR HTML review).

When a table id is listed here, ``dataset._shape_columns`` uses this schema
instead of tokenizing ``headerRaw``. Value order must match the OCR value
cells after NO / FORMULA / NAME.
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

# Tables 12–25 (HTML review). 10–11 omitted (no Modal HTML in this run).
TABLE_COLUMN_SCHEMAS: dict[str, list[dict[str, str | None]]] = {
    "12-1": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("TMIN", "TMIN", "K"),
        _col("TMAX", "TMAX", "K"),
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
        _col("TMIN", "TMIN", "K"),
        _col("TMAX", "TMAX", "K"),
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
        _col("TB", "TB, K", "K"),
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("S_at_X_0", "S @ X=0"),
        _col("S_at_X_34_472", "S @ X=34,472"),
    ],
    "17-1": _ID
    + [
        _col("MW", "MW, g/mol", "g/mol"),
        _col("TB", "T_B, K", "K"),
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("S_at_25_C", "S @ 25 C"),
        _col("S_at_100_C", "S @ 100 C"),
    ],
    "18-1": _ID
    + [
        _col("MW", "MW, g/mol", "g/mol"),
        _col("TF", "TF, K", "K"),
        _col("TB", "TB, K", "K"),
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
        _col("TMIN", "TMIN", "K"),
        _col("TMAX", "TMAX", "K"),
        _col("n_gas_at_25_C", "n_gas @ 25 C"),
        _col("n_gas_at_TMIN", "n_gas @ TMIN"),
        _col("n_gas_at_TMAX", "n_gas @ TMAX"),
    ],
    "21-2": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("TMIN", "TMIN", "K"),
        _col("TMAX", "TMAX", "K"),
        _col("n_gas_at_25_C", "n_gas @ 25 C"),
        _col("n_gas_at_TMIN", "n_gas @ TMIN"),
        _col("n_gas_at_TMAX", "n_gas @ TMAX"),
    ],
    "22-1": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("D", "D"),
        _col("TMIN", "TMIN", "K"),
        _col("TMAX", "TMAX", "K"),
        _col("n_liq_at_25_C", "n_liq @ 25 C"),
        _col("n_liq_at_TMAX", "n_liq @ TMAX"),
    ],
    "22-2": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("D", "D"),
        _col("TMIN", "TMIN", "K"),
        _col("TMAX", "TMAX", "K"),
        _col("n_liq_at_25_C", "n_liq @ 25 C"),
        _col("n_liq_at_TMAX", "n_liq @ TMAX"),
    ],
    "23-1": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("TMIN", "TMIN", "K"),
        _col("TMAX", "TMAX", "K"),
        _col("k_gas_at_25_C", "k_gas @ 25 C"),
        _col("k_gas_at_TMIN", "k_gas @ TMIN"),
        _col("k_gas_at_TMAX", "k_gas @ TMAX"),
    ],
    "23-2": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("TMIN", "TMIN", "K"),
        _col("TMAX", "TMAX", "K"),
        _col("k_gas_at_25_C", "k_gas @ 25 C"),
        _col("k_gas_at_TMIN", "k_gas @ TMIN"),
        _col("k_gas_at_TMAX", "k_gas @ TMAX"),
    ],
    "24-1": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("TMIN", "TMIN", "K"),
        _col("TMAX", "TMAX", "K"),
        _col("k_liq_at_25_C", "k_liq @ 25 C"),
        _col("k_liq_at_TMIN", "k_liq @ TMIN"),
        _col("k_liq_at_TMAX", "k_liq @ TMAX"),
    ],
    "24-2": _ID
    + [
        _col("A", "A"),
        _col("B", "B"),
        _col("C", "C"),
        _col("TMIN", "TMIN", "K"),
        _col("TMAX", "TMAX", "K"),
        _col("Phase", "Phase"),
        _col("k_at_25_C", "k @ 25 C"),
        _col("k_at_TMIN", "k @ TMIN"),
        _col("k_at_TMAX", "k @ TMAX"),
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
