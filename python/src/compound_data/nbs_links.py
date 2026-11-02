"""
compound_data.nbs_links — Fill missing 298.15 K properties from the NBS tables.

A pure ``g`` / ``l`` / ``cr`` (also ``am``, ``vit``) row can add ``enthalpyFormation298``,
``gibbsEnergy298``, ``entropy298`` and ``heatCapacity298`` when that record has no value of that
property in that phase. An existing value stays. ``cr`` is used before ``cr2`` and before amorphous
or vitreous. Ions, isotopes, aqueous rows (``ai``, ``ao``, ``aq``) and ``in N H2O`` rows are not used.
A formula with no record is not given one. Several inorganic carbon-free records of one formula each
receive the gap; several records of a carbon formula (isomers) are reported and skipped.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [47] NBS1982
"""
from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

from chemical_formula.formula_elements import ISOTOPES, formula_elements
from chemical_formula.hill_formula import hill_formula
from chemicals_tables.parsers.number import parse_number
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_link import SourceLink
from compound_data.compound_record import CompoundRecord
from compound_data.constants.nbs_source import NBS_PROPERTIES, nbs_table

_STATE = re.compile(r"^(cr|am|vit|g|l)(\d+)?$")
_CHARGE = re.compile(r"[+-]\d*$")
_SYMBOL = re.compile(r"[A-Z][a-z]?")
_PHASE = {"cr": "solid", "am": "solid", "vit": "solid", "g": "gas", "l": "liquid"}
_FORM_RANK = {"cr": 0, "am": 1, "vit": 2, "g": 0, "l": 0}


@dataclass(frozen=True)
class NbsValue:
    """One chosen NBS cell: the preferred form of that formula, phase and property."""

    hill: str
    phase: str
    property: str
    value: float
    line: int
    formula: str
    variant: Optional[str]


def attach_nbs(
    records: Iterable[CompoundRecord], path: Path,
) -> tuple[list[dict], dict[str, int]]:
    """Add missing phase values from ``path``. Issues (ambiguous formulas) and counts."""
    table = nbs_table(path)
    chosen = nbs_values(path)
    by_hill: dict[str, list[CompoundRecord]] = {}
    for record in records:
        by_hill.setdefault(record.hill, []).append(record)

    issues: list[dict] = []
    reported: set[str] = set()
    counts = {"nbsValues": len(chosen), "nbsFilled": 0, "nbsNoRecord": 0, "nbsAmbiguous": 0}
    for item in chosen:
        group = by_hill.get(item.hill, [])
        targets = _fillable(group)
        if not group:
            counts["nbsNoRecord"] += 1
            continue
        if not targets:
            counts["nbsAmbiguous"] += 1
            if item.hill not in reported:
                reported.add(item.hill)
                issues.append(report_issue(
                    "nbsFormulaAmbiguous", table.name, item.line, None, item.formula,
                    formula=item.hill, candidates=sorted(r.id for r in group),
                ))
            continue
        for record in targets:
            values = record.properties.setdefault(item.property, [])
            if any(v.phase == item.phase for v in values):
                continue
            values.append(PropertyValue(
                item.value, table.ref,
                SourceLink(table.name, table.key, "", table.ref, item.line, item.formula,
                           {"variant": item.variant} if item.variant else {}),
                item.phase,
            ))
            counts["nbsFilled"] += 1
    return issues, counts


def nbs_values(path: Path) -> list[NbsValue]:
    """Preferred cell of each formula, phase and property. Dashes and unusable rows are left out."""
    best: dict[tuple[str, str, str], tuple[tuple[int, int, int], NbsValue]] = {}
    for line, row in _rows(path):
        formula, solvent, _name, description, state = (row[i].strip() for i in range(5))
        if not formula or solvent or "<" in formula or _charged(formula) or _isotopic(formula):
            continue
        parsed = _STATE.fullmatch(state)
        if parsed is None:
            continue
        form, suffix = parsed.group(1), int(parsed.group(2) or 0)
        try:
            hill = hill_formula(formula_elements(formula))
        except ValueError:
            continue
        phase = _PHASE[form]
        rank = (_FORM_RANK[form], suffix, line)
        variant = description or (f"{form}{suffix}" if suffix else None)
        for column, prop, scale in NBS_PROPERTIES:
            try:
                number = parse_number(row[column] if column < len(row) else None)
            except ValueError:
                continue
            if number is None:
                continue
            key = (hill, phase, prop)
            item = NbsValue(hill, phase, prop, float(f"{float(number) * scale:.12g}"), line, formula, variant)
            old = best.get(key)
            if old is None or rank < old[0]:
                best[key] = (rank, item)
    return [item for _, item in best.values()]


def _rows(path: Path) -> Iterable[tuple[int, list[str]]]:
    """(first file line, cells) of each data row. The two header rows are skipped."""
    text = path.read_text(encoding="utf-8-sig")
    line = 1
    for index, row in enumerate(csv.reader(io.StringIO(text))):
        if index >= 2:
            yield line, row
        line += sum(cell.count("\n") for cell in row) + 1


def _charged(formula: str) -> bool:
    """A trailing charge (``NH4+``, ``SO4 2-``). HTML superscripts are rejected by the caller."""
    return _CHARGE.search(formula.replace(" ", "")) is not None


def _isotopic(formula: str) -> bool:
    """``D``, ``T`` or a bracketed mass number. Those counts are not a separate compound here."""
    return "[" in formula or any(sym in ISOTOPES for sym in _SYMBOL.findall(formula))


def _fillable(group: list[CompoundRecord]) -> list[CompoundRecord]:
    """The records a formula may fill. Isomers of a carbon formula are not filled."""
    if len(group) == 1:
        return group
    plain = all(
        r.compound_class == "inorganic" and "C" not in r.elements and _plain(r.formula) for r in group
    )
    return group if plain else []


def _plain(formula: str) -> bool:
    """No isotope symbol and no charge, as in the merger's unidentified rule."""
    return not ("[" in formula or _CHARGE.search(formula) or any(s in ISOTOPES for s in _SYMBOL.findall(formula)))
