"""
chemicals_tables.parsers.perry_151 — Perry Table 2-151 Cp rows → linearHyperbolic / quadratic equations.

Cp = 4.184·(a + b·T + c/T² + d·T²) in J/(mol K); no row has both the 1/T² and the T² term.
Rows without Tmin/Tmax (monatomic gases, Cp = 4.97 cal/(mol K)) are kept as raw values only.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [34] Perry8
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Optional, Union

from chemical_formula.formula_cleaner import clean_formula
from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.constants.source_tables import SOURCE_TABLES
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.parsers.cas import parse_cas
from chemicals_tables.parsers.number import parse_number
from chemicals_tables.parsers.tsv_reader import read_tsv
from chemicals_tables.raw_value import RawValue
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_entry import SourceEntry

CAL_TO_J = 4.184
PHASES = {"c": "solid", "gls": "solid", "l": "liquid", "g": "gas"}


def _variant(source_phase: str, subphase: str) -> Optional[str]:
    """Subphase (``α``, ``quartz, β``); glass rows give ``glass`` or ``glass, <subphase>``."""
    if source_phase == "gls":
        return f"glass, {subphase}" if subphase else "glass"
    return subphase or None


def _error(cell: str) -> Union[int, float, str, None]:
    """``%error`` as a number; footnoted cells (``1a``) stay text."""
    try:
        return parse_number(cell)
    except ValueError:
        return cell.strip()


def parse_perry_151(source_dir: Path, chem: ChemicalsSource) -> tuple[list[SourceEntry], list[dict[str, Any]]]:
    """Equation entries, raw entries for rows without a range, and report issues."""
    table = SOURCE_TABLES["Perry 2-151"]
    entries: list[SourceEntry] = []
    issues: list[dict[str, Any]] = []
    for line, row in read_tsv(source_dir / table.path):
        cas = parse_cas(row["Ful CAS"])
        formula = clean_formula(row["Formula"])
        source_phase = row["main phase"]
        phase = PHASES.get(source_phase)
        if phase is None:
            issues.append(report_issue("unknownPhase", table.name, line, cas, formula, phase=source_phase))
            continue

        a = parse_number(row["Constant Term"]) or 0
        b = parse_number(row["+*T term"]) or 0
        inv_t2 = parse_number(row["/T^2 term"])
        t2 = parse_number(row["*T^2 term"])
        tmin = parse_number(row["Tmin"])
        tmax = parse_number(row["Tmax"])
        link = chem.link(
            table, line, formula,
            variant=_variant(source_phase, row["subphase"].strip()), error=_error(row["%error"]),
        )

        if tmin is None or tmax is None:
            entries.append(SourceEntry(
                cas=cas, formula=formula, label=formula, property="heatCapacity", phase=phase,
                value=RawValue(
                    property="heatCapacity", phase=phase, ref=table.ref, source=link,
                    values={"a": a, "b": b, "c": inv_t2 or 0, "d": t2 or 0, "Tmin": tmin, "Tmax": tmax,
                            "unit": "cal/(mol K)"},
                ),
            ))
            issues.append(report_issue("perryNoRange", table.name, line, cas, formula, phase=phase))
            continue

        if t2:
            eq_type, vars_ = EquationType.quadratic, {"a": a, "b": b, "c": t2}
        else:
            eq_type, vars_ = EquationType.linearHyperbolic, {"a": a, "b": b, "d": inv_t2 or 0}
        entries.append(SourceEntry(
            cas=cas, formula=formula, label=formula, property="heatCapacity", phase=phase,
            value=EquationValue(
                type=eq_type, ref=table.ref, vars=vars_, min=tmin, max=tmax, source=link, k=CAL_TO_J,
            ),
        ))
    return entries, issues
