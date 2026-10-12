"""
chemicals_tables.parsers.crc_molten_density — CRC molten salt densities → backend ``linear`` equations.

ρ = ρ0 − k·(T − Tm) = (ρ0 + k·Tm) − k·T, in kg/m3, valid Tm..Tmax.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [37] CRC95
"""
from __future__ import annotations

from pathlib import Path

from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.constants.source_tables import SOURCE_TABLES
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.label_variant import label_variant
from chemicals_tables.parsers.cas import parse_cas
from chemicals_tables.parsers.number import parse_number
from chemicals_tables.parsers.tsv_reader import read_tsv
from chemicals_tables.source_entry import SourceEntry


def parse_crc_molten_density(source_dir: Path, chem: ChemicalsSource) -> list[SourceEntry]:
    """One liquid ``density`` equation per row, with the verbatim row in ``raw``."""
    table = SOURCE_TABLES["CRC molten densities"]
    entries: list[SourceEntry] = []
    for line, row in read_tsv(source_dir / table.path):
        rho0, k, tm, tmax = (parse_number(row[c]) for c in ("rho", "k", "Tm", "Tmax"))
        if rho0 is None or k is None or tm is None:
            continue
        label = row["Chemical"] or None
        entries.append(SourceEntry(
            cas=parse_cas(row["CAS"]), formula=None, label=label, property="density", phase="liquid",
            value=EquationValue(
                type=EquationType.linear, ref=table.ref, vars={"a": rho0 + k * tm, "b": -k},
                min=tm, max=tmax, source=chem.link(table, line, label, variant=label_variant(label)),
                raw={"rho0": rho0, "k": k, "Tm": tm, "Tmax": tmax},
            ),
        ))
    return entries
