"""
compound_data.writers — JSON files of the compound dataset.

Writes one file per compound (``compound_files``): ``<out_dir>/inorganic/<Element>/<formula>-<name>.json``
and ``<out_dir>/organic/<family>/<formula>-<name>.json``, entries keyed by CAS (``noCas`` without one);
plus ``unresolved.json``, ``index.json``, ``units.json``, ``sources.json`` and ``interactions.json``
(transport data of species pairs) in ``<out_dir>``, and the CAS list for the PubChem step
(``write_missing_cas``, in the report directory).
Values cite their row as ``ref: [RefKey, line, fileKey]``, except a PubChem experimental value,
which cites ``pubchem`` + the catalog number (``pubchem151``). ``sources.json`` maps the file keys to
the pinned repository files, explains that PubChem citation, and gives the URL templates of the JANAF
table ids (``janaf``) and the NASA datasets of the ``nasa7`` / ``nasa9`` keys (``nasa``).
Units are listed once, in ``units.json``. Compound files carry no ``generatedAt``, so a rebuild only
changes the files whose data changed.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Iterable, Optional

from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.constants.planned_equation_types import PLANNED_EQUATION_TYPES
from chemicals_tables.constants.source_tables import SOURCE_TABLES
from chemicals_tables.table_spec import TableSpec
from compound_data.compound_file import CompoundFile
from compound_data.compound_units import compound_units
from janaf.janaf_source import JanafSource
from pubchem.constants.pubchem import PUBCHEM_API, PUBCHEM_COMPOUND_URL
from references import RefKey

logger = logging.getLogger(__name__)

JANAF_DATASET = "shared/processed/JANAF/index.json"


def write_compound_sources(
    out_dir: Path, chem: ChemicalsSource, generated_at: str, janaf: Optional[JanafSource] = None,
    pubchem_tables: Iterable[TableSpec] = (), nasa: Optional[dict[str, Any]] = None,
    transport_tables: Iterable[TableSpec] = (),
) -> Path:
    """Write ``sources.json``: repository, commit, license, the file-key → file map, the JANAF and NASA links.

    With ``pubchem_tables`` (the PubChem class files that were read), the map gets their keys
    (``idPubchemRestInorganic`` …, local files, ``url: null``) and a ``pubchem`` block with the folder and the
    compound URL template for ``pubchemCid``. ``transport_tables`` add their file keys (the local
    transport-parameters file, ``url: null``).
    """
    payload: dict[str, Any] = {
        "generatedAt": generated_at,
        "repository": chem.repository,
        "sourceCommit": chem.commit,
        "sourceTree": chem.tree_url,
        "license": chem.license,
        "lineUrl": "{url}#L{line}",
        "files": {
            t.key: {
                "name": t.name, "path": t.path, "ref": t.ref.value if t.ref else None, "url": chem.file_url(t.path),
            }
            for t in SOURCE_TABLES.values()
        },
    }
    if janaf is not None:
        payload["janaf"] = {
            "ref": RefKey.NISTJANAF.value,
            "repository": janaf.repository,
            "sourceCommit": janaf.commit,
            "dataset": JANAF_DATASET,
            "tableUrl": janaf.file_url("{id}"),
            "nistUrl": janaf.nist_url("{id}"),
        }
    if nasa is not None:
        payload["nasa"] = nasa
    pubchem_tables = list(pubchem_tables)
    for table in pubchem_tables:
        payload["files"][table.key] = {"name": table.name, "path": table.path, "ref": None, "url": None}
    if pubchem_tables:
        folder = Path(pubchem_tables[0].path).parent
        payload["pubchem"] = {
            "api": PUBCHEM_API,
            "cache": str(folder),
            "compoundUrl": PUBCHEM_COMPOUND_URL,
            "references": str(folder / "pubchem-references.jsonl"),
            "ref": "pubchem{refNumber}",
            "refNote": "pubchem151 is refNumber 151 in references (source, refCode). "
                       "The same refNumber is on the citation in the class file "
                       "(pubchem-inorganic.jsonl or pubchem-organic.jsonl). "
                       "It is not a key of the main references database.",
        }
    for table in transport_tables:
        payload["files"][table.key] = {"name": table.name, "path": table.path, "ref": table.ref.value, "url": None}
    path = _write(out_dir / "sources.json", payload)
    logger.info("[output] Written → %s  (%d files)", path, len(payload["files"]))
    return path


def write_interactions(out_dir: Path, interactions: list[dict[str, Any]], generated_at: str) -> Path:
    """Write ``interactions.json``: transport data of species pairs (Svehla 1995 diffusion, ions, electron).

    ``ids`` are the record ids of the two species (null without a record); values are in the units of ``units.json``.
    """
    path = _write(out_dir / "interactions.json", {"generatedAt": generated_at, "count": len(interactions),
                                                  "interactions": interactions})
    logger.info("[output] Written → interactions.json  (%d pairs)", len(interactions))
    return path


def write_compound_json(files: Iterable[CompoundFile], out_dir: Path) -> list[Path]:
    """Write every compound file; returns the written paths."""
    written = []
    counts: dict[str, int] = {}
    for file in files:
        written.append(_write(out_dir / file.path, file.to_dict()))
        counts[file.compound_class] = counts.get(file.compound_class, 0) + 1
        logger.debug("[output] Written → %s  (%d entries)", file.path, len(file.entries))
    for compound_class, count in sorted(counts.items()):
        logger.info("[output] Written → %s/  (%d compound files)", compound_class, count)
    return written


def write_unresolved(out_dir: Path, unresolved: list[dict[str, Any]], generated_at: str) -> Path:
    """Write ``unresolved.json``: source rows that could not become a record."""
    path = _write(out_dir / "unresolved.json", {"generatedAt": generated_at, "count": len(unresolved),
                                                "entries": unresolved})
    logger.info("[output] Written → unresolved.json  (%d entries)", len(unresolved))
    return path


def write_compound_units(out_dir: Path) -> Path:
    """Write ``units.json``: the unit of every property, equation result, ``Mr`` and temperature."""
    path = _write(out_dir / "units.json", compound_units())
    logger.info("[output] Written → %s", path)
    return path


def write_compound_index(files: Iterable[CompoundFile], out_dir: Path, generated_at: str) -> Path:
    """Write ``index.json``: per-compound summary and the byFormula / byElement / byFamily / byOtherCas lookups.

    A record is at ``file`` → ``entries[entry]``; null and empty fields are left out.
    """
    located = [(file, key, record) for file in files for key, record in file.entries.items()]
    compounds: dict[str, dict[str, Any]] = {}
    by_formula: dict[str, list[str]] = {}
    by_element: dict[str, list[str]] = {}
    by_family: dict[str, list[str]] = {}
    by_other_cas: dict[str, str] = {}
    types: set[str] = set()
    for file, key, record in sorted(located, key=lambda item: item[2].id):
        entry = {
            "file": file.path,
            "hill": record.hill,
            "displayFormula": record.display_formula,
            "entry": key,
            "cas": record.pubchem_cas,
            "formula": record.formula if record.formula != record.hill else None,
            "name": record.name,
            "class": record.compound_class,
            "group": record.group,
            "families": record.families,
            "refs": record.refs(),
            "properties": sorted(record.properties),
            "equations": record.equation_phases(),
            "transport": sorted(record.transport),
            "janaf": record.janaf,
            "nasa7": record.nasa7,
            "nasa9": record.nasa9,
            "otherCas": record.other_cas,
        }
        compounds[record.id] = {k: v for k, v in entry.items() if v is not None and v != [] and v != {}}
        for cas in record.other_cas:
            by_other_cas[cas] = record.id
        by_formula.setdefault(record.hill, []).append(record.id)
        for element in record.elements:
            by_element.setdefault(element, []).append(record.id)
        for family in record.families:
            by_family.setdefault(family, []).append(record.id)
        types |= {v.type.value for phases in record.equations.values() for vs in phases.values() for v in vs}

    payload = {
        "generatedAt": generated_at,
        "count": len(compounds),
        "equationTypes": {t: "planned" if t in PLANNED_EQUATION_TYPES else "implemented" for t in sorted(types)},
        "compounds": compounds,
        "byFormula": dict(sorted(by_formula.items())),
        "byElement": dict(sorted(by_element.items())),
        "byFamily": dict(sorted(by_family.items())),
        "byOtherCas": dict(sorted(by_other_cas.items())),
    }
    path = _write(out_dir / "index.json", payload)
    logger.info("[output] Written → %s  (%d compounds, %d elements)", path, len(compounds), len(by_element))
    return path


def write_missing_cas(path: Path, cas_numbers: Iterable[str], generated_at: str) -> Path:
    """Write the CAS numbers the chemicals identifier files miss, one per line (input of the PubChem step)."""
    cas_numbers = sorted(cas_numbers)
    header = [
        "# CAS numbers of the compound data tables missing from the chemicals identifier files",
        "# input of make compound-data-pubchem (scripts/fetch_pubchem_identifiers.py)",
        f"# generated: {generated_at}  count: {len(cas_numbers)}",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join([*header, *cas_numbers]) + "\n", encoding="utf-8")
    logger.info("[output] Written → %s  (%d CAS numbers for PubChem)", path, len(cas_numbers))
    return path


def _write(path: Path, payload: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False, allow_nan=False), encoding="utf-8")
    return path
