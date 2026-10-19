"""
pubchem.constants.pubchem — PubChem PUG REST endpoints, request pacing and the local PubChem files.

The files are filled by ``scripts/fetch_pubchem_identifiers.py`` (``make compound-data-pubchem``)
from the CAS list the compound data build writes and by on-demand searches (``make pubchem-search``,
``PubchemSearcher``), and read by the next build.

Pacing follows https://pubchem.ncbi.nlm.nih.gov/docs/dynamic-request-throttling: at most 5 requests
per second and 400 per minute; every response carries ``X-Throttling-Control`` with Green / Yellow /
Red / Black per counter. Black on a client counter (request count, request time) means this client is
blocked; Black on the service counter means the whole server is overloaded.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

PUBCHEM_API = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
PUBCHEM_VIEW_API = "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view"
PUBCHEM_EXPERIMENTAL_HEADING = "Experimental Properties"
PUBCHEM_CAS_HEADING = "CAS"
PUBCHEM_SUMMARY_HEADINGS: tuple[str, ...] = ("Melting Point", "Boiling Point", "Density", "Decomposition")
PUBCHEM_SUMMARY_MAX_VALUES = 6
PUBCHEM_BY_CAS, PUBCHEM_BY_FORMULA, PUBCHEM_BY_NAME = "cas", "formula", "name"
# CAS → CID: try each route when compound/name has no synonym hit (see PubchemClient.answer).
PUBCHEM_CAS_LOOKUP_STEPS: tuple[str, ...] = (
    "compound/name",
    "compound/xref/RN",
    "substance/name",
    "substance/xref/RN",
)
PUBCHEM_CAS_LOOKUP = ",".join(PUBCHEM_CAS_LOOKUP_STEPS)
PUBCHEM_RANKING: tuple[str, ...] = ("AnnotationTypeCount", "LiteratureCount", "PatentCount")
PUBCHEM_COMPOUND_URL = "https://pubchem.ncbi.nlm.nih.gov/compound/{cid}"
# Identity / mass / charge / XLogP for the build, plus IsotopeAtomCount and PUBCHEM_RANKING so formula
# answers can drop isotopes and pick the best CID. Kept short: large property lists often time out (504).
PUBCHEM_PROPERTIES: tuple[str, ...] = (
    "MolecularFormula", "MolecularWeight", "SMILES", "ConnectivitySMILES", "InChI", "InChIKey",
    "IUPACName", "Title", "ExactMass", "MonoisotopicMass", "Charge", "XLogP",
    "IsotopeAtomCount", "AnnotationTypeCount", "LiteratureCount", "PatentCount",
)
PUBCHEM_DIR = "shared/sources/compound-data/pubchem"
PUBCHEM_FILE = "pubchem-{cls}.jsonl"
PUBCHEM_REFERENCES_FILE = "pubchem-references.jsonl"
PUBCHEM_OK, PUBCHEM_NOT_FOUND, PUBCHEM_AMBIGUOUS, PUBCHEM_CHARGED = "ok", "notFound", "ambiguous", "charged"
PUBCHEM_UNCLASSIFIED = "unclassified"
PUBCHEM_CAS_CLASSES: tuple[str, ...] = ("inorganic", "organic", PUBCHEM_UNCLASSIFIED)

PUBCHEM_DELAY = 0.5
PUBCHEM_CHUNK_SIZE = 50
PUBCHEM_CHUNK_PAUSE = 10.0
PUBCHEM_THROTTLE_LEVELS: tuple[str, ...] = ("Green", "Yellow", "Red", "Black")
PUBCHEM_THROTTLE_DELAYS: dict[str, float] = {"Yellow": 1.0, "Red": 5.0}
PUBCHEM_CLIENT_COUNTERS: tuple[str, ...] = ("Request Count", "Request Time")
PUBCHEM_SERVICE_COUNTER = "Service"
PUBCHEM_BUSY_PAUSE = 30.0
PUBCHEM_BUSY_PAUSE_MAX_MULTIPLIER = 4
PUBCHEM_OVERLOADED_PAUSE_MULTIPLIER = 1
PUBCHEM_MAX_WAIT = 4 * 3600.0
