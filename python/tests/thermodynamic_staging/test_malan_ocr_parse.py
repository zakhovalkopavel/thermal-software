"""Tests for Malan 2019 Table 3 page-ocr parser."""

from __future__ import annotations

from pathlib import Path

from thermodynamic_staging.malan_ocr_parse import parse_malan_ocr


def _ocr_dir() -> Path:
    p = Path("/opt/thermal-software/tmp/reports/python/minerals-thermodynamic/malan-2019/ocr")
    if p.is_dir() and (p / "page-0015.txt").is_file():
        return p
    for parent in Path(__file__).resolve().parents:
        for cand in (
            parent / "tmp/reports/python/minerals-thermodynamic/malan-2019/ocr",
            parent / "reports/minerals-thermodynamic/malan-2019/ocr",
        ):
            if cand.is_dir() and (cand / "page-0015.txt").is_file():
                return cand
    return p


def test_malan_table3_liquid_and_ss() -> None:
    data = parse_malan_ocr(_ocr_dir())
    assert data["ref"] == "Malan2019"
    liq = data["phases"]["liquid_quasichemical"]
    p0 = liq["parameters"][0]
    assert abs(p0["a"] - 152411.0) < 0.1
    assert abs(p0["b"] - (-92.6727)) < 0.001
    assert data["phases"]["ferricpseudobrookite_ss"]["status"] == "ok"
    assert data["phases"]["hematite_ss"]["status"] == "ok"
    assert data["phases"]["rutile_ss"]["status"] == "ok"
