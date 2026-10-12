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
    """

    table: str
    key: str
    url: str
    ref: Optional[RefKey] = None
    line: Optional[int] = None
    label: Optional[str] = None
    extra: dict[str, Any] = field(default_factory=dict)

    def to_ref(self) -> list:
        """``[RefKey, line, fileKey]``; identifier rows have no ref and give ``[line, fileKey]``."""
        if self.ref is None:
            return [self.line, self.key]
        return [self.ref.value, self.line, self.key]

    def extra_fields(self) -> dict[str, Any]:
        """``extra`` for the dataset: links become ``ref`` tuples, ``None`` values are dropped."""
        return {
            k: v.to_ref() if isinstance(v, SourceLink) else v
            for k, v in self.extra.items()
            if v is not None
        }

    def to_dict(self) -> dict:
        """Full form for the build report."""
        out: dict[str, Any] = {"table": self.table, "label": self.label, "line": self.line, "url": self.url}
        for key, value in self.extra.items():
            out[key] = value.to_dict() if isinstance(value, SourceLink) else value
        return out
