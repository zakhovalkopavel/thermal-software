"""phase_diagrams.builders.isotherm_temperature_solver — thin adapter over ``source_extract.diagrams.builders.isotherm_temperature_solver``."""
from __future__ import annotations

from source_extract.diagrams.builders import isotherm_temperature_solver as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
