"""
janaf.janaf_index — Load the py-janaf table index (``janaf.json``).

Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

import json
from pathlib import Path


def load_janaf_index(path: Path) -> dict[str, str]:
    """Map table ID to its display label, in index order.

    ``janaf.json`` holds two parallel arrays:
    ``{"display": ["Al, Aluminum (ref)", ...], "index": ["Al-001", ...]}``.
    """
    data = json.loads(path.read_text(encoding="utf-8"))
    ids = data["index"]
    labels = data["display"]
    if len(ids) != len(labels):
        raise ValueError(f"{path}: {len(ids)} IDs but {len(labels)} labels")
    return dict(zip(ids, labels))
