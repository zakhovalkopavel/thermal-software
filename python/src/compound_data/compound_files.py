"""
compound_data.compound_files — Split the records into compound files.

Inorganic: one file per Hill formula in the main-element folder, holding every CAS of the formula
(polymorphs, duplicate CAS); named with the IUPAC formula and the name of the record with the lowest CAS
(``inorganic/Ti/TiO2-titanium-dioxide.json``).
Organic: one file per record in its first family folder, since isomers differ in name and family
(``organic/alcohols/C2H6O-ethanol.json``).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from typing import Iterable

from compound_data.compound_file import CompoundFile
from compound_data.compound_record import CompoundRecord
from dataset_layout.compound_file_name import compound_file_name
from dataset_layout.unique_file_paths import unique_file_paths


def compound_files(records: Iterable[CompoundRecord]) -> list[CompoundFile]:
    """Files sorted by path; entries ordered by CAS (numerically), records without CAS last."""
    units: dict[tuple[str, ...], list[CompoundRecord]] = {}
    for record in records:
        key = (record.compound_class, record.group, record.hill)
        if record.compound_class == "organic":
            key += (record.id,)
        units.setdefault(key, []).append(record)

    stems: dict[tuple[str, ...], tuple[str, str, str]] = {}
    for key, members in units.items():
        members.sort(key=record_order)
        first = members[0]
        stems[key] = (
            f"{first.compound_class}/{first.group}", compound_file_name(first.display_formula, first.name), first.id,
        )
    paths = unique_file_paths(stems)

    files = []
    for key, members in units.items():
        first = members[0]
        file = CompoundFile(
            paths[key], first.compound_class, first.group, first.display_formula, first.hill, first.elements,
        )
        for record in members:
            entry_key = record.cas or "noCas"
            file.entries[record.id if entry_key in file.entries else entry_key] = record
        files.append(file)
    return sorted(files, key=lambda f: f.path)


def record_order(record: CompoundRecord) -> tuple:
    """CAS numerically (``1344-28-1`` before ``12005-16-6``), then records without CAS by id."""
    if record.cas is None:
        return (1, (), record.id)
    return (0, tuple(int(part) for part in record.cas.split("-")), record.id)
