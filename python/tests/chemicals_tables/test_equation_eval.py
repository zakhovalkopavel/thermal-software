"""Tests for chemicals_tables.equation_eval — expected values copied from the chemicals functions."""
from __future__ import annotations

import pytest

from chemicals_tables.constants.gas_constant import GAS_CONSTANT
from chemicals_tables.equation_eval import evaluate_equation

R = GAS_CONSTANT
REL = 1e-12


class TestExistingTypes:
    def test_perry_151_through_linear_hyperbolic(self):
        # chemicals Perry_151(300, 4.8, 0.00322, 0, 0)
        assert evaluate_equation("linearHyperbolic", 300, {"a": 4.8, "b": 0.00322, "d": 0}, 273, 1000, 4.184) == \
            pytest.approx(24.124944, rel=REL)

    def test_perry_151_al2o3_row(self):
        # chemicals Perry_151(500, 22.08, 0.008971, -522500, 0); Perry 2-151 line 459
        vars_ = {"a": 22.08, "b": 0.008971, "d": -522500}
        assert evaluate_equation("linearHyperbolic", 500, vars_, 273, 1973, 4.184) == \
            pytest.approx(102.405492, rel=REL)

    def test_crc_molten_density_through_linear(self):
        # chemicals CRC_inorganic(300, 2370.0, 2.687, 239.08)
        rho0, k, tm = 2370.0, 2.687, 239.08
        vars_ = {"a": rho0 + k * tm, "b": -k}
        assert evaluate_equation("linear", 300, vars_, tm, 1000) == pytest.approx(2206.30796, rel=REL)

    def test_poling_through_quartic_with_k_r(self):
        # chemicals Poling(300, 4.568, -0.008975, 3.631e-05, -3.407e-08, 1.091e-11)
        vars_ = {"a": 4.568, "b": -0.008975, "c": 3.631e-05, "d": -3.407e-08, "e": 1.091e-11}
        assert evaluate_equation("quartic", 300, vars_, 50, 1000, R) == pytest.approx(35.850973388425, rel=REL)

    def test_dippr_n102_c3h8(self):
        # chemicals EQ102 with the Perry 2-312 / 2-314 C3H8 rows (line 34)
        visc = {"c1": 4.9054e-08, "c2": 0.90125, "c3": 0, "c4": 0}
        cond = {"c1": -1.12, "c2": 0.10972, "c3": -9834.6, "c4": -7535800}
        assert evaluate_equation("dipprN102", 300, visc, 85.47, 1000) == pytest.approx(8.37876399032458e-06, rel=REL)
        assert evaluate_equation("dipprN102", 300, cond, 231.11, 1000) == pytest.approx(0.0181291100746909, rel=REL)

    def test_clamps_to_range(self):
        vars_ = {"a": 1.0, "b": 1.0}
        assert evaluate_equation("linear", 50, vars_, 100, 200) == 101.0
        assert evaluate_equation("linear", 500, vars_, 100, 200) == 201.0

    def test_no_clamp_when_range_is_null(self):
        assert evaluate_equation("linear", 500, {"a": 1.0, "b": 1.0}, None, None) == 501.0

    def test_unknown_type(self):
        with pytest.raises(ValueError):
            evaluate_equation("nope", 300, {})


