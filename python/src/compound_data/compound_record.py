"""
compound_data.compound_record — Merged record of one compound (one CAS, or one formula without CAS).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from chemicals_tables.constants.planned_equation_types import PLANNED_EQUATION_TYPES
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.raw_value import RawValue
from chemicals_tables.source_link import SourceLink
from chemicals_tables.transport_value import TransportValue
from references import RefKey


@dataclass
class CompoundRecord:
    """All values of one compound, grouped by property (and phase for equations).

    Equation values are kept in source priority order; ``def`` is the first one whose type
    the backend implements, or ``None`` when all are planned types. ``janaf`` lists the NIST-JANAF
    table ids with the same Hill formula; the tables themselves are in ``shared/processed/JANAF/``.
    ``nasa7`` / ``nasa9`` list the species keys of ``shared/processed/NASA/nasa7.json`` / ``nasa9.json``
    (all phases) whose formula and ΔfH°(298.15) match the record (see nasa_links).
    ``transport`` holds, per property (viscosity, thermalConductivity), how a source obtained it
    (Svehla 1995 methods, see transport_parameters).
    ``other_cas`` are source CAS numbers whose rows were moved onto this record (unknown CAS, see merger).
    ``display_formula`` is the IUPAC element order for inorganic compounds (``iupac_formula``), else ``hill``.
    """

    id: str
    cas: Optional[str]
    formula: str
    hill: str
    display_formula: str
    elements: list[str]
    compound_class: str
    group: str
    name: Optional[str] = None
    Mr: Optional[float] = None
    smiles: Optional[str] = None
    inchikey: Optional[str] = None
    pubchem_cid: Optional[int] = None
    families: list[str] = field(default_factory=list)
    identifier_source: Optional[SourceLink] = None
    properties: dict[str, list[PropertyValue]] = field(default_factory=dict)
    equations: dict[str, dict[str, list[EquationValue]]] = field(default_factory=dict)
    raw: list[RawValue] = field(default_factory=list)
    transport: dict[str, list[TransportValue]] = field(default_factory=dict)
    janaf: list[str] = field(default_factory=list)
    nasa7: list[str] = field(default_factory=list)
    nasa9: list[str] = field(default_factory=list)
    other_cas: list[str] = field(default_factory=list)

    def refs(self) -> list[str]:
        """Sorted ref keys used by any value of the record."""
        keys = {v.ref.value for values in self.properties.values() for v in values}
        keys |= {v.ref.value for phases in self.equations.values() for values in phases.values() for v in values}
        keys |= {r.ref.value for r in self.raw}
        keys |= {v.ref.value for values in self.transport.values() for v in values}
        if self.janaf:
            keys.add(RefKey.NISTJANAF.value)
        if self.nasa7:
            keys.add(RefKey.NASA7.value)
        if self.nasa9:
            keys.add(RefKey.NASA9.value)
        return sorted(keys)

    def equation_phases(self) -> dict[str, list[str]]:
        """Which phases each equation property has, e.g. ``{"heatCapacity": ["gas", "solid"]}``."""
        return {prop: sorted(phases) for prop, phases in sorted(self.equations.items())}

    def to_dict(self) -> dict:
        """Entry of the compound file: the CAS is its key, Hill formula and elements are file fields, so they are not repeated.

        ``formula`` is written only when it differs from the Hill formula (isotopes, charges);
        null and empty fields are left out.
        """
        out: dict[str, Any] = {
            "formula": self.formula if self.formula != self.hill else None,
            "name": self.name,
            "Mr": self.Mr,
            "smiles": self.smiles,
            "inchikey": self.inchikey,
            "pubchemCid": self.pubchem_cid,
            "families": self.families,
            "identifierRef": self.identifier_source.to_ref() if self.identifier_source else None,
            "otherCas": self.other_cas,
            "properties": {
                prop: [v.to_dict() for v in values] for prop, values in sorted(self.properties.items())
            },
            "equations": {
                prop: {phase: _equation_list(values) for phase, values in sorted(phases.items())}
                for prop, phases in sorted(self.equations.items())
            },
            "raw": [r.to_dict() for r in self.raw],
            "transport": {
                prop: [v.to_dict() for v in values] for prop, values in sorted(self.transport.items())
            },
            "janaf": self.janaf,
            "nasa7": self.nasa7,
            "nasa9": self.nasa9,
        }
        return {k: v for k, v in out.items() if v is not None and v != [] and v != {}}


def _equation_list(values: list[EquationValue]) -> dict:
    default = next(
        (i for i, v in enumerate(values) if v.type.value not in PLANNED_EQUATION_TYPES),
        None,
    )
    return {"def": default, "values": [v.to_dict() for v in values]}
