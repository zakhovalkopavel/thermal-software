"""
chemicals_tables.parsers.vdi_ppds — VDI Heat Atlas PPDS tables → equations.

Liquid properties take ``min = Tm`` and ``max = Tc`` from the surface-tension row of the same CAS,
else from the vapor-pressure row, cited in ``rangeRef``. Gas properties have no limits in the
source: ``min/max = None`` and no ``rangeRef``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [41] VDI2010
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional, Union

from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.constants.source_tables import SOURCE_TABLES
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.parsers.cas import parse_cas
from chemicals_tables.parsers.number import parse_number
from chemicals_tables.parsers.tsv_reader import read_tsv
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_entry import SourceEntry
from chemicals_tables.source_link import SourceLink

Number = Union[int, float]
_ABCDE = {"a": "A", "b": "B", "c": "C", "d": "D", "e": "E"}


@dataclass(frozen=True)
class _VdiFile:
    table: str
    type: EquationType
    property: str
    phase: str
    vars: dict[str, str]
    own_range: bool = False


_FILES: tuple[_VdiFile, ...] = (
    _VdiFile("VDI gas viscosity", EquationType.quartic, "viscosity", "gas", _ABCDE),
    _VdiFile("VDI gas thermal conductivity", EquationType.quartic, "thermalConductivity", "gas", _ABCDE),
    _VdiFile("VDI liquid thermal conductivity", EquationType.quartic, "thermalConductivity", "liquid", _ABCDE),
    _VdiFile("VDI liquid viscosity", EquationType.ppds9, "viscosity", "liquid", _ABCDE),
    _VdiFile(
        "VDI liquid density", EquationType.ppds10, "density", "liquid",
        {"Tc": "Tc", "rhoc": "rhoc", "a": "A", "b": "B", "c": "C", "d": "D"},
    ),
    _VdiFile("VDI enthalpy of vaporization", EquationType.ppds12, "enthalpyVaporization", "liquid",
             {"Tc": "Tc", **_ABCDE}),
    _VdiFile(
        "VDI surface tension", EquationType.dipprN106, "surfaceTension", "liquid",
        {"Tc": "Tc", "c1": "A", "c2": "B", "c3": "C", "c4": "D", "c5": "E"}, own_range=True,
    ),
    _VdiFile(
        "VDI vapor pressure", EquationType.wagner25, "vaporPressure", "liquid",
        {"Tc": "Tc", "Pc": "Pc", "a": "A", "b": "B", "c": "C", "d": "D"}, own_range=True,
    ),
)

_RANGE_TABLES = ("VDI surface tension", "VDI vapor pressure")


def parse_vdi_ppds(source_dir: Path, chem: ChemicalsSource) -> tuple[list[SourceEntry], list[dict[str, Any]]]:
    """Equations of the 8 VDI PPDS files and report issues (liquid rows without Tm/Tc, PPDS 9 singularity)."""
    ranges = _range_rows(source_dir, chem)
    entries: list[SourceEntry] = []
    issues: list[dict[str, Any]] = []
    for spec in _FILES:
        table = SOURCE_TABLES[spec.table]
        for line, row in read_tsv(source_dir / table.path):
            cas = parse_cas(row["CAS"])
            label = row.get("Chemical") or None
            vars_ = {var: parse_number(row[column]) or 0 for var, column in spec.vars.items()}
            extra: dict[str, Any] = {}

            if spec.phase == "gas":
                tmin: Optional[Number] = None
                tmax: Optional[Number] = None
            elif spec.own_range:
                tmin, tmax = parse_number(row["Tm"]), parse_number(row["Tc"])
            else:
                found = ranges.get(cas) if cas else None
                if found is None:
                    tmin = tmax = None
                    issues.append(report_issue("vdiLiquidNoRange", table.name, line, cas, label))
                else:
                    tmin, tmax, range_link = found
                    extra["rangeRef"] = range_link

            if spec.type is EquationType.ppds9 and tmin is not None and tmin <= vars_["d"]:
                issues.append(report_issue("ppds9MinAtOrBelowD", table.name, line, cas, label, min=tmin, d=vars_["d"]))

            entries.append(SourceEntry(
                cas=cas, formula=None, label=label, property=spec.property, phase=spec.phase,
                value=EquationValue(
                    type=spec.type, ref=table.ref, vars=vars_, min=tmin, max=tmax,
                    source=chem.link(table, line, label, **extra),
                ),
            ))
    return entries, issues


def _range_rows(source_dir: Path, chem: ChemicalsSource) -> dict[str, tuple[Number, Number, SourceLink]]:
    """CAS → (Tm, Tc, link) from the surface-tension rows, then the vapor-pressure rows."""
    out: dict[str, tuple[Number, Number, SourceLink]] = {}
    for name in _RANGE_TABLES:
        table = SOURCE_TABLES[name]
        for line, row in read_tsv(source_dir / table.path):
            cas = parse_cas(row["CAS"])
            tm, tc = parse_number(row["Tm"]), parse_number(row["Tc"])
            if cas and cas not in out and tm is not None and tc is not None:
                out[cas] = (tm, tc, chem.link(table, line, row.get("Chemical") or None))
    return out
