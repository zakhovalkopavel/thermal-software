"""phase_diagrams.rendering.overlay_renderer — thin adapter over ``source_extract.diagrams.rendering.overlay_renderer``."""
from __future__ import annotations

from source_extract.diagrams.rendering import overlay_renderer as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
