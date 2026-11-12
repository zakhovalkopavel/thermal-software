"""phase_diagrams.detection.skeletonizer — thin adapter over ``source_extract.diagrams.detection.skeletonizer``."""
from __future__ import annotations

from source_extract.diagrams.detection import skeletonizer as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
