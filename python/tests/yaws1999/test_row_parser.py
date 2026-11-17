"""Parse reconstructed Yaws table lines into structured rows."""
from __future__ import annotations

from yaws1999.row_parser import (
    clean_formula,
    clean_name,
    parse_data_line,
    parse_page_lines,
    reconcile_formula_with_name,
)


_PAGE_2_2 = """\
Table 2-2 HEAT CAPACITY OF GAS - INORGANIC COMPOUNDS
CpsA + BT + C^ + D^ + ET4 (CP-joule/(mol K), T - K)
NO FORMULA NAME A B C D E TMIN ! TMAX
1 Ag SILVER 20.794 0.0000E+00 0.0000E+00 0.0000E+00 0.0000E+00 298 6000
12 Ar ARGON 20.786 0.0000E+00 0.0000E+00 0.0000E+00 0.0000E+00 100 1500 |
2 AgCI SILVER CHLORIDE 32.931 1.3917E-02 -1.6486E-05 8.4479E-09 -1.5693E-12 j 298 I 2000 1
51
""".splitlines()


def test_parse_page_lines_reads_header_equation_and_rows():
    parsed = parse_page_lines(_PAGE_2_2, djvu_page=54)
    assert parsed.table_id == "2-2"
    assert "INORGANIC" in (parsed.title or "")
    assert parsed.equation is not None and "CP" in parsed.equation.upper().replace(" ", "")
    assert parsed.header is not None and "FORMULA" in parsed.header
    assert [r.no for r in parsed.rows] == [1, 12, 2]
    argon = parsed.rows[1]
    assert argon.formula == "Ar"
    assert argon.name == "ARGON"
    assert argon.values[:2] == [20.786, 0.0]
    assert argon.values[-2:] == [100, 1500]


def test_parse_data_line_fixes_cl_ocr_and_sci_spaces():
    row = parse_data_line(
        "3 CBrF3 BROMOTRIFLUOROMETHANE 17.208 2.4770E-01 -2.9181 E-04 1.6247E-07 -3.4765E-11 100 1500",
        djvu_page=36,
    )
    assert row is not None
    assert row.formula == "CBrF3"
    assert row.values[2] == -0.00029181


def test_clean_formula_uses_name_for_halogens():
    assert clean_formula("AgCI", "SILVER CHLORIDE") == "AgCl"
    assert clean_formula("AgCi", "SILVER CHLORIDE") == "AgCl"
    assert clean_formula("CIF", "CHLORINE MONOFLUORIDE") == "ClF"
    assert clean_formula("C1F", "CHLORINE MONOFLUORIDE") == "ClF"
    assert clean_formula("CIF3", "CHLORINE TRIFLUORIDE") == "ClF3"
    assert clean_formula("CbrCIF2", "BROMOCHLORODIFLUOROMETHANE") == "CBrClF2"
    assert clean_formula("CHbr3", "TRIBROMOMETHANE") == "CHBr3"
    assert clean_formula("AICI3", "ALUMINUM CHLORIDE") == "AlCl3"
    assert clean_formula("Agl", "SILVER IODIDE") == "AgI"
    assert clean_formula("Zrl4", "ZIRCONIUM IODIDE") == "ZrI4"
    # Carbon tetraiodide: name has IODIDE, not CHLOR — do not turn CI into Cl.
    assert clean_formula("CI4", "CARBON TETRAIODIDE") == "CI4"
    assert clean_formula("~ZrBr4", "ZIRCONIUM BROMIDE") == "ZrBr4"


def test_clean_formula_zero_as_oxygen_from_name():
    assert clean_formula("C02", "CARBON DIOXIDE") == "CO2"
    assert clean_formula("CI20", "CHLORINE MONOXIDE") == "Cl2O"
    assert clean_formula("CIF03", "PERCHLORYL FLUORIDE") == "ClFO3"
    assert clean_formula("CI02", "CHLORINE DIOXIDE") == "ClO2"
    assert clean_formula("02", "OXYGEN") == "O2"
    assert clean_formula("Os04", "OSMIUM TETROXIDE") == "OsO4"
    # Already-correct "10" oxygens must stay (not P4O1O).
    assert clean_formula("P4O10", "PHOSPHORUS PENTOXIDE") == "P4O10"


def test_reconcile_preserves_cl_when_fixing_iodide_l():
    # Chloro+iodo name: Cl's L must stay; only metal+l becomes I.
    assert reconcile_formula_with_name("AgCl", "SILVER CHLORIDE IODIDE") == "AgCl"


