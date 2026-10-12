"""
janaf.janaf_source — Where the parsed JANAF tables came from (py-janaf repository and commit).

Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class JanafSource:
    """py-janaf repository and commit of the parsed files, with link builders.

    Refs: docs/REFERENCES.md  [36] NISTJANAF
    """

    repository: str
    commit: Optional[str] = None

    def file_url(self, table_id: str) -> str:
        """Link to the py-janaf data file, pinned to the commit when known."""
        return f"{self.repository}/blob/{self.commit or 'main'}/src/janaf/data/{table_id}.txt"

    def nist_url(self, table_id: str) -> str:
        """Link to the original NIST-JANAF table page."""
        return f"https://janaf.nist.gov/tables/{table_id}.html"
