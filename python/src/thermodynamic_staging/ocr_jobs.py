"""OCR job catalog for thermochemical papers that need Modal/Surya table dumps.

Refs:
  [62] Abdul2023
  [63] Mao2005
  [65] Jung2009AlTiO
  [66] Malan2019
  [70] Mao2006
  [71] Yazhenskikh2007
  [72] Yazhenskikh2008
  [73] Yazhenskikh2009

Each job maps a source PDF under ``shared/sources/minerals-thermodynamic/`` to a report
dir under ``tmp/reports/python/minerals-thermodynamic/<id>/``. Existing
``page-NNNN.txt`` dumps are skipped by ``thermodynamic_staging_ocr.py`` unless
``FORCE=1``.

Mao journal papers live under ``shared/sources/minerals-thermodynamic/mao-papers/``
(``Mao_2606.pdf`` = 2006 CAS assessment with Tables I/III). Remaining Papers
I–V can be dropped there and OCR'd via ``--mao-papers``.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class OcrJob:
    """One PDF → OCR report directory."""

    job_id: str
    ref: str
    pdf_rel: str
    report_rel: str
    pages: tuple[int, ...]
    note: str = ""


# Short slide decks / papers: OCR all pages (tables scattered).
_YAZH_07 = OcrJob(
    job_id="yazhenskikh-2007",
    ref="Yazhenskikh2007",
    pdf_rel="shared/sources/minerals-thermodynamic/EYazhenskikh07.pdf",
    report_rel="minerals-thermodynamic/yazhenskikh-2007",
    pages=tuple(range(1, 28)),
    note="GTT workshop slides — alkali oxide–Al2O3–SiO2 assessments",
)
_YAZH_08 = OcrJob(
    job_id="yazhenskikh-2008",
    ref="Yazhenskikh2008",
    pdf_rel="shared/sources/minerals-thermodynamic/Yazhenskikh_2008.pdf",
    report_rel="minerals-thermodynamic/yazhenskikh-2008",
    pages=tuple(range(1, 20)),
    note="GTT workshop — alkali-containing oxide systems",
)
_YAZH_09 = OcrJob(
    job_id="yazhenskikh-2009",
    ref="Yazhenskikh2009",
    pdf_rel="shared/sources/minerals-thermodynamic/Yazhenskikh_2009.pdf",
    report_rel="minerals-thermodynamic/yazhenskikh-2009",
    pages=tuple(range(1, 21)),
    note="GTT workshop — K2O/Na2O–Al2O3–SiO2 optimisation",
)
_JUNG = OcrJob(
    job_id="jung-2009",
    ref="Jung2009AlTiO",
    pdf_rel=(
        "shared/sources/minerals-thermodynamic/"
        "Thermodynamic Modeling of the Al2O3–Ti2O3–TiO2 System.pdf"
    ),
    report_rel="minerals-thermodynamic/jung-2009",
    pages=tuple(range(1, 9)),
    note="Full paper re-OCR (Table 1 MQM + solid params); skips existing dumps",
)
_MALAN = OcrJob(
    job_id="malan-2019",
    ref="Malan2019",
    pdf_rel=(
        "shared/sources/minerals-thermodynamic/"
        "Phase equilibria and thermodynamic evaluation of the "
        "Fe-Ti-V-O system in air.pdf"
    ),
    report_rel="minerals-thermodynamic/malan-2019",
    pages=tuple(range(1, 23)),
    note="Fe–Ti–V–O assessment — liquid / solid model tables",
)
_MAO_2006 = OcrJob(
    job_id="mao-2006-cas",
    ref="Mao2006",
    pdf_rel="shared/sources/minerals-thermodynamic/mao-papers/Mao_2606.pdf",
    report_rel="minerals-thermodynamic/mao-2006-cas",
    pages=tuple(range(1, 14)),
    note="JACS 2006 CAS — Table I solids + Table III ionic liquid G/L coeffs",
)
_ABDUL_CCR = OcrJob(
    job_id="abdul-2023-ccr",
    ref="Abdul2023",
    pdf_rel="shared/sources/minerals-thermodynamic/1-s2.0-S0008884623002235-main.pdf",
    report_rel="minerals-thermodynamic/abdul-2023-ccr",
    pages=tuple(range(1, 17)),
    note="CCR paper CaO–SiO2 3rd-gen CALPHAD — tables vs thesis Appendix B TDB",
)
_KOROLEVA = OcrJob(
    job_id="koroleva-2017",
    ref="Koroleva2017",
    pdf_rel="shared/sources/minerals-thermodynamic/avdinvv,+05_Koroleva.pdf",
    report_rel="minerals-thermodynamic/koroleva-2017",
    pages=tuple(range(1, 11)),
    note="Silicate/borate Table 1–2 + regression eqs (6)(7)(10)(11) — Modal Surya",
)

OCR_JOBS: dict[str, OcrJob] = {
    j.job_id: j
    for j in (
        _YAZH_07,
        _YAZH_08,
        _YAZH_09,
        _JUNG,
        _MALAN,
        _MAO_2006,
        _ABDUL_CCR,
        _KOROLEVA,
    )
}

# Batch for melt-model papers (run after USGS 2131 OCR finishes).
MELT_OCR_JOB_IDS: tuple[str, ...] = (
    "yazhenskikh-2007",
    "yazhenskikh-2008",
    "yazhenskikh-2009",
    "jung-2009",
    "malan-2019",
    "mao-2006-cas",
    "abdul-2023-ccr",
)

MAO_PAPERS_DIR_REL = "shared/sources/minerals-thermodynamic/mao-papers"


def mao_paper_pdfs(repo_root: Path) -> list[Path]:
    """Journal PDFs for Mao Papers I–V (user-supplied), if any."""
    folder = repo_root / MAO_PAPERS_DIR_REL
    if not folder.is_dir():
        return []
    return sorted(p for p in folder.glob("*.pdf") if p.is_file())
