"""phase_diagrams.config.config_loader — thin adapter over ``source_extract.diagrams.config.config_loader``."""
from __future__ import annotations

from source_extract.diagrams.config import config_loader as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
