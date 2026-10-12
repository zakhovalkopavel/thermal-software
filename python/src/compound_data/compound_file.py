"""
compound_data.compound_file — One compound file of the dataset and its records.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass, field

from compound_data.compound_record import CompoundRecord


@dataclass
class CompoundFile:
    """``<class>/<group>/<formula>-<name>.json``: every record of one Hill formula (inorganic) or one record (organic).

    ``display_formula`` names the file (IUPAC order for inorganic, Hill for organic); ``hill`` is the lookup key.
    ``entries`` maps the entry key (CAS, or ``noCas``) to the record.
    """

    path: str
    compound_class: str
    group: str
    display_formula: str
    hill: str
    elements: list[str]
    entries: dict[str, CompoundRecord] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "class": self.compound_class,
            "group": self.group,
            "displayFormula": self.display_formula,
            "hill": self.hill,
            "elements": self.elements,
            "entries": {key: record.to_dict() for key, record in self.entries.items()},
        }
