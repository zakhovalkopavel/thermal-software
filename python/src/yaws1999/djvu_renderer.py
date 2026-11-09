"""
yaws1999.djvu_renderer — Render one DjVu page to a grey image with ``ddjvu``, cached.

Same role as ``phase_diagrams.rendering.pdf_renderer.render_page`` for PDFs.
``-scale=N`` is N dpi relative to 100 dpi (DjVuLibre), so ``dpi=400`` → ``-scale=400``.
"""
from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

_DEFAULT_DPI = 400


def render_page(
    djvu_path: Path | str,
    page: int,
    dpi: int = _DEFAULT_DPI,
    cache_dir: Path | str | None = None,
    cache_stem: str = "yaws",
) -> np.ndarray:
    """Grey page image (uint8) of ``page`` (1-based) at ``dpi``.

    With ``cache_dir`` the PNG is kept as ``<cache_stem>-p<page>-<dpi>dpi.png``.
    """
    if page < 1:
        raise ValueError(f"page must be >= 1, got {page}")
    cache_file = None
    if cache_dir is not None:
        cache_file = Path(cache_dir) / f"{cache_stem}-p{page}-{dpi}dpi.png"
        if cache_file.exists():
            return np.array(Image.open(cache_file).convert("L"))

    path = Path(djvu_path)
    if not path.is_file():
        raise FileNotFoundError(path)

    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "page.pgm"
        subprocess.run(
            [
                "ddjvu",
                "-format=pgm",
                f"-page={page}",
                f"-scale={dpi}",
                str(path),
                str(out),
            ],
            check=True,
            capture_output=True,
        )
        if not out.is_file():
            raise RuntimeError(f"ddjvu produced no image for page {page} of {path}")
        image = Image.open(out).convert("L")
        if cache_file is not None:
            cache_file.parent.mkdir(parents=True, exist_ok=True)
            image.save(cache_file)
        return np.array(image)
