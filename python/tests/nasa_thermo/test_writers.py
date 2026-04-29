"""Tests for nasa_thermo.writers — JSON output serialisation."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from nasa_thermo.nasa7_coeffs   import Nasa7Coeffs
from nasa_thermo.nasa7_equation import Nasa7Equation
from nasa_thermo.nasa7_species  import Nasa7Species
from nasa_thermo.nasa9_coeffs   import Nasa9Coeffs
from nasa_thermo.nasa9_equation import Nasa9Equation
from nasa_thermo.nasa9_range    import Nasa9Range
from nasa_thermo.nasa9_species  import Nasa9Species
from nasa_thermo.writers import (
    write_nasa7_json,
    write_nasa9_json,
    NASA7_META,
    NASA9_META,
)


def _make_n2() -> Nasa7Species:
    low  = Nasa7Coeffs(3.298, 1.408e-3, -3.963e-6, 5.641e-9, -2.444e-12, -1020.9, 3.950)
    high = Nasa7Coeffs(2.926, 1.487e-3, -5.684e-7, 1.009e-10, -6.753e-15, -922.8, 5.980)
    return Nasa7Species(
        name="N2", comment="test", phase="G",
        MW=28.014, Tmin=200.0, Tmax=6000.0,
        nasa7=Nasa7Equation(Tswitch=1000.0, low=low, high=high),
    )


def _make_h2() -> Nasa9Species:
    coeffs = Nasa9Coeffs(-3994.0, 0.699, 2.300, 1.817e-3, -3.533e-7, 3.937e-11, -2.353e-15, -1033.2, 4.664)
    return Nasa9Species(
        name="H2", comment="Hydrogen", refCode="T 2/17",
        phase="gas", MW=2.016, Hf298=0.0,
        nasa9=Nasa9Equation(ranges=[Nasa9Range(200.0, 6000.0, 8448.7, coeffs)]),
    )


class TestWriteNasa7Json:
    def test_creates_file(self, tmp_path):
        write_nasa7_json({"N2": _make_n2()}, tmp_path)
        assert (tmp_path / "nasa7.json").exists()

    def test_valid_json(self, tmp_path):
        write_nasa7_json({"N2": _make_n2()}, tmp_path)
        text = (tmp_path / "nasa7.json").read_text()
        data = json.loads(text)
        assert isinstance(data, dict)

    def test_count_field(self, tmp_path):
        write_nasa7_json({"N2": _make_n2()}, tmp_path)
        data = json.loads((tmp_path / "nasa7.json").read_text())
        assert data["count"] == 1

    def test_species_key_present(self, tmp_path):
        write_nasa7_json({"N2": _make_n2()}, tmp_path)
        data = json.loads((tmp_path / "nasa7.json").read_text())
        assert "N2" in data["species"]

    def test_meta_fields(self, tmp_path):
        write_nasa7_json({"N2": _make_n2()}, tmp_path)
        data = json.loads((tmp_path / "nasa7.json").read_text())
        for key in ("source", "ref", "url", "generatedAt"):
            assert key in data

    def test_url_matches_meta(self, tmp_path):
        write_nasa7_json({"N2": _make_n2()}, tmp_path)
        data = json.loads((tmp_path / "nasa7.json").read_text())
        assert data["url"] == NASA7_META["url"]

    def test_creates_output_dir(self, tmp_path):
        nested = tmp_path / "a" / "b"
        write_nasa7_json({"N2": _make_n2()}, nested)
        assert (nested / "nasa7.json").exists()

    def test_nasa7_structure(self, tmp_path):
        write_nasa7_json({"N2": _make_n2()}, tmp_path)
        data = json.loads((tmp_path / "nasa7.json").read_text())
        sp = data["species"]["N2"]
        assert "nasa7" in sp
        assert "Tswitch" in sp["nasa7"]
        assert "low"     in sp["nasa7"]
        assert "high"    in sp["nasa7"]
        assert "a1" in sp["nasa7"]["low"]


class TestWriteNasa9Json:
    def test_creates_file(self, tmp_path):
        write_nasa9_json({"H2": _make_h2()}, tmp_path)
        assert (tmp_path / "nasa9.json").exists()

    def test_count_field(self, tmp_path):
        write_nasa9_json({"H2": _make_h2()}, tmp_path)
        data = json.loads((tmp_path / "nasa9.json").read_text())
        assert data["count"] == 1

    def test_url_points_to_anl(self, tmp_path):
        write_nasa9_json({"H2": _make_h2()}, tmp_path)
        data = json.loads((tmp_path / "nasa9.json").read_text())
        assert "anl.gov" in data["url"]

    def test_nasa9_ranges(self, tmp_path):
        write_nasa9_json({"H2": _make_h2()}, tmp_path)
        data = json.loads((tmp_path / "nasa9.json").read_text())
        sp = data["species"]["H2"]
        assert "nasa9" in sp
        assert isinstance(sp["nasa9"]["ranges"], list)
        assert len(sp["nasa9"]["ranges"]) == 1

    def test_coeffs_a1_to_a9(self, tmp_path):
        write_nasa9_json({"H2": _make_h2()}, tmp_path)
        data = json.loads((tmp_path / "nasa9.json").read_text())
        coeffs = data["species"]["H2"]["nasa9"]["ranges"][0]["coeffs"]
        for k in [f"a{i}" for i in range(1, 10)]:
            assert k in coeffs

    def test_generated_at_iso8601(self, tmp_path):
        from datetime import datetime
        write_nasa9_json({"H2": _make_h2()}, tmp_path)
        data = json.loads((tmp_path / "nasa9.json").read_text())
        # Should parse without error
        datetime.fromisoformat(data["generatedAt"].replace("Z", "+00:00"))

