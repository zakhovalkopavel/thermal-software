"""
janaf.writers — JSON serialisation of JANAF tables, one file per JANAF ID prefix.

Writes ``<out_dir>/<prefix>.json`` (``Al.json``, ``O.json``, ...). Tables are grouped
the way NIST files them, so TiO2 (``O-045``) lands in ``O.json``.
``<out_dir>/index.json`` lists every table with its file, plus lookups by formula and element.

Spec: docs/scripts/JANAF_PARSER_SPEC.md
Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path

from janaf.janaf_source import JanafSource
from janaf.janaf_table import JanafTable
from references import RefKey

logger = logging.getLogger(__name__)

_ELEMENT = re.compile(r"[A-Z][a-z]?")

JANAF_META = {
    "ref": RefKey.NISTJANAF.value,
    "units": {
        "T": "K",
        "Cp": "J/(mol K)",
        "S": "J/(mol K)",
        "gef": "J/(mol K)",
        "dH": "kJ/mol",
        "dfH": "kJ/mol",
        "dfG": "kJ/mol",
        "logKf": "-",
    },
}


def write_janaf_json(
    tables: list[JanafTable],
    out_dir: Path,
    source: JanafSource,
) -> list[Path]:
    """Write one JSON file per prefix; returns the written paths in first-seen prefix order."""
    groups: dict[str, list[JanafTable]] = {}
    for table in tables:
        groups.setdefault(table.prefix, []).append(table)

    generated_at = datetime.now(timezone.utc).isoformat()
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for prefix, group in groups.items():
        payload = {
            "ref": JANAF_META["ref"],
            "repository": source.repository,
            "sourceCommit": source.commit,
            "units": JANAF_META["units"],
            "generatedAt": generated_at,
            "prefix": prefix,
            "count": len(group),
            "tables": {table.table_id: _table_entry(table, source) for table in group},
        }
        out_path = out_dir / f"{prefix}.json"
        out_path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False, allow_nan=False),
            encoding="utf-8",
        )
        logger.info("[output] Written → %s  (%d tables)", out_path, len(group))
        written.append(out_path)
    return written


def write_janaf_index(
    tables: list[JanafTable],
    out_dir: Path,
    source: JanafSource,
) -> Path:
    """Write ``<out_dir>/index.json``: one entry per table, plus ``byFormula`` and ``byElement``.

    ``byElement`` lists a table under every element of its JANAF formula,
    so TiO2 (``O-045``, in ``O.json``) is found under both ``O`` and ``Ti``.
    """
    entries: dict[str, dict] = {}
    by_formula: dict[str, list[str]] = {}
    by_element: dict[str, list[str]] = {}
    for table in tables:
        entries[table.table_id] = {
            "formula": table.formula,
            "janafFormula": table.janaf_formula,
            "name": table.name,
            "phase": table.phase,
            "label": table.label,
            "file": f"{table.prefix}.json",
        }
        by_formula.setdefault(table.formula or table.janaf_formula, []).append(table.table_id)
        for element in dict.fromkeys(_ELEMENT.findall(table.janaf_formula)):
            by_element.setdefault(element, []).append(table.table_id)

    payload = {
        "ref": JANAF_META["ref"],
        "repository": source.repository,
        "sourceCommit": source.commit,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "count": len(entries),
        "tables": entries,
        "byFormula": by_formula,
        "byElement": dict(sorted(by_element.items())),
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.json"
    out_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False, allow_nan=False),
        encoding="utf-8",
    )
    logger.info("[output] Written → %s  (%d tables, %d elements)", out_path, len(entries), len(by_element))
    return out_path


def _table_entry(table: JanafTable, source: JanafSource) -> dict:
    entry = table.to_dict()
    rows = entry.pop("rows")
    transitions = entry.pop("transitions")
    entry["sourceUrl"] = source.file_url(table.table_id)
    entry["nistUrl"] = source.nist_url(table.table_id)
    entry["rows"] = rows
    entry["transitions"] = transitions
    return entry
