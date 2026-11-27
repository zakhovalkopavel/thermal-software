"""Paths for minerals thermochemical sources and processed outputs."""

from __future__ import annotations

from pathlib import Path


def repo_root() -> Path:
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "shared").is_dir() and (
            (parent / "python").is_dir() or parent.name == "app"
        ):
            return parent
    return Path("/app")


def sources_dir(root: Path | None = None) -> Path:
    root = root or repo_root()
    return root / "shared" / "sources" / "minerals-thermodynamic"


def out_dir(root: Path | None = None) -> Path:
    root = root or repo_root()
    return root / "shared" / "processed" / "minerals-thermodynamic"


def report_dir(root: Path | None = None) -> Path:
    root = root or repo_root()
    if (root / "reports").is_dir() and not (root / "tmp").is_dir():
        return root / "reports" / "minerals-thermodynamic"
    return root / "tmp" / "reports" / "python" / "minerals-thermodynamic"
