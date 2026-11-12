"""phase_diagrams.builders.boundary_graph_builder — thin adapter over ``source_extract.diagrams.builders.boundary_graph_builder``."""
from __future__ import annotations

from source_extract.diagrams.builders import boundary_graph_builder as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
