"""
compound_data.constants.pubchem_source — How the build cites the PubChem cache and hands its CAS list to the fetch step.

Step 1 (``make compound-data-build``) writes ``MISSING_CAS_FILE`` into the report directory: the CAS
numbers the chemicals identifier files do not have. Step 2 (``make compound-data-pubchem``) looks them
up in PubChem into the cache and rebuilds; the build cites cache rows as ``[line, "idPubchemRest"]``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from chemicals_tables.table_spec import TableSpec
from pubchem.constants.pubchem import PUBCHEM_CACHE

PUBCHEM_TABLE = TableSpec("PubChem REST", "idPubchemRest", PUBCHEM_CACHE, None, label_column=None)
MISSING_CAS_FILE = "missing-cas.txt"
