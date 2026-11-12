"""phase_diagrams.figures.caption_parser — thin adapter over ``source_extract.diagrams.figures.caption_parser``."""
from __future__ import annotations

from source_extract.diagrams.figures import caption_parser as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
