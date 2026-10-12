"""
compound_data.builder — Run all parsers, merge by CAS, check the equations and attach JANAF table ids and NASA keys.

Besides the chemicals tables, the hand-transcribed transport parameters (``shared/sources/transport-parameters.json``)
are parsed into the same entries; their pair rows are resolved to record ids for ``interactions.json``.

The build is offline: PubChem answers come only from the cache that the second step
(``make compound-data-pubchem``) fills from ``BuildResult.missing_cas``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import logging
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

from chemical_formula.organic_family import OrganicFamilyClassifier
from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.parsers.identifiers import load_identifiers
from chemicals_tables.parsers.provenance import read_chemicals_source
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_entries import parse_source_entries
from chemicals_tables.table_spec import TableSpec
from compound_data.compound_record import CompoundRecord
from compound_data.constants.janaf_cas_index import JANAF_CAS_INDEX
from compound_data.constants.nasa_source import NASA7_DATASET, NASA7_FILE, NASA9_DATASET, NASA9_FILES
from compound_data.equation_check import check_equations
from compound_data.janaf_links import attach_janaf
from compound_data.merger import MergeResult, merge_compounds
from compound_data.nasa_links import attach_nasa, nasa7_species, nasa9_species
from compound_data.parsers.janaf_cas_index import read_janaf_cas_index
from compound_data.parsers.transport_parameters import TransportParameters, parse_transport_parameters
from compound_data.pubchem_identifiers import load_pubchem_identifiers
from janaf.janaf_index import load_janaf_index
from janaf.janaf_source import JanafSource
from janaf.parsers.janaf_table import parse_janaf_tables
from janaf.parsers.provenance import read_janaf_source
from nasa_thermo.parsers.nasa7 import parse_nasa7
from nasa_thermo.parsers.nasa9 import parse_nasa9
from references import RefKey

logger = logging.getLogger(__name__)


@dataclass
class BuildResult:
    """Provenance, merged records and the report payload.

    ``janaf`` is None when JANAF was not read; ``nasa`` is the ``sources.json`` block of the NASA files
    when they were read; ``pubchem_cache`` is the cache path when it was read;
    ``missing_cas`` are the CAS numbers the chemicals identifier files do not have (input of the PubChem step).
    ``transport_tables`` are the tables of the transport-parameters file that were read (for ``sources.json``),
    ``interactions`` its pair rows with the record ids of their species (``interactions.json``).
    """

    chem: ChemicalsSource
    merge: MergeResult
    report: dict[str, Any]
    janaf: Optional[JanafSource] = None
    nasa: Optional[dict[str, Any]] = None
    pubchem_cache: Optional[str] = None
    missing_cas: list[str] = field(default_factory=list)
    transport_tables: list[TableSpec] = field(default_factory=list)
    interactions: list[dict[str, Any]] = field(default_factory=list)


def build_compound_data(
    source_dir: Path, janaf_dir: Optional[Path] = None, pubchem_cache: Optional[Path] = None,
    nasa_dir: Optional[Path] = None, transport_file: Optional[Path] = None,
) -> BuildResult:
    """Parse every table under ``source_dir`` (the chemicals copy with ``PROVENANCE.txt``).

    ``janaf_dir`` is the NIST-JANAF copy (``py-janaf/data``, ``py-janaf/janaf.json``,
    ``PROVENANCE.txt``); its table ids are attached to the records by Hill formula.
    ``pubchem_cache`` is the PubChem identifier cache, used for CAS numbers the chemicals
    identifier files do not have. ``nasa_dir`` holds the NASA-7 / NASA-9 sources (``shared/sources/NASA``);
    their species keys are attached by Hill formula, checked by ΔfH°(298.15).
    ``transport_file`` is ``shared/sources/transport-parameters.json`` (White, TN D-481, Mamedov 2014, Svehla 1995).
    """
    chem = read_chemicals_source(source_dir / "PROVENANCE.txt")
    entries, issues = parse_source_entries(source_dir, chem)
    transport = _parse_transport(transport_file)
    entries += transport.entries
    issues += transport.issues

    wanted = {e.cas for e in entries if e.cas}
    identifiers = load_identifiers(source_dir, chem, wanted)
    chemicals_resolved = len(identifiers)
    missing_cas = sorted(wanted - identifiers.keys())
    pubchem_counts: dict[str, int] = {}
    pubchem_used = None
    if pubchem_cache is not None:
        added, pubchem_counts, pubchem_issues = load_pubchem_identifiers(pubchem_cache, set(missing_cas))
        identifiers.update(added)
        issues += pubchem_issues
        pubchem_used = str(pubchem_cache) if pubchem_cache.is_file() else None
    logger.info("[identifiers] %d of %d CAS numbers resolved (%d from PubChem)",
                len(identifiers), len(wanted), len(identifiers) - chemicals_resolved)

    merge = merge_compounds(entries, identifiers, OrganicFamilyClassifier())
    equation_issues, checks = check_equations(merge.records.values())

    janaf_source, janaf_counts = None, {}
    if janaf_dir is not None:
        janaf_source, janaf_issues, janaf_counts = _attach_janaf(janaf_dir, source_dir / JANAF_CAS_INDEX, merge)
        issues += janaf_issues

    nasa_block, nasa_counts = None, {}
    if nasa_dir is not None:
        nasa_block, nasa_issues, nasa_counts = _attach_nasa(nasa_dir, merge)
        issues += nasa_issues

    interactions, interaction_issues = _resolve_interactions(transport.interactions, merge.records)
    issues += interaction_issues
    transport_counts = {
        "transportEntries": len(transport.entries),
        "transportRecords": sum(1 for r in merge.records.values() if r.transport),
        "transportInteractions": len(interactions),
    } if transport_file is not None else {}

    grouped: dict[str, list[dict[str, Any]]] = {}
    for issue in issues:
        grouped.setdefault(issue["issue"], []).append(issue)
    classes = Counter(r.compound_class for r in merge.records.values())
    report = {
        "repository": chem.repository,
        "sourceCommit": chem.commit,
        "counts": {
            "entries": len(entries),
            "records": len(merge.records),
            "inorganic": classes["inorganic"],
            "organic": classes["organic"],
            "unresolved": len(merge.unresolved),
            "casResolved": len(identifiers),
            "casResolvedPubchem": len(identifiers) - chemicals_resolved,
            "casTotal": len(wanted),
            "casMissing": len(missing_cas),
            **pubchem_counts,
            "formulaConflicts": len(merge.conflicts),
            "unknownCasMoved": len(merge.unknown_cas_moved),
            "unknownCasKept": len(merge.unknown_cas_kept),
            "noCasMoved": len(merge.no_cas_moved),
            "noCasKept": len(merge.no_cas_kept),
            "classOverridden": len(merge.class_overridden),
            "classFromFormula": len(merge.class_from_formula),
            "familyFromFormula": len(merge.family_from_formula),
            "equationIssues": len(equation_issues),
            **janaf_counts,
            **nasa_counts,
            **transport_counts,
            **{kind: len(items) for kind, items in sorted(grouped.items())},
        },
        "formulaConflicts": merge.conflicts,
        "sharedFormulas": merge.shared_formulas,
        "unknownCasMoved": merge.unknown_cas_moved,
        "unknownCasKept": merge.unknown_cas_kept,
        "noCasMoved": merge.no_cas_moved,
        "noCasKept": merge.no_cas_kept,
        "classOverridden": merge.class_overridden,
        "classFromFormula": merge.class_from_formula,
        "familyFromFormula": merge.family_from_formula,
        **{kind: items for kind, items in sorted(grouped.items())},
        "equationIssues": equation_issues,
        "checks": checks,
    }
    return BuildResult(chem=chem, merge=merge, report=report, janaf=janaf_source, nasa=nasa_block,
                       pubchem_cache=pubchem_used, missing_cas=missing_cas, transport_tables=transport.tables,
                       interactions=interactions)


def _parse_transport(transport_file: Optional[Path]) -> TransportParameters:
    """Parse the transport-parameters file; empty with a warning when it is missing."""
    if transport_file is None:
        return TransportParameters()
    if not transport_file.is_file():
        logger.warning("[transport] Not found: %s — transport parameters skipped", transport_file)
        return TransportParameters()
    parsed = parse_transport_parameters(transport_file)
    logger.info("[parse] %-32s %6d values, %d interactions", "Transport parameters", len(parsed.entries),
                len(parsed.interactions))
    return parsed


def _resolve_interactions(
    interactions: list[dict[str, Any]], records: dict[str, CompoundRecord],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Add ``ids`` (record id of each species, by CAS or moved CAS; None without a record) to every pair row."""
    by_cas: dict[str, str] = {}
    for record in records.values():
        for cas in (record.cas, *record.other_cas):
            if cas:
                by_cas[cas] = record.id
    resolved, issues = [], []
    for item in interactions:
        ids = [by_cas.get(cas) if cas else None for cas in item["cas"]]
        for species, cas, record_id in dict.fromkeys(zip(item["species"], item["cas"], ids)):
            if cas and record_id is None:
                issues.append(report_issue("transportInteractionNoRecord", item["ref"][2], item["ref"][1], cas,
                                           species))
        resolved.append({"species": item["species"], "ids": ids, **{k: v for k, v in item.items() if k != "species"}})
    return resolved, issues


