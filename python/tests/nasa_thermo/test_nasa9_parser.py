"""
Tests for nasa_thermo.parsers.nasa9 — NASA-9 parser.

Fixtures are in-memory strings; no real datafiles are read.
Two format variants are covered:
  - nasa9-origin format (has 'thermo' keyword)
  - nasa9-new / Burcat format (no 'thermo' keyword)
"""
from __future__ import annotations

import textwrap
from pathlib import Path

import pytest

from nasa_thermo.parsers.nasa9 import parse_nasa9
from nasa_thermo.nasa9_species import Nasa9Species


# ── helpers ───────────────────────────────────────────────────────────────────


def _write_tmp(tmp_path: Path, content: str, name: str = "test.dat") -> Path:
    p = tmp_path / name
    p.write_text(content, encoding="utf-8")
    return p


# ── NASA-9 origin format fixture ──────────────────────────────────────────────
#
# Uses H2 coefficients from the JSON spec example (low range only, truncated).
#
# Line 2 field layout (0-indexed):
#  col  1      n_intervals  '2'
#  cols 3-8    refCode      'T 2/17'
#  ...
#  col 51      phase_flag   '0'
#  cols 52-64  MW           ' 2.01588      '
#  cols 65-79  Hf298        '          0.000'
#
# Line 3 per interval:
#  cols 1-10   Tmin
#  cols 11-20  Tmax
#  cols 65-79  H0
#
# Lines 4&5: 5×D16.8 and 2×D16.8 + gap + 2×D16.8

_H2_L1  = "H2                      Hydrogen Reference Element  HF298=0.0  CODATA\n"
#          |<---- 24 chars name ---->|<---- comment ---->
_H2_L2  = " 2T 2/17H   2.00         0   0   0  0     2.01588          0.000\n"
#          spaces ok if we just need n_intervals=2

# We need exactly the right column positions. Let me build them precisely.
# col 0=space, col 1='2' (n_intervals), col 2=space, cols 3-8='T 2/17'
# col 51='0' (gaseous), cols 52-64=' 2.01588      ', cols 65-79='          0.000'

def _make_line2(n: int, ref: str, phase: int, mw: float, hf: float) -> str:
    """Build an 80-char NASA-9 line 2.

    Parser reads:
      col  1      (0-idx): n_intervals
      cols 3-8   (0-idx): ref_code
      col  51    (0-idx): phase_flag
      cols 52-64 (0-idx): MW
      cols 65-79 (0-idx): Hf298
    """
    s = (
        f" {n} "                  # cols 0-2  (col 1=N, col 2=separator)
        + f"{ref:<6}"             # cols 3-8   ref_code
        + " " * 42                # cols 9-50  formula fields (not parsed)
        + f"{phase}"              # col  51    phase_flag
        + f"{mw:13.5f}"          # cols 52-64 MW  (13 chars)
        + f"{hf:15.3f}"          # cols 65-79 Hf298 (15 chars)
    )
    return s.ljust(80)[:80] + "\n"


def _make_line3(tmin: float, tmax: float, h0: float) -> str:
    """Build an 80-char NASA-9 interval line 3."""
    s = (
        " "
        + f"{tmin:10.3f}"       # cols 1-10
        + f"{tmax:10.3f}"       # cols 11-20
        + " " * 44              # cols 21-64
        + f"{h0:15.3f}"         # cols 65-79
    )
    return s.ljust(80)[:80] + "\n"


def _make_line4(*coeffs: float) -> str:
    """5 × D16.8 on one line."""
    return "".join(f"{c:16.8E}".replace("E", "D") for c in coeffs).ljust(80)[:80] + "\n"


def _make_line5_origin(a6: float, a7: float, b1: float, b2: float) -> str:
    """Origin format: 2×D16.8 + 16-space gap + 2×D16.8."""
    return (
        f"{a6:16.8E}".replace("E", "D")
        + f"{a7:16.8E}".replace("E", "D")
        + " " * 16
        + f"{b1:16.8E}".replace("E", "D")
        + f"{b2:16.8E}".replace("E", "D")
    ).ljust(80)[:80] + "\n"


