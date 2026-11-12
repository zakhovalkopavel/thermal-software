"""phase_diagrams.models.ternary_calibration — thin adapter over ``source_extract.diagrams.models.ternary_calibration``."""
from __future__ import annotations

from source_extract.diagrams.models import ternary_calibration as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
