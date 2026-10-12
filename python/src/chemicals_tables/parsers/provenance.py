"""
chemicals_tables.parsers.provenance — Read the chemicals repository and commit from ``PROVENANCE.txt``.

Expected lines::

    chemicals: https://github.com/CalebBell/chemicals
    version:   commit: e79047588b30cfabc564c79fb26d760c746877d7  committed: ...

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Optional

from chemicals_tables.chemicals_source import ChemicalsSource

logger = logging.getLogger(__name__)

_DEFAULT_REPOSITORY = "https://github.com/CalebBell/chemicals"
_REPOSITORY = re.compile(r"^chemicals:\s*(\S+)", re.MULTILINE)
_COMMIT = re.compile(r"\bcommit:\s*([0-9a-fA-F]{7,40})\b")


def read_chemicals_source(path: Optional[Path]) -> ChemicalsSource:
    """Repository URL (without ``.git``) and commit; falls back to the default repository at master."""
    if path is None or not path.exists():
        logger.warning("No provenance file (%s): links use %s at master", path, _DEFAULT_REPOSITORY)
        return ChemicalsSource(repository=_DEFAULT_REPOSITORY)
    text = path.read_text(encoding="utf-8")
    repository_match = _REPOSITORY.search(text)
    repository = repository_match[1] if repository_match else _DEFAULT_REPOSITORY
    repository = repository.removesuffix(".git").rstrip("/")
    commit_match = _COMMIT.search(text)
    if commit_match is None:
        logger.warning("%s: no commit found, links use master", path)
    return ChemicalsSource(repository=repository, commit=commit_match[1] if commit_match else None)
