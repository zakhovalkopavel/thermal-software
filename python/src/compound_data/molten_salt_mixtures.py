"""
compound_data.molten_salt_mixtures — Molten-salt mixtures, outside the compound dataset.

A mixture is a hyphenated salt name. It is not a compound and it has no CAS, so it is not given a
compound record. Each system keeps the composition of every fit (mole percent of the components, in
the printed order). Temperature fits use the same equation types as a pure salt. A composition
isotherm (``I1``–``I4``) is a polynomial in mole percent at one temperature, not a temperature
equation. ``E2`` keeps its printed coefficients. Electrical conductivity is stored here, in S/m.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [48] NISTMoltenSalts
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Optional, Union

from chemical_formula.formula_elements import formula_elements
from chemical_formula.hill_formula import hill_formula
from chemicals_tables.parsers.number import parse_number
from chemicals_tables.table_spec import TableSpec
from compound_data.constants.molten_salt_source import (
    MOLTEN_SALT_CONDUCTIVITY, MOLTEN_SALT_FILES, molten_salt_table,
)
from compound_data.molten_salt_links import (
    _charged, _coeffs, _exponential, _isotopic, _num, _polynomial, _rows,
)

logger = logging.getLogger(__name__)

_COMPOSITION_VARS = ("a", "b", "c", "d", "e")
_FILES = (*MOLTEN_SALT_FILES, MOLTEN_SALT_CONDUCTIVITY)
Composition = Union[list[float], dict[str, Any]]


def read_molten_salt_mixtures(
    directory: Path,
) -> tuple[list[dict[str, Any]], list[TableSpec], dict[str, int]]:
    """Every mixture, the files that were read, and counts. A pure salt is not included."""
    systems: dict[str, dict[str, Any]] = {}
    tables: list[TableSpec] = []
    skipped = 0
    for file_name, prop, key, table_name, scale in _FILES:
        path = directory / file_name
        if not path.is_file():
            continue
        table = molten_salt_table(directory, file_name, table_name, key)
        tables.append(table)
        for line, row in _rows(path):
            if len(row) < 7:
                continue
            salt = row[0].strip()
            components = _components(salt)
            if components is None:
                continue
            composition = _composition(row[1], [c["formula"] for c in components])
            value = _value(row, line, scale, table, composition)
            if value is None:
                skipped += 1
                continue
            system = systems.setdefault(salt, {"id": salt, "components": components, "properties": {}})
            values = system["properties"].setdefault(prop, [])
            if any(_same(have, value) for have in values):
                continue
            values.append(value)
    mixtures = [systems[key] for key in sorted(systems)]
    count = sum(len(values) for mix in mixtures for values in mix["properties"].values())
    return mixtures, tables, {
        "moltenMixtures": len(mixtures), "moltenMixtureValues": count, "moltenMixtureSkipped": skipped,
    }


def write_molten_salt_mixtures(
    out_dir: Path, mixtures: list[dict[str, Any]], tables: list[TableSpec], generated_at: str,
) -> Path:
    """Write ``mixtures.json``. The file is not part of the compound dataset."""
    payload = {
        "generatedAt": generated_at,
        "count": len(mixtures),
        "ref": "NISTMoltenSalts",
        "url": "https://data.nist.gov/pdr/lps/ark:/88434/mds2-2298",
        "composition": "mol%",
        "temperature": "K",
        "units": {
            "density": "kg/m3",
            "surfaceTension": "N/m",
            "viscosity": "Pa s",
            "electricalConductivity": "S/m",
        },
        "files": {
            table.key: {
                "name": table.name, "path": table.path,
                "ref": table.ref.value if table.ref else None, "url": None,
            }
            for table in tables
        },
        "mixtures": mixtures,
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "mixtures.json"
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False, allow_nan=False), encoding="utf-8")
    logger.info("[output] Written → %s  (%d mixtures)", path, len(mixtures))
    return path


def _value(
    row: list[str], line: int, scale: float, table: TableSpec, composition: Optional[Composition],
) -> Optional[dict[str, Any]]:
    """One mixture row. None when the composition or the coefficients cannot be read."""
    if composition is None:
        return None
    kind = row[2].strip()
    coeffs = _coeffs(row)
    try:
        tmin, tmax = parse_number(row[3]), parse_number(row[4])
    except ValueError:
        tmin = tmax = None
    value: dict[str, Any] = {"composition": composition, "dataType": kind, "k": scale,
                             "ref": [table.ref.value if table.ref else None, line, table.key]}
    uncertainty = row[5].strip() if len(row) > 5 else ""
    comment = row[11].strip() if len(row) > 11 else ""
    if uncertainty:
        value["uncertainty"] = uncertainty
    raw: dict[str, Any] = {"data": [_num(c) for c in coeffs]}
    if comment:
        raw["comment"] = comment
    built = _polynomial(kind, coeffs) or _exponential(kind, coeffs)
    if built is not None:
        if tmin is None or tmax is None:
            return None
        type_, vars_ = built
        value.update(type=type_.value, vars=vars_, min=_num(tmin), max=_num(tmax), raw=raw)
        return value
    if kind in {"I1", "I2", "I3", "I4"}:
        degree = int(kind[1])
        if tmin is None or len(coeffs) < degree + 1:
            return None
        value.update(
            vars={name: _num(coeffs[i]) for i, name in enumerate(_COMPOSITION_VARS[: degree + 1])},
            min=_num(tmin), raw=raw,
        )
        return value
    if kind == "E2":
        if tmin is None or tmax is None or len(coeffs) < 3 or coeffs[0] <= 0:
            return None
        value.update(min=_num(tmin), max=_num(tmax), raw=raw)
        return value
    if kind == "DP":
        if not coeffs:
            return None
        try:
            temperature = _kelvin(row[7] if len(row) > 7 else "")
        except ValueError:
            return None
        if temperature is None:
            return None
        value.update(T=_num(temperature), value=_num(coeffs[0]), raw={"data": [_num(coeffs[0]), _num(temperature)]})
        if comment:
            value["raw"]["comment"] = comment
        return value
    return None


def _components(salt: str) -> Optional[list[dict[str, str]]]:
    """Printed components of a mixture. A single formula, or a name that is not formulas, is None."""
    if "-" not in salt:
        return None
    parts = [part.strip() for part in salt.split("-")]
    if len(parts) < 2 or any(not part for part in parts):
        return None
    components = []
    for part in parts:
        if "<" in part or _charged(part) or _isotopic(part):
            return None
        try:
            hill = hill_formula(formula_elements(part))
        except ValueError:
            return None
        components.append({"formula": part, "hill": hill})
    return components


def _composition(cell: str, formulas: list[str]) -> Optional[Composition]:
    """Mole percent of each component, or ``{range, of}`` when the cell names one component."""
    cell = cell.strip()
    bits = cell.split()
    if not bits or len(bits) > 2:
        return None
    named = bits[1] if len(bits) == 2 else None
    if named is not None and named not in formulas:
        return None
    numbers: list[float] = []
    try:
        for part in bits[0].split("-"):
            number = parse_number(part)
            if number is None:
                return None
            numbers.append(_num(number))
    except ValueError:
        return None
    if named is not None:
        return {"range": numbers, "of": named}
    if len(numbers) == len(formulas):
        return numbers
    if len(numbers) == 1 and numbers[0] == 100:
        return [100.0, *([0.0] * (len(formulas) - 1))]
    return None


def _kelvin(text: str) -> Optional[float]:
    """``498K`` and ``498`` are both a temperature."""
    text = text.strip()
    if text.lower().endswith("k"):
        text = text[:-1].strip()
    number = parse_number(text)
    return None if number is None else float(number)


def _same(have: dict[str, Any], new: dict[str, Any]) -> bool:
    """Same composition and the same fit. The source line is not part of the comparison."""
    return {k: v for k, v in have.items() if k != "ref"} == {k: v for k, v in new.items() if k != "ref"}
