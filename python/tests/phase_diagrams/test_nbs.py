"""
Unit tests for the NSRDS-NBS 61 text normalizer, entry index and matcher (real lines with OCR noise).
"""
from __future__ import annotations

import pytest

from phase_diagrams.nbs.nbs_entry_index import build_nbs_index
from phase_diagrams.nbs.nbs_matcher import NbsMatcher
from phase_diagrams.nbs.nbs_text_normalizer import NbsTextNormalizer


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("Si0 2", "SiO2"), ("Si0,", "SiO2"), ("SiO,", "SiO2"), ("SiO.", "SiO2"),
        ("YlgO", "MgO"), ("MgoO", "MgO"),
        ("AI,O,", "Al2O3"), ("Al,O,", "Al2O3"), ("Al,0,", "Al2O3"), ("A1,0,", "Al2O3"), ("Al,03", "Al2O3"),
        ("Ca0", "CaO"),
        ("K,0", "K2O"), ("K 2O", "K2O"), ("K,O", "K2O"),
        ("Na,O", "Na2O"), ("Na,0", "Na2O"),
        ("KC1", "KC1"),
    ],
)
def test_component_normalization(raw, expected):
    assert NbsTextNormalizer.component(raw) == expected


@pytest.mark.parametrize(
    "raw, expected",
    [("1995.0", 1995.0), ("1%0.0", 1960.0), ("426,0", 426.0), ("1512;0", 1512.0), ("S0", 50.0), ("abc", None)],
)
def test_number_normalization(raw, expected):
    assert NbsTextNormalizer.number(raw) == expected


@pytest.mark.parametrize("raw, expected", [(":t3", 3.0), ("±5", 5.0), ("=4", 4.0), (":!:5", 5.0), ("±o", None)])
def test_uncertainty_normalization(raw, expected):
    assert NbsTextNormalizer.uncertainty(raw) == expected


def test_reference_digits():
    assert NbsTextNormalizer.reference("II43") == "1143"


@pytest.fixture
def entries(nbs_text):
    parsed, unparsed = build_nbs_index(nbs_text, 8)
    assert unparsed == []
    return {e.entry: e for e in parsed}


def test_page_from_form_feeds(entries):
    assert entries[6095].pdf_page == 116
    assert entries[6095].printed_page == 108


def test_binary_entry(entries):
    entry = entries[6095]
    assert entry.components == ["Al2O3", "MgO"]
    assert entry.composition_mol == [32.6, 67.4]
    assert entry.temperature_C == 1995.0
    assert entry.references == ["1442"]
    assert not entry.approximate


def test_approximate_composition(entries):
    assert entries[6077].approximate_composition
    assert entries[6096].composition_mol == [35.0, 65.0]
    assert entries[5909].approximate_composition
    assert entries[5909].uncertainty_C == 5.0


def test_approximate_temperature(entries):
    assert entries[4992].approximate_temperature
    assert entries[4992].components == ["K2O", "SiO2"]


def test_ternary_entry(entries):
    entry = entries[5802]
    assert entry.components == ["Al2O3", "MgO", "SiO2"]
    assert entry.composition_mol == [10.5, 29.5, 60.0]


def test_decimal_comma_and_ocr_digits(entries):
    assert entries[2352].temperature_C == 426.0
    assert entries[2812].composition_mol == [50.0, 50.0]
    assert entries[2812].approximate_composition


def test_suggest_filters_exact_components(entries):
    matcher = NbsMatcher(list(entries.values()))
    numbers = [entry.entry for entry, _ in matcher.suggest(["MgO", "Al2O3"])]
    assert numbers == [6077, 6095, 6096, 6097]


def test_suggest_converts_to_wt(entries):
    matcher = NbsMatcher(list(entries.values()))
    converted = dict((entry.entry, wt) for entry, wt in matcher.suggest(["Al2O3", "MgO"]))
    assert converted[6095] == {"Al2O3": 55.0, "MgO": 45.0}


def test_compare_rejects_other_components(entries):
    matcher = NbsMatcher(list(entries.values()))
    with pytest.raises(ValueError):
        matcher.compare(5931, {"Al2O3": 55.0, "MgO": 45.0}, 1995)
