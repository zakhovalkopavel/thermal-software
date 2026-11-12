"""phase_diagrams.tracing.contour_segments — thin adapter over ``source_extract.diagrams.tracing.contour_segments``."""
from __future__ import annotations

from source_extract.diagrams.tracing import contour_segments as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
