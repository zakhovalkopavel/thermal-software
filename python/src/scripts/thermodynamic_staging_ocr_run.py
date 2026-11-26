#!/usr/bin/env python3
"""Run catalogued thermochemical staging OCR jobs (Modal/local page-ocr).

Refs:
  [63] Mao2005
  [65] Jung2009AlTiO
  [66] Malan2019

After USGS 2131 OCR finishes::

  make thermodynamic-staging-ocr-melt BACKEND=modal

Individual jobs::

  make thermodynamic-staging-ocr-job JOB=yazhenskikh-2007 BACKEND=modal
  make thermodynamic-staging-ocr-job JOB=jung-2009 BACKEND=modal
  make thermodynamic-staging-ocr-mao-papers BACKEND=modal

Existing ``page-NNNN.txt`` dumps are skipped unless ``FORCE=1``.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from thermodynamic_staging.ocr_jobs import (
    MAO_PAPERS_DIR_REL,
    MELT_OCR_JOB_IDS,
    OCR_JOBS,
    OcrJob,
    mao_paper_pdfs,
)
from thermodynamic_staging.paths import report_dir, repo_root


def _pdf_page_count(pdf: Path) -> int:
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(pdf)
        try:
            return int(len(doc))
        finally:
            doc.close()
    except Exception:
        pass
    result = subprocess.run(
        ["pdfinfo", str(pdf)],
        check=True,
        capture_output=True,
        text=True,
    )
    for line in result.stdout.splitlines():
        if line.startswith("Pages:"):
            return int(line.split(":", 1)[1].strip())
    raise RuntimeError(f"could not read page count for {pdf}")


def _run_staging_ocr(
    *,
    pdf: Path,
    job_report: Path,
    source_id: str,
    ref: str,
    pages: tuple[int, ...],
    dpi: int | None,
    force: bool,
    quant: str | None,
) -> int:
    ocr_script = Path(__file__).resolve().parent / "thermodynamic_staging_ocr.py"
    cmd: list[str] = [
        sys.executable,
        str(ocr_script),
        "--pdf",
        str(pdf),
        "--report-dir",
        str(job_report),
        "--source-id",
        source_id,
        "--ref",
        ref,
    ]
    for page in pages:
        cmd.extend(["--page", str(page)])
    if dpi is not None:
        cmd.extend(["--dpi", str(dpi)])
    if force:
        cmd.append("--force")
    if quant:
        cmd.extend(["--quant", quant])
    return int(subprocess.call(cmd))


def _run_job(
    job: OcrJob,
    *,
    root: Path,
    dpi: int | None,
    force: bool,
    quant: str | None,
    page_override: list[int],
) -> int:
    pdf = root / job.pdf_rel
    if not pdf.is_file():
        print(f"PDF missing for job {job.job_id}: {pdf}", file=sys.stderr)
        return 1
    job_report = report_dir(root) / job.job_id
    pages = tuple(sorted(set(page_override))) if page_override else job.pages
    print(
        f"=== OCR job {job.job_id} ref={job.ref} pages={len(pages)} → {job_report}",
        flush=True,
    )
    if job.note:
        print(f"    {job.note}", flush=True)
    return _run_staging_ocr(
        pdf=pdf,
        job_report=job_report,
        source_id=job.job_id,
        ref=job.ref,
        pages=pages,
        dpi=dpi,
        force=force,
        quant=quant,
    )


def _run_mao_papers(
    *,
    root: Path,
    dpi: int | None,
    force: bool,
    quant: str | None,
) -> int:
    pdfs = mao_paper_pdfs(root)
    folder = root / MAO_PAPERS_DIR_REL
    if not pdfs:
        print(
            f"No PDFs in {folder}/\n"
            "Drop Mao Papers I–V journal PDFs there, then re-run "
            "`make thermodynamic-staging-ocr-mao-papers BACKEND=modal`.",
            file=sys.stderr,
        )
        return 1
    rc = 0
    for pdf in pdfs:
        n_pages = _pdf_page_count(pdf)
        source_id = f"mao-papers/{pdf.stem}"
        job_report = report_dir(root) / "mao-papers" / pdf.stem
        print(
            f"=== OCR Mao paper {pdf.name} ({n_pages} pages) → {job_report}",
            flush=True,
        )
        code = _run_staging_ocr(
            pdf=pdf,
            job_report=job_report,
            source_id=source_id,
            ref="Mao2005",
            pages=tuple(range(1, n_pages + 1)),
            dpi=dpi,
            force=force,
            quant=quant,
        )
        if code != 0:
            rc = code
    return rc


def _list_jobs(root: Path) -> int:
    print("Catalogued OCR jobs:")
    for job_id, job in OCR_JOBS.items():
        pdf = root / job.pdf_rel
        mark = "ok" if pdf.is_file() else "MISSING PDF"
        print(
            f"  {job_id:22} pages={len(job.pages):3} ref={job.ref:16} [{mark}]  {job.note}"
        )
    print(f"\nMelt batch ids: {', '.join(MELT_OCR_JOB_IDS)}")
    mao = mao_paper_pdfs(root)
    print(f"Mao Papers I–V dir: {MAO_PAPERS_DIR_REL}/ ({len(mao)} pdf(s))")
    for pdf in mao:
        print(f"  - {pdf.name}")
    return 0


def main(argv: list[str] | None = None) -> int:
    root = repo_root()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--list",
        action="store_true",
        help="List catalogued jobs and exit",
    )
    parser.add_argument(
        "--job",
        action="append",
        default=[],
        help="Job id from ocr_jobs.OCR_JOBS (repeatable)",
    )
    parser.add_argument(
        "--batch",
        choices=("melt",),
        default=None,
        help="Run a predefined batch (melt = Yazhenskikh×3 + Jung + Malan)",
    )
    parser.add_argument(
        "--mao-papers",
        action="store_true",
        help=f"OCR every PDF under {MAO_PAPERS_DIR_REL}/",
    )
    parser.add_argument(
        "--page",
        type=int,
        action="append",
        default=[],
        help="Limit pages for --job runs (repeatable)",
    )
    parser.add_argument("--dpi", type=int, default=None)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--quant", default=None)
    args = parser.parse_args(argv)

    if args.list:
        return _list_jobs(root)

    job_ids: list[str] = list(args.job)
    if args.batch == "melt":
        job_ids.extend(MELT_OCR_JOB_IDS)

    if not job_ids and not args.mao_papers:
        parser.error("pass --list, --job, --batch melt, and/or --mao-papers")

    rc = 0
    seen: set[str] = set()
    for job_id in job_ids:
        if job_id in seen:
            continue
        seen.add(job_id)
        job = OCR_JOBS.get(job_id)
        if job is None:
            print(f"unknown job id: {job_id}", file=sys.stderr)
            print(f"known: {', '.join(OCR_JOBS)}", file=sys.stderr)
            return 1
        code = _run_job(
            job,
            root=root,
            dpi=args.dpi,
            force=args.force,
            quant=args.quant,
            page_override=args.page,
        )
        if code != 0:
            rc = code

    if args.mao_papers:
        code = _run_mao_papers(
            root=root,
            dpi=args.dpi,
            force=args.force,
            quant=args.quant,
        )
        if code != 0:
            rc = code

    return rc


if __name__ == "__main__":
    sys.exit(main())
