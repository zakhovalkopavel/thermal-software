"""Tests for nasa_thermo.utils — number-parsing helpers."""
from __future__ import annotations

import pytest
from nasa_thermo.utils import parse_d, parse_e, slice_e15


class TestParseE:
    def test_positive_exponent(self):
        assert parse_e(" 1.23456789E+04") == pytest.approx(12345.6789)

    def test_negative_exponent(self):
        assert parse_e("-3.14000000E-03") == pytest.approx(-0.00314)

    def test_zero(self):
        assert parse_e(" 0.00000000E+00") == 0.0

    def test_strips_whitespace(self):
        assert parse_e("  2.5E+00  ") == 2.5


class TestParseD:
    def test_positive_d_notation(self):
        assert parse_d(" 1.23456789D+04") == pytest.approx(12345.6789)

    def test_negative_value(self):
        assert parse_d("-3.14000000D-03") == pytest.approx(-0.00314)

    def test_case_insensitive(self):
        assert parse_d("1.0d+00") == pytest.approx(1.0)

    def test_zero(self):
        assert parse_d("0.00000000D+00") == 0.0


class TestSliceE15:
    def test_two_coefficients(self):
        # 15 chars each: " 3.29867700E+00" + " 1.40824040E-03"
        line = " 3.29867700E+00 1.40824040E-03"
        result = slice_e15(line, 2)
        assert len(result) == 2
        assert result[0] == pytest.approx(3.29867700)
        assert result[1] == pytest.approx(1.40824040e-3)

    def test_five_coefficients(self):
        # Build a synthetic NASA-7 line 2 with 5 known values
        coeffs = [1.0, 2.0, 3.0, 4.0, 5.0]
        line = "".join(f"{c:15.8E}" for c in coeffs)
        result = slice_e15(line, 5)
        assert result == pytest.approx(coeffs)

