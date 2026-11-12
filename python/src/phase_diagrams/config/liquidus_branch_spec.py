"""phase_diagrams.config.liquidus_branch_spec — thin adapter over ``source_extract.diagrams.config.liquidus_branch_spec``."""
from __future__ import annotations

from source_extract.diagrams.config import liquidus_branch_spec as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
