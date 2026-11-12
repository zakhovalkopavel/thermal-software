"""phase_diagrams.builders.node_label_resolver — thin adapter over ``source_extract.diagrams.builders.node_label_resolver``."""
from __future__ import annotations

from source_extract.diagrams.builders import node_label_resolver as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
