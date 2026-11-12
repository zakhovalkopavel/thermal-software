"""phase_diagrams.models.detected_isotherm — thin adapter over ``source_extract.diagrams.models.detected_isotherm``."""
from __future__ import annotations

from source_extract.diagrams.models import detected_isotherm as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
