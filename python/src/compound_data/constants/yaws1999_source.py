"""
compound_data.constants.yaws1999_source — Processed Yaws 1999 tables as a compound-data source.

Paths are under ``shared/processed/yaws1999/``. File keys are ``yaws1999Table{id with _ for -}``.

Spec: tmp/spec/02_yaws1999_compound_data_update.md
Refs: docs/REFERENCES.md  [6] Yaws1999
"""
from __future__ import annotations

from chemicals_tables.table_spec import TableSpec
from references import RefKey

YAWS1999_DIR = "shared/processed/yaws1999"
YAWS1999_INDEX = f"{YAWS1999_DIR}/index.json"
YAWS1999_CAS_INDEX = f"{YAWS1999_DIR}/appendix/CAS_Compound_Index.json"
YAWS1999_SYNONYM_INDEX = f"{YAWS1999_DIR}/appendix/Name_and_Synonym_Index.json"
YAWS1999_REPLACE_LOG = "reports/compound-data/yaws1999-replace-log.jsonl"
# Table-only CAS (not in appendix) + noRecord attach misses — review / later PubChem.
YAWS1999_ISSUES_LOG = "reports/compound-data/yaws1999-issues-log.jsonl"
# Compounds created from the Yaws appendix — input for a follow-up PubChem search.
YAWS1999_CREATED_LOG = "reports/compound-data/yaws1999-created-log.jsonl"


def yaws1999_table_key(table_id: str) -> str:
    """``2-1`` → ``yaws1999Table2_1``."""
    return f"yaws1999Table{table_id.replace('-', '_')}"


def yaws1999_table_spec(table_id: str, title: str, path: str) -> TableSpec:
    return TableSpec(title, yaws1999_table_key(table_id), path, RefKey.Yaws1999)
