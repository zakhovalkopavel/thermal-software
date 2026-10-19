"""
pubchem.pubchem_record_summary — A PubChem record as a few lines of text, for the console and notes.

    formula:CaAl2O4 → ok  CID 14779  CAS 12042-68-1  Calcium aluminate  CaAl2O4  158.04 g/mol
      Melting Point: 1600 °C | 2903 °F
      https://pubchem.ncbi.nlm.nih.gov/compound/14779

The experimental values are the chosen compound's "Experimental Properties" strings under
``PUBCHEM_SUMMARY_HEADINGS``, as the sources print them, at most ``PUBCHEM_SUMMARY_MAX_VALUES`` per heading.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

from typing import Optional

from pubchem.constants.pubchem import (
    PUBCHEM_COMPOUND_URL, PUBCHEM_OK, PUBCHEM_SUMMARY_HEADINGS, PUBCHEM_SUMMARY_MAX_VALUES,
)
from pubchem.pubchem_record import PubchemRecord
from pubchem.pubchem_view_text import view_strings


def record_headline(record: PubchemRecord) -> str:
    """Key, status and the chosen compound's identifiers on one line."""
    result = record.result
    parts = [f"{record.key} → {result.status}"]
    if result.cid is not None:
        parts.append(f"CID {result.cid}")
    if result.cas:
        parts.append(f"CAS {result.cas}")
    parts += [s for s in (result.name, result.formula) if s]
    if result.mw is not None:
        parts.append(f"{result.mw:g} g/mol")
    if result.candidates and result.status != PUBCHEM_OK:
        parts.append(f"candidates {', '.join(result.candidates[:8])}{' …' if len(result.candidates) > 8 else ''}")
    return "  ".join(parts)


def experimental_values(record: PubchemRecord, heading: str, cid: Optional[int] = None) -> list[str]:
    """Distinct strings under ``heading`` on the page of ``cid`` (default: the chosen compound)."""
    cid = cid if cid is not None else record.result.cid
    view = next((v for v in record.experimental if v.cid == cid), None)
    return list(dict.fromkeys(view_strings(view, heading) if view else []))


def record_summary(record: PubchemRecord) -> list[str]:
    """``record_headline``, the experimental values and the compound URL."""
    lines = [record_headline(record)]
    for heading in PUBCHEM_SUMMARY_HEADINGS:
        values = experimental_values(record, heading)
        if values:
            more = " …" if len(values) > PUBCHEM_SUMMARY_MAX_VALUES else ""
            lines.append(f"  {heading}: {' | '.join(values[:PUBCHEM_SUMMARY_MAX_VALUES])}{more}")
    if record.result.cid is not None:
        lines.append(f"  {PUBCHEM_COMPOUND_URL.format(cid=record.result.cid)}")
    return lines
