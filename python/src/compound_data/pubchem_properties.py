"""
compound_data.pubchem_properties — Melting point, boiling point and density from PubChem experimental data.

A value is cited ``pubchem`` + the catalog ``refNumber`` (``pubchem151``). That number is a line of
``pubchem-references.jsonl``, and the same number is on the citation in the class file. It is not a
key of the main references database.

Only a plain temperature (°C, °F, K) becomes a melting or boiling point, and only a density unit
(g/cm³, g/mL, kg/m³) becomes a density. A temperature printed next to a density, a boiling point at
a reduced pressure, and a decomposition or sublimation note are left out.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from typing import Callable, Optional

from chemicals_tables.property_value import PropertyValue
from chemicals_tables.source_link import SourceLink
from chemicals_tables.table_spec import TableSpec
from compound_data.compound_record import CompoundRecord
from compound_data.pubchem_sources import PubchemSources
from pubchem.constants.pubchem import PUBCHEM_OK
from pubchem.experimental_value import ExperimentalQuantity
from pubchem.pubchem_record import PubchemRecord

_HEADINGS = {
    "melting point": "meltingPoint",
    "boiling point": "boilingPoint",
    "density": "density",
}

_TEMPERATURE: dict[str, Callable[[float], float]] = {
    "°c": lambda n: n + 273.15,
    "ºc": lambda n: n + 273.15,
    "degreescelsius": lambda n: n + 273.15,
    "°f": lambda n: (n - 32.0) * 5.0 / 9.0 + 273.15,
    "ºf": lambda n: (n - 32.0) * 5.0 / 9.0 + 273.15,
    "k": lambda n: n,
}

_DENSITY: dict[str, Callable[[float], float]] = {
    "g/cm3": lambda n: n * 1000.0,
    "g/cm³": lambda n: n * 1000.0,
    "g/ml": lambda n: n * 1000.0,
    "g/cc": lambda n: n * 1000.0,
    "kg/m3": lambda n: n,
    "kg/m³": lambda n: n,
    "g/l": lambda n: n,
}


def attach_pubchem_properties(
    records: list[CompoundRecord], sources: PubchemSources,
) -> dict[str, int]:
    """Copy convertible experimental values onto the records; returns how many were kept and skipped."""
    kept = skipped = 0
    for record in records:
        for key in _keys(record):
            located = sources.find(key)
            if located is None:
                continue
            pubchem, table, line = located
            if pubchem.result.status != PUBCHEM_OK:
                continue
            added, missed = _apply(record, pubchem, table, line)
            kept += added
            skipped += missed
    return {"pubchemProperties": kept, "pubchemPropertiesSkipped": skipped}


def _keys(record: CompoundRecord) -> list[str]:
    keys = [cas for cas in (record.cas, *record.other_cas) if cas]
    if record.id.startswith("formula:"):
        keys.append(f"formula:{record.hill}")
    return keys


def _apply(
    record: CompoundRecord, pubchem: PubchemRecord, table: TableSpec, line: int,
) -> tuple[int, int]:
    kept = skipped = 0
    seen = {
        (name, round(value.value, 2), value.source.ref_text)
        for name, values in record.properties.items() for value in values if value.source.ref_text
    }
    for view in pubchem.experimental:
        for prop in view.values:
            name = _HEADINGS.get(prop.heading.strip().casefold())
            if name is None:
                continue
            for cite in prop.citation:
                if not isinstance(cite.ref_number, int):
                    skipped += 1
                    continue
                numbers = [n for q in cite.values if (n := _convert(name, q)) is not None]
                if not numbers:
                    skipped += 1
                    continue
                ref_text = f"pubchem{cite.ref_number}"
                link = SourceLink(table.name, table.key, view.url, line=line, ref_text=ref_text)
                for number in numbers:
                    key = (name, number, ref_text)
                    if key in seen:
                        continue
                    seen.add(key)
                    record.properties.setdefault(name, []).append(PropertyValue(number, None, link))
                    kept += 1
    return kept, skipped


def _convert(name: str, quantity: ExperimentalQuantity) -> Optional[float]:
    unit = "".join(quantity.unit.strip().lower().split())
    table = _DENSITY if name == "density" else _TEMPERATURE
    convert = table.get(unit)
    if convert is None:
        return None
    return round(convert(quantity.number), 2)
