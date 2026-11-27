"""Unit tests for Holland–Powell hp633 staging parser."""

from __future__ import annotations

from thermodynamic_staging.hp633_parse import parse_hp633
from thermodynamic_staging.paths import sources_dir


def test_parse_gehlenite_from_hp633() -> None:
    path = sources_dir() / "hp633ver.dat"
    assert path.is_file(), f"missing {path}"
    data = parse_hp633(path, keys={"geh"})
    geh = data["phases"]["geh"]
    assert geh["formula"] == "Ca2Al2SiO7"
    assert geh["H_Jmol"] == -3992180.0
    assert geh["S0_JmolK"] == 198.5
    assert geh["cp"]["c1"] == 405.7
    assert geh["status"] == "ok"


def test_parse_all_endmembers_from_hp633() -> None:
    path = sources_dir() / "hp633ver.dat"
    data = parse_hp633(path)
    assert data["nPhases"] == 276
    assert len(data["phases"]) == 276
    assert "fo" in data["phases"]
    assert data["phases"]["fo"]["name"] == "forsterite"
    assert data["phases"]["fo"]["H_Jmol"] == -2172500.0
    assert data["phases"]["qL"]["state"] == "liquid"
    assert data["phases"]["Azr"]["formula"] == "Cu3(OH)2(CO3)2"
    assert data["phases"]["Azr"]["G0_Jmol"] == -1399201.0
    assert sum(1 for p in data["phases"].values() if p["status"] == "ok") >= 270
