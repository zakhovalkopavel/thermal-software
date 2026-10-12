"""
chemicals_tables — Parsers of the CalebBell/chemicals data tables into source entries.

Reads the CRC, Perry, Poling, Yaws, TRC, Zabransky, NIST WebBook Shomate and VDI PPDS tables and the
identifier databases copied into ``shared/sources/compound-data/chemicals/``. Every row becomes a
``SourceEntry`` (CAS, formula, label, property) holding a ``PropertyValue``, a backend ``EquationValue``
or a ``RawValue``, each citing its file row through a ``SourceLink``.

Sub-modules
-----------
  chemicals_tables.source_entries        — parse_source_entries (all parsers + identity overrides)
  chemicals_tables.parsers.*             — one parser per table family, identifiers, PROVENANCE.txt
  chemicals_tables.identity_resolver     — apply_identity_overrides (rows without CAS or formula)
  chemicals_tables.equation_eval         — evaluate_equation (backend calculate, existing + planned types)
  chemicals_tables.chemicals_source      — ChemicalsSource (repository, commit, file links)
  chemicals_tables.source_entry          — SourceEntry; property_value, equation_value, raw_value, source_link
  chemicals_tables.identifier            — Identifier (CAS → formula, Mr, SMILES, InChIKey, source row)
  chemicals_tables.constants.*           — tables, coefficient layouts, equation types, identity overrides

Spec
----
  docs/scripts/COMPOUND_DATA_SPEC.md

Refs
----
  docs/REFERENCES.md  [37] CRC95, [34] Perry8, [7] Poling5, [38] Yaws2014, [40] TRC1994,
                      [39] Zabransky1996, [32] NISTWebBook, [41] VDI2010
"""

from chemicals_tables.chemicals_source      import ChemicalsSource
from chemicals_tables.equation_eval         import evaluate_equation
from chemicals_tables.equation_value        import EquationValue
from chemicals_tables.identifier            import Identifier
from chemicals_tables.parsers.identifiers   import load_identifiers
from chemicals_tables.parsers.provenance    import read_chemicals_source
from chemicals_tables.property_value        import PropertyValue
from chemicals_tables.raw_value             import RawValue
from chemicals_tables.source_entries        import parse_source_entries
from chemicals_tables.source_entry          import SourceEntry
from chemicals_tables.source_link           import SourceLink

__all__ = [
    "ChemicalsSource",
    "evaluate_equation",
    "EquationValue",
    "Identifier",
    "load_identifiers",
    "parse_source_entries",
    "PropertyValue",
    "RawValue",
    "read_chemicals_source",
    "SourceEntry",
    "SourceLink",
]
