"""phase_diagrams.models.field_approximation — thin adapter over ``source_extract.diagrams.models.field_approximation``."""
from __future__ import annotations

from source_extract.diagrams.models import field_approximation as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
