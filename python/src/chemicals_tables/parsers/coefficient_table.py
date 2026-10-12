"""
chemicals_tables.parsers.coefficient_table — Coefficient tables (Poling, Perry 2-153/2-312/2-313/2-314, TRC).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [7] Poling5, [34] Perry8, [40] TRC1994, [38] Yaws2014
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Optional, Union

from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.coefficient_spec import CoefficientSpec
from chemicals_tables.constants.source_tables import SOURCE_TABLES
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.label_variant import label_variant
from chemicals_tables.parsers.cas import parse_cas
from chemicals_tables.parsers.number import parse_number
from chemicals_tables.parsers.tsv_reader import read_tsv
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_entry import SourceEntry
from chemicals_tables.source_link import SourceLink

Number = Union[int, float]


def parse_coefficient_table(
    source_dir: Path,
    spec: CoefficientSpec,
    chem: ChemicalsSource,
    tc_lookup: Optional[dict[str, tuple[Number, SourceLink]]] = None,
) -> tuple[list[SourceEntry], list[dict[str, Any]]]:
    """Equations and scalar values of one table, plus report issues.

    Rows with all coefficient cells empty give no equation (Poling rows with only Cpg/Cpl);
    otherwise an empty cell is 0. Rows without Tmin/Tmax get ``min/max = None`` and an issue.
    ``tc_lookup`` maps CAS → (Tc, link) for specs with ``tc_from``.
    """
    table = SOURCE_TABLES[spec.table]
    entries: list[SourceEntry] = []
    issues: list[dict[str, Any]] = []
    for line, row in read_tsv(source_dir / table.path):
        cas = parse_cas(row.get(table.cas_column))
        label = (row.get(table.label_column) or None) if table.label_column else None
        variant = label_variant(label)
        link = chem.link(table, line, label, variant=variant)

        for column, prop in spec.scalars.items():
            value = parse_number(row.get(column))
            if value is not None:
                entries.append(SourceEntry(
                    cas=cas, formula=None, label=label, property=prop.property,
                    value=PropertyValue(value, table.ref, chem.link(table, line, label, variant=variant), prop.phase),
                ))

        cells = {var: parse_number(row.get(column)) for var, column in spec.vars.items()}
        if all(v is None for v in cells.values()):
            continue
        vars_: dict[str, Any] = {var: 0 if v is None else v for var, v in cells.items()}

        if spec.tc_from:
            found = (tc_lookup or {}).get(cas) if cas else None
            if found is None:
                issues.append(report_issue("missingTc", table.name, line, cas, label, tcFrom=spec.tc_from))
                continue
            tc, tc_link = found
            vars_ = {"Tc": tc, **vars_}
            link.extra["tcRef"] = tc_link

        tmin = parse_number(row.get(spec.tmin_column))
        tmax = parse_number(row.get(spec.tmax_column))
        if tmin is None or tmax is None:
            issues.append(report_issue("noRange", table.name, line, cas, label))

        entries.append(SourceEntry(
            cas=cas, formula=None, label=label, property=spec.property, phase=spec.phase,
            value=EquationValue(
                type=spec.type, ref=table.ref, vars=vars_, min=tmin, max=tmax, source=link, k=spec.k,
            ),
        ))
    return entries, issues
