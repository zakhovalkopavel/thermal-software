"""phase_diagrams.detection.triangle_detector — thin adapter over ``source_extract.diagrams.detection.triangle_detector``."""
from __future__ import annotations

from source_extract.diagrams.detection import triangle_detector as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
