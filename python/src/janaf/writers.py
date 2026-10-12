"""
janaf.writers — JSON files of the JANAF dataset, laid out like the compound-data dataset.

Writes one file per compound (``janaf_files``): ``<out_dir>/inorganic/<Element>/<formula>-<name>.json``
and ``<out_dir>/organic/<family>/<formula>-<name>.json``, tables keyed by table ID; plus, in ``<out_dir>``,
``index.json`` (every table with its file, lookups by formula, element and family), ``units.json``
(units of the row columns) and ``sources.json`` (py-janaf repository, commit, license and the URL
templates that resolve each table ``ref`` ``[RefKey, line, table ID]``). Compound files carry no
provenance, units or ``generatedAt``.

Spec: docs/scripts/JANAF_PARSER_SPEC.md
Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any, Iterable

from janaf.constants.row_definitions import JANAF_ROW_DEFINITIONS
from janaf.constants.units import JANAF_UNITS
from janaf.janaf_file import JanafFile
from janaf.janaf_source import JanafSource
from references import RefKey

logger = logging.getLogger(__name__)

_ELEMENT = re.compile(r"[A-Z][a-z]?")


def write_janaf_json(files: Iterable[JanafFile], out_dir: Path) -> list[Path]:
    """Write every compound file; returns the written paths."""
    written = []
    for file in files:
        written.append(_write(out_dir / file.path, file.to_dict()))
        logger.debug("[output] Written → %s  (%d tables)", file.path, len(file.tables))
    logger.info("[output] Written → %s  (%d compound files)", out_dir, len(written))
    return written


def write_janaf_index(files: Iterable[JanafFile], out_dir: Path, generated_at: str) -> Path:
    """Write ``<out_dir>/index.json``: one entry per table, plus ``byFormula``, ``byElement`` and ``byFamily``.

    ``byElement`` lists a table under every element of its JANAF formula,
    so TiO2 (``O-045``, in ``inorganic/Ti/``) is found under both ``O`` and ``Ti``.
    """
    entries: dict[str, dict] = {}
    by_formula: dict[str, list[str]] = {}
    by_element: dict[str, list[str]] = {}
    by_family: dict[str, list[str]] = {}
    for file in files:
        for table in file.tables:
            entry = {
                "hill": file.hill,
                "displayFormula": file.display_formula,
                "formula": table.formula,
                "janafFormula": table.janaf_formula,
                "name": table.name,
                "phase": table.phase,
                "label": table.label,
                "class": file.compound_class,
                "group": file.group,
                "file": file.path,
            }
            entries[table.table_id] = {key: value for key, value in entry.items() if value is not None}
            by_formula.setdefault(file.hill, []).append(table.table_id)
            for element in dict.fromkeys(_ELEMENT.findall(table.janaf_formula)):
                by_element.setdefault(element, []).append(table.table_id)
            if file.compound_class == "organic":
                by_family.setdefault(file.group, []).append(table.table_id)

    payload = {
        "generatedAt": generated_at,
        "count": len(entries),
        "tables": dict(sorted(entries.items())),
        "byFormula": dict(sorted(by_formula.items())),
        "byElement": {k: sorted(v) for k, v in sorted(by_element.items())},
        "byFamily": {k: sorted(v) for k, v in sorted(by_family.items())},
    }
    out_path = _write(out_dir / "index.json", payload)
    logger.info("[output] Written → %s  (%d tables, %d elements)", out_path, len(entries), len(by_element))
    return out_path


def write_janaf_units(out_dir: Path) -> Path:
    """Write ``<out_dir>/units.json``: the unit of every row column, and in ``$comment`` what each column holds."""
    payload: dict[str, Any] = {
        "$comment": [
            "Units of the rows in shared/processed/JANAF; standard state p° = 0.1 MPa (1 bar), Tr = 298.15 K.",
            *(f"{column}: {definition}" for column, definition in JANAF_ROW_DEFINITIONS.items()),
        ],
        "rows": JANAF_UNITS,
    }
    out_path = _write(out_dir / "units.json", payload)
    logger.info("[output] Written → %s", out_path)
    return out_path


def write_janaf_sources(out_dir: Path, source: JanafSource, generated_at: str) -> Path:
    """Write ``<out_dir>/sources.json``: repository, commit, license and the URL templates.

    A table ``ref`` ``[RefKey, line, id]`` resolves to ``tableUrl`` with ``{id}``, then ``lineUrl``.
    """
    payload: dict[str, Any] = {
        "generatedAt": generated_at,
        "ref": RefKey.NISTJANAF.value,
        "repository": source.repository,
        "sourceCommit": source.commit,
        "sourceTree": source.tree_url,
        "license": source.license,
        "lineUrl": "{url}#L{line}",
        "tableUrl": source.file_url("{id}"),
        "nistUrl": source.nist_url("{id}"),
    }
    out_path = _write(out_dir / "sources.json", payload)
    logger.info("[output] Written → %s", out_path)
    return out_path


def _write(path: Path, payload: dict) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False, allow_nan=False), encoding="utf-8")
    return path