def test_clean_formula_thallium_from_name():
    assert clean_formula("Ti", "THALLIUM") == "Tl"
    assert clean_formula("TI", "THALLIUM") == "Tl"
    assert clean_formula("TIBr", "THALLOUS BROMIDE") == "TlBr"
    assert clean_formula("TiBr", "THALLOUS BROMIDE") == "TlBr"
    assert clean_formula("TiI", "THALLOUS IODIDE") == "TlI"
    assert clean_formula("TII", "THALLOUS IODIDE") == "TlI"
    # Titanium must keep Ti.
    assert clean_formula("Ti", "TITANIUM") == "Ti"
    assert clean_formula("TiCl4", "TITANIUM TETRACHLORIDE") == "TiCl4"


def test_clean_formula_yttrium_and_caps_cl_from_name():
    assert clean_formula("Yt", "YTTRIUM") == "Y"
    assert clean_formula("Yb", "YTTERBIUM") == "Yb"
    assert clean_formula("CCL4", "TETRACHLOROMETHANE") == "CCl4"
    assert clean_formula("C6H15A1", "TRIETHYLALUMINUM") == "C6H15Al"


def test_clean_formula_auto_ocr_glyph_families():
    """Accepted rebuild rules for the 16 mismatch auto-OCR cases."""
    cases = [
        ("C6H1OO3", "2-HYDROXYPROPYL ACRYLATE", "C6H10O3"),
        ("C9H8CI3NO2S", "CAPTAN", "C9H8Cl3NO2S"),
        ("C9H11C3NO3PS", "CHLORPYRIFOS", "C9H11Cl3NO3PS"),
        ("Cl0Cl8", "OCTACHLORONAPHTHALENE", "C10Cl8"),
        ("Cl0Cl10O", "CHLORDECONE", "C10Cl10O"),
        ("Cl0H5Cl3", "TRICHLORONAPHTHALENE", "C10H5Cl3"),
        ("Cl0H5Cl7", "HEPTACHLOR", "C10H5Cl7"),
        ("ClOH5Cl7O", "HEPTACHLOR EPOXIDE", "C10H5Cl7O"),
        ("Cl0H6Cl8", "CHLORDANE", "C10H6Cl8"),
        ("C10H9CI4NO2S", "CAPTAFOL", "C10H9Cl4NO2S"),
        ("Cl2H4Cl6O", "CHLORINATED DIPHENYL OXIDE", "C12H4Cl6O"),
        ("C12H8CI60", "DIELDRIN", "C12H8Cl6O"),
        ("C12H8CI60", "ENDRIN", "C12H8Cl6O"),
        ("Cl3H12Cl2N2", "4,4'-METHYLENE BIS(2-CHLOROANILINE)", "C13H12Cl2N2"),
        ("Cl6H15Cl3O2", "METHOXYCHLOR", "C16H15Cl3O2"),
        ("C9H2OO", "2-nonanol", "C9H20O"),
    ]
    for raw, name, want in cases:
        assert clean_formula(raw, name) == want, (raw, name, clean_formula(raw, name))


def test_clean_formula_leading_cl_as_carbon_does_not_touch_cl2o():
    assert clean_formula("CI20", "CHLORINE MONOXIDE") == "Cl2O"
    assert clean_formula("Cl2O", "CHLORINE MONOXIDE") == "Cl2O"
    assert clean_formula("H2O", "WATER") == "H2O"


def test_clean_formula_unparseable_ocr_cases():
    assert clean_formula("C6H15Al2Cl3ETHYL", "ALUMINUM SESQUICHLORIDE") == "C6H15Al2Cl3"
    assert clean_formula("ALB3H12", "ALUMINUM BOROHYDRIDE") == "AlB3H12"
    assert clean_formula("Oso4", "OSMIUM TETROXIDE - YELLOW") == "OsO4"
    assert clean_formula("C6H19Nsi2", "HEXAMETHYLDISILAZANE") == "C6H19NSi2"


def test_clean_name_restores_missing_i_in_iodide():
    assert clean_name("ARSENIC TRIODIDE") == "ARSENIC TRIIODIDE"
    assert clean_name("ARSENIC TRIIODIDE") == "ARSENIC TRIIODIDE"
    assert clean_name("CARBON DIODIDE") == "CARBON DIIODIDE"
    # Oxide / other TRI* must stay.
    assert clean_name("SULFUR TRIOXIDE") == "SULFUR TRIOXIDE"
    assert clean_name("CARBON DIOXIDE") == "CARBON DIOXIDE"