class TestPlannedTypes:
    def test_sutherland_air(self):
        # White Table 1-2 air: μ0 1.716e-5 Pa s at 273 K, S 111 K; tabulated μ(400 K) ≈ 2.29e-5
        vars_ = {"y0": 1.716e-5, "T0": 273, "S": 111}
        assert evaluate_equation("sutherland", 400, vars_, 170, 1900) == pytest.approx(2.2870392825210138e-05, rel=REL)
        assert evaluate_equation("sutherland", 273, vars_, 170, 1900) == pytest.approx(1.716e-5, rel=REL)

    def test_power_law_air(self):
        vars_ = {"y0": 1.716e-5, "T0": 273, "n": 0.666}
        assert evaluate_equation("powerLaw", 400, vars_, 210, 1900) == pytest.approx(2.2131197548169116e-05, rel=REL)
        assert evaluate_equation("powerLaw", 100, vars_, 210, 1900) == \
            evaluate_equation("powerLaw", 210, vars_, 210, 1900)

    def test_dippr_n114_hydrogen(self):
        vars_ = {"Tc": 33.19, "c1": 66.653, "c2": 6765.9, "c3": -123.63, "c4": 478.27}
        assert evaluate_equation("dipprN114", 20, vars_, 13.95, 32) == pytest.approx(19423.948911676463, rel=REL)

    def test_dippr_n114_ammonia(self):
        # Perry 2-153 DIPPR 114 ammonia row, Tc 405.65 from Yaws; chemicals EQ114 → J/(kmol K)
        vars_ = {"Tc": 405.65, "c1": 61.289, "c2": 80925, "c3": 799.4, "c4": -2651}
        assert evaluate_equation("dipprN114", 300, vars_, 203.15, 401.15, 1e-3) == \
            pytest.approx(80.27593023628401, rel=REL)

    def test_dippr_n114_raises_at_tc(self):
        with pytest.raises(ValueError):
            evaluate_equation("dipprN114", 40, {"Tc": 33.19, "c1": 1, "c2": 1, "c3": 1, "c4": 1})

    def test_trc_cp_docstring(self):
        vars_ = {"a0": 4.0, "a1": 7.65e5, "a2": 720, "a3": 3.565, "a4": -0.052, "a5": -1.55e6, "a6": 52,
                 "a7": 201, "I": 0, "J": 0}
        assert evaluate_equation("trcCp", 300, vars_, 50, 3000, R) == pytest.approx(42.065271080974654, rel=REL)

    def test_trc_cp_methanal(self):
        # TRC row line 2 (methanal)
        vars_ = {"a0": 4, "a1": 29000, "a2": 613, "a3": 7.31, "a4": -0.881, "a5": -10600000, "a6": 241,
                 "a7": 206, "I": -0.2, "J": 3.46}
        assert evaluate_equation("trcCp", 300, vars_, 50, 3000, R) == pytest.approx(35.448232765930214, rel=REL)

    def test_trc_cp_at_a7_drops_a5_term(self):
        vars_ = {"a0": 4, "a1": 0, "a2": 0, "a3": 1, "a4": 1, "a5": 1, "a6": 1, "a7": 300, "I": 0, "J": 0}
        assert evaluate_equation("trcCp", 300, vars_) == 4

    def test_shomate_water_vapour(self):
        r = {"Tmin": 500, "Tmax": 1700, "a": 30.092, "b": 6.832514e-3, "c": 6.793435e-6, "d": -2.53448e-9,
             "e": 0.082139e6}
        assert evaluate_equation("shomate", 500, {"ranges": [r]}, 500, 1700) == pytest.approx(35.21836175, rel=1e-9)

    def test_shomate_picks_range(self):
        low = {"Tmin": 300, "Tmax": 1000, "a": 1, "b": 0, "c": 0, "d": 0, "e": 0}
        high = {"Tmin": 1000, "Tmax": 2000, "a": 2, "b": 0, "c": 0, "d": 0, "e": 0}
        vars_ = {"ranges": [low, high]}
        assert evaluate_equation("shomate", 500, vars_, 300, 2000) == 1
        assert evaluate_equation("shomate", 1000, vars_, 300, 2000) == 1
        assert evaluate_equation("shomate", 1500, vars_, 300, 2000) == 2
        assert evaluate_equation("shomate", 5000, vars_, 300, 2000) == 2

    def test_zabransky_spline(self):
        r = {"Tmin": 0, "Tmax": 1000, "a1": 20.9634, "a2": -10.1344, "a3": 2.8253, "a4": -0.256738}
        assert evaluate_equation("zabranskySpline", 298.15, {"ranges": [r]}, 0, 1000, R) == \
            pytest.approx(75.31465144297, rel=REL)

    def test_zabransky_quasi_polynomial(self):
        vars_ = {"Tc": 591.79, "a1": -3.12743, "a2": 0.0857315, "a3": 13.7282, "a4": 1.28971, "a5": 6.42297,
                 "a6": 4.10989}
        assert evaluate_equation("zabranskyQuasiPolynomial", 330, vars_, 200, 500, R) == \
            pytest.approx(165.472878778683, rel=REL)

    def test_zabransky_quasi_polynomial_raises_at_tc(self):
        vars_ = {"Tc": 500, "a1": 1, "a2": 1, "a3": 1, "a4": 1, "a5": 1, "a6": 1}
        with pytest.raises(ValueError):
            evaluate_equation("zabranskyQuasiPolynomial", 500, vars_)

    def test_dippr_n101_docstring(self):
        vars_ = {"c1": 73.649, "c2": -7258.2, "c3": -7.3037, "c4": 4.1653e-6, "c5": 2}
        assert evaluate_equation("dipprN101", 300, vars_, 273.16, 647.1) == pytest.approx(3537.44834545549, rel=REL)

    def test_dippr_n101_formaldehyde(self):
        # Perry 2-313 line 2
        vars_ = {"c1": -11.24, "c2": 751.69, "c3": -0.024579, "c4": 0, "c5": 0}
        assert evaluate_equation("dipprN101", 220, vars_, 181.15, 254.05) == \
            pytest.approx(0.0003506236106505751, rel=REL)

    def test_ppds9(self):
        vars_ = {"a": 1.74793, "b": 1.33728, "c": 482.347, "d": 41.78, "e": 9.963e-5}
        assert evaluate_equation("ppds9", 400, vars_, 200, 480) == pytest.approx(0.00035091137378230684, rel=REL)

    def test_ppds9_ethanol(self):
        vars_ = {"a": 6.16832, "b": -0.00125, "c": 740.323, "d": 90.778, "e": 0.00000038}
        assert evaluate_equation("ppds9", 300, vars_, 159.05, 513.9) == pytest.approx(0.001026383215960496, rel=REL)

    def test_ppds10_above_tc(self):
        vars_ = {"Tc": 126.19, "rhoc": 313, "a": 470.922, "b": 493.251, "c": -560.469, "d": 389.611}
        assert evaluate_equation("ppds10", 300, vars_) == pytest.approx(313.0, rel=REL)

    def test_ppds10_ethanol(self):
        vars_ = {"Tc": 513.9, "rhoc": 276, "a": 748.617, "b": -412.3622, "c": 776.4394, "d": -436.6757}
        assert evaluate_equation("ppds10", 300, vars_, 159.05, 513.9) == pytest.approx(784.4306495995434, rel=1e-10)

    def test_ppds12(self):
        vars_ = {"Tc": 591.75, "a": 4.60584, "b": 13.97224, "c": -10.592315, "d": 2.120205, "e": 4.277128}
        assert evaluate_equation("ppds12", 300, vars_, 178, 591.75) == pytest.approx(37948.76862035925, rel=REL)

    def test_ppds12_zero_at_tc(self):
        vars_ = {"Tc": 500, "a": 1, "b": 1, "c": 1, "d": 1, "e": 1}
        assert evaluate_equation("ppds12", 600, vars_) == 0

    def test_dippr_n106_water(self):
        vars_ = {"Tc": 647.096, "c1": 0.17766, "c2": 2.567, "c3": -3.3377, "c4": 1.9699, "c5": 0}
        assert evaluate_equation("dipprN106", 300, vars_, 273.16, 647.096) == pytest.approx(0.07231499373541, rel=REL)

    def test_dippr_n106_ethanol(self):
        vars_ = {"Tc": 513.9, "c1": 0.06165, "c2": 2.37635, "c3": -3.15086, "c4": 1.98424, "c5": -0.15806}
        assert evaluate_equation("dipprN106", 300, vars_, 159.05, 513.9) == \
            pytest.approx(0.021881961176605163, rel=REL)

    def test_wagner25_methane(self):
        vars_ = {"Tc": 190.551, "Pc": 4599200, "a": -6.02242, "b": 1.26652, "c": -0.5707, "d": -1.366}
        assert evaluate_equation("wagner25", 100, vars_, 90.7, 190.551) == pytest.approx(34415.004762637, rel=REL)

    def test_wagner25_returns_pc_above_tc(self):
        vars_ = {"Tc": 190.551, "Pc": 4599200, "a": -6.02242, "b": 1.26652, "c": -0.5707, "d": -1.366}
        assert evaluate_equation("wagner25", 250, vars_) == pytest.approx(4599200, rel=REL)
