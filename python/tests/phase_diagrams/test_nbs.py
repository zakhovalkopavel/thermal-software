"""
Unit tests for the NSRDS-NBS 61 text normalizer, entry index and matcher (real lines with OCR noise).
"""
from __future__ import annotations

import pytest

from phase_diagrams.nbs.nbs_entry_index import build_nbs_index
from phase_diagrams.nbs.nbs_matcher import NbsMatcher
from phase_diagrams.nbs.nbs_page_ocr import CharBox, assemble_line, assemble_word, read_subscript_digit
from phase_diagrams.nbs.nbs_text_normalizer import NbsTextNormalizer


def _letter(ch: str, left: int, bottom: int = 40, height: int = 20, width: int = 12) -> CharBox:
    return CharBox(ch, left, bottom, left + width, bottom + height)


def _sub(ch: str, left: int, bottom: int = 28, height: int = 11, width: int = 8) -> CharBox:
    """Smaller and lower than letters (Tesseract y-up coordinates)."""
    return CharBox(ch, left, bottom, left + width, bottom + height)


def test_assemble_word_keeps_real_subscript_digit():
    word = [_letter("B", 0), _letter("F", 14), _sub("3", 28)]
    assert assemble_word(word) == "BF3"


def test_assemble_word_without_page_keeps_comma_for_formula_cleanup():
    word = [
        _letter("B", 0), _letter("C", 14), _letter("l", 28), _sub(",", 42),
        _letter("-", 55, bottom=42, height=16),
        _letter("P", 70), _letter("C", 84), _letter("l", 98), _sub(",", 112),
    ]
    assert assemble_word(word) == "BCl,-PCl,"
    assert NbsTextNormalizer.system(assemble_word(word)) == ["BCl3", "PCl3"]


def test_assemble_word_fixes_inverted_al_and_ge_on_overlapping_boxes():
    # Same left edge + wide first box, as Tesseract emits for Ge / Al.
    ge = [CharBox("e", 0, 40, 44, 60), CharBox("G", 0, 40, 17, 60), _letter("C", 50), _letter("l", 64)]
    al = [CharBox("l", 0, 40, 36, 60), CharBox("A", 0, 40, 17, 60), _letter("B", 40), _letter("r", 54)]
    assert assemble_word(ge) == "GeCl"
    assert assemble_word(al) == "AlBr"


def test_assemble_word_fixes_cl_tail_bracket():
    word = [_letter("V", 0), _letter("O", 14), _letter("C", 28), _letter("}", 42), _sub(",", 56)]
    assert assemble_word(word) == "VOCl,"


def test_assemble_word_keeps_as_not_a5():
    # Small ``s`` / digit ``5`` after ``A`` is arsenic, not subscript 5.
    assert assemble_word([_letter("A", 0), _sub("s", 14), _letter("B", 28), _letter("r", 42)]) == "AsBr"
    assert assemble_word([_letter("A", 0), _sub("5", 14), _letter("B", 28), _letter("r", 42)]) == "AsBr"


def test_assemble_line_subscript_digit_and_page1_systems():
    line = [
        _letter("1", 0, bottom=42, height=16),
        _letter("B", 40), _letter("F", 54), _sub("3", 68),
        _letter("-", 82, bottom=42, height=16),
        _letter("N", 96), _sub("2", 110), _letter("O", 124),
    ]
    assert assemble_line(line) == "1 BF3-N2O"
    assert NbsTextNormalizer.system("BF,-N,O") == ["BF3", "N2O"]
    assert NbsTextNormalizer.system("BF,-SO,") == ["BF3", "SO2"]
    assert NbsTextNormalizer.system("BCl,-GeCl,") == ["BCl3", "GeCl4"]
    assert NbsTextNormalizer.system("BCl,-PCl,") == ["BCl3", "PCl3"]