def test_parse_data_line_fixes_triodide_name():
    row = parse_data_line(
        "19 AsI3 ARSENIC TRIODIDE --- --- --- --- --- --- ---",
        djvu_page=81,
    )
    assert row is not None
    assert row.name == "ARSENIC TRIIODIDE"
    assert row.formula == "AsI3"


def test_missing_values_become_none():
    row = parse_data_line("5 AIB3H12 ALUMINUM BOROHYDRIDE —", djvu_page=54)
    assert row is not None
    assert row.formula == "AlB3H12"
    assert row.values == [None]


def test_skips_ocr_junk_between_values():
    row = parse_data_line(
        "2 AgCI SILVER CHLORIDE 32.931 1.3917E-02 -1.6486E-05 8.4479E-09 -1.5693E-12 j 298 I 2000 1",
        djvu_page=54,
    )
    assert row is not None
    assert row.formula == "AgCl"
    assert row.values == [32.931, 0.013917, -1.6486e-05, 8.4479e-09, -1.5693e-12, 298, 2000]


def test_row_fixes_br_and_ci_from_name():
    row = parse_data_line(
        "1 CbrCIF2 BROMOCHLORODIFLUOROMETHANE 18.387 2.7933E-01 100 1500",
        djvu_page=36,
    )
    assert row is not None
    assert row.formula == "CBrClF2"
    assert row.formula_raw == "CbrCIF2"


def test_parse_data_line_code_data_estimated():
    data = parse_data_line(
        "1 CCL4 TETRACHLOROMETHANE 153.838 -23.16 1.22E+02 data",
        djvu_page=438,
    )
    assert data is not None
    assert data.values == [153.838, -23.16, 122.0, "data"]
    assert data.unparsed_tail == ""

    est = parse_data_line(
        "4 CH3NO2 NITROMETHANE 61.040 -28.16 1.76E+02 estimated",
        djvu_page=438,
    )
    assert est is not None
    assert est.values[-1] == "estimated"


def test_parse_data_line_state_mid_row():
    row = parse_data_line(
        "1 Ag SILVER 107.868 solid 0.00 0.00 42.60",
        djvu_page=305,
    )
    assert row is not None
    assert row.name == "SILVER"
    assert row.values == [107.868, "solid", 0.0, 0.0, 42.6]
    assert row.unparsed_tail == ""


def test_parse_data_line_state_before_numbers_not_in_name():
    row = parse_data_line(
        "1 CBrCIF2 BROMOCHLORODIFLUOROMETHANE gas -53.3 -322.3 -138.6",
        djvu_page=576,
    )
    assert row is not None
    assert row.name == "BROMOCHLORODIFLUOROMETHANE"
    assert row.values == ["gas", -53.3, -322.3, -138.6]


def test_parse_data_line_phase_and_soild_ocr():
    row = parse_data_line(
        "1 Ag SILVER 438.2178 -2.2947E-02 -3.5429E-05 200 1200 solid 428.227 432.211 359.664",
        djvu_page=540,
    )
    assert row is not None
    assert row.values[5:] == ["solid", 428.227, 432.211, 359.664]

    bad = parse_data_line(
        "10 Xx EXAMPLE 1.0 soild 2.0",
        djvu_page=1,
    )
    assert bad is not None
    assert bad.values == [1.0, "solid", 2.0]


def test_parse_data_line_in_benzene_state():
    row = parse_data_line(
        "9 C6H6 BENZENE 25.0 1.5011 in benzene 0.10 ---",
        djvu_page=250,
    )
    assert row is not None
    assert row.values[2] == "in benzene"
    assert row.values[3] == 0.10
    assert row.values[4] is None


def test_parse_data_line_cas_registry_number():
    row = parse_data_line(
        "1 C GRAPHITE 7782-42-5 -- 2 -- -- -- 2.5 -- 6",
        djvu_page=596,
    )
    assert row is not None
    assert row.name == "GRAPHITE"
    assert row.values[0] == "7782-42-5"
    assert row.values[1] is None
    assert row.values[2] == 2
    assert row.values[6] == 2.5
    assert row.values[8] == 6


def test_parse_data_line_corrects_known_cas_typos():
    from yaws1999.constants import correct_cas
    assert correct_cas("72-02-5") == "75-02-5"
    assert correct_cas("75-05-08") == "75-05-8"
    row = parse_data_line(
        "86 C2H3F VINYL FLUORIDE 72-02-5 -- -- -- 1 -- -- --",
        djvu_page=596,
    )
    assert row is not None
    assert row.values[0] == "75-02-5"
