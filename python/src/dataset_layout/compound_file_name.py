"""
dataset_layout.compound_file_name — File name of one compound: formula plus name slug.

``("Al2O3", "Aluminum Oxide")`` → ``Al2O3-aluminum-oxide``; ``("C2H6O", "ethanol")`` → ``C2H6O-ethanol``.
The formula keeps its case (``CO`` and ``Co`` differ); the name becomes lowercase ASCII words joined
by ``-``, Greek letters spelled out (``α`` → ``alpha``). A name that only repeats the formula is dropped.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import re
import unicodedata
from typing import Optional

MAX_SLUG_LENGTH = 80

_NON_WORD = re.compile(r"[^a-z0-9]+")


def name_slug(name: Optional[str]) -> str:
    """``"Aluminum Oxide, Alpha (Al2O3)"`` → ``aluminum-oxide-alpha-al2o3``; ``""`` for no name."""
    if not name:
        return ""
    parts = []
    for char in unicodedata.normalize("NFKD", name):
        if unicodedata.combining(char):
            continue
        if char.isascii():
            parts.append(char.lower())
            continue
        char_name = unicodedata.name(char, "")
        parts.append(f" {char_name.split()[-1].lower()} " if char_name.startswith("GREEK") else " ")
    slug = _NON_WORD.sub("-", "".join(parts)).strip("-")
    if len(slug) > MAX_SLUG_LENGTH:
        slug = slug[:MAX_SLUG_LENGTH].rsplit("-", 1)[0]
    return slug


def compound_file_name(formula: str, name: Optional[str]) -> str:
    """File stem (no ``.json``) of a compound file."""
    slug = name_slug(name)
    if not slug or slug == name_slug(formula):
        return formula
    return f"{formula}-{slug}"
