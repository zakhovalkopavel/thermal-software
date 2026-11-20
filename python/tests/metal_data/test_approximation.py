import numpy as np

from metal_data.approximation import (
    apply_approximations,
    eval_approximation,
    fit_property_approximation,
    fit_property_polynomial,
)
from metal_data.inden_cp import detect_curie_peak_K, fit_inden_cp
from metal_data.models import AlloyRecord, PropertySeries


def _series(points, unit="W/(m·K)"):
    return PropertySeries(
        points=[{"T_K": float(t), "value": float(v)} for t, v in points],
        unit=unit,
        sources=["test"],
    )


def test_no_approximation_for_one_or_two_points():
    assert fit_property_polynomial(_series([(300, 50)])) is None
    assert fit_property_polynomial(_series([(300, 50), (400, 48)])) is None


def test_quadratic_short_object_smooth_series():
    def y(t):
        return 50 - 0.01 * t + 1e-6 * t**2

    ts = [300, 400, 500, 600, 700]
    approx = fit_property_polynomial(_series([(t, y(t)) for t in ts]))
    assert approx is not None
    assert approx["low"]["type"] == "quadratic"
    assert set(approx["low"]["vars"]) == {"a", "b", "c"}
    assert "high" not in approx
    assert "Tswitch" not in approx
    assert approx["maxRelPct"] is not None
    assert approx["maxRelPct"] < 1.0


def test_ac3_split_equation_style_for_conductivity():
    ac3 = 1000.0
    points = [
        (400, 40),
        (500, 38),
        (600, 35),
        (700, 32),
        (800, 28),
        (900, 24),
        (1100, 22),
        (1200, 23),
        (1300, 25),
    ]
    series = _series(points)
    approx, reason = fit_property_approximation(
        series, ac3_k=ac3, prop="thermalConductivity"
    )
    assert reason is None
    assert approx is not None
    assert approx["low"]["type"] == "quadratic"
    assert approx["Tswitch"] == 1000
    assert approx["low"]["min"] == 400.0
    assert approx["low"]["max"] == 1000
    assert "ref" not in approx["low"]
    assert "def" not in approx["low"]
    high = approx["high"]
    assert high["type"] == "linear"
    assert set(high["vars"]) == {"a", "b"}
    assert high["min"] == 1000
    assert high["max"] == 1300.0
    # High = free LS on the 3 points above Ac3
    th = np.array([1100.0, 1200.0, 1300.0])
    yh = np.array([22.0, 23.0, 25.0])
    b_free, a_free = np.polyfit(th, yh, 1)
    assert abs(high["vars"]["b"] - b_free) / abs(b_free) < 0.02
    assert abs(high["vars"]["a"] - a_free) / abs(a_free) < 0.02
    # Continuous at Ac3: low(Ac3) ≈ high(Ac3)
    assert abs(eval_approximation(approx, 1000) - (high["vars"]["a"] + high["vars"]["b"] * 1000)) < 1e-6
    assert abs(eval_approximation(approx, 1200) - (high["vars"]["a"] + high["vars"]["b"] * 1200)) < 1e-9


def test_no_high_when_all_points_below_ac3():
    approx, _ = fit_property_approximation(
        _series([(400, 40), (500, 38), (600, 35), (700, 32)]),
        ac3_k=1000,
        prop="thermalConductivity",
    )
    assert approx is not None
    assert "high" not in approx
    assert approx["low"]["max"] <= approx["Tswitch"]


def test_resistivity_ac3_split_linear_first_then_anchored_quadratic():
    # sae-1025-like: free linear on T>Ac3, then quadratic ≤ Ac3 through y_high(Ac3)
    points = [
        (273.15, 1.59e-7),
        (373.15, 2.19e-7),
        (473.15, 2.92e-7),
        (673.15, 4.87e-7),
        (873.15, 7.58e-7),
        (973.15, 9.25e-7),
        (1073.15, 1.094e-6),
        (1173.15, 1.136e-6),
        (1273.15, 1.167e-6),
        (1373.15, 1.194e-6),
        (1473.15, 1.219e-6),
        (1573.15, 1.239e-6),
    ]
    approx, reason = fit_property_approximation(
        _series(points, unit="Ω·m"),
        ac3_k=1082.0,
        prop="electricalResistivity",
    )
    assert reason is None
    assert approx is not None
    assert approx["Tswitch"] == 1082
    assert approx["low"]["type"] == "quadratic"
    assert set(approx["low"]["vars"]) == {"a", "b", "c"}
    assert approx["low"]["max"] == 1082
    high = approx["high"]
    assert high["type"] == "linear"
    assert set(high["vars"]) == {"a", "b"}
    assert high["min"] == 1082
    # High matches free LS on the 5 points above Ac3
    th = np.array([p[0] for p in points if p[0] > 1082])
    yh = np.array([p[1] for p in points if p[0] > 1082])
    b_free, _a_free = np.polyfit(th, yh, 1)
    assert abs(high["vars"]["b"] - b_free) / abs(b_free) < 0.02
    # Continuous join
    y_sw = high["vars"]["a"] + high["vars"]["b"] * 1082
    assert abs(eval_approximation(approx, 1082) - y_sw) < 1e-12
    assert approx["maxRelPct"] is not None and approx["maxRelPct"] <= 2.0


