"""Default PDF and report paths for USGS Bulletin 2131 OCR.

Refs:
  [60] RobieHemingway1995
"""

from __future__ import annotations

from pathlib import Path

USGS_2131_PDF_NAME = (
    "USGS Bulletin 2131 Thermodynamic properties of minerals "
    "(Robie Hemingway 1995).pdf"
)
USGS_2131_REPORT_REL = Path("reports") / "usgs-bulletin-2131"


def default_pdf_path(repo_root: Path) -> Path:
    """Bulletin PDF under ``shared/sources/compound-data/``."""
    return (
        repo_root
        / "shared"
        / "sources"
        / "compound-data"
        / USGS_2131_PDF_NAME
    )


def default_report_dir(repo_root: Path) -> Path:
    """OCR dumps and selections under the python reports mount."""
    if (repo_root / "reports").is_dir() and not (repo_root / "tmp").is_dir():
        # Inside the python container: /app/reports → tmp/reports/python
        return repo_root / USGS_2131_REPORT_REL
    return repo_root / "tmp" / "reports" / "python" / "usgs-bulletin-2131"
