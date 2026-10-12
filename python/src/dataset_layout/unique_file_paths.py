"""
dataset_layout.unique_file_paths — Final ``.json`` paths of compound files, without collisions.

Paths are compared case-insensitively (macOS and Windows checkouts); every file of a colliding path
gets its tie-breaker (CAS, record id or table id) appended: ``C2H6O-ethanol-64-17-5.json``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from typing import Hashable, TypeVar

from dataset_layout.compound_file_name import name_slug

K = TypeVar("K", bound=Hashable)


def unique_file_paths(stems: dict[K, tuple[str, str, str]]) -> dict[K, str]:
    """key → (folder, file stem, tie-breaker) to key → ``folder/stem.json``."""
    by_path: dict[str, list[K]] = {}
    for key, (folder, stem, _) in stems.items():
        by_path.setdefault(f"{folder}/{stem}".lower(), []).append(key)
    paths: dict[K, str] = {}
    for keys in by_path.values():
        for key in keys:
            folder, stem, tie = stems[key]
            paths[key] = f"{folder}/{stem}-{name_slug(tie)}.json" if len(keys) > 1 else f"{folder}/{stem}.json"
    return paths
