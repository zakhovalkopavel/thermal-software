"""phase_diagrams.validation.inferred_temperature_check — thin adapter over ``source_extract.diagrams.validation.inferred_temperature_check``."""
from __future__ import annotations

from source_extract.diagrams.validation import inferred_temperature_check as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
