"""phase_diagrams.models.line_scale — thin adapter over ``source_extract.diagrams.models.line_scale``."""
from __future__ import annotations

from source_extract.diagrams.models import line_scale as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
