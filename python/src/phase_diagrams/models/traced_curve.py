"""phase_diagrams.models.traced_curve — thin adapter over ``source_extract.diagrams.models.traced_curve``."""
from __future__ import annotations

from source_extract.diagrams.models import traced_curve as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
