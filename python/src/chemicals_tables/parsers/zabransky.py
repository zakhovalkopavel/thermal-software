"""
chemicals_tables.parsers.zabransky — Zabransky liquid Cp → ``zabranskySpline`` / ``zabranskyQuasiPolynomial``.

A row is a spline when any A1..A4-spline coefficient is non-zero, else a quasi-polynomial.
Spline rows of one CAS and data type are chained in file order while each row's Tmin equals the
previous Tmax; a gap or overlap (alternative fits) starts a new equation and is reported.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [39] Zabransky1996
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.constants.gas_constant import GAS_CONSTANT
from chemicals_tables.constants.source_tables import SOURCE_TABLES
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.parsers.cas import parse_cas
from chemicals_tables.parsers.number import parse_number
from chemicals_tables.parsers.tsv_reader import read_tsv
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_entry import SourceEntry


def parse_zabransky(source_dir: Path, chem: ChemicalsSource) -> tuple[list[SourceEntry], list[dict[str, Any]]]:
    """Liquid heatCapacity equations and report issues (CAS ``None`` rows, broken spline chains)."""
    table = SOURCE_TABLES["Zabransky"]
    entries: list[SourceEntry] = []
    issues: list[dict[str, Any]] = []
    chains: list[dict[str, Any]] = []
    open_chain: dict[tuple[str, str, str], dict[str, Any]] = {}

    for line, row in read_tsv(source_dir / table.path):
        raw_cas = row["CASRN"]
        cas = parse_cas(raw_cas)
        label = row["Name"] or None
        data_type = row["Data Type"]
        tmin, tmax = parse_number(row["Tmin"]), parse_number(row["Tmax"])
        spline = [parse_number(row[f"A{i}-spline"]) or 0 for i in range(1, 5)]
        if cas is None:
            issues.append(report_issue("zabranskyNoCas", table.name, line, None, label, casCell=raw_cas))

        if any(spline):
            key = (cas or raw_cas, label or "", data_type)
            chain = open_chain.get(key)
            if chain is not None and chain["ranges"][-1]["Tmax"] != tmin:
                issues.append(report_issue(
                    "zabranskySplineSplit", table.name, line, cas, label, dataType=data_type,
                    previousLine=chain["lines"][-1],
                ))
                chain = None
            if chain is None:
                chain = {"cas": cas, "label": label, "dataType": data_type, "ranges": [], "lines": [],
                         "uncertainty": []}
                open_chain[key] = chain
                chains.append(chain)
            chain["ranges"].append({"Tmin": tmin, "Tmax": tmax, **{f"a{i + 1}": c for i, c in enumerate(spline)}})
            chain["lines"].append(line)
            chain["uncertainty"].append(row["Uncertainty"])
            continue

        quasi = [parse_number(row[f"A{i}-quasi"]) or 0 for i in range(1, 7)]
        tc = parse_number(row["Tc"])
        if tc is None:
            issues.append(report_issue("zabranskyQuasiNoTc", table.name, line, cas, label))
            continue
        entries.append(SourceEntry(
            cas=cas, formula=None, label=label, property="heatCapacity", phase="liquid",
            value=EquationValue(
                type=EquationType.zabranskyQuasiPolynomial, ref=table.ref,
                vars={"Tc": tc, **{f"a{i + 1}": c for i, c in enumerate(quasi)}},
                min=tmin, max=tmax, k=GAS_CONSTANT,
                source=chem.link(table, line, label, dataType=data_type, uncertainty=row["Uncertainty"] or None),
            ),
        ))

    for chain in chains:
        entries.append(SourceEntry(
            cas=chain["cas"], formula=None, label=chain["label"], property="heatCapacity", phase="liquid",
            value=EquationValue(
                type=EquationType.zabranskySpline, ref=table.ref, vars={"ranges": chain["ranges"]},
                min=chain["ranges"][0]["Tmin"], max=chain["ranges"][-1]["Tmax"], k=GAS_CONSTANT,
                source=chem.link(
                    table, chain["lines"][0], chain["label"], dataType=chain["dataType"],
                    uncertainty=_uncertainty(chain["uncertainty"]),
                ),
            ),
        ))
    return entries, issues


def _uncertainty(classes: list[str]) -> Optional[str | list[str]]:
    """One class when all ranges share it, else the per-range list."""
    unique = {c for c in classes if c}
    if not unique:
        return None
    return classes[0] if len(unique) == 1 and all(classes) else classes
