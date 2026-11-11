"""Dataset shaping: slug names, header columns, row expansion."""
from __future__ import annotations

from yaws1999.dataset import (
    align_values,
    column_keys,
    columns_from_header,
    dataset_file_name,
    expand_row,
    to_dataset_table,
    to_debug_table,
)


def test_dataset_file_name_slug():
    name = dataset_file_name(
        "CRITICAL PROPERTIES AND ACENTRIC FACTOR - ORGANIC COMPOUNDS",
        "1-1",
    )
    assert name == (
        "Critical_properties_and_acentric_factor_of_organic_compounds_(table_1-1).json"
    )


def test_columns_from_header_critical_props():
    columns = columns_from_header(
        "NO FORMULA NAME g/mol K K K bar cm3/mol g/cm3 ZC OMEGA"
    )
    keys = column_keys(columns)
    assert keys[0:3] == ["id", "formula", "name"]
    assert "g_mol" in keys
    assert keys.count("K") + sum(1 for c in keys if c.startswith("K_")) == 3
    by_key = {c["key"]: c for c in columns}
    assert by_key["id"]["header"] == "NO"
    assert by_key["g_mol"]["header"] == "g/mol"


def test_columns_from_header_heat_capacity():
    columns = columns_from_header("NO FORMULA NAME A B C D E TMIN TMAX")
    assert column_keys(columns) == [
        "id", "formula", "name", "A", "B", "C", "D", "E", "TMIN", "TMAX"
    ]
    assert columns[3]["header"] == "A"


def test_columns_coalesce_at_25_c():
    columns = columns_from_header(
        "NO FORMULA NAME A B n Tc TMIN TMAX density @ 25 C"
    )
    keys = column_keys(columns)
    assert keys == [
        "id", "formula", "name", "A", "B", "n", "Tc", "TMIN", "TMAX", "density_at_25_C"
    ]
    assert columns[-1]["header"] == "density @ 25 C"


def test_columns_coalesce_q_at_ppmv():
    columns = columns_from_header(
        "NO FORMULA NAME A B C ymin ymax Q @10 ppmv Q @100 ppmv Q @1000 ppmv"
    )
    keys = column_keys(columns)
    assert keys == [
        "id",
        "formula",
        "name",
        "A",
        "B",
        "C",
        "ymin",
        "ymax",
        "Q_at_10_ppmv",
        "Q_at_100_ppmv",
        "Q_at_1000_ppmv",
    ]


def test_schema_table_15_1_groups():
    parsed = {
        "id": "15-1",
        "title": "SOLUBILITY IN WATER AND OCTANOL-WATER PARTITION COEFFICIENT",
        "header": "NO FORMULA NAME Solubility in Water Octanol-Water Partition Coefficient",
        "printedPages": {"first": 353, "last": 370},
        "rows": [
            {
                "no": 1,
                "formula": "CBrClF2",
                "name": "BROMOCHLORODIFLUOROMETHANE",
                "values": [1, 2.0, 991.0, 108.06, 2, 1.9],
            }
        ],
    }
    dataset = to_dataset_table(parsed)
    keys = column_keys(dataset["columns"])
    assert keys == [
        "id",
        "formula",
        "name",
        "solubility_code",
        "solubility_T",
        "S_at_T_ppm_wt",
        "S_at_T_ppm_mol",
        "kow_code",
        "log10_Kow",
    ]
    row = dataset["rows"][0]
    assert row["solubility_code"] == 1
    assert row["solubility_T"] == 2.0
    assert row["S_at_T_ppm_wt"] == 991.0
    assert row["S_at_T_ppm_mol"] == 108.06
    assert row["kow_code"] == 2
    assert row["log10_Kow"] == 1.9


def test_schema_table_19_1():
    parsed = {
        "id": "19-1",
        "title": "ADSORPTION CAPACITY OF ACTIVATED CARBON",
        "header": "NO FORMULA NAME A B C ymin ymax Q @10 ppmv Q @100 ppmv Q @1000 ppmv",
        "printedPages": {"first": 414, "last": 424},
        "rows": [
            {
                "no": 1,
                "formula": "CBrCl3",
                "name": "BROMOTRICHLOROMETHANE",
                "values": [1.3984, 0.23228, -0.02184, 10, 10000, 40.63, 59.65, 79.2],
            }
        ],
    }
    dataset = to_dataset_table(parsed)
    row = dataset["rows"][0]
    assert row["Q_at_10_ppmv"] == 40.63
    assert row["Q_at_100_ppmv"] == 59.65
    assert row["Q_at_1000_ppmv"] == 79.2


def test_columns_coalesce_latex_and_glued_at():
    columns = columns_from_header(
        r"NO FORMULA NAME A B C TMIN TMAX C_p @ 25^\circ C C_p @ TMIN CP @TMAX"
    )
    keys = column_keys(columns)
    assert "density" not in keys
    assert keys[-3:] == ["C_p_at_25_C", "C_p_at_TMIN", "CP_at_TMAX"]
    assert columns[-3]["header"] == "C_p @ 25 C"


def test_columns_coalesce_t_comma_k_and_sigma_at_t():
    columns = columns_from_header(
        "NO FORMULA NAME A Tc n TMIN TMAX T, K sigma @ T"
    )
    keys = column_keys(columns)
    assert keys[-2:] == ["T", "sigma_at_T"]
    assert "K" not in keys
    assert columns[-2] == {"key": "T", "header": "T", "unit": "K"}


