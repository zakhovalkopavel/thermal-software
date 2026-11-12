"""phase_diagrams.models.curve_sample — thin adapter over ``source_extract.diagrams.models.curve_sample``."""
from __future__ import annotations

from source_extract.diagrams.models import curve_sample as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
