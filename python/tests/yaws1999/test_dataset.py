"""Dataset shaping: slug names, header columns, row expansion."""
from __future__ import annotations

from yaws1999.dataset import (
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
    columns, header = columns_from_header(
        "NO FORMULA NAME g/mol K K K bar cm3/mol g/cm3 ZC OMEGA"
    )
    assert columns[0:3] == ["id", "formula", "name"]
    assert "g_mol" in columns
    assert columns.count("K") + sum(1 for c in columns if c.startswith("K_")) == 3
    assert header["id"] == "NO"
    assert header["g_mol"] == "g/mol"


def test_columns_from_header_heat_capacity():
    columns, header = columns_from_header("NO FORMULA NAME A B C D E TMIN TMAX")
    assert columns == ["id", "formula", "name", "A", "B", "C", "D", "E", "TMIN", "TMAX"]
    assert header["A"] == "A"


def test_expand_row_named_values():
    columns = ["id", "formula", "name", "A", "B", "TMIN", "TMAX"]
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
    assert dataset["rows"][0]["id"] == 1
    assert dataset["rows"][0]["g_mol"] == 165.365
    assert "raw" not in dataset["rows"][0]
    assert isinstance(dataset["header"], dict)

    debug = to_debug_table(parsed)
    assert debug["engine"] == "surya"
    assert debug["backend"] == "modal"
    assert debug["model"] == "test/ocr-model"
    assert debug["quant"] == "bf16"
    assert debug["rows"][0]["djvuPage"] == 10
    assert debug["rows"][0]["formulaRaw"] == "CbrCiF2"
    assert debug["unparsed"] == ["p10: junk"]
