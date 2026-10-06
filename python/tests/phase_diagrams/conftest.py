"""
Fixtures for the phase_diagrams tests (helpers in pd_helpers.py).
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

import pd_helpers


@pytest.fixture
def binary_image() -> np.ndarray:
    return pd_helpers.draw_binary()


@pytest.fixture
def nbs_text() -> str:
    return pd_helpers.nbs_text()


@pytest.fixture
def dataset_factory(tmp_path: Path):
    return pd_helpers.dataset_writer(tmp_path)
