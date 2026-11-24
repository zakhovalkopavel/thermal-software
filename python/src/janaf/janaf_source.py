"""
janaf.janaf_source — Where the parsed JANAF tables came from (py-janaf repository and commit).

Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class JanafSource:
    """py-janaf repository, commit and license of the parsed files, with link builders.

    Refs: docs/REFERENCES.md  [36] NISTJANAF
    """

    repository: str
    commit: Optional[str] = None
    license: str = "0BSD"

    @property
    def ref(self) -> str:
        """Commit when known, else ``main``."""
        return self.commit or "main"

    @property
    def tree_url(self) -> str:
        """The repository browsed at the recorded commit."""
        return f"{self.repository}/tree/{self.ref}"

    def file_url(self, table_id: str) -> str:
        """Link to the py-janaf data file, pinned to the commit when known."""
        return f"{self.repository}/blob/{self.ref}/src/janaf/data/{table_id}.txt"

    def nist_url(self, table_id: str) -> str:
        """Link to the original NIST-JANAF table page."""
        return f"https://janaf.nist.gov/tables/{table_id}.html"
