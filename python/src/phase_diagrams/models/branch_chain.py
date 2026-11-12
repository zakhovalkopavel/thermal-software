"""phase_diagrams.models.branch_chain — thin adapter over ``source_extract.diagrams.models.branch_chain``."""
from __future__ import annotations

from source_extract.diagrams.models import branch_chain as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