def test_columns_coalesce_t_comma_c():
    columns = columns_from_header(
        "NO FORMULA NAME T, C Value @ T State Debye Angstrom"
    )
    keys = column_keys(columns)
    assert keys == [
        "id", "formula", "name", "T", "Value_at_T", "State", "Debye", "Angstrom"
    ]
    assert columns[3] == {"key": "T", "header": "T", "unit": "°C"}


def test_expand_row_named_values():
    columns = columns_from_header("NO FORMULA NAME A B TMIN TMAX")
    row = expand_row(
        {
            "no": 12,
            "formula": "Ar",
            "name": "ARGON",
            "values": [20.786, 0.0, 100, 1500],
            "djvuPage": 54,
            "raw": "12 Ar ARGON …",
            "formulaRaw": "Ar",
        },
        columns,
        keep_debug=False,
    )
    assert row == {
        "id": 12,
        "formula": "Ar",
        "name": "ARGON",
        "A": 20.786,
        "B": 0.0,
        "TMIN": 100,
        "TMAX": 1500,
    }
    assert "djvuPage" not in row
    assert "raw" not in row


def test_to_dataset_and_debug_table():
    parsed = {
        "id": "1-1",
        "title": "CRITICAL PROPERTIES AND ACENTRIC FACTOR - ORGANIC COMPOUNDS",
        "refKey": "Yaws1999",
        "engine": "surya",
        "backend": "modal",
        "model": "test/ocr-model",
        "quant": "bf16",
        "dpi": 400,
        "equation": None,
        "header": "NO FORMULA NAME g/mol K K K bar cm3/mol g/cm3 ZC OMEGA",
        "djvuPages": {"first": 10, "last": 27},
        "printedPages": {"first": 1, "last": 18},
        "rows": [
            {
                "no": 1,
                "formula": "CBrClF2",
                "name": "BROMOCHLORODIFLUOROMETHANE",
                "values": [165.365, 113.65, 269.14, 426.15, 42.54, 246.0, 0.6722, 0.295, 0.187],
                "djvuPage": 10,
                "raw": "1 CbrCiF2 …",
                "formulaRaw": "CbrCiF2",
            }
        ],
        "unparsed": ["p10: junk"],
    }
    dataset = to_dataset_table(parsed)
    assert dataset["pages"] == {"first": 1, "last": 18}
    assert "engine" not in dataset
    assert "header" not in dataset
    assert "units" not in dataset
    assert dataset["rows"][0]["id"] == 1
    assert dataset["rows"][0]["g_mol"] == 165.365
    assert "raw" not in dataset["rows"][0]
    assert isinstance(dataset["columns"], list)
    assert dataset["columns"][0] == {"key": "id", "header": "NO", "unit": None}
    g_mol = next(c for c in dataset["columns"] if c["key"] == "g_mol")
    assert g_mol == {"key": "g_mol", "header": "g/mol", "unit": "g/mol"}

    debug = to_debug_table(parsed)
    assert debug["engine"] == "surya"
    assert debug["backend"] == "modal"
    assert debug["model"] == "test/ocr-model"
    assert debug["quant"] == "bf16"
    assert debug["rows"][0]["djvuPage"] == 10
    assert debug["rows"][0]["formulaRaw"] == "CbrCiF2"
    assert debug["unparsed"] == ["p10: junk"]
    assert debug["headerRaw"] == parsed["header"]


def test_to_dataset_density_units_and_at_column():
    parsed = {
        "id": "8-1",
        "title": "DENSITY OF LIQUID - ORGANIC COMPOUNDS",
        "refKey": "Yaws1999",
        "equation": "density = A B-(1 - T/Tc)^n (density - g/ml, T - K)",
        "header": "NO FORMULA NAME A B n Tc TMIN TMAX density @ 25 C",
        "printedPages": {"first": 183, "last": 200},
        "rows": [
            {
                "no": 1,
                "formula": "CBrClF2",
                "name": "BROMOCHLORODIFLUOROMETHANE",
                "values": [0.67201, 0.25624, 0.2644, 426.15, 113.65, 426.15, 1.81],
            }
        ],
    }
    dataset = to_dataset_table(parsed)
    keys = column_keys(dataset["columns"])
    assert keys[-1] == "density_at_25_C"
    assert "value" not in keys
    assert "25" not in keys
    assert "C" not in keys
    dens = dataset["columns"][-1]
    assert dens["header"] == "density @ 25 C"
    assert dens["unit"] == "g/ml"
    tc = next(c for c in dataset["columns"] if c["key"] == "Tc")
    assert tc["unit"] == "K"
    assert dataset["rows"][0]["density_at_25_C"] == 1.81


def test_align_values_strips_extra_leading_nulls():
    # OCR: "- - - - - - - 1.020" → 7 nulls + density for 7 columns
    assert align_values([None] * 7 + [1.02], 7) == [None] * 6 + [1.02]


def test_expand_row_maps_trailing_density_not_value_extra():
    columns = columns_from_header(
        "NO FORMULA NAME A B n Tc TMIN TMAX density @ 25 C"
    )
    row = expand_row(
        {
            "no": 640,
            "formula": "C6H18N3OP",
            "name": "HEXAMETHYL PHOSPHORAMIDE",
            "values": [None, None, None, None, None, None, None, 1.02],
        },
        columns,
    )
    assert row["density_at_25_C"] == 1.02
    assert "value_extra_1" not in row
    assert row["A"] is None
