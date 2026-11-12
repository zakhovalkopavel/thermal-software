"""phase_diagrams.rendering.node_map_renderer — thin adapter over ``source_extract.diagrams.rendering.node_map_renderer``."""
from __future__ import annotations

from source_extract.diagrams.rendering import node_map_renderer as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