def _make_line5_new(a6: float, a7: float, b1: float, b2: float) -> str:
    """Burcat-new format: 5×D16.8 (third is zero placeholder)."""
    return (
        f"{a6:16.8E}".replace("E", "D")
        + f"{a7:16.8E}".replace("E", "D")
        + f"{0.0:16.8E}".replace("E", "D")
        + f"{b1:16.8E}".replace("E", "D")
        + f"{b2:16.8E}".replace("E", "D")
    ).ljust(80)[:80] + "\n"


# Build fixture for H2, 2 intervals, origin format
_H2_FIXTURE_ORIGIN = (
    "! Thermodynamic data — origin format\n"
    "thermo\n"
    "   200.0   1000.0  6000.0  20000.   20231201\n"
    + "H2                      Hydrogen\n"
    + _make_line2(2, "T 2/17", 0, 2.01588, 0.0)
    + _make_line3(200.0, 1000.0, 8448.714)
    + _make_line4(-3.994306020e3, 6.989271930e-1, 2.300814374e0, 1.817234052e-3, -3.533221680e-7)
    + _make_line5_origin(3.937771660e-11, -2.353067135e-15, -1.033174503e3, 4.664370590)
    + _make_line3(1000.0, 6000.0, 8448.714)
    + _make_line4(6.082027600e5, -1.819571604e3, 4.438184520e0, -6.393523650e-4, 1.197726747e-7)
    + _make_line5_origin(-1.392138475e-11, 7.454330100e-16, 2.748620396e4, -7.667698635)
    + "END PRODUCTS\n"
    + "END REACTANTS\n"
)


# ── NASA-9 new (Burcat) format fixture ────────────────────────────────────────

_H2_FIXTURE_NEW = (
    "! Extended Third Millennium Database\n"
    "! Source: Burcat / Ruscic\n"
    + "H2                      Hydrogen NEWformat\n"
    + _make_line2(1, "T 2/17", 0, 2.01588, 0.0)
    + _make_line3(200.0, 6000.0, 8448.714)
    + _make_line4(-3.994306020e3, 6.989271930e-1, 2.300814374e0, 1.817234052e-3, -3.533221680e-7)
    + _make_line5_new(3.937771660e-11, -2.353067135e-15, -1.033174503e3, 4.664370590)
)


# ── tests ─────────────────────────────────────────────────────────────────────


