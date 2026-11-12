"""phase_diagrams.figures.figure_finder — thin adapter over ``source_extract.diagrams.figures.figure_finder``."""
from __future__ import annotations

from source_extract.diagrams.figures import figure_finder as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
