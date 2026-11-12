"""phase_diagrams.builders.field_regions_builder — thin adapter over ``source_extract.diagrams.builders.field_regions_builder``."""
from __future__ import annotations

from source_extract.diagrams.builders import field_regions_builder as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
