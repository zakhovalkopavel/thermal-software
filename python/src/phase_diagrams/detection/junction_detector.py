"""phase_diagrams.detection.junction_detector — thin adapter over ``source_extract.diagrams.detection.junction_detector``."""
from __future__ import annotations

from source_extract.diagrams.detection import junction_detector as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
