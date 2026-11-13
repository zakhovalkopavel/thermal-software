"""Dataset / debug writers and index."""
from __future__ import annotations

import json
from pathlib import Path

from yaws1999.dataset import dataset_file_name
from yaws1999.writers import (
    migrate_root_tables,
    purge_legacy_short_table_files,
    resolve_dataset_path,
    tables_directory,
    write_dataset_table,
    write_debug_table,
    write_index,
)


def test_resolve_dataset_path_uses_tables_subdir(tmp_path: Path):
    title = "HEAT CAPACITY OF GAS - INORGANIC COMPOUNDS"
    primary = tables_directory(tmp_path) / dataset_file_name(title, "2-2")
    primary.parent.mkdir(parents=True, exist_ok=True)
    primary.write_text("{}", encoding="utf-8")
    assert resolve_dataset_path(tmp_path, title, "2-2", no_replace=False) == primary
    alt = resolve_dataset_path(tmp_path, title, "2-2", tag="q8", no_replace=True)
    assert alt is not None
    assert alt.parent == tables_directory(tmp_path)
    assert alt.name.endswith("_(table_2-2).q8.json")
    alt.write_text("{}", encoding="utf-8")
    assert resolve_dataset_path(tmp_path, title, "2-2", tag="q8", no_replace=True) is None


def test_write_dataset_debug_and_index(tmp_path: Path):
    dataset = {
        "id": "2-2",
        "title": "HEAT CAPACITY OF GAS - INORGANIC COMPOUNDS",
        "refKey": "Yaws1999",
        "equation": None,
        "columns": [
            {"key": "id", "header": "NO", "unit": None},
            {"key": "formula", "header": "FORMULA", "unit": None},
            {"key": "name", "header": "NAME", "unit": None},
            {"key": "A", "header": "A", "unit": None},
        ],
        "pages": {"first": 45, "last": 49},
        "rows": [{"id": 12, "formula": "Ar", "name": "ARGON", "A": 20.786}],
    }
    path = write_dataset_table(tmp_path, dataset)
    assert path.parent == tables_directory(tmp_path)
    assert "table_2-2" in path.name
    loaded = json.loads(path.read_text(encoding="utf-8"))
    assert loaded["rows"][0]["formula"] == "Ar"
    assert "engine" not in loaded

    debug = {**dataset, "engine": "surya", "quant": "bf16", "dpi": 400, "unparsed": []}
    dbg = write_debug_table(tmp_path / "debug", debug)
    assert dbg.is_file()

    dataset["_file"] = str(path.relative_to(tmp_path)).replace("\\", "/")
    index_path = write_index(tmp_path, [dataset], "tmp/sources/yaws.djvu")
    index = json.loads(index_path.read_text(encoding="utf-8"))
    assert index["tables"][0]["file"] == dataset["_file"]
    assert index["tables"][0]["file"].startswith("tables/")
    assert index["tables"][0]["rowCount"] == 1
    assert index["source"]["refKey"] == "Yaws1999"


def test_migrate_root_tables(tmp_path: Path):
    name = dataset_file_name("HEAT CAPACITY OF GAS - ORGANIC COMPOUNDS", "2-1")
    src = tmp_path / name
    src.write_text('{"id":"2-1"}', encoding="utf-8")
    (tmp_path / "table-1-1.json").write_text("{}", encoding="utf-8")
    (tmp_path / "index.json").write_text(
        json.dumps({"tables": [{"id": "2-1", "file": name}]}),
        encoding="utf-8",
    )
    moves = migrate_root_tables(tmp_path)
    assert moves
    assert (tables_directory(tmp_path) / name).is_file()
    assert (tables_directory(tmp_path) / "table-1-1.json").is_file()
    assert not src.exists()
    index = json.loads((tmp_path / "index.json").read_text(encoding="utf-8"))
    assert index["tables"][0]["file"] == f"tables/{name}"


def test_purge_legacy_short_table_files(tmp_path: Path):
    tables = tables_directory(tmp_path)
    tables.mkdir(parents=True)
    slug = dataset_file_name(
        "CRITICAL PROPERTIES AND ACENTRIC FACTOR - ORGANIC COMPOUNDS", "1-1",
    )
    (tables / slug).write_text('{"id":"1-1"}', encoding="utf-8")
    (tables / "table-1-1.json").write_text('{"id":"1-1"}', encoding="utf-8")
    (tables / "table-1-1.text.json").write_text("{}", encoding="utf-8")
    (tables / "table-9-9.json").write_text('{"id":"9-9"}', encoding="utf-8")
    (tmp_path / "index.json").write_text(
        json.dumps(
            {
                "tables": [
                    {"id": "1-1", "file": f"tables/{slug}"},
                    {"id": "1-1-short", "file": "tables/table-1-1.json"},
                    {"id": "9-9", "file": "tables/table-9-9.json"},
                ]
            }
        ),
        encoding="utf-8",
    )
    removed = purge_legacy_short_table_files(tmp_path)
    assert {p.name for p in removed} == {"table-1-1.json", "table-1-1.text.json"}
    assert (tables / slug).is_file()
    assert not (tables / "table-1-1.json").exists()
    assert (tables / "table-9-9.json").is_file()  # no slug yet → keep
    index = json.loads((tmp_path / "index.json").read_text(encoding="utf-8"))
    files = {t["file"] for t in index["tables"]}
    assert f"tables/{slug}" in files
    assert "tables/table-9-9.json" in files
    assert "tables/table-1-1.json" not in files
