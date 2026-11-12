"""phase_diagrams.rendering.arrowheads — thin adapter over ``source_extract.diagrams.rendering.arrowheads``."""
from __future__ import annotations

from source_extract.diagrams.rendering import arrowheads as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
