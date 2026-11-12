"""phase_diagrams.models.diagram_node — thin adapter over ``source_extract.diagrams.models.diagram_node``."""
from __future__ import annotations

from source_extract.diagrams.models import diagram_node as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
