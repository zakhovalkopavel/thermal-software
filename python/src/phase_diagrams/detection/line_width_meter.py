"""phase_diagrams.detection.line_width_meter — thin adapter over ``source_extract.diagrams.detection.line_width_meter``."""
from __future__ import annotations

from source_extract.diagrams.detection import line_width_meter as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
