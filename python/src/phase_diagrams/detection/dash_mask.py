"""phase_diagrams.detection.dash_mask — thin adapter over ``source_extract.diagrams.detection.dash_mask``."""
from __future__ import annotations

from source_extract.diagrams.detection import dash_mask as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
