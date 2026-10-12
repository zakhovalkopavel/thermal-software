"""
chemicals_tables.parsers.shomate_json — NIST WebBook Shomate coefficients (chemicals JSON) → ``shomate``.

JSON layout: ``{CAS: [solid | null, liquid | null, gas | null]}``, each phase a list of
``[Tmin, Tmax, A, B, C, D, E]`` ranges with T in K (chemicals already converted from t = T/1000).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [32] NISTWebBook
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.constants.source_tables import SOURCE_TABLES
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.parsers.cas import parse_cas
from chemicals_tables.source_entry import SourceEntry

PHASES = ("solid", "liquid", "gas")
_KEY = re.compile(r'^\s*"([^"]+)"\s*:')


def parse_shomate_json(source_dir: Path, chem: ChemicalsSource) -> list[SourceEntry]:
    """One piecewise heatCapacity equation per CAS and phase; the link points to the CAS key line."""
    table = SOURCE_TABLES["WebBook Shomate"]
    path = source_dir / table.path
    text = path.read_text(encoding="utf-8")
    key_lines = _top_level_key_lines(text)
    entries: list[SourceEntry] = []
    for key, phases in json.loads(text).items():
        cas = parse_cas(key)
        for phase, ranges in zip(PHASES, phases):
            if not ranges:
                continue
            rows = sorted(ranges, key=lambda r: r[0])
            vars_ = {"ranges": [
                {"Tmin": tmin, "Tmax": tmax, "a": a, "b": b, "c": c, "d": d, "e": e}
                for tmin, tmax, a, b, c, d, e in rows
            ]}
            entries.append(SourceEntry(
                cas=cas, formula=None, label=None, property="heatCapacity", phase=phase,
                value=EquationValue(
                    type=EquationType.shomate, ref=table.ref, vars=vars_, min=rows[0][0], max=rows[-1][1],
                    source=chem.link(table, key_lines.get(key)),
                ),
            ))
    return entries


def _top_level_key_lines(text: str) -> dict[str, int]:
    """Line of each top-level key; nested values hold no keys, only lists of numbers."""
    lines: dict[str, int] = {}
    for number, line in enumerate(text.splitlines(), start=1):
        match = _KEY.match(line)
        if match:
            lines.setdefault(match.group(1), number)
    return lines
