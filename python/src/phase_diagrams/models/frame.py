"""phase_diagrams.models.frame — thin adapter over ``source_extract.diagrams.models.frame``."""
from __future__ import annotations

from source_extract.diagrams.models import frame as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
