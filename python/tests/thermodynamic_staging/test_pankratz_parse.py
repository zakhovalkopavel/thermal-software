"""Tests for Pankratz 672 OCR parser."""

from __future__ import annotations

from pathlib import Path

from thermodynamic_staging.pankratz_parse import parse_pankratz_ocr


def _ocr_dir() -> Path:
    p = Path("/opt/thermal-software/tmp/reports/python/minerals-thermodynamic/pankratz-1982/ocr")
    if p.is_dir():
        return p
    for parent in Path(__file__).resolve().parents:
        cand = parent / "tmp/reports/python/minerals-thermodynamic/pankratz-1982/ocr"
        if cand.is_dir():
            return cand
        cand = parent / "reports/minerals-thermodynamic/pankratz-1982/ocr"
        if cand.is_dir():
            return cand
    return p


def test_pankratz_mno_and_y2o3() -> None:
    ocr = _ocr_dir()
    assert (ocr / "page-0238.txt").is_file()
    data = parse_pankratz_ocr(ocr)
    assert data["ref"] == "Pankratz1982"
    mno = data["phases"]["manganosite"]
    assert mno["status"] == "ok"
    assert abs(mno["Hf298_kJmol"] + 385.22) < 0.5
    assert abs(mno["S298_JmolK"] - 59.71) < 0.2
    y = data["phases"]["yttria"]
    assert y["status"] == "ok"
    assert abs(y["Hf298_kJmol"] + 1905.3) < 1.0
    assert data["phases"]["Mn2O3"]["status"] == "ok"
