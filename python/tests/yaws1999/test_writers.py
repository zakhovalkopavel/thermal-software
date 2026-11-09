"""One JSON file per handbook table."""
from __future__ import annotations

import json
from pathlib import Path

from yaws1999.writers import resolve_table_path, table_file_name, write_index, write_table


def test_table_file_name():
    assert table_file_name("2-1") == "table-2-1.json"
    assert table_file_name("2-1", engine="q8") == "table-2-1.q8.json"


def test_resolve_table_path_no_replace(tmp_path: Path):
    primary = tmp_path / "table-2-2.json"
    primary.write_text("{}", encoding="utf-8")
    assert resolve_table_path(tmp_path, "2-2", "q8", no_replace=False) == primary
    alt = resolve_table_path(tmp_path, "2-2", "q8", no_replace=True)
    assert alt == tmp_path / "table-2-2.q8.json"
    alt.write_text("{}", encoding="utf-8")
    assert resolve_table_path(tmp_path, "2-2", "q8", no_replace=True) is None


def test_write_table_and_index(tmp_path: Path):
    table = {
        "id": "2-2",
        "title": "HEAT CAPACITY OF GAS - INORGANIC COMPOUNDS",
        "engine": "surya",
        "quant": "bf16",
        "djvuPages": {"first": 54, "last": 58},
        "rows": [{"no": 12, "formula": "Ar", "name": "ARGON", "values": [20.786]}],
        "unparsed": [],
    }
    path = write_table(tmp_path, table)
    assert path.name == "table-2-2.json"
    loaded = json.loads(path.read_text(encoding="utf-8"))
    assert loaded["rows"][0]["formula"] == "Ar"

    index_path = write_index(tmp_path, [table], "tmp/sources/yaws.djvu")
    index = json.loads(index_path.read_text(encoding="utf-8"))
    assert index["tables"][0]["file"] == "table-2-2.json"
    assert index["tables"][0]["rowCount"] == 1
    assert index["source"]["refKey"] == "Yaws1999"


def test_write_index_merges_existing(tmp_path: Path):
    bf16 = {
        "id": "2-2",
        "title": "HEAT CAPACITY",
        "engine": "surya",
        "quant": "bf16",
        "_file": "table-2-2.json",
        "djvuPages": {"first": 54, "last": 58},
        "rows": [{"no": 1}],
        "unparsed": [],
    }
    write_index(tmp_path, [bf16], "tmp/sources/yaws.djvu")
    q8 = {
        "id": "2-2",
        "title": "HEAT CAPACITY",
        "engine": "surya",
        "quant": "q8",
        "_file": "table-2-2.q8.json",
        "djvuPages": {"first": 54, "last": 58},
        "rows": [{"no": 1}, {"no": 2}],
        "unparsed": [],
    }
    index_path = write_index(tmp_path, [q8], "tmp/sources/yaws.djvu", merge_existing=True)
    index = json.loads(index_path.read_text(encoding="utf-8"))
    files = {t["file"] for t in index["tables"]}
    assert files == {"table-2-2.json", "table-2-2.q8.json"}