def test_assemble_line_restores_ser_solid_sol_spaces():
    # Narrow gaps between SER / SOLID / SOL stay below the word-gap threshold, so the
    # remark is one token until the known-phrase repair runs.
    line = [
        _letter("3", 0), _letter("0", 12),
        CharBox("e", 40, 40, 84, 60), CharBox("G", 40, 40, 57, 60),
        _letter("C", 58), _letter("l", 72), _sub(",", 86),
        _letter("9", 200), _letter("1", 214),
        _letter("S", 230), _letter("E", 244), _letter("R", 258),
        _letter("S", 272), _letter("O", 286), _letter("L", 300), _letter("I", 314), _letter("D", 328),
        _letter("S", 342), _letter("O", 356), _letter("L", 370),
    ]
    text = assemble_line(line)
    assert "GeCl" in text
    assert "SER SOLID SOL" in text
    assert "SERSOLIDSOL" not in text


def test_read_subscript_digit_from_drawn_three():
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont

    page_h, page_w = 80, 60
    page = np.full((page_h, page_w), 255, dtype=np.uint8)
    image = Image.fromarray(page)
    draw = ImageDraw.Draw(image)
    draw.text((18, 25), "3", fill=0)
    page = np.asarray(image)
    # Box in Tesseract coords (y up): digit occupies roughly PIL y 25–55 → bottom=25, top=55
    glyph = CharBox(",", left=15, bottom=page_h - 55, right=45, top=page_h - 25)
    assert read_subscript_digit(page, glyph) == "3"


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("Si0 2", "SiO2"), ("Si0,", "SiO2"), ("SiO,", "SiO2"), ("SiO.", "SiO2"),
        ("YlgO", "MgO"), ("MgoO", "MgO"),
        ("AI,O,", "Al2O3"), ("Al,O,", "Al2O3"), ("Al,0,", "Al2O3"), ("A1,0,", "Al2O3"), ("Al,03", "Al2O3"),
        ("Ca0", "CaO"),
        ("K,0", "K2O"), ("K 2O", "K2O"), ("K,O", "K2O"),
        ("Na,O", "Na2O"), ("Na,0", "Na2O"),
        ("KC1", "KCl"),
        ("NaN°3", "NaNO3"), ("TI2C03", "Tl2CO3"), ("TIN03", "TlNO3"),
        ("BCI 3", "BCl3"), ("GeCl.", "GeCl4"), ("S0 2", "SO2"),
        ("eGCl4", "GeCl4"), ("lABr3", "AlBr3"), ("IACl3", "AlCl3"), ("VOC},", "VOCl3"),
        ("A5Br3", "AsBr3"), ("O5Cl4", "OsCl4"), ("S.Br,", "S2Br2"), ("C5F", "CsF"),
        ("FH", "HF"), ("NaBH,", "NaBH4"), ("PbR3", "PBr3"), ("GeBr,", "GeBr4"),
        ("ReOCl,", "ReOCl4"), ("I6ABr3", "AlBr3"),
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


