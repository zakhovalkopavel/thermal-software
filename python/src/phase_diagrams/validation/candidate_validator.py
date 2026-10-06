"""
phase_diagrams.validation.candidate_validator — Validate the dataset as it would be after promoting a candidate.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Candidates, comparison and promotion
"""
from __future__ import annotations

import shutil
import tempfile
from pathlib import Path

from phase_diagrams.models.validation_issue import ValidationIssue
from phase_diagrams.validation.dataset_validator import validate_dataset


def validate_with_candidate(dataset_dir: Path | str, relative_path: str, candidate_text: str) -> list[ValidationIssue]:
    """Issues of a copy of the dataset with ``relative_path`` replaced by the candidate; the dataset is not touched.

    The copy keeps the ``shared/processed/phase-diagrams`` depth, so PDF paths in
    sources.json resolve the same way.
    """
    dataset_dir = Path(dataset_dir)
    with tempfile.TemporaryDirectory(prefix="pd-candidate-") as tmp:
        copy = Path(tmp) / "shared" / "processed" / dataset_dir.name
        shutil.copytree(dataset_dir, copy)
        target = copy / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(candidate_text, encoding="utf-8")
        return validate_dataset(copy)
