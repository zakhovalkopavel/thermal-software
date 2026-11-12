"""phase_diagrams.tracing.polyline_simplifier — thin adapter over ``source_extract.diagrams.tracing.polyline_simplifier``."""
from __future__ import annotations

from source_extract.diagrams.tracing import polyline_simplifier as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
