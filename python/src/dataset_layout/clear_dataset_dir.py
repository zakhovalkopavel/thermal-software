"""
dataset_layout.clear_dataset_dir — Empty a dataset folder before a full rewrite.

Removes the class folders (``inorganic/``, ``organic/``) and the top-level ``.json`` files, so files of
renamed or dropped compounds (and of older layouts) do not linger. Anything else is kept and logged,
which guards against a mistyped ``--out-dir``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import logging
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)

CLASS_FOLDERS = ("inorganic", "organic")


def clear_dataset_dir(out_dir: Path) -> None:
    """Delete ``out_dir/inorganic``, ``out_dir/organic`` and ``out_dir/*.json``; create ``out_dir`` if missing."""
    out_dir.mkdir(parents=True, exist_ok=True)
    removed = 0
    for entry in sorted(out_dir.iterdir()):
        if entry.is_dir() and entry.name in CLASS_FOLDERS:
            shutil.rmtree(entry)
            removed += 1
        elif entry.is_file() and entry.suffix == ".json":
            entry.unlink()
            removed += 1
        else:
            logger.warning("%s: kept %s (not a dataset file)", out_dir, entry.name)
    logger.info("[output] Cleared %s  (%d entries removed)", out_dir, removed)
