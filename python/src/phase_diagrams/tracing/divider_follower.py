"""phase_diagrams.tracing.divider_follower — thin adapter over ``source_extract.diagrams.tracing.divider_follower``."""
from __future__ import annotations

from source_extract.diagrams.tracing import divider_follower as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