# First Table I page (bw PDF text layer), entries 1–58 — OCR as in nsrds-nbs-61-1.txt.
_PAGE1_OCR = """\
 1 BF 3 -N 2O             76.6                  -138.0 ±.25          575
 2 BF 3 -S0 2             95.2                  -128.6 ±.25          575
 3 BCI 3 -GeCl.           76                    -116.0              2732
 4 BCI 3 - P 0 3          94                    -110.0              2179
 5 BCI 3 -PO,             20                     -99.0              2179
 6 BF 3 -S0 2             38.                    -97.1 ±.25          575
 7 TiCl.-VOCl,            29                     -95.0              2008
 8 PC1,-TeCl.             100 APP                -91.0              2821
 9 TiCI.-VOC1,            18                     -88.0              1240
10 TiCl.-VOCl,            18.6                   -88.0               659
11 VC1.-V0Cl 3            27.8                   -86.5               659
12 NH,-NaBH.              94.7                   -84.0              1287
13 CO<NH,)2-NH 3          1.8                    -81.5              2033
14 POC1,-VOCI 3           3                      -80.8              1240
15 BBr 3 -SiCl.           26.4                   -80.0               971
16 NH,-NH.Br(NH,).        93                     -80.0              1005
17 NH 3 -NH.NO,           96                     -79.5              2033
18 KNH 2-NH 3             99APP                  -78.8               961
19 BBr,-GeCl.             40                     -74.0               971
20 POCI 3 -SiCl.          4APP                   -71.8              1240
21 SiCl.-WC1.             100 APP                -70.0              2451
22 SiCl.-TeCl.            99APP                  --68.0             3053
23 FeCI 3 -GeCl.-TeCl.    NA                     -59.0 APP          2849
24 BBr 3 -SiBr.           76                     -57.5               971
25 AsBr,-S2Br 2           13.5                   -56.0               453 1081
26 AsBr s-BBr 3           5.8                    -54.1               342
27 GaCI 3 -GeCl.          7 APP                  -54.0              1874
28 BBr,-GeBr.             80.9                   -53.0               971
29 BBr 3 -SnBr.           81.7                   -52.5               342
30 GeCI.-SnCl.            91 SER SOLID SOL       -51.3              2732
31 GeCI.-TiCl.            96.7 SER SOLID SOL     -SO.8              2732
32 Si 2OCl.-TiCl.         42                     -SO.O              2008
33 PbR,-SnBr.             84                     -50.0              453    1081
34 CsF-HF                 17.2                   -49.5               566
35 SbCl s- TiCl.          35                     -47.5              1679
36 S,Br 2-SnBr.           95.5                   -47.5              1081
37 AlBr 3 -BBr,           5.24                   -46.1               342
38 POCI 3 -SnO.           5 APP                  -33.8              2359 2555
39 FeCI 3 -SnCl.-TeCl.    NA                     -33.0 APP          2849
40 SnCl.-WCl.             100 APP                -32.0              2451
41 AsBr 3 -Br 2           34                     -31.5              1081
42 AlCI 3-SnCl.           .45 LT                 -30.5 APP          2359
43 AsCI 3 -SbCI 3 .       97 APP                 -30.0 APP          1279
44 NH 3 -NaBH.            69                     -28.0              1287
45 NH,-NaBH.              56.6                   -25.1              1287
46 GaCl,-TiCl.            10 APP                 -25.0              1874
47 CC1.-GaCI 3            92 APP                 -24.0              1874
48 POCI 3 -SbCl s-TiCl.   NA                     -24.0              1679
49 TiCl.-WC1.             100 APP                -23.0              2451
50 Ba(BHJ2- N2H•          13                     -22.0              1253
51 Br,-N 2O.              17                     -18.0              1058
52 GeBr.-POCI 3           36APP                  -16.0              3083
53 AsCI 3 -TeCI.          100 APP                -16.0              2821
54 Br,-SbBr 3             81.8                   -15.5              1081
55 AlBr 3-Br 2            21.4                   -13.5              1081
56 POCI 3 -ReOC1.         97                     -10.0              2708
57 GaC1 3 -SbCl s         18                      -4.0              2676
58 GaCI 3 -POCI 3         10                      -3.8              2202
"""

# Chemically correct systems; 4/5/38 keep OCR-limited forms (P 0 3/PO,/SnO. cannot become PCl3/SnCl4).
_PAGE1_SYSTEMS = {
    1: ["BF3", "N2O"], 2: ["BF3", "SO2"], 3: ["BCl3", "GeCl4"],
    4: ["BCl3", "PO3"], 5: ["BCl3", "PO3"], 6: ["BF3", "SO2"],
    7: ["TiCl4", "VOCl3"], 8: ["PCl3", "TeCl4"], 9: ["TiCl4", "VOCl3"],
    10: ["TiCl4", "VOCl3"], 11: ["VCl4", "VOCl3"], 12: ["NH3", "NaBH4"],
    13: ["CO(NH2)2", "NH3"], 14: ["POCl3", "VOCl3"], 15: ["BBr3", "SiCl4"],
    16: ["NH3", "NH4Br(NH3)4"], 17: ["NH3", "NH4NO3"], 18: ["KNH2", "NH3"],
    19: ["BBr3", "GeCl4"], 20: ["POCl3", "SiCl4"], 21: ["SiCl4", "WCl6"],
    22: ["SiCl4", "TeCl4"], 23: ["FeCl3", "GeCl4", "TeCl4"], 24: ["BBr3", "SiBr4"],
    25: ["AsBr3", "S2Br2"], 26: ["AsBr5", "BBr3"], 27: ["GaCl3", "GeCl4"],
    28: ["BBr3", "GeBr4"], 29: ["BBr3", "SnBr4"], 30: ["GeCl4", "SnCl4"],
    31: ["GeCl4", "TiCl4"], 32: ["Si2OCl6", "TiCl4"], 33: ["PBr3", "SnBr4"],
    34: ["CsF", "HF"], 35: ["SbCl5", "TiCl4"], 36: ["S2Br2", "SnBr4"],
    37: ["AlBr3", "BBr3"], 38: ["POCl3", "SnO4"], 39: ["FeCl3", "SnCl4", "TeCl4"],
    40: ["SnCl4", "WCl6"], 41: ["AsBr3", "Br2"], 42: ["AlCl3", "SnCl4"],
    43: ["AsCl3", "SbCl3"], 44: ["NH3", "NaBH4"], 45: ["NH3", "NaBH4"],
    46: ["GaCl3", "TiCl4"], 47: ["CCl4", "GaCl3"], 48: ["POCl3", "SbCl5", "TiCl4"],
    49: ["TiCl4", "WCl6"], 50: ["Ba(BH4)2", "N2H4"], 51: ["Br2", "N2O4"],
    52: ["GeBr4", "POCl3"], 53: ["AsCl3", "TeCl4"], 54: ["Br2", "SbBr3"],
    55: ["AlBr3", "Br2"], 56: ["POCl3", "ReOCl4"], 57: ["GaCl3", "SbCl5"],
    58: ["GaCl3", "POCl3"],
}


