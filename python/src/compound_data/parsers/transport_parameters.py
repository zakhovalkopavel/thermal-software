"""
compound_data.parsers.transport_parameters — ``shared/sources/transport-parameters.json`` → source entries.

- White Tables 1-2, 1-3, A-6: ``sutherland`` and ``powerLaw`` equations of gas viscosity and thermal
  conductivity (``vars {y0, T0, S}`` / ``{y0, T0, n}``; A-6 in its SI columns, without a range).
- White Table A-7, TN D-481 Table III, Mamedov 2014 Table 1: ``collisionDiameter`` [m] and ``epsilonToKb``
  [K] tagged with their ``potential``; TN D-481 adds ``stockmayerDelta`` and ``dipoleMoment`` [C m].
  Mamedov's values are fitted to second virial coefficients (``basis: secondVirial``); its benzene
  mixture rows are reported and skipped.
- Svehla 1995 Table I: a pure-species row (both species the same, with a CAS) becomes a ``transport``
  value of the record (its methods, σ in m) plus the σ, ε/k, δ, ρ*, V0* of its potential; the other
  rows (binary pairs, the electron, H6F6) are returned as interactions for ``interactions.json``.

Every value cites ``[RefKey, line, fileKey]``, the line being the first line of the row in the file.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [20] White3, [44] Itean1961, [45] Svehla1995, [46] Mamedov2014
"""
from __future__ import annotations

import bisect
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

from chemical_formula.formula_elements import formula_elements
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_entry import SourceEntry
from chemicals_tables.source_link import SourceLink
from chemicals_tables.table_spec import TableSpec
from chemicals_tables.transport_value import TransportValue
from compound_data.constants.transport_source import (
    ANGSTROM, ORIGINAL_REFS, POTENTIALS, SVEHLA_PROPERTIES, TRANSPORT_COLUMNS, TRANSPORT_TABLES,
)

_ROWS = re.compile(r'"rows"\s*:\s*\[')


@dataclass
class TransportParameters:
    """Parsed entries, the interaction rows (record ids not resolved yet), report issues and the tables read."""

    entries: list[SourceEntry] = field(default_factory=list)
    interactions: list[dict[str, Any]] = field(default_factory=list)
    issues: list[dict[str, Any]] = field(default_factory=list)
    tables: list[TableSpec] = field(default_factory=list)


def parse_transport_parameters(path: Path) -> TransportParameters:
    """Read the file; raises ValueError when the row lines cannot be located."""
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    lines = _row_lines(text)
    tables = data.get("tables", [])
    if len(lines) != len(tables) or any(len(l) != len(t.get("rows", [])) for l, t in zip(lines, tables)):
        raise ValueError(f"{path}: row lines do not match the tables")

    out = TransportParameters()
    for table, table_lines in zip(tables, lines):
        spec = TRANSPORT_TABLES.get(table.get("id"))
        if spec is None:
            out.issues.append(report_issue("transportUnknownTable", table.get("id"), None, None, table.get("title")))
            continue
        out.tables.append(spec)
        parse_row = _PARSERS[table["id"]]
        for row, line in zip(table["rows"], table_lines):
            parse_row(out, spec, table["id"], row, line)
    return out


def _row_lines(text: str) -> list[list[int]]:
    """First line of every row, per ``rows`` array, in file order."""
    starts = [0] + [m.end() for m in re.finditer("\n", text)]
    decoder = json.JSONDecoder()
    result = []
    for match in _ROWS.finditer(text):
        idx, lines = _skip(text, match.end()), []
        while text[idx] != "]":
            lines.append(bisect.bisect_right(starts, idx))
            _, idx = decoder.raw_decode(text, idx)
            idx = _skip(text, idx)
            if text[idx] == ",":
                idx = _skip(text, idx + 1)
        result.append(lines)
    return result


def _skip(text: str, idx: int) -> int:
    while text[idx] in " \t\r\n":
        idx += 1
    return idx


def _link(spec: TableSpec, table_id: str, line: int, label: Optional[str], **extra: Any) -> SourceLink:
    original = ORIGINAL_REFS.get(table_id)
    if original is not None:
        extra["originalRef"] = original.value
    return SourceLink(table=spec.name, key=spec.key, url=spec.path, ref=spec.ref, line=line, label=label, extra=extra)


def _formula(text: Optional[str]) -> Optional[str]:
    """The printed formula when it parses (``Air`` does not)."""
    if not text:
        return None
    try:
        formula_elements(text)
    except ValueError:
        return None
    return text


def _si(prop: str, value: float) -> float:
    scale = TRANSPORT_COLUMNS[prop].scale
    return float(f"{value * scale:.12g}") if scale != 1.0 else value


def _property(cas: Optional[str], formula: Optional[str], label: str, prop: str, value: float,
              link: SourceLink) -> SourceEntry:
    return SourceEntry(cas=cas, formula=formula, label=label, property=prop,
                       value=PropertyValue(value=_si(prop, value), ref=link.ref, source=link))


def _equation(cas: Optional[str], formula: Optional[str], label: str, prop: str, type_: EquationType,
              vars_: dict[str, Any], tmin: Optional[float], tmax: Optional[float], link: SourceLink) -> SourceEntry:
    return SourceEntry(cas=cas, formula=formula, label=label, property=prop, phase="gas",
                       value=EquationValue(type=type_, ref=link.ref, vars=vars_, min=tmin, max=tmax, source=link))


