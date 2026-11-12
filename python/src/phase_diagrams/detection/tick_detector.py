"""phase_diagrams.detection.tick_detector — thin adapter over ``source_extract.diagrams.detection.tick_detector``."""
from __future__ import annotations

from source_extract.diagrams.detection import tick_detector as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
