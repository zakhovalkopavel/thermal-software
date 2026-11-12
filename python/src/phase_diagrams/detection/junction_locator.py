"""phase_diagrams.detection.junction_locator — thin adapter over ``source_extract.diagrams.detection.junction_locator``."""
from __future__ import annotations

from source_extract.diagrams.detection import junction_locator as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
