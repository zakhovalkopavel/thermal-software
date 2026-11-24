"""
janaf.parsers.provenance — Read the py-janaf repository and commit from ``PROVENANCE.txt``.

Expected lines (written by the download script)::

    py-janaf: https://github.com/n-takumasa/py-janaf.git
    ref: main  commit: c8ed6be3ba31a61835061091bd3c521270b484ec  committed: ...

Spec: docs/scripts/JANAF_PARSER_SPEC.md
Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Optional

from janaf.janaf_source import JanafSource

logger = logging.getLogger(__name__)

_DEFAULT_REPOSITORY = "https://github.com/n-takumasa/py-janaf"
_REPOSITORY = re.compile(r"^py-janaf:\s*(\S+)", re.MULTILINE)
_COMMIT = re.compile(r"\bcommit:\s*([0-9a-fA-F]{7,40})\b")


def read_janaf_source(path: Optional[Path]) -> JanafSource:
    """Repository URL (without ``.git``) and commit; falls back to the default repository and no commit."""
    if path is None or not path.exists():
        logger.warning("No provenance file (%s): links use %s at main", path, _DEFAULT_REPOSITORY)
        return JanafSource(repository=_DEFAULT_REPOSITORY)
    text = path.read_text(encoding="utf-8")
    repository_match = _REPOSITORY.search(text)
    repository = repository_match[1] if repository_match else _DEFAULT_REPOSITORY
    repository = repository.removesuffix(".git").rstrip("/")
    commit_match = _COMMIT.search(text)
    if commit_match is None:
        logger.warning("%s: no commit found, links use main", path)
    return JanafSource(repository=repository, commit=commit_match[1] if commit_match else None)
