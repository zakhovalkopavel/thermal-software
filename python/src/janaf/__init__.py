"""
janaf — NIST-JANAF thermochemical table parser package.

Converts the NIST-JANAF tables (py-janaf copy, tab-separated text) into
structured Python objects and JSON files grouped by JANAF ID prefix.

Sub-modules
-----------
  janaf.janaf_row               — JanafRow dataclass
  janaf.janaf_transition        — JanafTransition dataclass
  janaf.janaf_table             — JanafTable dataclass
  janaf.janaf_source            — JanafSource dataclass (py-janaf repository, commit, links)
  janaf.janaf_index             — load_janaf_index (janaf.json)
  janaf.parsers.janaf_table     — table file parser
  janaf.parsers.provenance      — PROVENANCE.txt reader
  janaf.writers                 — JSON serialisation, one file per prefix + index.json

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
from janaf.parsers.janaf_table     import parse_janaf_table, parse_janaf_tables
from janaf.parsers.provenance      import read_janaf_source
from janaf.writers                 import write_janaf_index, write_janaf_json

__all__ = [
    "JanafRow",
    "JanafTransition",
    "JanafTable",
    "JanafSource",
    "load_janaf_index",
    "parse_janaf_table",
    "parse_janaf_tables",
    "read_janaf_source",
    "write_janaf_index",
    "write_janaf_json",
]
