"""
Unit tests for NSRDS-NBS 61 bibliography parse (two-column layout, wrap, gaps).
"""
from __future__ import annotations

from phase_diagrams.nbs.nbs_bibliography import (
    linearize_bibliography_pages,
    merge_bibliography,
    parse_bibliography,
    split_two_columns,
)

# Synthetic two-column page (layout-like spacing) with wrap + a gap after [2].
_SAMPLE_PAGE = """\
                                                                                      Bibliography
[1]    Akopov,   E.K.,  Bergman,   A.G.,   Complex Formation                                           [3]   Chernov,           R.V.,             Delimarskii,         Yu.K.,        Electrical
           between the Molten Chlorides and Sulfates of Lithium,                                                 Conductivity Relations in Molten Alkali Metal Chloride
           Sodium, and Potassium — Dokl. Akad. Nauk SSSR,                                                        Systems — Zhur. Neorg. Khim., 6, 2749(1961).
            102, 81(1955).
[2]    Akopov, E.K., The Ternary System of the Chlorides of                                            [4]   Cohen,     S.I.,    Powers,           W.D., Greene, N.D.,             A Physical
           Lithium, Sodium, and Potassium — Zhur. Neorg. Khim.,                                                  Property Summary for Fluoride Mixtures — ORNL— 2150,
            1, 1019(1956).                                                                                        117(1956).

                                                                               157
"""


def test_split_two_columns_keeps_right_marker_intact():
    left, right = split_two_columns(_SAMPLE_PAGE)
    assert "[1]" in left and "[2]" in left
    assert "[3]" in right and "[4]" in right
    assert "[3]" not in left
    assert "[1]" not in right


def test_linearize_is_left_then_right():
    linear = linearize_bibliography_pages(_SAMPLE_PAGE + "\f")
    assert linear.index("[1]") < linear.index("[2]") < linear.index("[3]") < linear.index("[4]")


def test_parse_joins_wrapped_lines_and_reports_gap():
    entries, missing = parse_bibliography(_SAMPLE_PAGE + "\f")
    assert list(entries) == ["1", "2", "3", "4"]
    assert "Complex Formation between the Molten Chlorides" in entries["1"]
    assert "Dokl. Akad. Nauk SSSR, 102, 81(1955)" in entries["1"]
    assert "2749(1961)" in entries["3"]
    assert missing == []  # contiguous 1–4


def test_parse_reports_missing_ids_in_range():
    # Markers 1, 2, 4 only → missing [3] in the closed range.
    sparse = """\
[1]    First citation here — J. Chem., 1, 1(1950).                                          [4]   Fourth citation — J. Chem., 4, 4(1954).
[2]    Second citation — J. Chem., 2, 2(1951).
"""
    entries, missing = parse_bibliography(sparse + "\f")
    assert set(entries) == {"1", "2", "4"}
    assert missing == [3]


def test_spaced_and_multiline_markers():
    page = """\
[   10]   Spaced marker citation — J. Test, 1(1960).                                        [11]   Normal marker — J. Test, 2(1961).
"""
    entries, missing = parse_bibliography(page + "\f")
    assert entries["10"].startswith("Spaced marker")
    assert entries["11"].startswith("Normal marker")
    assert missing == []


def test_merge_preserves_prior_only_keys_unless_force():
    prior = {"1": "hand-fixed", "99": "only-in-prior"}
    parsed = {"1": "from-pdf", "2": "new"}
    merged = merge_bibliography(prior, parsed, force=False)
    assert merged == {"1": "from-pdf", "2": "new", "99": "only-in-prior"}
    forced = merge_bibliography(prior, parsed, force=True)
    assert forced == {"1": "from-pdf", "2": "new"}
