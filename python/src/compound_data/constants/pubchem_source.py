"""
compound_data.constants.pubchem_source — How the build cites the PubChem files and hands its CAS list to the fetch step.

Step 1 (``make compound-data-build``) writes ``MISSING_CAS_FILE`` into the report directory: the CAS
numbers the chemicals identifier files do not have. Step 2 (``make compound-data-pubchem``) looks them
up in PubChem into ``pubchem-<class>.jsonl`` and rebuilds; the build cites a record as
``[line, "idPubchemRestInorganic"]`` (``idPubchemRestOrganic``, ``idPubchemRestUnclassified``; the
chemicals' own PubChem tables are ``idPubchemSmall`` / ``idPubchemLarge``).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from pathlib import Path

from chemicals_tables.table_spec import TableSpec
from pubchem.constants.pubchem import PUBCHEM_DIR
from pubchem.pubchem_paths import pubchem_files

PUBCHEM_TABLES: dict[str, TableSpec] = {
    cls: TableSpec(f"PubChem REST ({cls})", f"idPubchemRest{cls[0].upper()}{cls[1:]}", str(path), None, label_column=None)
    for cls, path in pubchem_files(Path(PUBCHEM_DIR)).items()
}
MISSING_CAS_FILE = "missing-cas.txt"
