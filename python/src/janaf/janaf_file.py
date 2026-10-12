"""
janaf.janaf_file — One compound file of the JANAF dataset: every table of one formula.

Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

from dataclasses import dataclass, field

from janaf.janaf_table import JanafTable


@dataclass
class JanafFile:
    """``<class>/<group>/<formula>-<name>.json``: the tables (phases, polymorphs) of one Hill formula.

    ``hill`` (the lookup key) and ``display_formula`` (IUPAC order for inorganic, Hill for organic; names
    the file) keep the charge of ions (``Al+``) and isotope symbols (``D2O``).
    """

    path: str
    compound_class: str
    group: str
    hill: str
    display_formula: str
    tables: list[JanafTable] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "class": self.compound_class,
            "group": self.group,
            "displayFormula": self.display_formula,
            "hill": self.hill,
            "tables": {table.table_id: table.to_dict() for table in self.tables},
        }
