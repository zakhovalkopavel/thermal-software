"""
Tests for nasa_thermo.parsers.nasa7 — NASA-7 parser.

All tests use in-memory fixture strings; no real datafiles are read.
"""
from __future__ import annotations

import textwrap
from pathlib import Path

import pytest

from nasa_thermo.parsers.nasa7  import parse_nasa7
from nasa_thermo.nasa7_species  import Nasa7Species


# ── helpers ───────────────────────────────────────────────────────────────────


def _write_tmp(tmp_path: Path, content: str) -> Path:
    p = tmp_path / "test.dat"
    p.write_text(textwrap.dedent(content), encoding="utf-8")
    return p


# ── minimal valid NASA-7 fixture ──────────────────────────────────────────────
#
# Layout (80-char lines, 0-indexed):
#   Line 1: cols 0-17 name, col 44 phase, cols 45-54 Tmin, cols 55-64 Tmax,
#            cols 65-78 MW, col 79 = '1'
#   Line 2: 5×E15.8 HIGH coeffs a1-a5, col 79 = '2'
#   Line 3: 5×E15.8 (a6h, a7h, a1l, a2l, a3l), col 79 = '3'
#   Line 4: 4×E15.8 (a4l, a5l, a6l, a7l) + optional Hf/R, col 79 = '4'
#
# We use N2 values taken from the spec JSON example.

_N2_LINE1 = (
    "N2              " +           # cols 0-15 (16) name padded
    "  " +                         # cols 16-17
    "L 7/88N  2.   0.   0.   0." + # cols 18-43 (comment / formula)
    "G" +                          # col 44 phase
    "  200.000" +                  # cols 45-54 Tmin (10)
    "  6000.000" +                 # cols 55-64 Tmax (10)
    " 28.01340      " +            # cols 65-78 MW (14)  -- NOTE: 1 trailing space
    "1"                            # col 79
)

# Ensure line 1 is exactly 80 chars
assert len(_N2_LINE1) == 80, f"L1 len={len(_N2_LINE1)}"

# 5 × E15.8  HIGH coeffs  a1h=2.926640e+00 a2h=1.4879768e-03 a3h=-5.684760e-07
#             a4h=1.0097038e-10 a5h=-6.753351e-15
_N2_LINE2 = (
    " 2.92664000E+00" +
    " 1.48797680E-03" +
    "-5.68476000E-07" +
    " 1.00970380E-10" +
    "-6.75335100E-15" +
    "    " +    # cols 75-78 (empty)
    "2"
)
assert len(_N2_LINE2) == 80, f"L2 len={len(_N2_LINE2)}"

# 5 × E15.8  (a6h, a7h, a1l, a2l, a3l)
# a6h=-9.227977e+02 a7h=5.980528e+00  a1l=3.298677e+00 a2l=1.4082404e-03 a3l=-3.963222e-06
_N2_LINE3 = (
    "-9.22797700E+02" +
    " 5.98052800E+00" +
    " 3.29867700E+00" +
    " 1.40824040E-03" +
    "-3.96322200E-06" +
    "    " +    # cols 75-78 (empty)
    "3"
)
assert len(_N2_LINE3) == 80, f"L3 len={len(_N2_LINE3)}"

# 4 × E15.8  (a4l, a5l, a6l, a7l)  + 15 chars (Hf/R) + 4-char pad + record counter
# a4l=5.641515e-09 a5l=-2.444854e-12 a6l=-1.0208999e+03 a7l=3.950372e+00
_N2_LINE4 = (
    " 5.64151500E-09" +
    "-2.44485400E-12" +
    "-1.02089990E+03" +
    " 3.95037200E+00" +
    "               " +  # cols 60-74 (Hf°/R — blank/zero)
    "    " +             # cols 75-78 (empty)
    "4"
)
assert len(_N2_LINE4) == 80, f"L4 len={len(_N2_LINE4)}"

_NASA7_FIXTURE = "\n".join([
    "THERMO",
    " 200.0    1000.0   6000.0",
    _N2_LINE1,
    _N2_LINE2,
    _N2_LINE3,
    _N2_LINE4,
    "END",
    "",
])


