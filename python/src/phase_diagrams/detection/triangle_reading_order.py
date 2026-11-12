"""phase_diagrams.detection.triangle_reading_order — thin adapter over ``source_extract.diagrams.detection.triangle_reading_order``."""
from __future__ import annotations

from source_extract.diagrams.detection import triangle_reading_order as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
