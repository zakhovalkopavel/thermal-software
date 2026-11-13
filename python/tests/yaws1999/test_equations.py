"""Canonical handbook equations for Yaws tables."""
from __future__ import annotations

from yaws1999.dataset import to_dataset_table
from yaws1999.equations import (
    TABLE_EQUATIONS,
    apply_canonical_equations,
    canonical_equation,
)
from yaws1999.row_parser import _clean_equation, _looks_like_equation, collect_equations


def test_canonical_covers_p0_p1_p2_targets():
    for tid in (
        "16-1",
        "19-1",
        "5-1",
        "8-1",
        "9-1",
        "12-1",
        "13-1",
        "22-1",
        "24-1",
        "24-2",
        "28-1",
        "2-1",
        "7-1",
        "21-1",
        "23-1",
    ):
        eq = canonical_equation(tid)
        assert eq, tid
        assert "=" in eq


def test_apply_canonical_overwrites_broken_density():
    parsed = {
        "id": "8-1",
        "title": "DENSITY OF LIQUID - ORGANIC COMPOUNDS",
        "equation": "density = A B-(1 - T/Tc)^n (density - g/ml, T - K)",
        "header": "NO FORMULA NAME A B n Tc TMIN TMAX density @ 25 C",
        "printedPages": {"first": 183, "last": 200},
        "rows": [],
    }
    apply_canonical_equations(parsed)
    assert "equation" not in parsed
    assert "B^{-" in parsed["equations"][0]
    assert parsed["equationSource"] == "curated"
    assert parsed["equationPage"] == 179  # published chapter page (ch08)
    assert "equationDjvuPage" not in parsed


def test_apply_canonical_fills_missing_16_1():
    parsed = {"id": "16-1", "equation": None, "rows": []}
    apply_canonical_equations(parsed)
    assert parsed["equations"]
    assert "X" in parsed["equations"][0]
    assert "equation" not in parsed
    by_text = {c["text"]: c for c in parsed["coefficients"]}
    assert by_text["X"]["meaning"].startswith("concentration of salt")
    assert by_text["X"]["latex"] == "X"


def test_coefficients_include_text_latex_meaning_for_28_3():
    parsed = {"id": "28-1", "equation": None, "rows": []}
    apply_canonical_equations(parsed)
    by_text = {c["text"]: c for c in parsed["coefficients"]}
    assert by_text["Qv"] == {
        "text": "Qv",
        "latex": "Q_v",
        "meaning": "volumetric expansion rate",
    }
    assert by_text["rho_liq"]["latex"] == r"\rho_{\mathrm{liq}}"
    assert by_text["Text"]["latex"] == r"T_{\mathrm{ext}}"
    assert by_text["Tc"]["latex"] == r"T_c"
    assert by_text["B_liq"]["meaning"].startswith("thermal expansion")
    assert by_text["U"]["meaning"] == "overall heat transfer coefficient"
    assert "a" not in by_text and "m" not in by_text
    doc = to_dataset_table(
        {
            **parsed,
            "title": "Thermal expansion",
            "printedPages": {"first": 602, "last": 619},
            "header": "NO FORMULA NAME",
        }
    )
    assert any(c["text"] == "Qv" for c in doc["coefficients"])
    assert "equation" not in doc
    assert doc["equations"]


def test_p3_metadata_critical_props_have_derived_equations():
    parsed = {"id": "1-1", "equation": None, "rows": []}
    apply_canonical_equations(parsed)
    eqs = parsed["equations"]
    assert any("\\rho_c" in e for e in eqs)
    assert parsed["equationPage"] == 1
    assert "derivedDefinitions" not in parsed
    doc = to_dataset_table(
        {
            **parsed,
            "title": "Critical properties",
            "printedPages": {"first": 1, "last": 18},
            "header": "NO FORMULA NAME",
        }
    )
    assert doc["equations"]
    assert "equation" not in doc
    assert doc["equationPage"] == 1
    assert "equationDjvuPage" not in doc
    assert "derivedDefinitions" not in doc
    assert doc["equationSource"] == "curated"


def test_estimation_folded_into_equations_on_15_1():
    parsed = {"id": "15-1", "equation": None, "rows": []}
    apply_canonical_equations(parsed)
    assert any("K" in e for e in parsed["equations"])
    assert any("T_B" in e for e in parsed["equations"])
    assert "estimationEquation" not in parsed
    assert parsed["equationPage"] == 346


def test_spot_tables_gain_chapter_equations():
    for tid, needle in (
        ("20-1", "K"),
        ("18-1", "K_i"),
        ("25-1", "LEL"),
        ("27-1", "PEL"),
        ("12-2", "H"),
        ("10-1", "vacuum"),
    ):
        parsed = {"id": tid, "equation": None, "rows": []}
        apply_canonical_equations(parsed)
        assert parsed.get("equations"), tid
        assert any(needle in e for e in parsed["equations"]), tid
        assert "equation" not in parsed
        assert "definition" not in parsed
        assert isinstance(parsed.get("equationPage"), int), tid


def test_spot_tables_remain_null_equation():
    """Ch 6/11 are tabulations only — no handbook correlation to attach."""
    for tid in ("6-1", "6-2", "11-1", "11-2"):
        parsed = {"id": tid, "equation": "stale OCR junk", "rows": []}
        apply_canonical_equations(parsed)
        assert parsed["equations"] == [], tid
        assert "equation" not in parsed, tid
        assert parsed.get("coefficients"), tid
        assert isinstance(parsed.get("equationPage"), int), tid