def test_ac3_split_moves_tswitch_to_nearby_point_when_ac3_anchor_fails():
    """sae-1078-like: Ac3 in steep region — move Tswitch to a measured knot near Ac3."""
    points = [
        (293.15, 1.8e-7),
        (373.15, 2.32e-7),
        (473.15, 3.08e-7),
        (673.15, 5.05e-7),
        (873.15, 7.72e-7),
        (973.15, 9.35e-7),
        (1073.15, 1.129e-6),
        (1173.15, 1.164e-6),
        (1273.15, 1.191e-6),
        (1373.15, 1.214e-6),
        (1473.15, 1.231e-6),
        (1573.15, 1.246e-6),
    ]
    approx, reason = fit_property_approximation(
        _series(points, unit="Ω·m"),
        ac3_k=1003.0,
        prop="electricalResistivity",
    )
    assert reason is None
    assert approx is not None
    assert approx["joinContinuous"] is True
    assert approx["switchMovedFromAc3_K"] == 1003
    assert approx["Tswitch"] != 1003
    # Switch is one of the measured knots (rounded)
    knot_K = {int(round(t)) for t, _ in points}
    assert approx["Tswitch"] in knot_K
    assert approx["high"]["type"] == "linear"
    assert approx["maxRelPct"] is not None and approx["maxRelPct"] <= 10.0
    # Continuous at the moved switch
    y_sw = approx["high"]["vars"]["a"] + approx["high"]["vars"]["b"] * approx["Tswitch"]
    assert abs(eval_approximation(approx, approx["Tswitch"]) - y_sw) < 1e-12


def test_expansion_single_quadratic_ignores_ac3():
    approx, reason = fit_property_approximation(
        _series([(373.15, 12.0), (673.15, 13.5), (873.15, 14.4)], unit="1e-6/K"),
        ac3_k=1082.0,
        prop="thermalExpansion",
    )
    assert reason is None
    assert approx is not None
    assert approx["low"]["type"] == "quadratic"
    assert "Tswitch" not in approx
    assert "high" not in approx
    assert approx["low"]["max"] == 873.15


def test_coefficients_use_limited_sigfigs():
    approx, _ = fit_property_approximation(
        _series([(400, 40.123456), (500, 38.987654), (600, 35.555555), (700, 32.111111)]),
        ac3_k=1000,
        prop="thermalConductivity",
    )
    assert approx is not None
    for v in approx["low"]["vars"].values():
        assert len(f"{v:.12g}") <= 10


def test_inden_cp_fits_curie_peak():
    # sae-1025-like λ-peak at ~998 K
    points = [
        (348.15, 486.0),
        (448.15, 519.0),
        (498.15, 532.0),
        (548.15, 557.0),
        (598.15, 574.0),
        (648.15, 599.0),
        (748.15, 662.0),
        (848.15, 749.0),
        (948.15, 846.0),
        (998.15, 1432.0),
        (1048.15, 950.0),
    ]
    assert detect_curie_peak_K(points) == 998.15
    approx, reason = fit_inden_cp(points)
    assert reason is None
    assert approx is not None
    assert approx["low"]["type"] == "indenCp"
    assert approx["Tswitch"] == approx["low"]["vars"]["Tc"]
    assert set(approx["low"]["vars"]) == {"a", "b", "c", "Al", "Ah", "Tc"}
    assert approx["maxRelPct"] is not None and approx["maxRelPct"] <= 10.0
    # Peak region elevated vs base
    assert eval_approximation(approx, 998.15) > eval_approximation(approx, 848.15)


def test_specific_heat_uses_inden_via_fit_property():
    series = _series(
        [
            (348.15, 486.0),
            (448.15, 519.0),
            (548.15, 557.0),
            (648.15, 599.0),
            (748.15, 662.0),
            (848.15, 749.0),
            (948.15, 846.0),
            (998.15, 1432.0),
            (1048.15, 950.0),
        ],
        unit="J/(kg·K)",
    )
    approx, reason = fit_property_approximation(series, ac3_k=1082.0, prop="specificHeat")
    assert reason is None
    assert approx is not None
    assert approx["low"]["type"] == "indenCp"


def test_apply_approximations_sets_critical_temperatures():
    steel = AlloyRecord(
        material_id="sae-1025",
        name="1025",
        group="steel",
        family="carbon",
        composition={"C": 0.25, "Mn": 0.45},
    )
    steel.properties["thermalConductivity"] = _series(
        [(300, 52), (400, 50), (500, 47), (600, 44), (700, 40), (800, 36), (900, 32)]
    )
    report = apply_approximations({steel.material_id: steel})
    assert steel.critical_temperatures is not None
    assert isinstance(steel.critical_temperatures["Ac3_K"], int)
    assert any(r.get("status") == "ok" for r in report)
    ap = steel.properties["thermalConductivity"].approximation
    assert ap is not None
    assert ap["low"]["type"] == "quadratic"
    assert isinstance(ap["Tswitch"], int)
