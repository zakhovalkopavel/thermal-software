"""phase_diagrams.constants.boundary_arrows — thin adapter over ``source_extract.diagrams.constants.boundary_arrows``."""
from __future__ import annotations

from source_extract.diagrams.constants import boundary_arrows as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
