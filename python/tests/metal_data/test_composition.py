from metal_data.composition import (
    composition_elmd,
    composition_l1,
    normalize_composition,
    with_iron_balance,
    wt_percent_to_elmd_formula,
)


def test_midpoint_minmax():
    comp = normalize_composition(
        {"C": {"min": 0.08, "max": 0.12}, "Mn": {"min": 0.3, "max": 0.5}, "P_max": {"min": 0, "max": 0.04}}
    )
    assert abs(comp["C"] - 0.10) < 1e-9
    assert abs(comp["Mn"] - 0.4) < 1e-9
    assert "P" in comp


def test_balance():
    comp = normalize_composition({"Ni": "bal", "Cr": 20.0, "Al": 0.3})
    assert abs(comp["Ni"] - 79.7) < 1e-9


def test_l1():
    a = {"C": 0.1, "Mn": 0.5}
    b = {"C": 0.2, "Mn": 0.5, "Si": 0.2}
    assert abs(composition_l1(a, b) - 0.3) < 1e-9


def test_iron_balance_adds_fe():
    bal = with_iron_balance({"C": 0.2, "Mn": 0.5})
    assert abs(bal["Fe"] - 99.3) < 1e-9


def test_wt_to_elmd_formula_starts_with_fe():
    formula = wt_percent_to_elmd_formula({"C": 0.2, "Mn": 0.45})
    assert formula.startswith("Fe")
    assert "C" in formula
    assert "Mn" in formula


def test_composition_elmd_identical_is_zero():
    a = {"C": 0.2, "Mn": 0.45, "Fe": 99.35}
    assert composition_elmd(a, dict(a)) == 0.0


def test_composition_elmd_ranks_closer_carbon():
    """Small ΔC should be nearer than large ΔC under ElMD (mod_petti)."""
    base = {"C": 0.20, "Mn": 0.45}
    near = {"C": 0.22, "Mn": 0.45}
    far = {"C": 0.80, "Mn": 0.45}
    d_near = composition_elmd(base, near)
    d_far = composition_elmd(base, far)
    assert d_near < d_far
    assert d_near > 0.0
