"""
phase_diagrams.figures.rotated_label_reader — Tesseract reading of a number printed along a line (any angle).

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Isotherm detection
"""
from __future__ import annotations

import numpy as np
from PIL import Image

_PAD_PX = 8
_ZOOM = 3
_UPRIGHT_DEG = 10.0


def read_rotated_number(glyphs: np.ndarray, angle_deg: float, whitelist: str = "0123456789") -> tuple[str, float]:
    """Text and mean confidence (0–100) of the digits in ``glyphs`` (a boolean crop holding only the
    label's ink), read upright, along ``angle_deg`` (direction of the line in page pixels, y down)
    and along it upside down; the reading with the highest confidence is returned."""
    import pytesseract

    image = Image.fromarray(np.where(np.pad(glyphs, _PAD_PX), 0, 255).astype(np.uint8))
    image = image.resize((image.width * _ZOOM, image.height * _ZOOM), Image.LANCZOS)
    best = ("", 0.0)
    angles = [0.0] + [a for a in (angle_deg, angle_deg + 180.0) if abs((a + 180.0) % 360.0 - 180.0) > _UPRIGHT_DEG]
    for angle in angles:
        turned = image.rotate(angle, resample=Image.BICUBIC, expand=True, fillcolor=255)
        data = pytesseract.image_to_data(turned, config=f"--psm 7 -c tessedit_char_whitelist={whitelist}",
                                         output_type=pytesseract.Output.DICT)
        words = [(w.strip(), float(c)) for w, c in zip(data["text"], data["conf"]) if w.strip() and float(c) >= 0]
        if words:
            reading = ("".join(w for w, _ in words), sum(c for _, c in words) / len(words))
            if reading[1] > best[1]:
                best = reading
    return best