def _attach_janaf(
    janaf_dir: Path, cas_index_path: Path, merge: MergeResult,
) -> tuple[Optional[JanafSource], list[dict[str, Any]], dict[str, int]]:
    """Parse the JANAF copy and attach its table ids; skipped with a warning when the copy is missing.

    Without ``cas_index_path`` every table is matched by formula.
    """
    data_dir, index_path = janaf_dir / "py-janaf" / "data", janaf_dir / "py-janaf" / "janaf.json"
    if not data_dir.is_dir() or not index_path.is_file():
        logger.warning("[janaf] Not found: %s or %s — JANAF links skipped", data_dir, index_path)
        return None, [], {}
    source = read_janaf_source(janaf_dir / "PROVENANCE.txt")
    tables = parse_janaf_tables(data_dir, load_janaf_index(index_path))
    if cas_index_path.is_file():
        cas_index = read_janaf_cas_index(cas_index_path)
    else:
        logger.warning("[janaf] Not found: %s — tables matched by formula only", cas_index_path)
        cas_index = {}
    issues = attach_janaf(merge.records, tables, cas_index)
    linked = sum(1 for r in merge.records.values() if r.janaf)
    logger.info("[janaf] %d tables (%d CAS index rows) → %d records", len(tables), len(cas_index), linked)
    return source, issues, {"janafTables": len(tables), "janafCasRows": len(cas_index), "janafRecords": linked}


