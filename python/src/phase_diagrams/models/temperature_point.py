"""phase_diagrams.models.temperature_point — thin adapter over ``source_extract.diagrams.models.temperature_point``."""
from __future__ import annotations

from source_extract.diagrams.models import temperature_point as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
