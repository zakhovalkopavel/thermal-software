"""
compound_data.molten_salt_links — Liquid equations from the NIST molten-salts extract.

A pure salt (composition 100 and a name with no hyphen) can add a liquid ``density``,
``surfaceTension`` or ``viscosity`` equation. An empty property gets the equation. A property that
already has one keeps it, and the molten-salt equation is added when its type, coefficients or
temperature range differ. An identical equation is not copied again.

``P1``–``P4`` are ``linear`` through ``quartic``. ``+E`` and ``E1`` are ``dipprN101``. ``E2``, a
single point (``DP``) and a composition isotherm (``I1``–``I4``) have no temperature equation here.
A mixture is not a compound: it is written by ``molten_salt_mixtures``, apart from these records.
Electrical conductivity and a formula with no record are left out. Several inorganic carbon-free
records of one formula each receive the equation; several records of a carbon formula are reported
and skipped.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [48] NISTMoltenSalts
"""
from __future__ import annotations

import csv
import io
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

from chemical_formula.formula_elements import ISOTOPES, formula_elements
from chemical_formula.hill_formula import hill_formula
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.parsers.number import parse_number
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_link import SourceLink
from chemicals_tables.table_spec import TableSpec
from compound_data.compound_record import CompoundRecord
from compound_data.constants.molten_salt_source import (
    MOLTEN_SALT_FILES, MOLTEN_SALT_R, molten_salt_table,
)

_CHARGE = re.compile(r"[+-]\d*$")
_SYMBOL = re.compile(r"[A-Z][a-z]?")
_POLY = {
    "P1": (EquationType.linear, ("a", "b")),
    "P2": (EquationType.quadratic, ("a", "b", "c")),
    "P3": (EquationType.cubic, ("a", "b", "c", "d")),
    "P4": (EquationType.quartic, ("a", "b", "c", "d", "e")),
}


@dataclass(frozen=True)
class MoltenEquation:
    """One pure-salt fit, already in the backend equation shape."""

    hill: str
    formula: str
    property: str
    equation: EquationValue


def attach_molten_salts(
    records: Iterable[CompoundRecord], directory: Path,
) -> tuple[list[dict], dict[str, int], list[TableSpec]]:
    """Add liquid equations from ``directory``. Issues, counts and the files that were read."""
    chosen, tables, counts = molten_salt_equations(directory)
    by_hill: dict[str, list[CompoundRecord]] = {}
    for record in records:
        by_hill.setdefault(record.hill, []).append(record)

    issues: list[dict] = []
    reported: set[str] = set()
    counts.update({"moltenFilled": 0, "moltenSame": 0, "moltenNoRecord": 0, "moltenAmbiguous": 0})
    for item in chosen:
        group = by_hill.get(item.hill, [])
        targets = _fillable(group)
        if not group:
            counts["moltenNoRecord"] += 1
            continue
        if not targets:
            counts["moltenAmbiguous"] += 1
            if item.hill not in reported:
                reported.add(item.hill)
                issues.append(report_issue(
                    "moltenFormulaAmbiguous", item.equation.source.table, item.equation.source.line,
                    None, item.formula, formula=item.hill, candidates=sorted(r.id for r in group),
                ))
            continue
        for record in targets:
            values = record.equations.setdefault(item.property, {}).setdefault("liquid", [])
            if any(_same(have, item.equation) for have in values):
                counts["moltenSame"] += 1
                continue
            values.append(_copy(item.equation))
            counts["moltenFilled"] += 1
    return issues, counts, tables


def molten_salt_equations(
    directory: Path,
) -> tuple[list[MoltenEquation], list[TableSpec], dict[str, int]]:
    """Every distinct pure-salt equation, the files read, and the rows that were not an equation."""
    chosen: list[MoltenEquation] = []
    tables: list[TableSpec] = []
    counts = {"moltenEquations": 0, "moltenUnparsed": 0, "moltenUnmapped": 0}
    for file_name, prop, key, table_name, scale in MOLTEN_SALT_FILES:
        path = directory / file_name
        if not path.is_file():
            continue
        table = molten_salt_table(directory, file_name, table_name, key)
        tables.append(table)
        for line, row in _rows(path):
            item = _equation(row, line, prop, scale, table)
            if item is None:
                kind = _skip(row)
                if kind is not None:
                    counts[kind] += 1
                continue
            chosen.append(item)
    counts["moltenEquations"] = len(chosen)
    return chosen, tables, counts


