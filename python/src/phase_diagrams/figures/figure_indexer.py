"""phase_diagrams.figures.figure_indexer — thin adapter over ``source_extract.diagrams.figures.figure_indexer``."""
from __future__ import annotations

from source_extract.diagrams.figures import figure_indexer as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
