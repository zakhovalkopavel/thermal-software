"""
phase_diagrams.models.calibration_result — Frame, ticks and calibration of one binary diagram.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from phase_diagrams.models.binary_calibration import BinaryCalibration
from phase_diagrams.models.frame import Frame
from phase_diagrams.models.review_item import ReviewItem


@dataclass
class CalibrationResult:
    frame: Frame
    calibration: BinaryCalibration
    x_tick_pixels: list[float]
    y_tick_pixels: list[float]
    x_residuals: list[float]
    y_residuals: list[float]
    tick_candidates: dict[str, list[float]] = field(default_factory=dict)
    review: list[ReviewItem] = field(default_factory=list)
    log: list[str] = field(default_factory=list)
