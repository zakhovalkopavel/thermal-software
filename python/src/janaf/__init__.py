"""
janaf — NIST-JANAF thermochemical table parser package.

Converts the NIST-JANAF tables (py-janaf copy, tab-separated text) into structured Python objects
and one JSON file per compound, laid out like the compound-data dataset (``dataset_layout``).

Sub-modules
-----------
  janaf.janaf_row               — JanafRow dataclass
  janaf.janaf_transition        — JanafTransition dataclass
  janaf.janaf_table             — JanafTable dataclass
  janaf.janaf_source            — JanafSource dataclass (py-janaf repository, commit, links)
  janaf.janaf_index             — load_janaf_index (janaf.json)
  janaf.janaf_formula           — janaf_counts, janaf_charge (header formula → element counts, charge)
  janaf.janaf_classes           — JanafClasses (class and folder from the compound-data index)
  janaf.janaf_file              — JanafFile (one compound file and its tables)
  janaf.janaf_files             — janaf_files, janaf_placement, JanafPlacement (tables → compound files)
  janaf.parsers.janaf_table     — table file parser
  janaf.parsers.provenance      — PROVENANCE.txt reader
  janaf.writers                 — compound files, index.json, units.json, sources.json
  janaf.constants.units         — units of the row columns
  janaf.constants.row_definitions — what each row column holds (units.json $comment)

Spec
----
  docs/scripts/JANAF_PARSER_SPEC.md

Refs
----
  docs/REFERENCES.md  [36] NISTJANAF
"""

from janaf.janaf_row               import JanafRow
from janaf.janaf_transition        import JanafTransition
from janaf.janaf_table             import JanafTable
from janaf.janaf_source            import JanafSource
from janaf.janaf_index             import load_janaf_index
from janaf.janaf_formula           import janaf_charge, janaf_counts
from janaf.janaf_classes           import JanafClasses
from janaf.janaf_file              import JanafFile
from janaf.janaf_files             import JanafPlacement, janaf_files, janaf_placement
from janaf.parsers.janaf_table     import parse_janaf_table, parse_janaf_tables
from janaf.parsers.provenance      import read_janaf_source
from janaf.writers                 import write_janaf_index, write_janaf_json, write_janaf_sources, write_janaf_units

__all__ = [
    "JanafRow",
    "JanafTransition",
    "JanafTable",
    "JanafSource",
    "load_janaf_index",
    "janaf_charge",
    "janaf_counts",
    "JanafClasses",
    "JanafFile",
    "JanafPlacement",
    "janaf_files",
    "janaf_placement",
    "parse_janaf_table",
    "parse_janaf_tables",
    "read_janaf_source",
    "write_janaf_index",
    "write_janaf_json",
    "write_janaf_sources",
    "write_janaf_units",
]
