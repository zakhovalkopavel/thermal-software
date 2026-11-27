"""Tests for Yazhenskikh workshop OCR inventory parser."""

from __future__ import annotations

from pathlib import Path

from thermodynamic_staging.yazhenskikh_ocr_parse import parse_yazhenskikh_ocr


def _ocr_dir(year: int) -> Path:
    job = f"yazhenskikh-{year}"
    p = Path(f"/opt/thermal-software/tmp/reports/python/minerals-thermodynamic/{job}/ocr")
    if p.is_dir() and any(p.glob("page-*.txt")):
        return p
    for parent in Path(__file__).resolve().parents:
        for cand in (
            parent / f"tmp/reports/python/minerals-thermodynamic/{job}/ocr",
            parent / f"reports/minerals-thermodynamic/{job}/ocr",
        ):
            if cand.is_dir() and any(cand.glob("page-*.txt")):
                return cand
    return p


def test_yazhenskikh_2007_inventory() -> None:
    data = parse_yazhenskikh_ocr(_ocr_dir(2007), year=2007)
    assert data["ref"] == "Yazhenskikh2007"
    assert data["status"] == "partial"
    scope = data["phases"]["liquid_associate_scope"]
    assert scope["numericLPrinted"] is False
    assert any("Na2Si" in s or "SiO2" in s for s in scope["species"])
    assert len(scope["species"]) >= 5
