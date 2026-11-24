"""phase_diagrams.figures.caption_display — atlas caption display via source-extract."""
from __future__ import annotations

from source_extract.diagrams.figures.caption_display import display_caption as _display_caption

from phase_diagrams.constants.oxide_formulas import OXIDE_FORMULAS

__all__ = ["display_caption"]


def display_caption(
    caption: str,
    components: list[str],
    *,
    extra_formulas: list[str] | tuple[str, ...] | None = None,
) -> str:
    """Display-only caption cleanup; defaults ``extra_formulas`` to atlas oxides."""
    return _display_caption(
        caption,
        components,
        extra_formulas=OXIDE_FORMULAS if extra_formulas is None else extra_formulas,
    )
