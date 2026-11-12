"""phase_diagrams.models.compound_point — thin adapter over ``source_extract.diagrams.models.compound_point``."""
from __future__ import annotations

from source_extract.diagrams.models import compound_point as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
