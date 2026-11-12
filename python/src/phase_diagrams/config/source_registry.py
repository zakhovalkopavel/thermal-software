"""phase_diagrams.config.source_registry — thin adapter over ``source_extract.diagrams.config.source_registry``."""
from __future__ import annotations

from source_extract.diagrams.config import source_registry as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
