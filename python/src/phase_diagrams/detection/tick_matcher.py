"""phase_diagrams.detection.tick_matcher — thin adapter over ``source_extract.diagrams.detection.tick_matcher``."""
from __future__ import annotations

from source_extract.diagrams.detection import tick_matcher as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
