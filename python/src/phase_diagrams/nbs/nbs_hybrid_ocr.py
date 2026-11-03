"""
phase_diagrams.nbs.nbs_hybrid_ocr — Fast NBS Table I OCR (Surya detect + Indra recognize).

**Hybrid mode** keeps Surya only for line detection (batched ``DetectionPredictor`` /
``batch_detection``), crops each line strip with PIL, then runs
``datalab-to/indra-ocr`` (``OrtOCR.recognize``) for CTC recognition. Reading order
is geometric (top→bottom, left→right), refined with Indra's order model when present.

Full-page ``surya-ocr-2.5`` remains available as ``engine="surya"``.

Spec: docs/scripts/phase-diagrams/NBS.md § Text index
"""
from __future__ import annotations

import os
from collections.abc import Callable, Sequence
from pathlib import Path

import numpy as np
from PIL import Image

from phase_diagrams.rendering.pdf_renderer import render_page

_DPI = 400
_LINE_PAD_PX = 2
_DEFAULT_REC_BATCH = 64


def dump_nbs_table_ocr(
    pdf_path: Path | str,
    first_page: int,
    last_page: int,
    cache_dir: Path | str | None = None,
    dpi: int = _DPI,
    progress: Callable[[int, int], None] | None = None,
) -> str:
    """OCR Table I pages with hybrid engine; pages separated by ``\\f``."""
    detector, recognizer = _hybrid_engines()
    pages: list[str] = []
    for page in range(first_page, last_page + 1):
        if progress:
            progress(page, last_page)
        image = render_page(pdf_path, page, dpi=dpi, cache_dir=cache_dir, cache_stem="nbs-table")
        if page == first_page and first_page > 1:
            pages.extend([""] * (first_page - 1))
        pages.append(ocr_page_text(image, detector=detector, recognizer=recognizer))
    return "\f".join(pages) + "\f"


def ocr_pdf_page(
    pdf_path: Path | str,
    page: int,
    cache_dir: Path | str | None = None,
    dpi: int = _DPI,
    detector: object | None = None,
    recognizer: object | None = None,
) -> str:
    """OCR one PDF page (1-based) to NBS dump text via hybrid mode."""
    if detector is None or recognizer is None:
        detector, recognizer = _hybrid_engines()
    image = render_page(pdf_path, page, dpi=dpi, cache_dir=cache_dir, cache_stem="nbs-table")
    return ocr_page_text(image, detector=detector, recognizer=recognizer)


def ocr_page_text(
    image: np.ndarray,
    detector: object | None = None,
    recognizer: object | None = None,
    rec_batch: int = _DEFAULT_REC_BATCH,
) -> str:
    """Detect lines (Surya) → crop (PIL) → recognize (Indra); keep reading order."""
    picture = _as_rgb(image)
    if detector is None or recognizer is None:
        detector, recognizer = _hybrid_engines()

    boxes = detect_line_boxes([picture], detector=detector)[0]
    if not boxes:
        return ""

    boxes = sort_boxes_reading_order(boxes)
    # PIL strips drop degenerate clamps; keep boxes aligned with surviving crops.
    kept_boxes: list[tuple[float, float, float, float]] = []
    for box in boxes:
        strips = crop_line_strips(picture, [box], pad=_LINE_PAD_PX)
        if not strips or strips[0].size[0] < 2 or strips[0].size[1] < 2:
            continue
        kept_boxes.append(box)
    if not kept_boxes:
        return ""

    gray = np.asarray(picture.convert("L"), dtype=np.uint8)
    box_arr = boxes_to_ndarray(kept_boxes)
    # Indra batches CTC on the page using these boxes (re-crops at model height).
    lines = recognize_line_batch(recognizer, gray, box_arr, batch=rec_batch)
    order = refine_reading_order(recognizer, box_arr, lines, picture.size)
    return "\n".join(lines[i] for i in order if lines[i].strip())


def detect_line_boxes(
    images: Sequence[Image.Image],
    detector: object | None = None,
    batch_size: int | None = None,
) -> list[list[tuple[float, float, float, float]]]:
    """Surya text-line boxes per image as ``(x0, y0, x1, y1)`` in pixel coords."""
    det = detector or _detection_predictor()
    rgb = [im.convert("RGB") if im.mode != "RGB" else im for im in images]
    # DetectionPredictor batches internally (``batch_detection`` on the local model).
    kwargs = {}
    if batch_size is not None:
        kwargs["batch_size"] = batch_size
    results = det(rgb, **kwargs)
    out: list[list[tuple[float, float, float, float]]] = []
    for result in results:
        page_boxes: list[tuple[float, float, float, float]] = []
        for box in result.bboxes:
            x0, y0, x1, y1 = box.bbox
            if x1 - x0 < 2 or y1 - y0 < 2:
                continue
            page_boxes.append((float(x0), float(y0), float(x1), float(y1)))
        out.append(page_boxes)
    return out


