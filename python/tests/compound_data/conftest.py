"""Fixtures for compound_data tests: shared with chemicals_tables (tests/chemicals_tables/chemicals_fixtures.py)."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "chemicals_tables"))

from chemicals_fixtures import chem, make_source  # noqa: E402,F401
