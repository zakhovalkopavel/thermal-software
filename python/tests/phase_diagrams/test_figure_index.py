"""
Unit tests for the caption parser and the figure-index merge (real Tesseract output of atlas pages).
"""
from __future__ import annotations

from phase_diagrams.figures.caption_parser import parse_figure_captions
from phase_diagrams.figures.figure_index_merger import merge_figure_index

PAGE_80 = (
    "Fig. 3.64.\n\n(Cad)\n\na: CagFe90 13\n\nb: CaFeqOg\n\nc: CagFe704,\n\n"
    "Fig. 3.65,\n\n"
    "Figs. 3.64 and 3.65. _Sub-solidus equilibria in the Fe,0,-\n"
    "rich region of the Fe-CaO-Fe,O, system at 1200 °C\n"
)
PAGE_81 = (
    "Fig. 3.66. CaO-MgO phase diagram after\nDoman et al. [1]. The solubility of CaO in\n\n"
    "Fig. 3.67. CaO-MnO system under reducing\nconditions after Schenck et al. [1] (solidus as\n"
)
PAGE_134 = (
    "Fig. 3.188.\n\nSiOz\n\nMass % AlO3 —~\n\nFig. 3.189.\n\nReferences\n\n"
    "Fig. 3.190.\n\n"
    "Figures 3.188 to 3.190. Isothermal section through the\nsystem Al,O,-MgO-SiO, at 1470, 1450 and 1350 °C a\n"
)
PAGE_154 = (
    "Fig. 3.250. Sub-solidus equilibria in the Ca0-MgO-SiO,,\nsystem as evaluated by Osborn, Muan [1].\n"
    "Fig. 3.251) are not included in the figure. The\nsection shows the compatibility relations\n"
    "Fig. 3.249. Liquidus surface in the\nCaO-MgO-SiO, system as evaluated\n"
)


def _by_figure(text: str) -> dict[str, str]:
    return {c["figure"]: c["captionStart"] for c in parse_figure_captions(text)}


def test_single_captions_take_the_following_text():
    captions = _by_figure(PAGE_81)
    assert list(captions) == ["Fig. 3.66", "Fig. 3.67"]
    assert captions["Fig. 3.66"].startswith("CaO-MgO phase diagram after Doman et al. [1].")


def test_shared_caption_with_and_replaces_bare_labels():
    captions = _by_figure(PAGE_80)
    assert list(captions) == ["Fig. 3.64", "Fig. 3.65"]
    assert captions["Fig. 3.64"].startswith("_Sub-solidus equilibria in the Fe,0,- rich region")
    assert captions["Fig. 3.65"] == captions["Fig. 3.64"]


def test_shared_caption_with_range_expands_the_numbers():
    captions = _by_figure(PAGE_134)
    assert list(captions) == ["Fig. 3.188", "Fig. 3.189", "Fig. 3.190"]
    assert all(c.startswith("Isothermal section through the system") for c in captions.values())


def test_cross_reference_is_not_a_caption():
    assert list(_by_figure(PAGE_154)) == ["Fig. 3.250", "Fig. 3.249"]


def test_bare_label_without_caption_keeps_the_figure():
    assert _by_figure("Fig. 3.30.\n\nMass % MgO\n") == {"Fig. 3.30": ""}


def test_merge_replaces_only_the_reindexed_pages():
    existing = [
        {"figure": "Fig. 3.30", "pdfPage": 64, "printedPage": 44, "captionStart": "Al2O3-MgO"},
        {"figure": "Fig. 3.64", "pdfPage": 80, "printedPage": 60, "captionStart": "(Cad) a: CagFe90"},
        {"figure": "Fig. 3.125", "pdfPage": 108, "printedPage": 88, "captionStart": "MgO-SiO2"},
    ]
    found = [
        {"figure": "Fig. 3.65", "pdfPage": 80, "printedPage": 60, "captionStart": "Sub-solidus"},
        {"figure": "Fig. 3.64", "pdfPage": 80, "printedPage": 60, "captionStart": "Sub-solidus"},
        {"figure": "Fig. 3.66", "pdfPage": 81, "printedPage": 61, "captionStart": "CaO-MgO"},
    ]
    merged = merge_figure_index(existing, found, range(80, 83))
    assert [(e["figure"], e["captionStart"]) for e in merged] == [
        ("Fig. 3.30", "Al2O3-MgO"),
        ("Fig. 3.64", "Sub-solidus"),
        ("Fig. 3.65", "Sub-solidus"),
        ("Fig. 3.66", "CaO-MgO"),
        ("Fig. 3.125", "MgO-SiO2"),
    ]
