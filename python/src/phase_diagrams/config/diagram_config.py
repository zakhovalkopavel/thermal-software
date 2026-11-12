"""phase_diagrams.config.diagram_config — thin adapter over ``source_extract.diagrams.config.diagram_config``."""
from __future__ import annotations

from source_extract.diagrams.config import diagram_config as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