class TestParseNasa9OriginFormat:
    def test_parses_species(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        result = parse_nasa9([p])
        assert "H2" in result

    def test_species_type(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        sp = parse_nasa9([p])["H2"]
        assert isinstance(sp, Nasa9Species)

    def test_phase_is_gas(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        sp = parse_nasa9([p])["H2"]
        assert sp.phase == "gas"

    def test_mw(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        sp = parse_nasa9([p])["H2"]
        assert sp.MW == pytest.approx(2.01588, abs=1e-4)

    def test_two_ranges(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        sp = parse_nasa9([p])["H2"]
        assert len(sp.nasa9.ranges) == 2

    def test_range_tmin_tmax(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        sp = parse_nasa9([p])["H2"]
        assert sp.nasa9.ranges[0].Tmin == pytest.approx(200.0)
        assert sp.nasa9.ranges[0].Tmax == pytest.approx(1000.0)
        assert sp.nasa9.ranges[1].Tmin == pytest.approx(1000.0)
        assert sp.nasa9.ranges[1].Tmax == pytest.approx(6000.0)

    def test_range_continuity(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        sp = parse_nasa9([p])["H2"]
        assert sp.nasa9.ranges[0].Tmax == pytest.approx(sp.nasa9.ranges[1].Tmin)

    def test_a8_a9_integration_constants(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        sp = parse_nasa9([p])["H2"]
        coeffs = sp.nasa9.ranges[0].coeffs
        assert coeffs.a8 == pytest.approx(-1.033174503e3, rel=1e-5)
        assert coeffs.a9 == pytest.approx(4.664370590, rel=1e-5)

    def test_h0_metadata(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        sp = parse_nasa9([p])["H2"]
        assert sp.nasa9.ranges[0].H0 == pytest.approx(8448.714, rel=1e-4)


class TestParseNasa9NewFormat:
    def test_parses_burcat_new(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_NEW, "nasa9-new.dat")
        result = parse_nasa9([p])
        assert "H2" in result

    def test_b1_b2_parsed_from_new_format(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_NEW, "nasa9-new.dat")
        sp = parse_nasa9([p])["H2"]
        coeffs = sp.nasa9.ranges[0].coeffs
        assert coeffs.a8 == pytest.approx(-1.033174503e3, rel=1e-5)
        assert coeffs.a9 == pytest.approx(4.664370590, rel=1e-5)


class TestParseNasa9Merge:
    def test_later_file_overwrites(self, tmp_path):
        p1 = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN, "origin.dat")
        p2 = _write_tmp(tmp_path, _H2_FIXTURE_NEW, "new.dat")
        result = parse_nasa9([p1, p2])
        assert "H2" in result
        # new.dat has 1 range, origin has 2 — later overwrites
        assert len(result["H2"].nasa9.ranges) == 1

    def test_two_different_species_merged(self, tmp_path):
        # O2 block in origin format
        o2_fixture = (
            "thermo\n"
            "   200.0   1000.0  6000.0  20000.   20231201\n"
            + "O2                      Oxygen\n"
            + _make_line2(1, "RUS 89", 0, 31.99880, 0.0)
            + _make_line3(200.0, 6000.0, 8682.0)
            + _make_line4(2.96464e4, -1.63051e3, 5.43117e0, -4.42989e-3, 3.36995e-7)
            + _make_line5_origin(-1.63467e-11, 0.0, 2.84891e3, -9.87701)
            + "END PRODUCTS\n"
        )
        p1 = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN, "h2.dat")
        p2 = _write_tmp(tmp_path, o2_fixture, "o2.dat")
        result = parse_nasa9([p1, p2])
        assert "H2" in result
        assert "O2" in result


class TestParseNasa9Filters:
    def test_filter_keeps_match(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        result = parse_nasa9([p], filter_species={"H2"})
        assert "H2" in result

    def test_filter_drops_non_match(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        result = parse_nasa9([p], filter_species={"O2"})
        assert len(result) == 0

    def test_only_gaseous_keeps_gas(self, tmp_path):
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        result = parse_nasa9([p], only_gaseous=True)
        assert "H2" in result

    def test_only_gaseous_skips_condensed(self, tmp_path):
        # Create condensed-phase fixture (phase_flag=1)
        fixture = (
            "thermo\n"
            "   200.0   1000.0  6000.0  20000.   20231201\n"
            + "H2O(L)                  Water liquid\n"
            + _make_line2(1, "JNAF  ", 1, 18.01528, -285830.0)
            + _make_line3(273.0, 373.0, 0.0)
            + _make_line4(0.0, 0.0, 0.0, 0.0, 0.0)
            + _make_line5_origin(0.0, 0.0, 0.0, 0.0)
            + "END PRODUCTS\n"
        )
        p = _write_tmp(tmp_path, fixture)
        result = parse_nasa9([p], only_gaseous=True)
        assert "H2O(L)" not in result


class TestParseNasa9ToDict:
    def test_to_dict_json_serialisable(self, tmp_path):
        import json
        p = _write_tmp(tmp_path, _H2_FIXTURE_ORIGIN)
        sp = parse_nasa9([p])["H2"]
        text = json.dumps(sp.to_dict())
        assert "nasa9" in text
        assert "ranges" in text

