"""
compound_data.pubchem_formula_links — CAS and PubChem CID for the records without a CAS, from formula searches.

A record keyed ``formula:<source formula>`` keeps its key; an ``ok`` search record ``formula:<Hill>`` of the
fetch step adds ``pubchem_cas`` (the CAS most sources give on the compound's PubChem page), ``pubchem_cid``
and their source (``casRef``). Not added, and reported:

- ``pubchemCasExists`` — the found CAS is already a record (or a moved CAS of one), named with its Hill
  formula: either the compound is in the data twice, or that record has a wrong formula (21548-73-2 is
  Ag2HS in the identifier file, PubChem's Ag2S; 13595-82-9 is AlF3 in the sources, PubChem's AlF);
- ``pubchemFormulaSearch<Status>`` — the search was not ``ok`` (``ambiguous``: isomers of an organic
  formula or equally annotated candidates; ``notFound``: no neutral compound with that formula).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from collections import Counter
from typing import Any, Iterable

from chemicals_tables.report_issue import report_issue
from compound_data.compound_record import CompoundRecord
from compound_data.pubchem_identifiers import pubchem_link
from compound_data.pubchem_sources import PubchemSources
from pubchem.constants.pubchem import PUBCHEM_OK


def attach_pubchem_formulas(
    records: Iterable[CompoundRecord], sources: PubchemSources,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Set ``pubchem_cas`` / ``pubchem_cid`` / ``pubchem_cas_source`` on records without a CAS; issues and counts."""
    records = list(records)
    known = {cas: r for r in records for cas in (r.cas, *r.other_cas) if cas}
    counts: Counter[str] = Counter()
    issues: list[dict[str, Any]] = []
    for record in records:
        if record.cas is not None:
            continue
        located = sources.find(f"formula:{record.hill}")
        if located is None:
            counts["pubchemFormulaNotFetched"] += 1
            continue
        search, table, line = located
        result = search.result
        if result.status != PUBCHEM_OK:
            kind = f"pubchemFormulaSearch{result.status[0].upper()}{result.status[1:]}"
            counts[kind] += 1
            issues.append(report_issue(kind, table.name, line, record.id, record.name, formula=record.hill,
                                       candidates=result.candidates))
            continue
        if result.cas in known:
            counts["pubchemCasExists"] += 1
            issues.append(report_issue("pubchemCasExists", table.name, line, record.id, record.name,
                                       formula=record.hill, pubchemCas=result.cas, pubchemCid=result.cid,
                                       record=known[result.cas].id, recordFormula=known[result.cas].hill))
            continue
        record.pubchem_cas = result.cas
        record.pubchem_cid = result.cid
        record.pubchem_cas_source = pubchem_link(result, line, table)
        counts["pubchemFormulaCas" if result.cas else "pubchemFormulaCidOnly"] += 1
    return issues, dict(sorted(counts.items()))