def test_hildebrand_equation_on_14():
    for tid in ("14-1", "14-2"):
        parsed = {"id": tid, "equations": [], "rows": []}
        apply_canonical_equations(parsed)
        assert len(parsed["equations"]) == 1, tid
        eq = parsed["equations"][0]
        assert r"\delta" in eq and r"\Delta H_{\mathrm{vap}}" in eq, tid
        assert "R T" in eq or "RT" in eq.replace(" ", ""), tid
        assert parsed["equationPage"] == 340, tid
        by_text = {c["text"]: c for c in parsed["coefficients"]}
        assert by_text["solubility_parameter"]["latex"] == r"\delta"
        assert by_text["liquid_volume"]["latex"] == "V"


def test_no_duplicate_or_legacy_equation_fields_in_table_map():
    for tid, meta in TABLE_EQUATIONS.items():
        assert "equation" not in meta, tid
        assert "definition" not in meta, tid
        assert "estimationEquation" not in meta, tid
        assert "derivedDefinitions" not in meta, tid
        eqs = meta.get("equations")
        if eqs:
            assert len(eqs) == len(set(eqs)), tid


def test_clean_equation_repairs_common_ocr():
    assert "^2" in _clean_equation("Hf = A + B T + C T2 (Hf - kjoule/mol, T - K)")
    assert "^n" in _clean_equation("HVAP = A (1 - T/Tc)n (HVAP - kjoule/mol, T - K)")
    assert "B^{-" in _clean_equation(
        "density = A B-(1 - T/Tc)^n (density - g/ml, T - K)"
    )
    fixed = _clean_equation(r"\log_{10} n_liq = A + B/T + C T + C T^2")
    assert "+ D T^2" in fixed
    assert "^{2/7}" in _clean_equation(
        r"\log_{10} k_liq = A + B [1 - T/C]^{27} (k_liq - W/m-K, T - K)"
    )
    assert "B_{liq}" in _clean_equation(
        "BIIq = a (1 - T/TC)^m (BIIq - 1/C, T - K)"
    )


def test_looks_like_equation_accepts_salt_and_adsorption():
    assert _looks_like_equation(r"\log_{10} S = A + B X + C X^2")
    assert _looks_like_equation(
        r"\log_{10} Q = A + B[\log_{10} y] + C[\log_{10} y]^2"
    )
    eqs = collect_equations(
        [
            r"\log_{10} S = A + B X + C X^2 \quad (16-1)",
            "noise",
        ]
    )
    assert len(eqs) == 1


def test_table_equations_ids_are_unique():
    assert len(TABLE_EQUATIONS) == len(set(TABLE_EQUATIONS))


def test_regression_letters_trimmed_from_coefficients():
    """Polynomial fit letters A–E / a / m / n are not meaningful coeff defs."""
    banned = {"A", "B", "C", "D", "E", "a", "m", "n", "F"}
    # Area A on 28-1 is physical (heat-transfer area), not a fit letter.
    allow_physical_a = {"28-1"}
    for tid, meta in TABLE_EQUATIONS.items():
        texts = {c["text"] for c in meta.get("coefficients") or []}
        hit = texts & banned
        if tid in allow_physical_a:
            hit.discard("A")
        assert not hit, f"{tid} still lists regression letters {hit}"


def test_critical_props_coeff_naming_matches_columns():
    parsed = {"id": "1-2", "equation": None, "rows": []}
    apply_canonical_equations(parsed)
    texts = {c["text"] for c in parsed["coefficients"]}
    assert {"Tc", "Pc", "Vc", "rhoc", "Zc", "Tf", "Tb", "omega", "MW"} <= texts
    assert "T_c" not in texts and "Z_c" not in texts


def test_spot_tables_have_physical_coefficients():
    for tid in (
        "6-1",
        "10-1",
        "11-1",
        "12-2",
        "13-2",
        "14-1",
        "18-1",
        "25-1",
        "26-1",
        "27-1",
    ):
        parsed = {"id": tid, "equation": None, "rows": []}
        apply_canonical_equations(parsed)
        assert parsed.get("coefficients"), tid


def test_20_1_code_and_koc_coeffs():
    parsed = {"id": "20-1", "equation": None, "rows": []}
    apply_canonical_equations(parsed)
    by_text = {c["text"]: c for c in parsed["coefficients"]}
    assert "Koc" in by_text
    assert "CODE" in by_text
    assert "C" not in by_text  # bare definition dummy dropped
    assert "K_oc" not in by_text


def test_schema_state_and_code_rows_expand():
    from yaws1999.dataset import to_dataset_table

    doc_12 = to_dataset_table(
        {
            "id": "12-2",
            "title": "ENTHALPY FORMATION INORGANIC",
            "printedPages": {"first": 300, "last": 310},
            "header": "NO FORMULA NAME",
            "rows": [
                {
                    "no": 1,
                    "formula": "Ag",
                    "name": "SILVER",
                    "values": [107.868, "solid", 0.0, 0.0, 42.6],
                }
            ],
        }
    )
    assert doc_12["rows"][0]["State"] == "solid"
    assert doc_12["rows"][0]["Hf_at_298_K"] == 0.0
    assert doc_12["rows"][0]["S_at_298_K"] == 42.6

    doc_20 = to_dataset_table(
        {
            "id": "20-1",
            "title": "SOIL SORPTION",
            "printedPages": {"first": 429, "last": 433},
            "header": "NO FORMULA NAME",
            "rows": [
                {
                    "no": 1,
                    "formula": "CCl4",
                    "name": "TETRACHLOROMETHANE",
                    "values": [153.838, -23.16, 122.0, "data"],
                }
            ],
        }
    )
    assert doc_20["rows"][0]["CODE"] == "data"
