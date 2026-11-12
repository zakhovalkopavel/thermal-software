"""phase_diagrams.tracing.curve_tracer — thin adapter over ``source_extract.diagrams.tracing.curve_tracer``."""
from __future__ import annotations

from source_extract.diagrams.tracing import curve_tracer as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
