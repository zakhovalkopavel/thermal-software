"""phase_diagrams.models.boundary_graph — thin adapter over ``source_extract.diagrams.models.boundary_graph``."""
from __future__ import annotations

from source_extract.diagrams.models import boundary_graph as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
