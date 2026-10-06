"""
phase_diagrams.models.traced_curve — Result of tracing one curve on the scan.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class TracedCurve:
    """Pixel path (stroke centre, page pixels) and the non-ink length it crossed."""

    pixels: list[tuple[float, float]]
    gap_px: float = 0.0
    label: str = ""
    points: list[tuple[float, float]] = field(default_factory=list)

    @property
    def start(self) -> tuple[float, float]:
        return self.pixels[0]

    @property
    def end(self) -> tuple[float, float]:
        return self.pixels[-1]