def _attach_nasa(
    nasa_dir: Path, merge: MergeResult,
) -> tuple[Optional[dict[str, Any]], list[dict[str, Any]], dict[str, int]]:
    """Parse the NASA-7 / NASA-9 sources and attach their keys; skipped with a warning when a file is missing.

    The parser warnings (duplicate keys, bad intervals) are those of ``make nasa-parse`` and are not repeated.
    """
    nasa7_path, nasa9_paths = nasa_dir / NASA7_FILE, [nasa_dir / name for name in NASA9_FILES]
    missing = [p for p in (nasa7_path, *nasa9_paths) if not p.is_file()]
    if missing:
        logger.warning("[nasa] Not found: %s — NASA links skipped", ", ".join(map(str, missing)))
        return None, [], {}
    nasa_logger = logging.getLogger("nasa_thermo")
    level = nasa_logger.level
    nasa_logger.setLevel(logging.CRITICAL)
    try:
        species7, species9 = parse_nasa7(nasa7_path), parse_nasa9(nasa9_paths)
    finally:
        nasa_logger.setLevel(level)
    issues7, counts7 = attach_nasa(merge.records, "nasa7", nasa7_species(species7))
    issues9, counts9 = attach_nasa(merge.records, "nasa9", nasa9_species(species9))
    logger.info("[nasa] NASA-7 %d species → %d records, NASA-9 %d species → %d records",
                counts7["nasa7Species"], counts7["nasa7Records"], counts9["nasa9Species"], counts9["nasa9Records"])
    block = {
        "nasa7": {"ref": RefKey.NASA7.value, "dataset": NASA7_DATASET, "sources": [str(nasa7_path)]},
        "nasa9": {"ref": RefKey.NASA9.value, "dataset": NASA9_DATASET, "sources": [str(p) for p in nasa9_paths]},
    }
    return block, issues7 + issues9, {**counts7, **counts9}
