"""phase_diagrams.models.binary_extraction — thin adapter over ``source_extract.diagrams.models.binary_extraction``."""
from __future__ import annotations

from source_extract.diagrams.models import binary_extraction as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
