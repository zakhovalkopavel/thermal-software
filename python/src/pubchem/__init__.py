"""
pubchem — Polite PubChem lookups (CAS numbers, formulas, names), kept in resumable local files.

Independent of the compound data build. The fetch step reads the CAS list the build writes (and the
compound-data records without a CAS, searched by formula) and appends one record per query to
``shared/sources/compound-data/pubchem/pubchem-<class>.jsonl`` (inorganic, organic, unclassified): the
property request (every compound, every ``PUBCHEM_PROPERTIES`` field), the PUG View "Experimental
Properties" of each compound and, for a formula or name search, the PUG View "CAS" section of the chosen
compound. ``PubchemSearcher`` does the same on demand (new phase-diagram compounds, the
``pubchem_search.py`` CLI and its query files). The build reads the files offline. Requests are paced by PubChem's
``X-Throttling-Control`` header; a block stops the run.

Sub-modules
-----------
  pubchem.pubchem_client           — PubchemClient (pacing, throttling, pauses)
  pubchem.pubchem_throttle         — throttle_level, throttle_statuses (X-Throttling-Control)
  pubchem.pubchem_query            — PubchemQuery (CAS / formula / name, key, URL)
  pubchem.cas_number               — is_cas (format and check digit)
  pubchem.pubchem_answer           — PubchemAnswer (property request answer)
  pubchem.pubchem_view             — PubchemView (one PUG View section of one CID)
  pubchem.pubchem_view_text        — view_strings (values of a section as text)
  pubchem.pubchem_record_summary   — record_summary, record_headline, experimental_values (console / notes text)
  pubchem.pubchem_record           — PubchemRecord (one query: answer + views, one file line)
  pubchem.pubchem_result           — PubchemResult (ok / notFound / ambiguous / charged, identifiers, CAS)
  pubchem.pubchem_fetch            — fetch_pubchem_record (ask only what a record lacks)
  pubchem.pubchem_searcher         — PubchemSearcher (on-demand searches into the class files)
  pubchem.pubchem_response         — PubchemResponse (HTTP status, JSON, throttling headers)
  pubchem.pubchem_blocked_error    — PubchemBlockedError (the run must stop)
  pubchem.pubchem_transient_error  — PubchemTransientError (no answer; pause and ask again)
  pubchem.pubchem_paths            — pubchem_files (class → file)
  pubchem.parsers.cas_list         — read_cas_list
  pubchem.parsers.compound_classes — read_compound_classes (CAS → class from the compound data index)
  pubchem.parsers.formula_compounds — read_formula_compounds (compound-data records without a CAS)
  pubchem.parsers.pubchem_records  — iter_pubchem_records, read_pubchem_records, read_pubchem_lines
  pubchem.pubchem_records_writer   — append_pubchem_record, compact_pubchem_files
  pubchem.constants.pubchem        — endpoints, properties, files, statuses, pacing

Spec
----
  docs/scripts/PUBCHEM_SPEC.md
"""

from pubchem.cas_number                import is_cas
from pubchem.parsers.cas_list          import read_cas_list
from pubchem.parsers.compound_classes  import read_compound_classes
from pubchem.parsers.formula_compounds import read_formula_compounds
from pubchem.parsers.pubchem_records   import iter_pubchem_records, read_pubchem_lines, read_pubchem_records
from pubchem.pubchem_answer            import PubchemAnswer
from pubchem.pubchem_blocked_error     import PubchemBlockedError
from pubchem.pubchem_client            import PubchemClient
from pubchem.pubchem_fetch             import fetch_pubchem_record
from pubchem.pubchem_paths             import pubchem_files
from pubchem.pubchem_query             import PubchemQuery
from pubchem.pubchem_record            import PubchemRecord
from pubchem.pubchem_record_summary    import experimental_values, record_headline, record_summary
from pubchem.pubchem_records_writer    import append_pubchem_record, compact_pubchem_files
from pubchem.pubchem_result            import PubchemResult
from pubchem.pubchem_searcher          import PubchemSearcher
from pubchem.pubchem_view              import PubchemView
from pubchem.pubchem_view_text         import view_strings

__all__ = [
    "PubchemAnswer",
    "PubchemBlockedError",
    "PubchemClient",
    "PubchemQuery",
    "PubchemRecord",
    "PubchemResult",
    "PubchemSearcher",
    "PubchemView",
    "append_pubchem_record",
    "compact_pubchem_files",
    "experimental_values",
    "fetch_pubchem_record",
    "is_cas",
    "iter_pubchem_records",
    "pubchem_files",
    "read_cas_list",
    "read_compound_classes",
    "read_formula_compounds",
    "read_pubchem_lines",
    "read_pubchem_records",
    "record_headline",
    "record_summary",
    "view_strings",
]