def _equation(
    row: list[str], line: int, prop: str, scale: float, table: TableSpec,
) -> Optional[MoltenEquation]:
    """One pure-salt row as an equation, or None when the row is not used."""
    if len(row) < 7:
        return None
    salt, composition, kind = (row[i].strip() for i in range(3))
    if not salt or "-" in salt or not _pure(composition):
        return None
    if "<" in salt or _charged(salt) or _isotopic(salt):
        return None
    try:
        hill = hill_formula(formula_elements(salt))
    except ValueError:
        return None
    try:
        tmin, tmax = parse_number(row[3]), parse_number(row[4])
    except ValueError:
        return None
    if tmin is None or tmax is None:
        return None
    coeffs = _coeffs(row)
    built = _polynomial(kind, coeffs) or _exponential(kind, coeffs)
    if built is None:
        return None
    type_, vars_ = built
    uncertainty = row[5].strip() if len(row) > 5 else ""
    comment = row[11].strip() if len(row) > 11 else ""
    extra = {"dataType": kind}
    if uncertainty:
        extra["uncertainty"] = uncertainty
    raw: dict = {"data": coeffs}
    if comment:
        raw["comment"] = comment
    equation = EquationValue(
        type=type_, ref=table.ref, vars=vars_, min=_num(tmin), max=_num(tmax),
        source=SourceLink(table.name, table.key, "", table.ref, line, salt, extra),
        k=scale, raw=raw,
    )
    return MoltenEquation(hill, salt, prop, equation)


def _skip(row: list[str]) -> Optional[str]:
    """Why a pure-salt row produced no equation. A mixture row is neither."""
    if len(row) < 3:
        return None
    salt, composition = row[0].strip(), row[1].strip()
    if not salt or "-" in salt or not _pure(composition):
        return None
    try:
        hill_formula(formula_elements(salt))
    except ValueError:
        return "moltenUnparsed"
    return "moltenUnmapped"


def _polynomial(kind: str, coeffs: list[float]) -> Optional[tuple[EquationType, dict[str, float]]]:
    spec = _POLY.get(kind)
    if spec is None or len(coeffs) < len(spec[1]):
        return None
    return spec[0], {name: _num(coeffs[i]) for i, name in enumerate(spec[1])}


def _exponential(kind: str, coeffs: list[float]) -> Optional[tuple[EquationType, dict[str, float]]]:
    """``+E`` and ``E1`` as ``dipprN101``. ``E2`` (``T − c`` in the denominator) is not that form."""
    if kind not in {"+E", "E1"} or len(coeffs) < 2 or coeffs[0] <= 0:
        return None
    if kind == "E1" and len(coeffs) < 3:
        return None
    c4, c5 = (coeffs[2], -2.0) if kind == "E1" else (0.0, 0.0)
    return EquationType.dipprN101, {
        "c1": _num(math.log(coeffs[0])),
        "c2": _num(coeffs[1] / MOLTEN_SALT_R),
        "c3": 0.0,
        "c4": _num(c4),
        "c5": c5,
    }


def _coeffs(row: list[str]) -> list[float]:
    """Data 1…5 up to the first empty cell."""
    coeffs: list[float] = []
    for cell in row[6:11]:
        try:
            number = parse_number(cell)
        except ValueError:
            break
        if number is None:
            break
        coeffs.append(float(number))
    return coeffs


def _pure(composition: str) -> bool:
    try:
        return parse_number(composition) == 100
    except ValueError:
        return False


def _rows(path: Path) -> Iterable[tuple[int, list[str]]]:
    """(file line, cells). The unit line and the column header are skipped."""
    text = path.read_text(encoding="utf-8-sig")
    line = 1
    for index, row in enumerate(csv.reader(io.StringIO(text))):
        if index >= 2:
            yield line, row
        line += sum(cell.count("\n") for cell in row) + 1


def _same(have: EquationValue, new: EquationValue) -> bool:
    """Same type, coefficients, scale and temperature range. A different fit is another equation."""
    return (
        have.type == new.type and have.vars == new.vars and have.min == new.min
        and have.max == new.max and have.k == new.k
    )


def _copy(equation: EquationValue) -> EquationValue:
    return EquationValue(
        equation.type, equation.ref, dict(equation.vars), equation.min, equation.max, equation.source,
        equation.k, dict(equation.raw) if equation.raw else None,
    )


def _num(value: float) -> float:
    return float(f"{float(value):.12g}")


def _charged(formula: str) -> bool:
    return _CHARGE.search(formula.replace(" ", "")) is not None


def _isotopic(formula: str) -> bool:
    return "[" in formula or any(sym in ISOTOPES for sym in _SYMBOL.findall(formula))


def _fillable(group: list[CompoundRecord]) -> list[CompoundRecord]:
    """The records a formula may receive. Isomers of a carbon formula are not filled."""
    if len(group) == 1:
        return group
    plain = all(
        r.compound_class == "inorganic" and "C" not in r.elements and _plain(r.formula) for r in group
    )
    return group if plain else []


def _plain(formula: str) -> bool:
    return not ("[" in formula or _CHARGE.search(formula) or any(s in ISOTOPES for s in _SYMBOL.findall(formula)))