def test_page1_parses_all_entries_and_systems():
    entries, unparsed = build_nbs_index(_PAGE1_OCR + "\f", 8)
    assert unparsed == []
    by_number = {e.entry: e for e in entries}
    assert sorted(by_number) == list(range(1, 59))
    assert by_number[1].temperature_C == -138.0
    assert by_number[1].uncertainty_C == 0.25
    assert by_number[22].temperature_C == -68.0
    assert by_number[31].temperature_C == -50.8
    for number, components in _PAGE1_SYSTEMS.items():
        assert by_number[number].components == components, number


def test_append_nbs_page_merges_without_overwriting_other_pages(tmp_path):
    """Incremental OCR keeps a continuous dump (no form-feeds) and merges entries by page."""
    import json
    from scripts.extract_phase_diagram import _append_nbs_page, _nbs_page_already_done

    dump = tmp_path / "nbs.txt"
    entries_path = tmp_path / "nbs.entries.json"
    unparsed_path = tmp_path / "nbs.unparsed.txt"
    p11 = "1  BF3-N2O  76.6  -138.0 +.25  575\n2  BF3-SO2  95.2  -128.6 +.25  575"
    p12 = "60  Al2O3-SiO2  10.0  1500.0  1"

    _append_nbs_page(dump, entries_path, unparsed_path, 11, p11, 8)
    _append_nbs_page(dump, entries_path, unparsed_path, 12, p12, 8)

    raw = dump.read_text(encoding="utf-8")
    assert "\f" not in raw
    assert "BF3-N2O" in raw and "Al2O3-SiO2" in raw
    # Continuous table: entry 2 then entry 60 with only a newline between.
    assert "575\n60  Al2O3-SiO2" in raw

    data = json.loads(entries_path.read_text(encoding="utf-8"))
    assert {row["pdfPage"] for row in data} == {11, 12}
    assert len(data) == 3
    assert _nbs_page_already_done(entries_path, 11)
    assert _nbs_page_already_done(entries_path, 12)
    assert not _nbs_page_already_done(entries_path, 13)

    # Re-OCR page 11 replaces those rows only; page 12 stays; dump stays continuous.
    _append_nbs_page(
        dump, entries_path, unparsed_path, 11,
        "1  BF3-N2O  76.6  -100.0 +.25  575", 8,
    )
    data = json.loads(entries_path.read_text(encoding="utf-8"))
    assert {row["pdfPage"] for row in data} == {11, 12}
    assert len(data) == 2
    assert next(r for r in data if r["entry"] == 1)["temperature_C"] == -100.0
    assert next(r for r in data if r["entry"] == 60)["pdfPage"] == 12
    raw = dump.read_text(encoding="utf-8")
    assert "\f" not in raw
    assert "BF3-SO2" not in raw
    assert "Al2O3-SiO2" in raw
