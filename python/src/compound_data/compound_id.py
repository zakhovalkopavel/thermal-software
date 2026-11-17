"""
compound_data.compound_id — Public catalogue id from the compound name.

``compoundId`` is the identifier name with spaces turned into ``_``. When several
records share that slug, they get ``_1``, ``_2``, ``_3``, … in stable CAS order.
A unique name stays unsuffixed.

Internal ``CompoundRecord.id`` (CAS / ``formula:…``) is unchanged.
"""
from __future__ import annotations

import re
from collections import defaultdict
from typing import Iterable

from compound_data.compound_files import record_order
from compound_data.compound_record import CompoundRecord

_SPACE = re.compile(r"\s+")


def name_to_slug(name: str) -> str:
    """Turn a compound name into a compoundId stem: strip, spaces → ``_``."""
    return _SPACE.sub("_", name.strip())


def compound_id_stem(record: CompoundRecord) -> str:
    """Slug stem for a record: name, else display/Hill formula, else record id."""
    if record.name and record.name.strip():
        stem = name_to_slug(record.name)
        if stem:
            return stem
    for candidate in (record.display_formula, record.hill, record.formula):
        if candidate and str(candidate).strip():
            stem = name_to_slug(str(candidate))
            if stem:
                return stem
    return name_to_slug(record.id.replace(":", "_")) or record.id.replace(":", "_")


def assign_compound_ids(records: Iterable[CompoundRecord]) -> dict[str, str]:
    """Set ``record.compound_id`` for every record; return ``record.id → compoundId``.

    Unique slug → ``slug``. Shared slug → ``slug_1``, ``slug_2``, … (1-based), ordered
    by ``record_order`` (CAS numerically, then formula ids).
    """
    groups: dict[str, list[CompoundRecord]] = defaultdict(list)
    ordered = sorted(records, key=record_order)
    for record in ordered:
        groups[compound_id_stem(record)].append(record)

    mapping: dict[str, str] = {}
    for stem, members in groups.items():
        if len(members) == 1:
            compound_id = stem
            members[0].compound_id = compound_id
            mapping[members[0].id] = compound_id
            continue
        for index, record in enumerate(members, start=1):
            compound_id = f"{stem}_{index}"
            record.compound_id = compound_id
            mapping[record.id] = compound_id
    return mapping
