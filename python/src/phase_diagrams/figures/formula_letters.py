"""phase_diagrams.figures.formula_letters — thin adapter over ``source_extract.diagrams.figures.formula_letters``."""
from __future__ import annotations

from source_extract.diagrams.figures import formula_letters as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
