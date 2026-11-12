"""phase_diagrams.constants.comparison_tolerance — thin adapter over ``source_extract.diagrams.constants.comparison_tolerance``."""
from __future__ import annotations

from source_extract.diagrams.constants import comparison_tolerance as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
