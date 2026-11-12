"""Sandbox: reshape one Yaws debug dump via source_extract (no OCR)."""
from __future__ import annotations

import json
from pathlib import Path

from source_extract import ExtractRequest, extract_and_save
from yaws1999.column_schemas import schema_for
from yaws1999.constants import PAGE_OFFSET, REF_KEY
from yaws1999.dataset import to_dataset_table

ROOT = Path("/opt/thermal-software")
DEBUG = ROOT / "tmp/reports/python/yaws1999/debug"
OUT = ROOT / "tmp/reports/python/scratch/source-extract-sandbox/tables"


def _pick_debug() -> Path:
    preferred = list(DEBUG.glob("*table_12-1*.json")) or list(DEBUG.glob("*table_1-1*.json"))
    if preferred:
        return preferred[0]
    found = sorted(DEBUG.glob("*.json"))
    if not found:
        raise SystemExit(f"no debug tables under {DEBUG}")
    return found[0]


def main() -> None:
    path = _pick_debug()
    raw = json.loads(path.read_text(encoding="utf-8"))
    columns = raw.get("columns") or []
    value_keys = [
        (c["key"] if isinstance(c, dict) else c)
        for c in columns
        if (c["key"] if isinstance(c, dict) else c) not in ("id", "formula", "name")
    ]
    parsed = {
        "id": raw["id"],
        "title": raw.get("title"),
        "header": raw.get("headerRaw"),
        "columns": schema_for(raw["id"]) or columns,
        "equation": raw.get("equation"),
        "rows": [
            {
                "no": r.get("id"),
                "formula": r.get("formula"),
                "name": r.get("name"),
                "values": [r.get(k) for k in value_keys],
                "djvuPage": r.get("djvuPage"),
                "raw": r.get("raw"),
            }
            for r in (raw.get("rows") or [])[:8]
        ],
        "djvuPages": raw.get("djvuPages"),
        "engine": "sandbox",
        "backend": "source_extract",
        "unparsed": [],
    }

    OUT.mkdir(parents=True, exist_ok=True)
    result = extract_and_save(
        ExtractRequest(
            kind="table",
            source_path=str(path),
            out_dir=OUT,
            ref_key=REF_KEY,
            parsed_table=parsed,
            page_offset=PAGE_OFFSET,
            debug_dir=OUT / "debug",
            verify=True,
        )
    )
    via_yaws = to_dataset_table(parsed)
    print("source:", path.name)
    print("dataset:", result.dataset_path)
    print("verify_ok:", result.verify_ok, "issues:", len(result.verify_issues))
    print(
        "yaws adapter id=",
        via_yaws["id"],
        "rows=",
        len(via_yaws["rows"]),
        "ref=",
        via_yaws["refKey"],
    )


if __name__ == "__main__":
    main()
