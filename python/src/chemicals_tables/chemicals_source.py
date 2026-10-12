"""
chemicals_tables.chemicals_source — Where the parsed tables came from (CalebBell/chemicals and commit).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional
from urllib.parse import quote

from chemicals_tables.source_link import SourceLink
from chemicals_tables.table_spec import TableSpec


@dataclass
class ChemicalsSource:
    """chemicals repository, commit and license, with link builders pinned to the commit."""

    repository: str
    commit: Optional[str] = None
    license: str = "MIT"

    @property
    def ref(self) -> str:
        """Commit when known, else ``master``."""
        return self.commit or "master"

    @property
    def tree_url(self) -> str:
        """The repository browsed at the recorded commit."""
        return f"{self.repository}/tree/{self.ref}"

    def file_url(self, path: str, line: Optional[int] = None) -> str:
        """Link to a repo file, e.g. ``chemicals/Heat Capacity/Zabransky.tsv``, optionally to one line."""
        url = f"{self.repository}/blob/{self.ref}/{quote(path)}"
        return f"{url}#L{line}" if line is not None else url

    def link(self, table: TableSpec, line: Optional[int], label: Optional[str] = None, **extra: Any) -> SourceLink:
        """``SourceLink`` to one row of ``table``."""
        return SourceLink(
            table=table.name, key=table.key, url=self.file_url(table.path, line), ref=table.ref,
            line=line, label=label, extra=extra,
        )
