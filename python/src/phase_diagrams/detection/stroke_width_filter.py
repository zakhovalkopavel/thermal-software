"""phase_diagrams.detection.stroke_width_filter — thin adapter over ``source_extract.diagrams.detection.stroke_width_filter``."""
from __future__ import annotations

from source_extract.diagrams.detection import stroke_width_filter as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
