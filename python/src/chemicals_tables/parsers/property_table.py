"""
chemicals_tables.parsers.property_table — Scalar tables (CRC, Yaws) → ``PropertyValue`` entries.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [37] CRC95, [38] Yaws2014
"""
from __future__ import annotations

from pathlib import Path

from chemical_formula.formula_cleaner import clean_formula
from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.label_variant import label_variant
from chemicals_tables.parsers.cas import parse_cas
from chemicals_tables.parsers.number import parse_number
from chemicals_tables.parsers.tsv_reader import read_tsv
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.source_entry import SourceEntry
from chemicals_tables.table_spec import TableSpec


def parse_property_table(source_dir: Path, table: TableSpec, chem: ChemicalsSource) -> list[SourceEntry]:
    """One entry per non-empty mapped cell; each keeps its row label and line."""
    entries: list[SourceEntry] = []
    for line, row in read_tsv(source_dir / table.path):
        cas = parse_cas(row.get(table.cas_column))
        label = (row.get(table.label_column) or None) if table.label_column else None
        formula = clean_formula(row.get(table.formula_column)) if table.formula_column else None
        for column, prop in table.columns.items():
            value = parse_number(row.get(column))
            if value is None:
                continue
            entries.append(SourceEntry(
                cas=cas, formula=formula, label=label, property=prop.property,
                value=PropertyValue(
                    value=float(f"{value * prop.scale:.12g}") if prop.scale != 1.0 else value,
                    ref=table.ref,
                    source=chem.link(table, line, label, variant=label_variant(label), **dict(prop.extra)),
                    phase=prop.phase,
                ),
            ))
    return entries
