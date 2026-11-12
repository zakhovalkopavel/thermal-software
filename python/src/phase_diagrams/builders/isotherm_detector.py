"""phase_diagrams.builders.isotherm_detector — thin adapter over ``source_extract.diagrams.builders.isotherm_detector``."""
from __future__ import annotations

from source_extract.diagrams.builders import isotherm_detector as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
