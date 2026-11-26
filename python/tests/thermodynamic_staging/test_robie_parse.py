"""Tests for Robie & Hemingway compact dataset builder."""

from __future__ import annotations

import json
from pathlib import Path

from usgs_bulletin_2131.parse_tables import (
    build_robie_dataset,
    parse_298k_pages,
    parse_cp_pages,
)


def _ocr_dir() -> Path:
    p = Path("/opt/thermal-software/tmp/reports/python/usgs-bulletin-2131/ocr")
    if p.is_dir():
        return p
    for parent in Path(__file__).resolve().parents:
        cand = parent / "tmp/reports/python/usgs-bulletin-2131/ocr"
        if cand.is_dir():
            return cand
        cand = parent / "reports/usgs-bulletin-2131/ocr"
        if cand.is_dir():
            return cand
    return p


def test_parse_diopside_298() -> None:
    ocr = _ocr_dir()
    assert ocr.is_dir(), f"missing OCR dir {ocr}"
    phases = parse_298k_pages(ocr, [40])
    assert "diopside" in phases
    d = phases["diopside"]
    assert abs(d["Hf298_kJmol"] + 3201.5) < 0.2
    assert abs(d["S298_JmolK"] - 142.7) < 0.2
    assert d["status"] == "ok"
    assert d.get("formula") in (None, "CaMgSi2O6") or "Ca" in str(d.get("formula"))


def test_akermanite_prefers_valid_ocr_weight() -> None:
    ocr = _ocr_dir()
    phases = parse_298k_pages(ocr, [38])
    assert "akermanite" in phases
    a = phases["akermanite"]
    assert abs(a["formulaWeight"] - 272.628) < 0.1
    assert abs(a["Hf298_kJmol"] + 3864.8) < 0.2
    assert abs(a["S298_JmolK"] - 212.5) < 0.2


def test_corundum_formula_from_next_line(tmp_path: Path) -> None:
    """Formula sits on the line under the mineral header."""
    page = tmp_path / "page-0021.txt"
    page.write_text(
        "CORUNDUM 101.961 50.9 25.58 -1675.7 -1582.3 277.20 93 268 94\n"
        "Al2O3 0.1 0.01 1.3 1.3 0.23 94 85 57\n",
        encoding="utf-8",
    )
    phases = parse_298k_pages(tmp_path, [21])
    assert "corundum" in phases
    assert phases["corundum"]["formula"] == "Al2O3"
    assert abs(phases["corundum"]["Hf298_kJmol"] + 1675.7) < 0.1


def test_generic_mineral_without_alias(tmp_path: Path) -> None:
    page = tmp_path / "page-0021.txt"
    page.write_text(
        "BOEHMITE 59.988 37.2 19.54 -996.4 -918.4 160.90 176 176\n"
        "AlO(OH) 0.1 0.03 2.2 2.2 0.39 12\n",
        encoding="utf-8",
    )
    phases = parse_298k_pages(tmp_path, [21])
    assert "boehmite" in phases
    assert phases["boehmite"]["formula"] in ("AlO(OH)", "ALO(OH)", "AlOOH") or phases[
        "boehmite"
    ]["formula"].upper().startswith("AL")


def test_cp_inline_formula_same_line(tmp_path: Path) -> None:
    page = tmp_path / "page-0053.txt"
    page.write_text(
        "CORUNDUM Al2O3 50.9 0.1 1.612E+02 -1.352E-03 -1.815E+06 "
        "-1.059E+03 5.381E-07 298 2250 2345\n",
        encoding="utf-8",
    )
    cp = parse_cp_pages(tmp_path, [53])
    assert "corundum" in cp
    assert cp["corundum"][0].get("formula") == "Al2O3"
    assert abs(cp["corundum"][0]["A"]["A1"] - 161.2) < 0.1


def test_cp_two_line_and_single_a1(tmp_path: Path) -> None:
    page = tmp_path / "page-0053.txt"
    page.write_text(
        "GIBBSITE 68.4 9.170E+01 298\n"
        "Al(OH)3 0.1\n"
        "BOEHMITE 37.2 2.057E+02 -3.492E-02 1.027E+06 -2.635E+03 298\n"
        "AlO(OH) 0.1 600\n",
        encoding="utf-8",
    )
    cp = parse_cp_pages(tmp_path, [53])
    assert "gibbsite" in cp
    assert abs(cp["gibbsite"][0]["A"]["A1"] - 91.7) < 0.1
    assert cp["gibbsite"][0].get("formula") == "Al(OH)3"
    assert "boehmite" in cp
    assert abs(cp["boehmite"][0]["A"]["A1"] - 205.7) < 0.1
    assert cp["boehmite"][0].get("Tmax_K") == 600.0


