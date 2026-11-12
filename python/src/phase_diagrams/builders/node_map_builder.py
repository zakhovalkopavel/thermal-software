"""phase_diagrams.builders.node_map_builder — thin adapter over ``source_extract.diagrams.builders.node_map_builder``."""
from __future__ import annotations

from source_extract.diagrams.builders import node_map_builder as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
