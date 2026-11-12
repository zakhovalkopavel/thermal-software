"""phase_diagrams.models.validation_issue — thin adapter over ``source_extract.diagrams.models.validation_issue``."""
from __future__ import annotations

from source_extract.diagrams.models import validation_issue as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
