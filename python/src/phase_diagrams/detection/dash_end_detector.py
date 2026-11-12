"""phase_diagrams.detection.dash_end_detector — thin adapter over ``source_extract.diagrams.detection.dash_end_detector``."""
from __future__ import annotations

from source_extract.diagrams.detection import dash_end_detector as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
