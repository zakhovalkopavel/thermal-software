"""phase_diagrams.builders.boundary_arrow_segments — thin adapter over ``source_extract.diagrams.builders.boundary_arrow_segments``."""
from __future__ import annotations

from source_extract.diagrams.builders import boundary_arrow_segments as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
