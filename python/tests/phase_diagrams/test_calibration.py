"""
Unit tests for AxisCalibration, BinaryCalibration, TernaryCalibration and calibrate_binary.
"""
from __future__ import annotations

import pytest

import pd_helpers
from phase_diagrams.models.axis_calibration import AxisCalibration
from phase_diagrams.models.binary_calibration import BinaryCalibration
from phase_diagrams.builders.binary_calibrator import calibrate_binary
from phase_diagrams.config.diagram_config import DiagramConfig
from phase_diagrams.detection.ink_mask import ink_mask
from phase_diagrams.models.ternary_calibration import TernaryCalibration


class TestAxisCalibration:
    def test_piecewise_linear_between_ticks(self):
        axis = AxisCalibration([0, 10, 20], [100.0, 200.0, 320.0])
        assert axis.to_value(150.0) == pytest.approx(5.0)
        assert axis.to_value(260.0) == pytest.approx(15.0)
        assert axis.to_pixel(15.0) == pytest.approx(260.0)

    def test_linear_extrapolation_beyond_outer_ticks(self):
        axis = AxisCalibration([0, 10], [100.0, 200.0])
        assert axis.to_value(250.0) == pytest.approx(15.0)
        assert axis.to_value(50.0) == pytest.approx(-5.0)

    def test_decreasing_values_sorted_by_pixel(self):
        axis = AxisCalibration([2000, 1800, 1600], [100.0, 260.0, 420.0])
        assert axis.to_value(180.0) == pytest.approx(1900.0)

    def test_residuals_zero_for_straight_ticks(self):
        axis = AxisCalibration([0, 10, 20], [100.0, 200.0, 300.0])
        assert max(abs(r) for r in axis.residuals()) == pytest.approx(0.0, abs=1e-9)


class TestBinaryCalibration:
    def _calibration(self, bottom_slope=0.0, left_slope=0.0):
        return BinaryCalibration(
            x=AxisCalibration([0, 100], [100.0, 1100.0]),
            y=AxisCalibration([2000, 1000], [100.0, 900.0]),
            bottom_slope=bottom_slope,
            left_slope=left_slope,
            ref_px=100.0,
            ref_py=900.0,
        )

    def test_to_data_without_rotation(self):
        wt, temperature = self._calibration().to_data(500.0, 500.0)
        assert wt == pytest.approx(40.0)
        assert temperature == pytest.approx(1500.0)

    def test_rotation_moves_isotherms_along_the_frame_slope(self):
        cal = self._calibration(bottom_slope=0.01)
        # 1000 px right of the reference the same isotherm is 10 px lower on the page
        _, t_left = cal.to_data(100.0, 500.0)
        _, t_right = cal.to_data(1100.0, 510.0)
        assert t_right == pytest.approx(t_left)

    def test_round_trip_with_rotation(self):
        cal = self._calibration(bottom_slope=0.009, left_slope=-0.005)
        px, py = cal.to_pixel(63.0, 1712.0)
        wt, temperature = cal.to_data(px, py)
        assert wt == pytest.approx(63.0, abs=1e-6)
        assert temperature == pytest.approx(1712.0, abs=1e-6)


class TestTernaryCalibration:
    def test_corners_and_centroid(self):
        cal = TernaryCalibration(["SiO2", "CaO", "MgO"], {"SiO2": (500, 100), "CaO": (100, 800), "MgO": (900, 800)})
        corner = cal.to_wt(500, 100)
        assert corner["SiO2"] == pytest.approx(100.0)
        centre = cal.to_wt((500 + 100 + 900) / 3, (100 + 800 + 800) / 3)
        assert all(v == pytest.approx(100 / 3) for v in centre.values())

    def test_pixel_origin_shifts_page_pixels(self):
        cal = TernaryCalibration(
            ["SiO2", "CaO", "MgO"], {"SiO2": (500, 100), "CaO": (100, 800), "MgO": (900, 800)}, pixel_origin=(50, 20)
        )
        assert cal.to_wt(550, 120)["SiO2"] == pytest.approx(100.0)

    def test_identity_warp(self):
        identity = [[1100.0, 1100.0], [1000.0, 0.0], [0.0, 1000.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0]]
        cal = TernaryCalibration(
            ["SiO2", "CaO", "MgO"], {"SiO2": (500, 100), "CaO": (100, 800), "MgO": (900, 800)}, warp=identity
        )
        assert cal.ideal(321.0, 654.0) == pytest.approx((321.0, 654.0))


class TestCalibrateBinary:
    def test_synthetic_diagram(self, binary_image):
        config = DiagramConfig.from_dict(pd_helpers.binary_config_dict(), name="test")
        result = calibrate_binary(ink_mask(binary_image), config)
        for value, pixel in zip(config.x_ticks, result.x_tick_pixels):
            assert pixel == pytest.approx(pd_helpers.wt_to_px(value), abs=1.5)
        for value, pixel in zip(config.y_ticks, result.y_tick_pixels):
            assert pixel == pytest.approx(pd_helpers.t_to_py(value), abs=1.5)
        assert result.calibration.to_data(500, 500) == pytest.approx((40.0, 1500.0), abs=0.3)

    def test_tick_hidden_on_the_left_edge_comes_from_the_right_edge(self):
        image = pd_helpers.draw_binary(hide_left_tick=1600)
        config = DiagramConfig.from_dict(pd_helpers.binary_config_dict(), name="test")
        result = calibrate_binary(ink_mask(image), config)
        index = config.y_ticks.index(1600)
        assert result.y_tick_pixels[index] == pytest.approx(pd_helpers.t_to_py(1600), abs=1.5)

    def test_unmatched_tick_value_is_an_error(self, binary_image):
        data = pd_helpers.binary_config_dict()
        data["axes"]["x"]["ticks"] = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110]
        config = DiagramConfig.from_dict(data, name="test")
        with pytest.raises(ValueError, match="ticks not found"):
            calibrate_binary(ink_mask(binary_image), config)

    def test_tick_pixels_override(self, binary_image):
        data = pd_helpers.binary_config_dict()
        data["axes"]["x"]["tickPixels"] = [None] * 5 + [601.0] + [None] * 5
        config = DiagramConfig.from_dict(data, name="test")
        result = calibrate_binary(ink_mask(binary_image), config)
        assert result.x_tick_pixels[5] == 601.0
