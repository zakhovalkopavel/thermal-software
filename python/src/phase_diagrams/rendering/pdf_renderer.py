"""
phase_diagrams.rendering.pdf_renderer — Render one PDF page to a grey image with pdftoppm, cached.
"""
from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image


def render_page(
    pdf_path: Path | str,
    page: int,
    dpi: int = 400,
    cache_dir: Path | str | None = None,
    cache_stem: str = "page",
) -> np.ndarray:
    """Grey page image (uint8, rows × columns) of ``page`` (1-based) at ``dpi``.

    With ``cache_dir`` the PNG is kept as ``<cache_stem>-p<page>-<dpi>dpi.png``
    and reused on the next call.
    """
    cache_file = None
    if cache_dir is not None:
        cache_file = Path(cache_dir) / f"{cache_stem}-p{page}-{dpi}dpi.png"
        if cache_file.exists():
            return np.array(Image.open(cache_file).convert("L"))
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    with tempfile.TemporaryDirectory() as tmp:
        prefix = Path(tmp) / "page"
        subprocess.run(
            ["pdftoppm", "-f", str(page), "-l", str(page), "-r", str(dpi), "-gray", "-png", str(pdf_path), str(prefix)],
            check=True,
            capture_output=True,
        )
        produced = sorted(Path(tmp).glob("page*.png"))
        if not produced:
            raise RuntimeError(f"pdftoppm produced no image for page {page} of {pdf_path}")
        image = Image.open(produced[0]).convert("L")
        if cache_file is not None:
            cache_file.parent.mkdir(parents=True, exist_ok=True)
            image.save(cache_file)
        return np.array(image)
