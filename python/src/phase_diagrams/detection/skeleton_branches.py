"""phase_diagrams.detection.skeleton_branches — thin adapter over ``source_extract.diagrams.detection.skeleton_branches``."""
from __future__ import annotations

from source_extract.diagrams.detection import skeleton_branches as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
