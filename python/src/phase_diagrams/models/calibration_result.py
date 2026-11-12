"""phase_diagrams.models.calibration_result — thin adapter over ``source_extract.diagrams.models.calibration_result``."""
from __future__ import annotations

from source_extract.diagrams.models import calibration_result as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
