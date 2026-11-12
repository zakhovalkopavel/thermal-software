"""phase_diagrams.builders.auto_overlay_curves — thin adapter over ``source_extract.diagrams.builders.auto_overlay_curves``."""
from __future__ import annotations

from source_extract.diagrams.builders import auto_overlay_curves as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
