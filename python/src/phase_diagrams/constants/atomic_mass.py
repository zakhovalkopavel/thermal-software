"""phase_diagrams.constants.atomic_mass — thin adapter over ``source_extract.diagrams.constants.atomic_mass``."""
from __future__ import annotations

from source_extract.diagrams.constants import atomic_mass as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
