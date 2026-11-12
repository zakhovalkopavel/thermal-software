"""phase_diagrams.config.trace_segment_spec — thin adapter over ``source_extract.diagrams.config.trace_segment_spec``."""
from __future__ import annotations

from source_extract.diagrams.config import trace_segment_spec as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
