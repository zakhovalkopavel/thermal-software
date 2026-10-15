"""
phase_diagrams.models.isotherm_detection — Result of the isotherm detector on one ternary page.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Isotherm detection
"""
from __future__ import annotations

from dataclasses import dataclass, field

from phase_diagrams.models.detected_isotherm import DetectedIsotherm
from phase_diagrams.models.review_item import ReviewItem


@dataclass
class IsothermDetection:
    """``isotherms`` found (one per field piece), ``dropped`` thin lines that are not isotherms as
    ``(page pixels, reason)``, the ``log`` and the ``review`` items."""

    isotherms: list[DetectedIsotherm] = field(default_factory=list)
    dropped: list[tuple[list[tuple[float, float]], str]] = field(default_factory=list)
    log: list[str] = field(default_factory=list)
    review: list[ReviewItem] = field(default_factory=list)