def crop_line_strips(
    picture: Image.Image,
    boxes: Sequence[tuple[float, float, float, float]],
    pad: int = _LINE_PAD_PX,
) -> list[Image.Image]:
    """PIL crops for each line box (clamped to the image)."""
    w, h = picture.size
    crops: list[Image.Image] = []
    for x0, y0, x1, y1 in boxes:
        left = max(0, int(x0) - pad)
        top = max(0, int(y0) - pad)
        right = min(w, int(np.ceil(x1)) + pad)
        bottom = min(h, int(np.ceil(y1)) + pad)
        if right <= left or bottom <= top:
            continue
        crops.append(picture.crop((left, top, right, bottom)))
    return crops


def sort_boxes_reading_order(
    boxes: Sequence[tuple[float, float, float, float]],
) -> list[tuple[float, float, float, float]]:
    """Top-to-bottom, then left-to-right (table rows)."""
    if not boxes:
        return []
    heights = [max(1.0, y1 - y0) for _, y0, _, y1 in boxes]
    band = float(np.median(heights)) * 0.6

    def key(b: tuple[float, float, float, float]) -> tuple[int, float]:
        x0, y0, x1, y1 = b
        cy = (y0 + y1) / 2.0
        return (int(cy // max(band, 1.0)), x0)

    return sorted(boxes, key=key)


def boxes_to_ndarray(boxes: Sequence[tuple[float, float, float, float]]) -> np.ndarray:
    """Indra expects ``(N, 4+)`` float boxes."""
    if not boxes:
        return np.zeros((0, 4), dtype=np.float32)
    return np.asarray(boxes, dtype=np.float32)


def recognize_line_batch(
    recognizer: object,
    gray: np.ndarray,
    boxes: np.ndarray,
    batch: int = _DEFAULT_REC_BATCH,
) -> list[str]:
    """Indra CTC recognition for a page of line boxes (batched)."""
    if boxes.size == 0:
        return []
    raw = recognizer.recognize(gray, boxes, batch=batch)
    return [text for text, _conf, _toks in raw]


def refine_reading_order(
    recognizer: object,
    boxes: np.ndarray,
    texts: Sequence[str],
    size: tuple[int, int],
) -> list[int]:
    """Prefer Indra's order model; fall back to current geometric order."""
    n = len(texts)
    if n == 0:
        return []
    if n == 1 or not hasattr(recognizer, "reading_order"):
        return list(range(n))
    try:
        order, _layout, _logits = recognizer.reading_order(boxes, list(texts), size)
    except Exception:
        return list(range(n))
    if not order or len(order) != n:
        return list(range(n))
    return [int(i) for i in order]


def select_torch_device() -> str:
    """cuda → mps → cpu from what PyTorch sees (overridable via ``TORCH_DEVICE``)."""
    if os.environ.get("TORCH_DEVICE"):
        return os.environ["TORCH_DEVICE"]
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"
        if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            return "mps"
    except ImportError:
        pass
    return "cpu"


def select_onnx_providers() -> list[str]:
    """CUDA EP when present, else CPU (Indra / ONNX Runtime)."""
    try:
        import onnxruntime as ort

        available = set(ort.get_available_providers())
    except ImportError:
        return ["CPUExecutionProvider"]
    if "CUDAExecutionProvider" in available:
        return ["CUDAExecutionProvider", "CPUExecutionProvider"]
    if "CoreMLExecutionProvider" in available:
        return ["CoreMLExecutionProvider", "CPUExecutionProvider"]
    return ["CPUExecutionProvider"]


def _hybrid_engines() -> tuple[object, object]:
    return _detection_predictor(), _indra_recognizer()


def _detection_predictor():
    """Process-local Surya detector on the best available torch device."""
    device = select_torch_device()
    os.environ.setdefault("TORCH_DEVICE", device)
    from surya.detection import DetectionPredictor
    from surya.settings import settings

    # Prefer in-process model (avoids a second detection server for nbs-index).
    try:
        return DetectionPredictor.local(device=device)
    except TypeError:
        # Older / client-only construction — still respects TORCH_DEVICE via settings.
        settings.TORCH_DEVICE = device
        return DetectionPredictor()


def _indra_recognizer():
    """Indra OrtOCR (datalab-to/indra-ocr weights) with device-aware ONNX providers."""
    import indra_ocr
    from indra_ocr.models import model_dir
    from indra_ocr.pipeline import OrtOCR

    threads = int(os.environ.get("INDRA_OCR_THREADS", "0")) or max(1, (os.cpu_count() or 4) // 2)
    return OrtOCR(
        model_dir(),
        threads=threads,
        providers=select_onnx_providers(),
    )


def _as_rgb(image: np.ndarray) -> Image.Image:
    if image.ndim == 2:
        picture = Image.fromarray(image).convert("RGB")
    else:
        picture = Image.fromarray(np.asarray(image))
        if picture.mode != "RGB":
            picture = picture.convert("RGB")
    return picture
