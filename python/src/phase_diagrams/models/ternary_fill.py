"""phase_diagrams.models.ternary_fill — thin adapter over ``source_extract.diagrams.models.ternary_fill``."""
from __future__ import annotations

from source_extract.diagrams.models import ternary_fill as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
