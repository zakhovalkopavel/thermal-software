"""
janaf.janaf_files — Split the JANAF tables into compound files, as the compound-data dataset does.

One file per Hill formula (with the charge for ions), holding all its phases and polymorphs:
- the class comes from the compound-data record (``JanafClasses``), else from the formula rule;
- inorganic tables go to their main element, named with the IUPAC formula: TiO2 → ``inorganic/Ti/TiO2-titanium-oxide.json``,
  NH3 → ``inorganic/N/NH3-ammonia.json``, D2O → ``inorganic/O/D2O-water-d2.json``;
- organic tables go to the family of their compound-data record, else to the family the formula alone
  fixes (``formula_family``: CCl3, CF+ → halogenated), named with the Hill formula:
  CH2O → ``organic/aldehydes/CH2O-formaldehyde.json``, CCl4 → ``organic/halogenated/CCl4-...json``;
- formulas that are not element counts (``e-``, electron gas) go to ``inorganic/other/``.
The file is named after the shortest table name, without a trailing formula group
(``Aluminum Oxide`` of ``Aluminum Oxide, Alpha``, ``Barium Hydroxide`` of ``Barium Hydroxide (Ba(OH)2)``).

Spec: docs/scripts/JANAF_PARSER_SPEC.md
Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

import re
from typing import Iterable, NamedTuple

from chemical_formula.compound_class import classify_compound
from chemical_formula.constants.organic_families import UNCLASSIFIED
from chemical_formula.formula_family import formula_family
from chemical_formula.hill_formula import hill_formula
from chemical_formula.iupac_formula import iupac_formula
from dataset_layout.compound_file_name import compound_file_name
from dataset_layout.unique_file_paths import unique_file_paths
from janaf.janaf_classes import JanafClasses
from janaf.janaf_file import JanafFile
from janaf.janaf_formula import janaf_charge, janaf_counts
from janaf.janaf_table import JanafTable

OTHER_GROUP = "other"

_TRAILING_GROUP = re.compile(r"\s*\((?:[^()]|\([^()]*\))*\)\s*$")


class JanafPlacement(NamedTuple):
    """Where a table goes; ``hill`` and ``display_formula`` carry the ion charge."""

    compound_class: str
    group: str
    hill: str
    display_formula: str


def janaf_placement(table: JanafTable, classes: JanafClasses) -> JanafPlacement:
    """Class, folder, Hill and display formula of one table."""
    counts = janaf_counts(table.janaf_formula)
    if counts is None:
        formula = table.formula or table.janaf_formula
        return JanafPlacement("inorganic", OTHER_GROUP, formula, formula)
    neutral = hill_formula(counts)
    charge = janaf_charge(table.janaf_formula)
    record = classes.lookup(table.table_id, neutral)
    compound_class, group = classify_compound(counts, None if record is None else record[0] == "organic")
    if compound_class == "organic":
        group = record[1] if record is not None and record[0] == "organic" else UNCLASSIFIED
        if group == UNCLASSIFIED:
            group = formula_family(counts) or UNCLASSIFIED
        return JanafPlacement(compound_class, group, neutral + charge, neutral + charge)
    return JanafPlacement(compound_class, group, neutral + charge, iupac_formula(counts) + charge)


def janaf_files(tables: Iterable[JanafTable], classes: JanafClasses) -> list[JanafFile]:
    """Files sorted by path; tables keep their parse order (``janaf.json``) inside a file."""
    units: dict[tuple[str, str, str], tuple[JanafPlacement, list[JanafTable]]] = {}
    for table in tables:
        placement = janaf_placement(table, classes)
        key = (placement.compound_class, placement.group, placement.hill)
        units.setdefault(key, (placement, []))[1].append(table)
    stems = {
        key: (
            f"{placement.compound_class}/{placement.group}",
            compound_file_name(placement.display_formula, _file_name(members)),
            members[0].table_id,
        )
        for key, (placement, members) in units.items()
    }
    paths = unique_file_paths(stems)
    files = [JanafFile(paths[key], *placement, tables=members) for key, (placement, members) in units.items()]
    return sorted(files, key=lambda f: f.path)


def _file_name(tables: list[JanafTable]) -> str:
    names = [_TRAILING_GROUP.sub("", table.name) for table in tables]
    return min(names, key=len)
