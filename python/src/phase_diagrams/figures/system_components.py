"""phase_diagrams.figures.system_components — thin adapter over ``source_extract.diagrams.figures.system_components``."""
from __future__ import annotations

from source_extract.diagrams.figures import system_components as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
