"""Orchestrate extraction of compact thermochemical datasets.

Texts / OCR / raw dumps stay under ``tmp/reports/python/minerals-thermodynamic/``.
``shared/processed/minerals-thermodynamic/`` holds compact JSON datasets only.

Refs:
  [60] RobieHemingway1995
  [61] HollandPowell2011
  [62] Abdul2023
  [63] Mao2005
  [64] Pankratz1982
  [65] Jung2009AlTiO
  [66] Malan2019
  [67] Watanabe2000
  [68] Koroleva2017
  [70] Mao2006
  [71] Yazhenskikh2007
  [72] Yazhenskikh2008
  [73] Yazhenskikh2009
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

from thermodynamic_staging.abdul_ccr_parse import parse_abdul_ccr
from thermodynamic_staging.abdul_tdb import extract_abdul_tdb
from thermodynamic_staging.abdul_tdb_parse import parse_abdul_tdb_file
from thermodynamic_staging.hp633_parse import parse_hp633
from thermodynamic_staging.jung_parse import parse_jung_table1
from thermodynamic_staging.koroleva_parse import parse_koroleva_ocr
from thermodynamic_staging.malan_ocr_parse import parse_malan_ocr
from thermodynamic_staging.mao_2006_cas_parse import parse_mao_2006_cas
from thermodynamic_staging.nagai_parse import parse_nagai_thermoml
from thermodynamic_staging.pankratz_parse import parse_pankratz_ocr
from thermodynamic_staging.paper_tables import (
    extract_malan_fe2tio5,
    extract_watanabe_cuspidine,
)
from thermodynamic_staging.paths import out_dir, report_dir, repo_root, sources_dir
from thermodynamic_staging.yazhenskikh_ocr_parse import parse_yazhenskikh_ocr
from usgs_bulletin_2131.parse_tables import build_robie_dataset
from usgs_bulletin_2131.write_compound_files import (
    clear_robie_staging_dir,
    write_compound_files,
)


def _staging_ocr_dir(base: Path, job_id: str) -> Path:
    primary = base / "tmp" / "reports" / "python" / "minerals-thermodynamic" / job_id / "ocr"
    if primary.is_dir():
        return primary
    alt = base / "reports" / "minerals-thermodynamic" / job_id / "ocr"
    return alt if alt.is_dir() else primary


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def _clear_non_dataset_siblings(folder: Path) -> None:
    """Keep only phases.json under each source folder (contract)."""
    if not folder.is_dir():
        return
    for p in folder.iterdir():
        if p.is_file() and p.name != "phases.json":
            p.unlink()


def extract_all(root: Path | None = None) -> dict[str, Any]:
    """Write compact datasets to processed/; texts and raw dumps to tmp/reports/."""
    base = root or repo_root()
    src = sources_dir(root)
    out = out_dir(root)
    rep = report_dir(root)
    texts = rep / "texts"
    out.mkdir(parents=True, exist_ok=True)
    texts.mkdir(parents=True, exist_ok=True)

    coverage: dict[str, Any] = {
        "title": "Thermochemical staging — compact datasets only in shared/processed",
        "sourcesDir": str(src),
        "datasetDir": str(out),
        "textsDir": str(texts),
        "rule": "processed = compact JSON datasets; tmp = OCR/text/raw working files",
        "items": [],
    }

    # 1) Holland & Powell — compact phases.json only (source .dat stays in shared/sources)
    hp = src / "hp633ver.dat"
    if hp.is_file():
        hp_data = parse_hp633(hp)
        hp_dir = out / "holland-powell-ds633"
        _write_json(hp_dir / "phases.json", hp_data)
        _clear_non_dataset_siblings(hp_dir)
        coverage["items"].append(
            {
                "id": "holland-powell-ds633",
                "status": "dataset",
                "nPhases": hp_data["nPhases"],
                "path": "holland-powell-ds633/phases.json",
                "ref": "HollandPowell2011",
                "convention": "HSC",
            }
        )
    else:
        coverage["items"].append({"id": "holland-powell-ds633", "status": "missing_source"})

    # 2) Abdul Appendix B — TDB text in tmp; compact phases.json (G coeffs + liquid L) in processed
    abdul_pdf = src / "wahab_abdul_thesis.pdf"
    if abdul_pdf.is_file():
        tdb_text = extract_abdul_tdb(abdul_pdf)
        tdb_path = texts / "abdul-2023" / "appendix-b.tdb.txt"
        tdb_path.parent.mkdir(parents=True, exist_ok=True)
        tdb_path.write_text(tdb_text, encoding="utf-8")
        dataset = parse_abdul_tdb_file(tdb_path)
        dataset["textPath"] = str(tdb_path)
        ab_dir = out / "abdul-2023"
        _write_json(ab_dir / "phases.json", dataset)
        _clear_non_dataset_siblings(ab_dir)
        ok = sum(1 for p in dataset["phases"].values() if p.get("status") == "ok")
        coverage["items"].append(
            {
                "id": "abdul-2023",
                "status": "dataset",
                "path": "abdul-2023/phases.json",
                "textPath": str(tdb_path),
                "nPhases": dataset["nPhases"],
                "nPhasesWithG": ok,
                "nLiquidExcess": dataset["nLiquidExcess"],
                "ref": "Abdul2023",
                "convention": "SER",
            }
        )
    else:
        coverage["items"].append({"id": "abdul-2023", "status": "missing_source"})

    # 3) Koroleva — Modal Surya OCR (tables + regressions); pdftotext is analysis-only
    kor_ocr = _staging_ocr_dir(base, "koroleva-2017")
    if kor_ocr.is_dir() and any(kor_ocr.glob("page-*.txt")):
        dataset = parse_koroleva_ocr(kor_ocr)
        k_dir = out / "koroleva-2017"
        _write_json(k_dir / "phases.json", dataset)
        _clear_non_dataset_siblings(k_dir)
        coverage["items"].append(
            {
                "id": "koroleva-2017",
                "status": "dataset",
                "nPhases": dataset["nPhases"],
                "nRegressions": len(dataset.get("regressions") or {}),
                "path": "koroleva-2017/phases.json",
                "ref": "Koroleva2017",
                "ocr": True,
            }
        )
    else:
        coverage["items"].append(
            {
                "id": "koroleva-2017",
                "status": "missing_ocr",
                "hint": "make thermodynamic-staging-ocr-koroleva BACKEND=modal",
            }
        )

    # 4) Malan Fe2TiO5 (+ Table 3 from page-ocr when present)
    malan = src / "Phase equilibria and thermodynamic evaluation of the Fe-Ti-V-O system in air.pdf"
    malan_ocr = _staging_ocr_dir(base, "malan-2019")
    if malan.is_file() or (malan_ocr.is_dir() and any(malan_ocr.glob("page-*.txt"))):
        phases: dict[str, Any] = {}
        try:
            if malan.is_file():
                m = extract_malan_fe2tio5(malan)
                c = m["compound"]
                phases["Fe2TiO5"] = {**c, "phaseId": "pseudobrookite", "status": "ok"}
        except ValueError as exc:
            coverage["items"].append(
                {"id": "malan-2019", "status": "parse_error", "error": str(exc)}
            )
        if malan_ocr.is_dir() and any(malan_ocr.glob("page-*.txt")):
            ocr_data = parse_malan_ocr(malan_ocr)
            phases.update(ocr_data.get("phases") or {})
        if phases:
            dataset = {
                "source": "Malan2019",
                "convention": "formation_298",
                "nPhases": len(phases),
                "phases": phases,
                "ref": "Malan2019",
                "note": "Fe2TiO5 from PDF text + Table 3 solution params from page-ocr",
            }
            m_dir = out / "malan-2019"
            _write_json(m_dir / "phases.json", dataset)
            _clear_non_dataset_siblings(m_dir)
            coverage["items"].append(
                {
                    "id": "malan-2019",
                    "status": "dataset",
                    "nPhases": len(phases),
                    "path": "malan-2019/phases.json",
                    "ref": "Malan2019",
                }
            )

    # 5) Watanabe cuspidine
    wat = src / "Measurement of Heat Content of Cuspidine (3CaO・2Si02・CaF2).pdf"
    if wat.is_file():
        w = extract_watanabe_cuspidine(wat)
        c = w["compound"]
        ok = c.get("Hfus_kJmol") is not None
        dataset = {
            "source": "Watanabe2000",
            "convention": "formation_298",
            "nPhases": 1,
            "phases": {
                "cuspidine": {**c, "phaseId": "cuspidine", "status": "ok" if ok else "partial"},
            },
            "ref": "Watanabe2000",
        }
        w_dir = out / "watanabe-2000"
        _write_json(w_dir / "phases.json", dataset)
        _clear_non_dataset_siblings(w_dir)
        coverage["items"].append(
            {
                "id": "watanabe-2000",
                "status": "dataset" if ok else "partial",
                "nPhases": 1,
                "path": "watanabe-2000/phases.json",
                "ref": "Watanabe2000",
            }
        )

    # 6) Jung — Table 1 from Modal Surya OCR (fallback: none)
    jung_ocr = _staging_ocr_dir(base, "jung-2009")
    if jung_ocr.is_dir() and (jung_ocr / "page-0002.txt").is_file():
        dataset = parse_jung_table1(jung_ocr)
        j_dir = out / "jung-2009"
        _write_json(j_dir / "phases.json", dataset)
        _clear_non_dataset_siblings(j_dir)
        coverage["items"].append(
            {
                "id": "jung-2009",
                "status": "dataset",
                "nPhases": dataset["nPhases"],
                "path": "jung-2009/phases.json",
                "ref": "Jung2009AlTiO",
            }
        )
    else:
        coverage["items"].append(
            {
                "id": "jung-2009",
                "status": "ocr_pending",
                "note": "Run make thermodynamic-staging-ocr-jung BACKEND=modal",
                "ref": "Jung2009AlTiO",
            }
        )

    # 7) Nagai ThermoML — raw in tmp; calculable series in processed
    nagai = src / "j.jct.2009.06.002.json"
    if nagai.is_file():
        raw_dir = texts / "nagai-2009"
        raw_dir.mkdir(parents=True, exist_ok=True)
        raw_path = raw_dir / "j.jct.2009.06.002.json"
        shutil.copy2(nagai, raw_path)
        n = parse_nagai_thermoml(raw_path)
        n["textPath"] = str(raw_path)
        n_dir = out / "nagai-2009"
        _write_json(n_dir / "phases.json", n)
        _clear_non_dataset_siblings(n_dir)
        coverage["items"].append(
            {
                "id": "nagai-2009",
                "status": "dataset",
                "path": "nagai-2009/phases.json",
                "nPhases": n.get("nPhases"),
                "nPoints": n.get("nPoints"),
                "textPath": str(raw_path),
                "ref": "Nagai2009",
            }
        )

    # 8) Robie & Hemingway — per-phase JSON at staging root (no compact phases.json)
    ocr_dir = base / "tmp" / "reports" / "python" / "usgs-bulletin-2131" / "ocr"
    if not ocr_dir.is_dir():
        cand = base / "reports" / "usgs-bulletin-2131" / "ocr"
        if cand.is_dir():
            ocr_dir = cand
    if ocr_dir.is_dir() and any(ocr_dir.glob("page-*.txt")):
        rh = build_robie_dataset(ocr_dir)
        rh_dir = out / "robie-hemingway-1995"
        clear_robie_staging_dir(rh_dir)
        written = write_compound_files(rh["phases"], rh_dir)
        coverage["items"].append(
            {
                "id": "robie-hemingway-1995",
                "status": "dataset",
                "path": "robie-hemingway-1995/",
                "nPhases": rh["nPhases"],
                "nFiles": written["nFiles"],
                "ref": "RobieHemingway1995",
                "convention": "formation_298",
                "layout": "per-phase JSON at staging root",
            }
        )
    else:
        coverage["items"].append(
            {
                "id": "robie-hemingway-1995",
                "status": "ocr_pending",
                "note": "Run make usgs2131-ocr then re-extract / make usgs2131-build",
                "ref": "RobieHemingway1995",
            }
        )
    # 9) Mao 2005 thesis — no calculable coeffs in processed; drop legacy folder.
    mao_2005_dir = out / "mao-2005"
    if mao_2005_dir.exists():
        shutil.rmtree(mao_2005_dir)
    coverage["items"].append(
        {
            "id": "mao-2005",
            "status": "skipped_no_data",
            "ref": "Mao2005",
            "note": (
                "Kappa thesis / front matter only — not staged under processed. "
                "Use mao-2006/ (and future Papers I–V PDFs) for coefficients."
            ),
        }
    )

    # 9b) Mao 2006 CAS paper (Tables I + III liquid ionic model) → processed/mao-2006/
    mao_cas = src / "mao-papers" / "Mao_2606.pdf"
    mao_cas_ocr = _staging_ocr_dir(base, "mao-2006-cas")
    legacy_cas_dir = out / "mao-2006-cas"
    if legacy_cas_dir.exists():
        shutil.rmtree(legacy_cas_dir)
    if mao_cas.is_file() or (mao_cas_ocr.is_dir() and any(mao_cas_ocr.glob("page-*.txt"))):
        cas = parse_mao_2006_cas(
            mao_cas if mao_cas.is_file() else None,
            ocr_dir=mao_cas_ocr if mao_cas_ocr.is_dir() else None,
        )
        cas_dir = out / "mao-2006"
        _write_json(cas_dir / "phases.json", cas)
        _clear_non_dataset_siblings(cas_dir)
        coverage["items"].append(
            {
                "id": "mao-2006",
                "status": cas.get("status") or "partial",
                "nPhases": cas["nPhases"],
                "path": "mao-2006/phases.json",
                "ref": "Mao2006",
                "note": cas.get("note"),
            }
        )
    else:
        coverage["items"].append(
            {"id": "mao-2006", "status": "missing_source", "ref": "Mao2006"}
        )

    # 10) Pankratz 672 — selected oxide pages from Modal Surya OCR
    pank_ocr = _staging_ocr_dir(base, "pankratz-1982")
    if pank_ocr.is_dir() and any(pank_ocr.glob("page-*.txt")):
        dataset = parse_pankratz_ocr(pank_ocr)
        p_dir = out / "pankratz-1982"
        _write_json(p_dir / "phases.json", dataset)
        _clear_non_dataset_siblings(p_dir)
        ok = sum(1 for p in dataset["phases"].values() if p.get("status") == "ok")
        coverage["items"].append(
            {
                "id": "pankratz-1982",
                "status": "dataset" if ok else "partial",
                "nPhases": dataset["nPhases"],
                "nOk": ok,
                "path": "pankratz-1982/phases.json",
                "ref": "Pankratz1982",
            }
        )
    else:
        coverage["items"].append(
            {
                "id": "pankratz-1982",
                "status": "ocr_pending",
                "note": "Run make thermodynamic-staging-ocr-pankratz BACKEND=modal",
                "ref": "Pankratz1982",
            }
        )

    # 11) Yazhenskikh workshop OCR inventories (species / systems; no numeric L)
    for year, job_id, ref in (
        (2007, "yazhenskikh-2007", "Yazhenskikh2007"),
        (2008, "yazhenskikh-2008", "Yazhenskikh2008"),
        (2009, "yazhenskikh-2009", "Yazhenskikh2009"),
    ):
        y_ocr = _staging_ocr_dir(base, job_id)
        if y_ocr.is_dir() and any(y_ocr.glob("page-*.txt")):
            ydata = parse_yazhenskikh_ocr(y_ocr, year=year)
            y_dir = out / job_id
            _write_json(y_dir / "phases.json", ydata)
            _clear_non_dataset_siblings(y_dir)
            coverage["items"].append(
                {
                    "id": job_id,
                    "status": "partial",
                    "nPhases": ydata["nPhases"],
                    "path": f"{job_id}/phases.json",
                    "ref": ref,
                    "note": ydata.get("note"),
                }
            )
        else:
            coverage["items"].append(
                {
                    "id": job_id,
                    "status": "ocr_pending",
                    "ref": ref,
                    "note": f"Run make thermodynamic-staging-ocr-job JOB={job_id} BACKEND=modal",
                }
            )

    # 12) Abdul CCR journal companion — tmp cross-check only (thesis TDB is the
    # processed source under abdul-2023/). Do not write abdul-2023-ccr/ to processed.
    abdul_ccr_pdf = src / "1-s2.0-S0008884623002235-main.pdf"
    abdul_ccr_ocr = _staging_ocr_dir(base, "abdul-2023-ccr")
    ccr_processed = out / "abdul-2023-ccr"
    if ccr_processed.exists():
        shutil.rmtree(ccr_processed)
    if (abdul_ccr_ocr.is_dir() and any(abdul_ccr_ocr.glob("page-*.txt"))) or abdul_ccr_pdf.is_file():
        ccr = parse_abdul_ccr(
            ocr_dir=abdul_ccr_ocr if abdul_ccr_ocr.is_dir() else None,
            pdf=abdul_ccr_pdf if abdul_ccr_pdf.is_file() else None,
        )
        ccr_tmp = rep / "abdul-2023-ccr"
        ccr_tmp.mkdir(parents=True, exist_ok=True)
        _write_json(ccr_tmp / "phases.cross-check.json", ccr)
        coverage["items"].append(
            {
                "id": "abdul-2023-ccr",
                "status": "tmp_cross_check",
                "nPhases": ccr["nPhases"],
                "path": str(ccr_tmp / "phases.cross-check.json"),
                "ref": "Abdul2023",
                "note": (
                    "CCR OCR cross-check only; processed Abdul source is abdul-2023/ "
                    f"(thesis TDB). {ccr.get('note') or ''}"
                ).strip(),
            }
        )
    else:
        coverage["items"].append(
            {
                "id": "abdul-2023-ccr",
                "status": "tmp_cross_check_pending",
                "ref": "Abdul2023",
                "note": "OCR stays in tmp; run make thermodynamic-staging-ocr-abdul-ccr BACKEND=modal",
            }
        )

    # Processed root holds only index.json (+ per-source subfolders).
    for stray in out.iterdir():
        if stray.is_file() and stray.name != "index.json":
            stray.unlink()
    _write_json(out / "index.json", coverage)
    _write_json(rep / "coverage.json", coverage)
    return coverage
