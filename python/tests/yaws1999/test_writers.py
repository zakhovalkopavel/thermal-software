"""Dataset / debug writers and index."""
from __future__ import annotations

import json
from pathlib import Path

from yaws1999.dataset import dataset_file_name
from yaws1999.writers import (
    resolve_dataset_path,
    write_dataset_table,
    write_debug_table,
    write_index,
)


def test_resolve_dataset_path_no_replace(tmp_path: Path):
    title = "HEAT CAPACITY OF GAS - INORGANIC COMPOUNDS"
    primary = tmp_path / dataset_file_name(title, "2-2")
    primary.write_text("{}", encoding="utf-8")
    assert resolve_dataset_path(tmp_path, title, "2-2", no_replace=False) == primary
    alt = resolve_dataset_path(tmp_path, title, "2-2", tag="q8", no_replace=True)
    assert alt is not None
    assert alt.name.endswith("_(table_2-2).q8.json")
    alt.write_text("{}", encoding="utf-8")
    assert resolve_dataset_path(tmp_path, title, "2-2", tag="q8", no_replace=True) is None


def test_write_dataset_debug_and_index(tmp_path: Path):
    dataset = {
        "id": "2-2",
        "title": "HEAT CAPACITY OF GAS - INORGANIC COMPOUNDS",
        "refKey": "Yaws1999",
        "equation": None,
        "header": {"id": "NO", "formula": "FORMULA", "name": "NAME", "A": "A"},
        "columns": ["id", "formula", "name", "A"],
        "pages": {"first": 45, "last": 49},
        "rows": [{"id": 12, "formula": "Ar", "name": "ARGON", "A": 20.786}],
    }
    path = write_dataset_table(tmp_path, dataset)
    assert "table_2-2" in path.name
    loaded = json.loads(path.read_text(encoding="utf-8"))
    assert loaded["rows"][0]["formula"] == "Ar"
    assert "engine" not in loaded

    debug = {**dataset, "engine": "surya", "quant": "bf16", "dpi": 400, "unparsed": []}
    dbg = write_debug_table(tmp_path / "debug", debug)
    assert dbg.is_file()

    dataset["_file"] = path.name
    index_path = write_index(tmp_path, [dataset], "tmp/sources/yaws.djvu")
    index = json.loads(index_path.read_text(encoding="utf-8"))
    assert index["tables"][0]["file"] == path.name
    assert index["tables"][0]["rowCount"] == 1
    assert index["source"]["refKey"] == "Yaws1999"
