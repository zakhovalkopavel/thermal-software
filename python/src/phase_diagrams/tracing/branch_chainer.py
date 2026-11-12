"""phase_diagrams.tracing.branch_chainer — thin adapter over ``source_extract.diagrams.tracing.branch_chainer``."""
from __future__ import annotations

from source_extract.diagrams.tracing import branch_chainer as _src

globals().update({k: v for k, v in vars(_src).items() if not k.startswith("__")})
