"""Tests for Jung 2009 Table 1 page-ocr parser."""

from __future__ import annotations

from pathlib import Path

from thermodynamic_staging.jung_parse import parse_jung_table1


def _ocr_dir() -> Path:
    p = Path("/opt/thermal-software/tmp/reports/python/minerals-thermodynamic/jung-2009/ocr")
    if p.is_dir() and (p / "page-0002.txt").is_file():
        return p
    for parent in Path(__file__).resolve().parents:
        for cand in (
            parent / "tmp/reports/python/minerals-thermodynamic/jung-2009/ocr",
            parent / "reports/minerals-thermodynamic/jung-2009/ocr",
        ):
            if cand.is_dir() and (cand / "page-0002.txt").is_file():
                return cand
    return p


def test_jung_tialite_and_al4tio8_from_ocr() -> None:
    ocr = _ocr_dir()
    assert (ocr / "page-0002.txt").is_file()
    data = parse_jung_table1(ocr)
    assert data["ref"] == "Jung2009AlTiO"

    t = data["phases"]["tialite"]
    assert abs(t["Hf298_Jmol"] + 2577174.0) < 1.0
    assert abs(t["S298_JmolK"] - 128.448) < 0.01
    assert abs(t["cp"]["a"] - 249.29) < 0.01
    assert t["status"] == "ok"

    a4 = data["phases"]["Al4TiO8"]
    assert abs(a4["Hf298_Jmol"] + 4194883.4) < 1.0
    assert abs(a4["S298_JmolK"] - 211.576) < 0.01
    assert a4["status"] == "ok"


def test_jung_mqm_binaries_match_table1() -> None:
    """Confirm Δg° / q0i against ISIJ Table 1 (page-ocr lines)."""
    data = parse_jung_table1(_ocr_dir())
    liquid = data["phases"]["liquid_MQM"]
    assert liquid["status"] == "ok"
    assert liquid["ternaryParameters"] is None
    bins = liquid["parameters"]["binaries"]

    ti = bins["Ti2O3-TiO2"]
    assert abs(ti["dg0_Jmol"] - (-19246.4)) < 0.05
    assert abs(ti["q01_Jmol"] - (-112366.0)) < 0.05
    assert abs(ti["q02_Jmol"] - 209542.8) < 0.05
    assert abs(ti["q03_Jmol"] - (-98420.0)) < 0.05
    assert len(ti["raw"]) < 500  # not the whole document

    al_tio2 = bins["Al2O3-TiO2"]
    assert abs(al_tio2["dg0_Jmol"] - 0.0) < 1e-9
    assert abs(al_tio2["q01_Jmol"] - 16022.6) < 0.05
    assert abs(al_tio2["q02_Jmol"] - 3856.2) < 0.05
    assert "q03_Jmol" not in al_tio2

    al_ti2o3 = bins["Al2O3-Ti2O3"]
    assert abs(al_ti2o3["dg0_Jmol"] - 0.0) < 1e-9
    assert abs(al_ti2o3["q01_Jmol"] - 16022.6) < 0.05
    assert abs(al_ti2o3["q02_Jmol"] - 3856.2) < 0.05


def test_jung_henrian_ss_shifts() -> None:
    data = parse_jung_table1(_ocr_dir())
    ss = data["phases"]["corundum_ilmenite_ss"]["parameters"]
    assert abs(ss["Al2O3_ilmenite_deltaG_Jmol"] - 50208.0) < 0.05
    assert abs(ss["Ti2O3_corundum_deltaG_Jmol"] - 108784.0) < 0.05
