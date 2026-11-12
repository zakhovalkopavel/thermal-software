"""phase_diagrams.models.review_item — thin adapter over ``source_extract.diagrams.models.review_item``."""
from __future__ import annotations

from source_extract.diagrams.models import review_item as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
