"""
chemicals_tables.source_entry — One value read from one source row, before merging by CAS.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Union

from chemicals_tables.equation_value import EquationValue
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.raw_value import RawValue
from chemicals_tables.transport_value import TransportValue


@dataclass
class SourceEntry:
    """A parser's output unit: the row's CAS, own formula and label, plus one value.

    ``phase`` is the equation phase key (``solid``/``liquid``/``gas``); a ``PropertyValue``
    carries its own phase. ``smiles`` comes from an identity override only.
    """

    cas: Optional[str]
    formula: Optional[str]
    label: Optional[str]
    property: str
    value: Union[PropertyValue, EquationValue, RawValue, TransportValue]
    phase: Optional[str] = None
    smiles: Optional[str] = None
