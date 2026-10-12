"""
pubchem.constants.pubchem — PubChem PUG REST endpoints, request pacing and the local identifier cache.

The cache is filled by ``scripts/fetch_pubchem_identifiers.py`` (``make compound-data-pubchem``)
from the CAS list the compound data build writes, and read by the next build.

Pacing follows https://pubchem.ncbi.nlm.nih.gov/docs/dynamic-request-throttling: at most 5 requests
per second and 400 per minute; every response carries ``X-Throttling-Control`` with Green / Yellow /
Red / Black per counter, Black meaning the client is blocked.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

PUBCHEM_API = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
PUBCHEM_COMPOUND_URL = "https://pubchem.ncbi.nlm.nih.gov/compound/{cid}"
PUBCHEM_PROPERTIES: tuple[str, ...] = (
    "MolecularFormula", "MolecularWeight", "SMILES", "InChIKey", "IUPACName", "Title",
)
PUBCHEM_CACHE = "shared/sources/compound-data/pubchem/pubchem-cas.tsv"
PUBCHEM_CACHE_COLUMNS: tuple[str, ...] = (
    "CAS", "status", "CID", "formula", "MW", "SMILES", "InChIKey", "IUPACName", "title", "candidates", "retrieved",
)
PUBCHEM_OK, PUBCHEM_NOT_FOUND, PUBCHEM_AMBIGUOUS, PUBCHEM_CHARGED = "ok", "notFound", "ambiguous", "charged"

PUBCHEM_DELAY = 0.25
PUBCHEM_THROTTLE_LEVELS: tuple[str, ...] = ("Green", "Yellow", "Red", "Black")
PUBCHEM_THROTTLE_DELAYS: dict[str, float] = {"Yellow": 1.0, "Red": 5.0}
PUBCHEM_BUSY_PAUSE = 60.0
PUBCHEM_MAX_PAUSES = 3
