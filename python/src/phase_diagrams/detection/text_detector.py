"""phase_diagrams.detection.text_detector — thin adapter over ``source_extract.diagrams.detection.text_detector``."""
from __future__ import annotations

from source_extract.diagrams.detection import text_detector as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
