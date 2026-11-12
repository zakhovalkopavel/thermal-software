"""phase_diagrams.models.page_word — thin adapter over ``source_extract.diagrams.models.page_word``."""
from __future__ import annotations

from source_extract.diagrams.models import page_word as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
