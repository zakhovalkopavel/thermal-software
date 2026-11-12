"""phase_diagrams.figures.label_reader — thin adapter over ``source_extract.diagrams.figures.label_reader``."""
from __future__ import annotations

from source_extract.diagrams.figures import label_reader as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
