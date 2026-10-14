"""
compound_data.pubchem_identifiers — PubChem records → identifiers for the CAS numbers the chemicals files miss.

Only ``ok`` records become identifiers (``[line, "idPubchemRest<Class>"]``, compound URL by CID); the other
statuses are counted and reported. The files are filled by the separate fetch step.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from collections import Counter
from typing import Any, Optional

from chemicals_tables.identifier import Identifier
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_link import SourceLink
from chemicals_tables.table_spec import TableSpec
from compound_data.pubchem_sources import PubchemSources
from pubchem.constants.pubchem import PUBCHEM_COMPOUND_URL, PUBCHEM_OK
from pubchem.pubchem_result import PubchemResult


def load_pubchem_identifiers(
    sources: PubchemSources, missing: set[str],
) -> tuple[dict[str, Identifier], dict[str, int], list[dict[str, Any]]]:
    """Identifiers of the ``ok`` records for ``missing`` CAS; counts per status and report issues."""
    found: dict[str, Identifier] = {}
    statuses: Counter[str] = Counter()
    issues: list[dict[str, Any]] = []
    for cas in sorted(missing):
        located = sources.find(cas)
        if located is None:
            statuses["notFetched"] += 1
            continue
        record, table, line = located
        result = record.result
        statuses[result.status] += 1
        identifier = pubchem_identifier(result, line, table)
        if identifier is not None:
            found[cas] = identifier
        elif result.status != PUBCHEM_OK:
            issues.append(report_issue(pubchem_count_key(result.status), table.name, line, cas, result.title,
                                       formula=result.formula, candidates=result.candidates))
    counts = {pubchem_count_key(s): n for s, n in sorted(statuses.items())}
    return found, counts, issues


def pubchem_identifier(result: PubchemResult, line: int, table: TableSpec) -> Optional[Identifier]:
    """Identifier of an ``ok`` result; ``line`` is the 1-based line of its record in ``table``'s file."""
    if result.status != PUBCHEM_OK or not result.formula:
        return None
    return Identifier(
        cas=result.cas, formula=result.formula, mw=result.mw, smiles=result.smiles, inchikey=result.inchikey,
        name=result.name, source=pubchem_link(result, line, table), cid=result.cid,
    )


def pubchem_link(result: PubchemResult, line: int, table: TableSpec) -> SourceLink:
    """``[line, "idPubchemRest<Class>"]`` with the compound URL of the result's CID."""
    return SourceLink(
        table=table.name, key=table.key, url=PUBCHEM_COMPOUND_URL.format(cid=result.cid), line=line, label=result.name,
    )


def pubchem_count_key(status: str) -> str:
    """``notFound`` → ``pubchemNotFound``."""
    return f"pubchem{status[0].upper()}{status[1:]}"
