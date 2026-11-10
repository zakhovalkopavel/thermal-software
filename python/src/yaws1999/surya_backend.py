"""
yaws1999.surya_backend — Dispatch full-page OCR to local Surya or Modal.

Local: llama-server + RecognitionPredictor (existing NBS stack).
Modal: one PNG per ``SuryaOcr.ocr_page.remote`` call (no page batching).
"""
from __future__ import annotations

import io
from types import SimpleNamespace
from typing import Any

import numpy as np
from PIL import Image

from yaws1999.ocr_config import OcrConfig, load_ocr_config, modal_tokens_present


def ocr_page_image(
    image: np.ndarray,
    *,
    config: OcrConfig | None = None,
    predictor: object | None = None,
) -> list[str]:
    """OCR one page image with the configured backend; return reading-order lines."""
    cfg = config or load_ocr_config()
    if cfg.backend == "modal":
        return _ocr_page_modal(image, cfg)
    return _ocr_page_local(image, cfg, predictor=predictor)


def prepare_local_predictor(config: OcrConfig | None = None) -> object:
    """Boot local Surya (llama-server). Used once per parse run when backend=local."""
    cfg = config or load_ocr_config()
    if cfg.backend != "local":
        raise ValueError("prepare_local_predictor only applies when YAWS_OCR_BACKEND=local")
    from phase_diagrams.nbs.nbs_surya_ocr import (
        _recognition_predictor,
        apply_surya_quant,
        ensure_llama_env,
    )

    _apply_local_model_env(cfg)
    apply_surya_quant(cfg.quant)
    ensure_llama_env()
    return _recognition_predictor()


def _apply_local_model_env(cfg: OcrConfig) -> None:
    """Map ``YAWS_OCR_MODEL`` onto Surya HF/cache env when possible."""
    import os

    os.environ["YAWS_OCR_MODEL"] = cfg.model
    # Known Surya 2.5 GGUF repo — existing helpers already look under this cache dir.
    if cfg.model.rstrip("/") in {
        "datalab-to/surya-ocr-2.5-gguf",
        "datalab-to/surya-ocr-2.5",
    }:
        return
    # For other ids, expose the repo for future resolvers / Hub downloads.
    os.environ["SURYA_HF_REPO"] = cfg.model


def _ocr_page_local(
    image: np.ndarray,
    cfg: OcrConfig,
    *,
    predictor: object | None,
) -> list[str]:
    from phase_diagrams.nbs.nbs_surya_ocr import ensure_llama_env, _recognition_predictor

    _apply_local_model_env(cfg)
    from yaws1999.surya_ocr import lines_from_prediction

    ensure_llama_env()
    picture = _as_rgb_pil(image)
    recognizer = predictor or _recognition_predictor()
    prediction = recognizer([picture], full_page=True)[0]
    return lines_from_prediction(prediction)


def _ocr_page_modal(image: np.ndarray, cfg: OcrConfig) -> list[str]:
    if not modal_tokens_present():
        raise RuntimeError(
            "YAWS_OCR_BACKEND=modal requires MODAL_TOKEN_ID and MODAL_TOKEN_SECRET "
            "in the environment (never commit them). See docs/scripts/YAWS1999_MODAL.md"
        )
    try:
        import modal
    except ImportError as exc:
        raise RuntimeError(
            "modal package is not installed; run make yaws1999-modal-deploy once "
            '(or: pip install "modal>=1.6,<2") so the python_packages volume has it'
        ) from exc
    except RuntimeError as exc:
        # modal 0.x raises RuntimeError on Python 3.14 at import time
        if "3.14" in str(exc):
            raise RuntimeError(
                'modal 0.x does not support Python 3.14; install "modal>=1.6,<2" '
                "(make yaws1999-modal-deploy does this)"
            ) from exc
        raise

    from yaws1999.surya_ocr import lines_from_prediction

    png = _image_to_png_bytes(image)
    SuryaOcr = modal.Cls.from_name(cfg.modal_app, cfg.modal_class)
    result: dict[str, Any] = SuryaOcr().ocr_page.remote(png)
    elapsed = result.get("elapsed_ms")
    if elapsed is not None:
        print(
            f"[yaws1999] modal OCR {elapsed}ms "
            f"(quant={result.get('quant')} gpu={result.get('gpu')} "
            f"rev={result.get('deploy_rev')})",
            flush=True,
        )
    blocks = [
        SimpleNamespace(html=b.get("html"), skipped=bool(b.get("skipped")))
        for b in (result.get("blocks") or [])
    ]
    return lines_from_prediction(SimpleNamespace(blocks=blocks))


def _as_rgb_pil(image: np.ndarray) -> Image.Image:
    picture = Image.fromarray(
        image if image.ndim == 2 else np.asarray(Image.fromarray(image).convert("RGB"))
    )
    if picture.mode != "RGB":
        picture = picture.convert("RGB")
    return picture


def _image_to_png_bytes(image: np.ndarray) -> bytes:
    picture = _as_rgb_pil(image)
    buf = io.BytesIO()
    picture.save(buf, format="PNG")
    return buf.getvalue()