def test_build_ignores_pdftotext(tmp_path: Path) -> None:
    (tmp_path / "page-0021.txt").write_text(
        "CORUNDUM 101.961 50.9 25.58 -1675.7 -1582.3 277.20 93 268 94\n"
        "Al2O3 0.1 0.01 1.3 1.3 0.23 94 85 57\n",
        encoding="utf-8",
    )
    (tmp_path / "page-0021.pdftotext.txt").write_text(
        "FAKEJUNK 999.0 1.0 1.0 -999.0 -999.0 1.0\nXxO 0.1\n",
        encoding="utf-8",
    )
    phases = parse_298k_pages(tmp_path, [21])
    assert "corundum" in phases
    assert "fakejunk" not in phases


def test_cp_ilmenite_from_ocr() -> None:
    ocr = _ocr_dir()
    if not (ocr / "page-0057.txt").is_file():
        return
    cp = parse_cp_pages(ocr, [57])
    assert "ilmenite" in cp
    row = cp["ilmenite"][0]
    assert row["A"]["A1"] is not None
    assert abs(row["A"]["A1"] - 262.7) < 1.0


def test_build_dataset_has_cp_and_298() -> None:
    ocr = _ocr_dir()
    data = build_robie_dataset(ocr)
    assert data["nPhases"] >= 5
    assert data.get("ref") == "RobieHemingway1995"
    assert any(
        p.get("Hf298_kJmol") is not None for p in data["phases"].values()
    )
    assert any(p.get("cpRanges") for p in data["phases"].values())
    a = data["phases"].get("akermanite")
    assert a is not None
    assert a.get("cpRanges")


def test_high_t_gehlenite_rows() -> None:
    from usgs_bulletin_2131.parse_high_t import parse_high_t_pages

    ocr = _ocr_dir()
    if not (ocr / "page-0320.txt").is_file():
        return
    ht = parse_high_t_pages(ocr, [320])
    assert "gehlenite" in ht
    rows = ht["gehlenite"]["rows"]
    assert len(rows) >= 10
    assert abs(rows[0]["T_K"] - 298.15) < 0.02
    assert abs(rows[0]["Hf_kJmol"] + 3985.0) < 0.2
    assert abs(rows[0]["Cp_JmolK"] - 206.40) < 0.2


def test_write_compound_file_includes_high_t(tmp_path: Path) -> None:
    from usgs_bulletin_2131.write_compound_files import (
        clear_robie_staging_dir,
        load_robie_phase_rows,
        write_compound_files,
    )

    phases = {
        "gehlenite": {
            "phaseId": "gehlenite",
            "name": "Gehlenite",
            "formula": "Ca2Al2SiO7",
            "status": "ok",
            "Hf298_kJmol": -3985.0,
            "S298_JmolK": 210.1,
            "pdfPage": 37,
            "cpRanges": [{"A": {"A1": 405.7}, "Tmin_K": 298, "Tmax_K": 1800, "pdfPage": 64}],
            "highT": {
                "rows": [{"T_K": 298.15, "Cp_JmolK": 206.4, "Hf_kJmol": -3985.0}],
                "pdfPages": [320],
            },
        }
    }
    staging = tmp_path / "robie-hemingway-1995"
    clear_robie_staging_dir(staging)
    summary = write_compound_files(phases, staging)
    assert summary["nFiles"] == 1
    assert not (staging / "compounds").exists()
    assert not (staging / "phases.json").exists()
    body = json.loads((staging / "gehlenite.json").read_text())
    assert body["table298"]["Hf298_kJmol"] == -3985.0
    assert body["highT"]["rows"][0]["Cp_JmolK"] == 206.4
    assert body["ocrPages"] == [37, 64, 320]
    loaded = load_robie_phase_rows(staging)
    assert abs(loaded["gehlenite"]["Hf298_kJmol"] + 3985.0) < 0.1
