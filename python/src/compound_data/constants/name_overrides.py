"""
compound_data.constants.name_overrides — CAS → display name filled when identifiers lack one.

Loaded from ``name_overrides.json`` (names-to-fill + proposal labels).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import json
from pathlib import Path

_PATH = Path(__file__).with_name("name_overrides.json")


def _load() -> dict[str, str]:
    if not _PATH.is_file():
        return {}
    data = json.loads(_PATH.read_text(encoding="utf-8"))
    return {cas: name for cas, name in data.items() if cas and name}


NAME_OVERRIDES: dict[str, str] = _load()
