"""phase_diagrams.detection.ink_mask — thin adapter over ``source_extract.diagrams.detection.ink_mask``."""
from __future__ import annotations

from source_extract.diagrams.detection import ink_mask as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