def _white_power_sutherland(prop: str, y0_key: str):
    """White Tables 1-2 / 1-3: power law over its error range, Sutherland over its 2% range."""
    def parse(out: TransportParameters, spec: TableSpec, table_id: str, row: dict, line: int) -> None:
        cas, formula, label = row.get("cas"), _formula(row.get("formula")), row["gas"]
        power, sutherland = row["powerLawError"], row["sutherlandRange2Pct"]
        out.entries.append(_equation(
            cas, formula, label, prop, EquationType.powerLaw, {"y0": row[y0_key], "T0": row["T0"], "n": row["n"]},
            power["Tmin"], power["Tmax"], _link(spec, table_id, line, label, error=power["percent"]),
        ))
        out.entries.append(_equation(
            cas, formula, label, prop, EquationType.sutherland, {"y0": row[y0_key], "T0": row["T0"], "S": row["S"]},
            sutherland["Tmin"], sutherland["Tmax"], _link(spec, table_id, line, label, error=2),
        ))
    return parse


def _white_a6(out: TransportParameters, spec: TableSpec, table_id: str, row: dict, line: int) -> None:
    """SI columns; Sutherland when S is printed, power law when n is printed; no range."""
    cas, formula, label, si = row.get("cas"), _formula(row.get("formula")), row["gas"], row["si"]
    if row.get("n") is not None:
        out.entries.append(_equation(cas, formula, label, "viscosity", EquationType.powerLaw,
                                     {"y0": si["mu0"], "T0": si["T0"], "n": row["n"]}, None, None,
                                     _link(spec, table_id, line, label)))
    if si.get("S") is not None:
        out.entries.append(_equation(cas, formula, label, "viscosity", EquationType.sutherland,
                                     {"y0": si["mu0"], "T0": si["T0"], "S": si["S"]}, None, None,
                                     _link(spec, table_id, line, label)))


def _white_a7(out: TransportParameters, spec: TableSpec, table_id: str, row: dict, line: int) -> None:
    cas, formula, label = row.get("cas"), _formula(row.get("formula")), row["gas"]
    for prop, key in (("collisionDiameter", "sigma"), ("epsilonToKb", "epsilonToK")):
        out.entries.append(_property(cas, formula, label, prop, row[key],
                                     _link(spec, table_id, line, label, potential="lennardJones")))


def _itean(out: TransportParameters, spec: TableSpec, table_id: str, row: dict, line: int) -> None:
    cas, formula, label = row.get("cas"), _formula(row.get("formula")), row["molecule"]
    for prop, key in (("collisionDiameter", "sigma"), ("epsilonToKb", "epsilonToK"), ("stockmayerDelta", "delta"),
                      ("dipoleMoment", "dipoleMoment")):
        out.entries.append(_property(cas, formula, label, prop, row[key],
                                     _link(spec, table_id, line, label, potential="stockmayer")))


def _mamedov(out: TransportParameters, spec: TableSpec, table_id: str, row: dict, line: int) -> None:
    label = row["species"]
    if len(row["components"]) != 1:
        out.issues.append(report_issue("transportMixtureSkipped", spec.name, line, None, label))
        return
    cas, formula = row.get("cas"), _formula(row["components"][0])
    for prop, key in (("collisionDiameter", "sigma"), ("epsilonToKb", "epsilonToK")):
        out.entries.append(_property(cas, formula, label, prop, row[key], _link(
            spec, table_id, line, label, potential="lennardJones", basis="secondVirial",
        )))


def _svehla(out: TransportParameters, spec: TableSpec, table_id: str, row: dict, line: int) -> None:
    species, cas_pair = row["species"], row.get("cas") or [None, None]
    methods = [_si_method(m) for m in row["methods"]]
    pure = species[0] == species[1] and cas_pair[0] is not None and row["property"] in SVEHLA_PROPERTIES
    if not pure:
        link = _link(spec, table_id, line, "–".join(species))
        out.interactions.append({
            "species": species, "cas": cas_pair, "property": SVEHLA_PROPERTIES.get(row["property"], row["property"]),
            "methods": methods,
            **({"matchTemperatureK": row["matchTemperatureK"]} if "matchTemperatureK" in row else {}),
            "ref": link.to_ref(),
        })
        return
    cas, formula, label = cas_pair[0], _formula(species[0]), species[0]
    out.entries.append(SourceEntry(
        cas=cas, formula=formula, label=label, property=SVEHLA_PROPERTIES[row["property"]],
        value=TransportValue(ref=spec.ref, methods=methods, source=_link(spec, table_id, line, label),
                             match_temperature=row.get("matchTemperatureK")),
    ))
    for method in row["methods"]:
        if method["method"] not in POTENTIALS or "sigma" not in method:
            continue
        extra = {"potential": method["method"], "basis": method.get("basis"), "citation": method.get("source"),
                 "TminK": method.get("TminK")}
        params = [("collisionDiameter", "sigma"), ("epsilonToKb", "epsilonToK"), ("stockmayerDelta", "delta"),
                  ("rhoStar", "rhoStar"), ("V0Star", "V0Star")]
        for prop, key in params:
            if key in method:
                out.entries.append(_property(cas, formula, label, prop, method[key],
                                             _link(spec, table_id, line, label, **extra)))


def _si_method(method: dict[str, Any]) -> dict[str, Any]:
    """σ in m and ``epsilonToK`` named ``epsilonToKb`` as in the properties; the rest as printed."""
    out = {}
    for key, value in method.items():
        if key == "sigma":
            out["sigma"] = float(f"{value * ANGSTROM:.12g}")
        elif key == "epsilonToK":
            out["epsilonToKb"] = value
        else:
            out[key] = value
    return out


_PARSERS = {
    "white-table-1-2": _white_power_sutherland("viscosity", "mu0"),
    "white-table-1-3": _white_power_sutherland("thermalConductivity", "k0"),
    "white-table-a-6": _white_a6,
    "white-table-a-7": _white_a7,
    "itean1961-table-3": _itean,
    "mamedov2014-table-1": _mamedov,
    "svehla1995-table-1": _svehla,
}
