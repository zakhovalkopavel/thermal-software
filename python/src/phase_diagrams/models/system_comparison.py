"""phase_diagrams.models.system_comparison — thin adapter over ``source_extract.diagrams.models.system_comparison``."""
from __future__ import annotations

from source_extract.diagrams.models import system_comparison as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
