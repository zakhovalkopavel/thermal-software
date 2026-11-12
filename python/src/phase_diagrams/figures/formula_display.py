"""phase_diagrams.figures.formula_display — thin adapter over ``source_extract.diagrams.figures.formula_display``."""
from __future__ import annotations

from source_extract.diagrams.figures import formula_display as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
