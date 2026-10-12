"""
compound_data — Source entries → compound JSON datasets (merge, JANAF links, output files).

Merges the ``chemicals_tables`` source entries and the transport parameters into one record per CAS,
resolves formulas with the chemicals identifier files and the PubChem cache, places inorganic compounds by
main element and organic compounds by functional family, attaches JANAF table ids and writes one file per
compound. The build is offline; PubChem lookups are the separate second step (``pubchem`` package,
``make compound-data-pubchem``).

Sub-modules
-----------
  compound_data.builder              — build_compound_data (parse → identifiers → merge → checks → JANAF → interactions)
  compound_data.merger               — merge_compounds (by CAS, formula resolution, unidentified rows)
  compound_data.compound_record      — CompoundRecord
  compound_data.compound_file        — CompoundFile (one output file and its records)
  compound_data.compound_files       — compound_files (records → files: per formula / per organic record)
  compound_data.compound_units       — compound_units (content of units.json)
  compound_data.pubchem_identifiers  — load_pubchem_identifiers (cache rows → identifiers)
  compound_data.janaf_links          — attach_janaf (JANAF table ids by CAS index and Hill formula)
  compound_data.equation_check       — check_equations (report sanity check)
  compound_data.writers              — compound files, unresolved.json, index.json, units.json, sources.json,
                                       interactions.json, missing-cas.txt
  compound_data.parsers.*            — JANAF CAS index, transport-parameters.json
  compound_data.constants.*          — formula overrides, source priority, PubChem table, JANAF CAS index path,
                                       transport tables, units

Spec
----
  docs/scripts/COMPOUND_DATA_SPEC.md
"""

from compound_data.builder           import BuildResult, build_compound_data
from compound_data.compound_file     import CompoundFile
from compound_data.compound_files    import compound_files
from compound_data.compound_record   import CompoundRecord
from compound_data.merger            import MergeResult, merge_compounds
from compound_data.writers           import (
    write_compound_index, write_compound_json, write_compound_sources, write_compound_units, write_interactions,
    write_missing_cas, write_unresolved,
)

__all__ = [
    "BuildResult",
    "build_compound_data",
    "CompoundFile",
    "compound_files",
    "CompoundRecord",
    "MergeResult",
    "merge_compounds",
    "write_compound_index",
    "write_compound_json",
    "write_compound_sources",
    "write_compound_units",
    "write_interactions",
    "write_missing_cas",
    "write_unresolved",
]
