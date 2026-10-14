"""
pubchem.pubchem_searcher — On-demand PubChem searches (a new phase-diagram compound, a CLI query or query file).

``search("CaAl2O4")`` (formula), ``search("12042-68-1")`` (CAS) or ``search("tricalcium silicate")`` (name):
the stored record is reused when it is complete, otherwise the missing requests are made and the record is
appended to its class file (``pubchem-<class>.jsonl``), so the fetch step and the build see it too. The
stored records are read once, on the first search.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional

from pubchem.constants.pubchem import PUBCHEM_DIR
from pubchem.parsers.pubchem_records import read_pubchem_lines, read_pubchem_records
from pubchem.pubchem_client import PubchemClient
from pubchem.pubchem_fetch import fetch_pubchem_record
from pubchem.pubchem_paths import pubchem_files
from pubchem.pubchem_query import PubchemQuery
from pubchem.pubchem_record import PubchemRecord
from pubchem.pubchem_records_writer import append_pubchem_record, compact_pubchem_files


class PubchemSearcher:
    """``client`` defaults to a ``PubchemClient`` with the standard pacing; ``experimental=False`` skips
    the "Experimental Properties" requests."""

    def __init__(self, out_dir: Path = Path(PUBCHEM_DIR), client: Optional[PubchemClient] = None,
                 experimental: bool = True) -> None:
        self.files = pubchem_files(out_dir)
        self._client = client
        self._experimental = experimental
        self._stored: Optional[dict[str, tuple[PubchemRecord, Path, int]]] = None
        self._fresh: dict[str, PubchemRecord] = {}
        self.requested = 0

    def search(self, text: str, by: Optional[str] = None, compound_class: Optional[str] = None,
               refresh: bool = False) -> Optional[PubchemRecord]:
        """Record of ``text`` (kind from ``by`` or from the text, see ``PubchemQuery.parse``)."""
        return self.fetch(PubchemQuery.parse(text, by), compound_class, refresh)

    def fetch(self, query: PubchemQuery, compound_class: Optional[str] = None,
              refresh: bool = False) -> Optional[PubchemRecord]:
        """Complete record of ``query`` (experimental bodies included); None when PubChem refused it."""
        stored = self._full(query.key)
        record = fetch_pubchem_record(self._client_(), query, compound_class, stored, self._experimental, refresh)
        if record is None:
            return None
        if stored is None or _fetched_more(record, stored):
            self.requested += 1
            append_pubchem_record(self.files[record.compound_class], record)
            self._fresh[query.key] = record
        return record

    def stored(self, key: str) -> Optional[PubchemRecord]:
        """The stored record of ``key`` (experimental bodies included), without asking PubChem."""
        return self._full(key)

    def compact(self) -> int:
        """Drop superseded lines (see ``compact_pubchem_files``); returns the number dropped."""
        dropped = compact_pubchem_files(self.files.values())
        self._stored = None
        return dropped

    def _full(self, key: str) -> Optional[PubchemRecord]:
        if key in self._fresh:
            return self._fresh[key]
        if self._stored is None:
            self._stored = read_pubchem_records(self.files.values())
        if key not in self._stored:
            return None
        _, path, line = self._stored[key]
        return read_pubchem_lines([(path, line)])[(path, line)]

    def _client_(self) -> PubchemClient:
        if self._client is None:
            self._client = PubchemClient()
        return self._client


def _fetched_more(record: PubchemRecord, stored: PubchemRecord) -> bool:
    return (record.answer is not stored.answer or record.compound_class != stored.compound_class
            or len(record.experimental) != len(stored.experimental)
            or len(record.cas_numbers) != len(stored.cas_numbers))
