"""
chemicals_tables.source_link — Link from a dataset value to the source table row it came from.

In the dataset a link is the tuple ``[RefKey, line, fileKey]`` (``to_ref``); ``sources.json`` maps
the file key to its path and URL. The full form with label and URL (``to_dict``) is only used in
the build report.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from references import RefKey


@dataclass
class SourceLink:
    """Table, file key, ref, row line, row label and pinned URL of one source row.

    ``extra`` holds per-value data written next to ``ref`` in the dataset (``variant``, ``error``,
    ``dataType``, ``uncertainty``) and links to other rows (``tcRef``, ``rangeRef``).

    Citation location is only ``ref`` (``[RefKey, line, fileKey]`` → ``sources.json``). Do not put
    ``tableId`` / ``rowId`` / ``page*`` in ``extra``; those keys are stripped if present.
    """

    table: str
    key: str
    url: str
    ref: Optional[RefKey] = None
    line: Optional[int] = None
    label: Optional[str] = None
    extra: dict[str, Any] = field(default_factory=dict)
    ref_text: Optional[str] = None

    # Provenance on a compound value is only ``ref``. Table/page locators belong in sources.json.
    _CITATION_ONLY_KEYS = frozenset({"tableId", "rowId", "page", "pageFirst", "pageLast", "pages"})

    def to_ref(self) -> list | str:
        """``[RefKey, line, fileKey]``; identifier rows have no ref and give ``[line, fileKey]``.

        ``ref_text`` is a catalog citation that is not a RefKey (``pubchem151``).
        """
        if self.ref_text is not None:
            return self.ref_text
        if self.ref is None:
            return [self.line, self.key]
        return [self.ref.value, self.line, self.key]

    def extra_fields(self) -> dict[str, Any]:
        """``extra`` for the dataset: links become ``ref`` tuples, ``None`` values are dropped.

        Citation-location keys are never written beside ``ref``.
        """
        return {
            k: v.to_ref() if isinstance(v, SourceLink) else v
            for k, v in self.extra.items()
            if v is not None and k not in self._CITATION_ONLY_KEYS
        }

    def to_dict(self) -> dict:
        """Full form for the build report."""
        out: dict[str, Any] = {"table": self.table, "label": self.label, "line": self.line, "url": self.url}
        for key, value in self.extra.items():
            out[key] = value.to_dict() if isinstance(value, SourceLink) else value
        return out
