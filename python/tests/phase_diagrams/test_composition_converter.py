"""
Unit tests for convert_composition (mol% ↔ wt%) with the NBS entries already in the dataset.
"""
from __future__ import annotations

import pytest

from phase_diagrams.nbs.composition_converter import convert_composition


def test_nbs_6095_converts_to_dataset_values():
    assert convert_composition({"Al2O3": 32.6, "MgO": 67.4}, "wt") == {"Al2O3": 55.0, "MgO": 45.0}


def test_nbs_6077_converts_to_dataset_values():
    assert convert_composition({"Al2O3": 88.3, "MgO": 11.7}, "wt") == {"Al2O3": 95.0, "MgO": 5.0}


def test_round_trip_without_rounding():
    wt = {"CaO": 30.3, "MgO": 8.1, "SiO2": 61.6}
    mol = convert_composition(wt, "mol", digits=None)
    back = convert_composition(mol, "wt", digits=None)
    assert back == pytest.approx(wt)


def test_unknown_oxide_raises():
    with pytest.raises(KeyError):
        convert_composition({"FeO": 50.0, "SiO2": 50.0}, "wt")
