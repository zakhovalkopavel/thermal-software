"""
phase_diagrams.models.review_item — One item of the review list.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Review outputs
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import ClassVar


@dataclass
class ReviewItem:
    KINDS: ClassVar[tuple[str, ...]] = (
        "label-drawing",
        "unlabelled",
        "nbs-conflict",
        "nbs-approximate",
        "trace-gap",
        "tick-residual",
        "ocr-differs",
        "dropped-points",
    )

    kind: str
    subject: str
    message: str

    def __post_init__(self) -> None:
        if self.kind not in self.KINDS:
            raise ValueError(f"unknown review kind '{self.kind}'")
