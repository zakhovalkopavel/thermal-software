"""Tests for Koroleva 2017 Modal Surya OCR parser."""

from __future__ import annotations

from pathlib import Path

from thermodynamic_staging.koroleva_parse import parse_koroleva_ocr


def _ocr_dir() -> Path:
    p = Path(
        "/opt/thermal-software/tmp/reports/python/minerals-thermodynamic/koroleva-2017/ocr"
    )
    if p.is_dir() and (p / "page-0004.txt").is_file():
        return p
    for parent in Path(__file__).resolve().parents:
        for cand in (
            parent / "tmp/reports/python/minerals-thermodynamic/koroleva-2017/ocr",
            parent / "reports/minerals-thermodynamic/koroleva-2017/ocr",
        ):
            if cand.is_dir() and (cand / "page-0004.txt").is_file():
                return cand
    return p


def test_koroleva_silicates_and_borates_this_work() -> None:
    data = parse_koroleva_ocr(_ocr_dir())
    assert data["ref"] == "Koroleva2017"
    assert data["nPhases"] == 26  # 14 silicates + 12 borates
    phases = data["phases"]

    li = phases["Li2SiO3"]
    assert abs(li["S298_JmolK"] - 81.52) < 0.01
    assert abs(li["Hf298_kJmol"] + 1640.49) < 0.01
    assert li["table"] == 1

    na4 = phases["Na4Si3O8"]
    assert abs(na4["S298_JmolK"] - 277.05) < 0.01
    assert abs(na4["Hf298_kJmol"] + 4010.13) < 0.01

    libo2 = phases["LiBO2"]
    assert abs(libo2["S298_JmolK"] - 52.0) < 0.01
    assert abs(libo2["Hf298_kJmol"] + 1021.68) < 0.01
    assert libo2["table"] == 2
    assert libo2["family"] == "borate"

    kbo2 = phases["KBO2"]
    assert abs(kbo2["S298_JmolK"] - 80.18) < 0.01
    assert abs(kbo2["Hf298_kJmol"] + 1014.58) < 0.01

    kb8 = phases["K2B8O13"]
    assert abs(kb8["S298_JmolK"] - 290.30) < 0.01
    assert abs(kb8["Hf298_kJmol"] + 5945.04) < 0.01


def test_koroleva_regression_equations() -> None:
    regs = parse_koroleva_ocr(_ocr_dir())["regressions"]

    s6 = regs["silicate_S298"]["coeffs"]
    assert abs(s6["SiO2"] - 43.153) < 1e-3
    assert abs(s6["Li2O"] - 38.366) < 1e-3
    assert abs(s6["Na2O"] - 73.796) < 1e-3
    assert abs(s6["K2O"] - 103.426) < 1e-3

    h7 = regs["silicate_Hf298"]["coeffs"]
    assert abs(h7["SiO2"] + 919.788) < 1e-3
    assert abs(h7["Li2O"] + 720.705) < 1e-3
    assert abs(h7["Na2O"] + 625.385) < 1e-3
    assert abs(h7["K2O"] + 650.962) < 1e-3
    ex7 = regs["silicate_Hf298"]["excess_kJmol"]
    assert abs(ex7["Li2O"] + 122.825) < 1e-3
    assert abs(ex7["Na2O"] + 210.815) < 1e-3
    assert abs(ex7["K2O"] + 289.262) < 1e-3

    h10 = regs["borate_Hf298"]["coeffs"]
    assert abs(h10["B2O3"] + 1305.296) < 1e-3
    assert abs(h10["Li2O"] + 738.059) < 1e-3
    assert abs(h10["Na2O"] + 678.501) < 1e-3
    assert abs(h10["K2O"] + 723.862) < 1e-3
    ex10 = regs["borate_Hf298"]["excess_kJmol"]
    assert abs(ex10["Li2O"] + 140.179) < 1e-3
    assert abs(ex10["Na2O"] + 263.931) < 1e-3
    assert abs(ex10["K2O"] + 371.162) < 1e-3

    s11 = regs["borate_S298"]["coeffs"]
    assert abs(s11["B2O3"] - 43.311) < 1e-3
    assert abs(s11["Li2O"] - 60.682) < 1e-3
    assert abs(s11["Na2O"] - 102.978) < 1e-3
    assert abs(s11["K2O"] - 117.058) < 1e-3
