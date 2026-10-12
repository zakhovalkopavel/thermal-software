"""
chemicals_tables.source_entries — Run every table parser over the chemicals copy.

Used by the build and by the PubChem fetch (which needs the CAS numbers of all rows).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.constants.coefficient_tables import COEFFICIENT_TABLES
from chemicals_tables.constants.source_tables import PROPERTY_TABLES, SOURCE_TABLES
from chemicals_tables.identity_resolver import apply_identity_overrides
from chemicals_tables.parsers.coefficient_table import parse_coefficient_table
from chemicals_tables.parsers.crc_molten_density import parse_crc_molten_density
from chemicals_tables.parsers.perry_151 import parse_perry_151
from chemicals_tables.parsers.property_table import parse_property_table
from chemicals_tables.parsers.shomate_json import parse_shomate_json
from chemicals_tables.parsers.vdi_ppds import parse_vdi_ppds
from chemicals_tables.parsers.zabransky import parse_zabransky
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.source_entry import SourceEntry

logger = logging.getLogger(__name__)


def parse_source_entries(source_dir: Path, chem: ChemicalsSource) -> tuple[list[SourceEntry], list[dict[str, Any]]]:
    """All parsed values (identity overrides applied) and the parsers' report issues."""
    entries: list[SourceEntry] = []
    issues: list[dict[str, Any]] = []

    for name in PROPERTY_TABLES:
        parsed = parse_property_table(source_dir, SOURCE_TABLES[name], chem)
        logger.info("[parse] %-32s %6d values", name, len(parsed))
        entries += parsed

    tc_lookup = {
        e.cas: (e.value.value, e.value.source)
        for e in entries
        if e.cas and e.property == "criticalTemperature" and isinstance(e.value, PropertyValue)
        and e.value.source.table == "Yaws critical properties"
    }
    for spec in COEFFICIENT_TABLES:
        parsed, found = parse_coefficient_table(source_dir, spec, chem, tc_lookup)
        logger.info("[parse] %-32s %6d values", spec.table, len(parsed))
        entries += parsed
        issues += found

    for name, parser in (
        ("Perry 2-151", parse_perry_151),
        ("Zabransky", parse_zabransky),
        ("VDI PPDS", parse_vdi_ppds),
    ):
        parsed, found = parser(source_dir, chem)
        logger.info("[parse] %-32s %6d values", name, len(parsed))
        entries += parsed
        issues += found
    for name, simple_parser in (
        ("CRC molten densities", parse_crc_molten_density),
        ("WebBook Shomate", parse_shomate_json),
    ):
        parsed = simple_parser(source_dir, chem)
        logger.info("[parse] %-32s %6d values", name, len(parsed))
        entries += parsed

    issues += apply_identity_overrides(entries)
    return entries, issues
