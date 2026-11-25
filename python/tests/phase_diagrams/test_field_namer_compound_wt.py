"""_compound_wt must tolerate triangle corners without a fixed molar mass (FeOx)."""
from __future__ import annotations

import pytest

from phase_diagrams.builders.field_namer import _compound_wt


def test_compound_wt_ignores_feox_corner_when_unused():
    compound = {"oxideMoles": {"CaO": 1, "SiO2": 1}}
    wt = _compound_wt(compound, ["CaO", "FeOx", "SiO2"])
    assert wt is not None
    assert wt[1] == pytest.approx(0.0)
    assert sum(wt) == pytest.approx(100.0)


def test_compound_wt_rejects_feox_when_used():
    compound = {"oxideMoles": {"FeOx": 1, "SiO2": 1}}
    assert _compound_wt(compound, ["CaO", "FeOx", "SiO2"]) is None