# ── tests ─────────────────────────────────────────────────────────────────────


class TestParseNasa7BasicBlock:
    def test_parses_one_species(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        result = parse_nasa7(p)
        assert "N2" in result

    def test_species_type(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        sp = parse_nasa7(p)["N2"]
        assert isinstance(sp, Nasa7Species)

    def test_name(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        sp = parse_nasa7(p)["N2"]
        assert sp.name == "N2"

    def test_phase(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        sp = parse_nasa7(p)["N2"]
        assert sp.phase == "G"

    def test_mw(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        sp = parse_nasa7(p)["N2"]
        assert sp.MW == pytest.approx(28.0134, abs=1e-3)

    def test_tmin_tmax(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        sp = parse_nasa7(p)["N2"]
        assert sp.Tmin == pytest.approx(200.0)
        assert sp.Tmax == pytest.approx(6000.0)

    def test_tswitch_from_header(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        sp = parse_nasa7(p)["N2"]
        assert sp.nasa7.Tswitch == pytest.approx(1000.0)


class TestParseNasa7Coefficients:
    def setup_method(self, _):
        pass  # fixtures are module-level

    def test_high_a1(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        high = parse_nasa7(p)["N2"].nasa7.high
        assert high.a1 == pytest.approx(2.92664000)

    def test_high_a6(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        high = parse_nasa7(p)["N2"].nasa7.high
        assert high.a6 == pytest.approx(-9.22797700e2)

    def test_high_a7(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        high = parse_nasa7(p)["N2"].nasa7.high
        assert high.a7 == pytest.approx(5.98052800)

    def test_low_a1(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        low = parse_nasa7(p)["N2"].nasa7.low
        assert low.a1 == pytest.approx(3.29867700)

    def test_low_a6(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        low = parse_nasa7(p)["N2"].nasa7.low
        assert low.a6 == pytest.approx(-1.02089990e3)

    def test_low_a7(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        low = parse_nasa7(p)["N2"].nasa7.low
        assert low.a7 == pytest.approx(3.95037200)


class TestParseNasa7Filters:
    def test_filter_species_include(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        result = parse_nasa7(p, filter_species={"N2"})
        assert "N2" in result

    def test_filter_species_exclude(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        result = parse_nasa7(p, filter_species={"O2"})
        assert len(result) == 0

    def test_only_gaseous_keeps_G_phase(self, tmp_path):
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        result = parse_nasa7(p, only_gaseous=True)
        assert "N2" in result

    def test_only_gaseous_drops_solid(self, tmp_path):
        # Modify fixture to produce a solid entry
        line1_solid = _N2_LINE1[:44] + "S" + _N2_LINE1[45:]
        fixture = _NASA7_FIXTURE.replace(_N2_LINE1, line1_solid)
        p = _write_tmp(tmp_path, fixture)
        result = parse_nasa7(p, only_gaseous=True)
        assert "N2" not in result


class TestParseNasa7Duplicates:
    def test_duplicate_renamed_with_hash(self, tmp_path):
        # Two identical blocks → second becomes "N2#2"
        double = "\n".join([
            "THERMO",
            " 200.0    1000.0   6000.0",
            _N2_LINE1, _N2_LINE2, _N2_LINE3, _N2_LINE4,
            _N2_LINE1, _N2_LINE2, _N2_LINE3, _N2_LINE4,
            "END", "",
        ])
        p = _write_tmp(tmp_path, double)
        result = parse_nasa7(p)
        assert "N2"    in result
        assert "N2#2"  in result

    def test_comment_lines_before_thermo_are_ignored(self, tmp_path):
        fixture = "! This is a comment\n" + _NASA7_FIXTURE
        p = _write_tmp(tmp_path, fixture)
        result = parse_nasa7(p)
        assert "N2" in result


class TestParseNasa7ToDict:
    def test_to_dict_serialisable(self, tmp_path):
        import json
        p = _write_tmp(tmp_path, _NASA7_FIXTURE)
        sp = parse_nasa7(p)["N2"]
        d = sp.to_dict()
        text = json.dumps(d)  # must not raise
        assert "nasa7" in text

