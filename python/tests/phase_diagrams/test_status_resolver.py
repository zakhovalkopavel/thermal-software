"""
Unit tests for resolve_status and the NBS comparison texts (al2o3-mgo cases).
"""
from __future__ import annotations

import pytest

from phase_diagrams.nbs.nbs_entry_index import build_nbs_index
from phase_diagrams.nbs.nbs_matcher import NbsMatcher
from phase_diagrams.nbs.status_resolver import resolve_status


@pytest.fixture
def matcher(nbs_text):
    entries, _ = build_nbs_index(nbs_text, 8)
    return NbsMatcher(entries)


def test_no_entries_is_extracted():
    assert resolve_status([]) == "extracted"


def test_am_1995_confirmed(matcher):
    liquid = {"Al2O3": 55.0, "MgO": 45.0}
    comparisons = [matcher.compare(n, liquid, 1995) for n in (6095, 6096)]
    assert resolve_status(comparisons) == "confirmed"
    assert comparisons[0].comparison_text() == "ΔT = 0 °C, Δ = 0.0 wt%."
    assert comparisons[1].comparison_text() == "ΔT = +5 °C, Δ = 2.7 wt% (approximate value)."


def test_am_1975_conflict(matcher):
    liquid = {"Al2O3": 96.0, "MgO": 4.0}
    comparisons = [matcher.compare(n, liquid, 1975) for n in (6077, 6097)]
    assert resolve_status(comparisons) == "conflict"
    assert comparisons[0].comparison_text() == "ΔT = −50 °C, Δ = 1.0 wt% (approximate value)."
    assert comparisons[1].comparison_text() == "ΔT = +25 °C, Δ = 2.5 wt% (approximate value)."


def test_nbs_source_block(matcher):
    source = matcher.compare(6095, {"Al2O3": 55.0, "MgO": 45.0}, 1995).to_source(["Al2O3", "MgO"])
    assert source == {
        "ref": "nsrds-nbs-61-1", "entry": 6095, "pdfPage": 116, "printedPage": 108,
        "reported": {"system": "Al2O3-MgO", "composition_mol": {"Al2O3": 32.6, "MgO": 67.4},
                     "temperature_C": 1995, "uncertainty_C": None},
        "converted_wt": {"Al2O3": 55.0, "MgO": 45.0}, "originalReference": "1442",
        "comparison": "ΔT = 0 °C, Δ = 0.0 wt%.",
    }
