"""Tests for nasa_thermo dataclass models — serialisation via to_dict()."""
from __future__ import annotations

from nasa_thermo.nasa7_coeffs   import Nasa7Coeffs
from nasa_thermo.nasa7_equation import Nasa7Equation
from nasa_thermo.nasa7_species  import Nasa7Species
from nasa_thermo.nasa9_coeffs   import Nasa9Coeffs
from nasa_thermo.nasa9_equation import Nasa9Equation
from nasa_thermo.nasa9_range    import Nasa9Range
from nasa_thermo.nasa9_species  import Nasa9Species


class TestNasa7Coeffs:
    def test_to_dict_keys(self):
        c = Nasa7Coeffs(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0)
        d = c.to_dict()
        assert list(d.keys()) == ["a1", "a2", "a3", "a4", "a5", "a6", "a7"]
        assert d["a3"] == 3.0

    def test_to_dict_values_preserved(self):
        c = Nasa7Coeffs(1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7)
        d = c.to_dict()
        assert d["a7"] == 7.7


class TestNasa7Equation:
    def test_to_dict_structure(self):
        low  = Nasa7Coeffs(*range(1, 8))
        high = Nasa7Coeffs(*[x * 0.1 for x in range(1, 8)])
        eq   = Nasa7Equation(Tswitch=1000.0, low=low, high=high)
        d = eq.to_dict()
        assert d["Tswitch"] == 1000.0
        assert "low"  in d
        assert "high" in d
        assert d["low"]["a1"] == 1


class TestNasa7Species:
    def test_to_dict_all_fields(self):
        low  = Nasa7Coeffs(*[0.0] * 7)
        high = Nasa7Coeffs(*[0.0] * 7)
        sp = Nasa7Species(
            name="N2", comment="test", phase="G",
            MW=28.014, Tmin=200.0, Tmax=6000.0,
            nasa7=Nasa7Equation(Tswitch=1000.0, low=low, high=high),
        )
        d = sp.to_dict()
        assert d["name"]  == "N2"
        assert d["phase"] == "G"
        assert d["MW"]    == 28.014
        assert "nasa7" in d


class TestNasa9Coeffs:
    def test_to_dict_has_nine_keys(self):
        c = Nasa9Coeffs(*range(1, 10))
        d = c.to_dict()
        assert len(d) == 9
        assert d["a8"] == 8
        assert d["a9"] == 9


class TestNasa9Range:
    def test_to_dict_structure(self):
        coeffs = Nasa9Coeffs(*[0.0] * 9)
        rng = Nasa9Range(Tmin=200.0, Tmax=1000.0, H0=8448.7, coeffs=coeffs)
        d = rng.to_dict()
        assert d["Tmin"] == 200.0
        assert d["Tmax"] == 1000.0
        assert d["H0"]   == 8448.7
        assert "coeffs"  in d


class TestNasa9Species:
    def test_to_dict_all_fields(self):
        coeffs = Nasa9Coeffs(*[0.0] * 9)
        sp = Nasa9Species(
            name="H2", comment="Hydrogen", refCode="T 2/17",
            phase="gas", MW=2.016, Hf298=0.0,
            nasa9=Nasa9Equation(
                ranges=[Nasa9Range(200.0, 1000.0, 8448.7, coeffs)]
            ),
        )
        d = sp.to_dict()
        assert d["name"]    == "H2"
        assert d["phase"]   == "gas"
        assert d["refCode"] == "T 2/17"
        assert len(d["nasa9"]["ranges"]) == 1

