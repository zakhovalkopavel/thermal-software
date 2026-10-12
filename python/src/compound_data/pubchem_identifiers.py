"""
compound_data.pubchem_identifiers — PubChem cache rows → identifiers for the CAS numbers the chemicals files miss.

Only ``ok`` rows become identifiers (``[line, "idPubchemRest"]``, compound URL by CID); the other
statuses are counted and reported. The cache itself is filled by the separate fetch step.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import logging
from collections import Counter
from pathlib import Path
from typing import Any, Optional

from chemicals_tables.identifier import Identifier
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_link import SourceLink
from compound_data.constants.pubchem_source import PUBCHEM_TABLE
from pubchem.constants.pubchem import PUBCHEM_COMPOUND_URL, PUBCHEM_OK
from pubchem.parsers.pubchem_cache import read_pubchem_cache
from pubchem.pubchem_result import PubchemResult

logger = logging.getLogger(__name__)


def load_pubchem_identifiers(
    cache_path: Path, missing: set[str],
) -> tuple[dict[str, Identifier], dict[str, int], list[dict[str, Any]]]:
    """Identifiers of the ``ok`` cache rows for ``missing`` CAS; counts per status and report issues."""
    if not cache_path.is_file():
        logger.warning("[pubchem] Not found: %s — run make compound-data-pubchem", cache_path)
        return {}, {pubchem_count_key("notFetched"): len(missing)}, []
    cache = read_pubchem_cache(cache_path)
    found: dict[str, Identifier] = {}
    statuses: Counter[str] = Counter()
    issues: list[dict[str, Any]] = []
    for cas in sorted(missing):
        if cas not in cache:
            statuses["notFetched"] += 1
            continue
        result, line = cache[cas]
        statuses[result.status] += 1
        identifier = pubchem_identifier(result, line)
        if identifier is not None:
            found[cas] = identifier
        elif result.status != PUBCHEM_OK:
            issues.append(report_issue(pubchem_count_key(result.status), PUBCHEM_TABLE.name, line, cas, result.title,
                                       formula=result.formula, candidates=result.candidates))
    return found, {pubchem_count_key(s): n for s, n in sorted(statuses.items())}, issues


def pubchem_identifier(result: PubchemResult, line: int) -> Optional[Identifier]:
    """Identifier of an ``ok`` row; ``line`` is its 1-based line in the cache file."""
    if result.status != PUBCHEM_OK or not result.formula:
        return None
    source = SourceLink(
        table=PUBCHEM_TABLE.name, key=PUBCHEM_TABLE.key, url=PUBCHEM_COMPOUND_URL.format(cid=result.cid),
        line=line, label=result.name,
    )
    return Identifier(
        cas=result.cas, formula=result.formula, mw=result.mw, smiles=result.smiles, inchikey=result.inchikey,
        name=result.name, source=source, cid=result.cid,
    )


def pubchem_count_key(status: str) -> str:
    """``notFound`` → ``pubchemNotFound``."""
    return f"pubchem{status[0].upper()}{status[1:]}"
