"""
compound_data.janaf_links — Attach NIST-JANAF table ids to the merged records.

Matching, per table:
1. CAS: the chemicals ``janaf_tables_index.csv`` row of the table (by Hill formula, state, name)
   gives a CAS; when that CAS is a record with the same Hill formula, the table goes to it only.
   A CAS record with another formula is reported (``janafCasFormulaMismatch``) and not used.
2. Formula: otherwise the table goes to every record with its Hill formula (Al2O3 under two CAS,
   isomers). Formulas without a record get a new record, keyed by the CSV CAS when the tables of
   that formula share one, else ``formula:<Hill>``.

Ions (``Al1+``) and deuterium species (``D2O1``) are skipped; they have no chemicals counterpart.
Only the ids are written; the tables are in ``shared/processed/JANAF/`` (``index.json``).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

import re
from typing import Any, Iterable, Optional

from chemical_formula.compound_class import classify_compound
from chemical_formula.constants.organic_families import UNCLASSIFIED
from chemical_formula.formula_elements import ISOTOPES
from chemical_formula.formula_family import formula_family
from chemical_formula.hill_formula import hill_formula
from chemical_formula.iupac_formula import iupac_formula
from chemicals_tables.report_issue import report_issue
from compound_data.compound_record import CompoundRecord
from janaf.janaf_formula import janaf_charge, janaf_counts
from janaf.janaf_table import JanafTable

JANAF_TABLE = "NIST-JANAF"

_TRAILING_GROUP = re.compile(r"\s*\((?:[^()]|\([^()]*\))*\)\s*$")


def attach_janaf(
    records: dict[str, CompoundRecord],
    tables: Iterable[JanafTable],
    cas_index: Optional[dict[tuple[str, str, str], tuple[str, int]]] = None,
) -> list[dict[str, Any]]:
    """Add table ids to ``records`` (new records included); returns report issues.

    ``cas_index`` maps (Hill formula, state, name) → (CAS, CSV line), see ``read_janaf_cas_index``.
    """
    cas_index = cas_index or {}
    issues: list[dict[str, Any]] = []
    by_hill: dict[str, list[tuple[JanafTable, Optional[str]]]] = {}
    counts_by_hill: dict[str, dict[str, float]] = {}
    used_rows: set[tuple[str, str, str]] = set()

    for table in tables:
        if janaf_charge(table.janaf_formula):
            issues.append(_issue("janafIon", table))
            continue
        counts = janaf_counts(table.janaf_formula)
        if counts is None:
            issues.append(_issue("janafFormulaNotParsed", table))
            continue
        if any(s in ISOTOPES for s in counts):
            issues.append(_issue("janafIsotope", table))
            continue
        hill = hill_formula(counts)
        row_key = _row_key(cas_index, hill, table)
        cas, csv_line = cas_index.get(row_key, (None, None))
        if cas is not None:
            used_rows.add(row_key)
        record = records.get(cas) if cas else None
        if record is not None and record.hill == hill:
            _add_ids(record, [table.table_id])
            continue
        if record is not None:
            issues.append(_issue("janafCasFormulaMismatch", table, cas=cas, csvLine=csv_line,
                                 janafHill=hill, recordHill=record.hill))
        by_hill.setdefault(hill, []).append((table, cas if record is None else None))
        counts_by_hill[hill] = counts

    for key in sorted(cas_index.keys() - used_rows):
        cas, csv_line = cas_index[key]
        issues.append(report_issue("janafCasRowUnmatched", JANAF_TABLE, csv_line, cas, key[2],
                                   formula=key[0], state=key[1]))

    records_by_hill: dict[str, list[CompoundRecord]] = {}
    for record in records.values():
        records_by_hill.setdefault(record.hill, []).append(record)

    for hill, group in sorted(by_hill.items()):
        ids = sorted(t.table_id for t, _ in group)
        targets = records_by_hill.get(hill)
        if not targets:
            record = _new_record(hill, counts_by_hill[hill], group, records)
            records[record.id] = record
            targets = [record]
            issues.append(report_issue("janafRecordCreated", JANAF_TABLE, None, record.cas, record.name,
                                       id=record.id, tables=ids))
        elif len(targets) > 1:
            issues.append(report_issue("janafSharedFormula", JANAF_TABLE, None, None, None,
                                       formula=hill, ids=sorted(r.id for r in targets), tables=ids))
        for record in targets:
            _add_ids(record, ids)
    return issues


def _row_key(
    cas_index: dict[tuple[str, str, str], tuple[str, int]], hill: str, table: JanafTable,
) -> tuple[str, str, str]:
    """CSV key of a table; the CSV drops a trailing formula group (``Aluminum Bromide ((AlBr3)2)``)."""
    key = (hill, table.phase or "", table.name)
    if key not in cas_index:
        short = (hill, table.phase or "", _TRAILING_GROUP.sub("", table.name))
        if short in cas_index:
            return short
    return key


def _add_ids(record: CompoundRecord, ids: list[str]) -> None:
    record.janaf = sorted(set(record.janaf) | set(ids))


def _new_record(
    hill: str, counts: dict[str, float], group: list[tuple[JanafTable, Optional[str]]],
    records: dict[str, CompoundRecord],
) -> CompoundRecord:
    """Record for a JANAF-only formula; keyed by the CSV CAS when the group has exactly one unused CAS."""
    cas_set = {cas for _, cas in group if cas}
    cas = next(iter(cas_set)) if len(cas_set) == 1 and not records.keys() & cas_set else None
    compound_class, element_group = classify_compound(counts)
    family = formula_family(counts) if compound_class == "organic" else None
    first = group[0][0]
    return CompoundRecord(
        id=cas or f"formula:{hill}", cas=cas, formula=first.formula or hill, hill=hill,
        display_formula=iupac_formula(counts) if compound_class == "inorganic" else hill, elements=list(counts),
        compound_class=compound_class,
        group=element_group if compound_class == "inorganic" else family or UNCLASSIFIED,
        name=first.name, families=[family] if family else [],
    )


def _issue(kind: str, table: JanafTable, **extra: Any) -> dict[str, Any]:
    return report_issue(kind, JANAF_TABLE, None, extra.pop("cas", None), table.label, tableId=table.table_id,
                        janafFormula=table.janaf_formula, **extra)
