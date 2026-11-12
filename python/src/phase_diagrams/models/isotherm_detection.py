"""phase_diagrams.models.isotherm_detection — thin adapter over ``source_extract.diagrams.models.isotherm_detection``."""
from __future__ import annotations

from source_extract.diagrams.models import isotherm_detection as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
