"""Tests for Abdul CCR Table 8/9 companion parser."""

from __future__ import annotations

from pathlib import Path

from thermodynamic_staging.abdul_ccr_parse import parse_abdul_ccr


_TABLE8_SNIPPET = """
Table 8
Table showing the functions found for the melt phase used for the C-S phase diagram.
  GLiquid (C, C2S, CS, S):
    GC = GCaO,Liquid [6]
    GS = GSiO2 ,Liquid [7]
    GC2 S = 2GCaO,Liquid + GSiO2,Liquid − 185132.188472035 − 1.6*T
    GCS = GCaO,Liquid + GSiO2 ,Liquid − 131793.447600044 + 12.6747313767583*T
    LCS,S,0 = 206415.921620474 − 107.044648799784*T
    LCS,S,1 = − 10306.431303854 − 2.24993113828298*T
    LCS,S,2 = 174447.554314851 − 64.2938830701164*T
    LC,C2 S,1 = 5490.98163817185
    LC2 S,S,0 = − 3*T

Table 9
Invariant                           T (K)                         X(SiO2) in liquid
Liquid + CaO → Ca3SiO5              2430      (2423) [52]         0.27        (0.27)
Liquid → Ca3SiO5 + α-Ca2SiO4        2300      (2323) [52]         0.30        (0.29)
Liquid + α-Ca2SiO4 → Ca3Si2O7       1741      (1737) [52]         0.41        (0.43)
Liquid → Ca3Si2O7 + CaSiO3          1734      (1733) [52]         0.42        (0.44)
Liquid → SiO2 + CaSiO3              1700      (1709) [52]         0.63        (0.61)
"""


def _ocr_dir() -> Path:
    p = Path(
        "/opt/thermal-software/tmp/reports/python/minerals-thermodynamic/abdul-2023-ccr/ocr"
    )
    if p.is_dir() and (p / "page-0010.pdftotext.txt").is_file():
        return p
    for parent in Path(__file__).resolve().parents:
        for cand in (
            parent / "tmp/reports/python/minerals-thermodynamic/abdul-2023-ccr/ocr",
            parent / "reports/minerals-thermodynamic/abdul-2023-ccr/ocr",
        ):
            if cand.is_dir() and (cand / "page-0010.pdftotext.txt").is_file():
                return cand
    return p

def test_abdul_ccr_table8_from_snippet(tmp_path: Path) -> None:
    page = tmp_path / "page-0010.pdftotext.txt"
    page.write_text(_TABLE8_SNIPPET, encoding="utf-8")
    data = parse_abdul_ccr(ocr_dir=tmp_path)
    assert data["ref"] == "Abdul2023"
    assert data["status"] == "ok"
    liq = data["phases"]["liquid_associate"]
    by_param = {p["parameter"]: p for p in liq["associates"]}
    assert abs(by_param["G_C2S_associate"]["a"] - (-185132.188472035)) < 1e-6
    assert abs(by_param["G_C2S_associate"]["b"] - (-1.6)) < 1e-9
    assert abs(by_param["G_CS_associate"]["a"] - (-131793.447600044)) < 1e-6
    assert abs(by_param["G_CS_associate"]["b"] - 12.6747313767583) < 1e-9
    l_by = {p["parameter"]: p for p in liq["parameters"]}
    assert abs(l_by["L_CS_S_0"]["a"] - 206415.921620474) < 1e-6
    assert abs(l_by["L_CS_S_0"]["b"] - (-107.044648799784)) < 1e-9
    assert abs(l_by["L_C_C2S_1"]["a"] - 5490.98163817185) < 1e-6
    assert abs(l_by["L_C2S_S_0"]["b"] - (-3.0)) < 1e-9
    inv = data["phases"]["invariants"]["reactions"]
    assert len(inv) >= 5
    assert abs(inv[0]["T_K"] - 2430.0) < 0.1


def test_abdul_ccr_from_ocr_dir() -> None:
    ocr = _ocr_dir()
    assert ocr.is_dir(), f"missing CCR OCR at {ocr}; run make thermodynamic-staging-ocr-abdul-ccr"
    data = parse_abdul_ccr(ocr_dir=ocr)
    assert data["status"] == "ok"
    liq = data["phases"]["liquid_associate"]
    assert len(liq["associates"]) >= 2
    assert len(liq["parameters"]) >= 5
    assert data["phases"]["invariants"]["status"] == "ok"
