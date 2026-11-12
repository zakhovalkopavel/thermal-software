"""phase_diagrams.builders.isotherm_side_labels — thin adapter over ``source_extract.diagrams.builders.isotherm_side_labels``."""
from __future__ import annotations

from source_extract.diagrams.builders import isotherm_side_labels as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
