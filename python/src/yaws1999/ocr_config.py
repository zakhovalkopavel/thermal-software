"""
yaws1999.ocr_config — Backend / model settings from the environment.

All values come from env (see ``.env.example``). Tokens
(``MODAL_TOKEN_ID``, ``MODAL_TOKEN_SECRET``) are never hard-coded.
"""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class OcrConfig:
    """Resolved OCR settings for one parse run."""

    backend: str  # local | modal
    model: str  # full HF / model id
    quant: str  # bf16 | q8 when supported
    modal_app: str
    modal_class: str
    modal_gpu: str

    def summary(self) -> str:
        parts = [
            f"backend={self.backend}",
            f"model={self.model}",
            f"quant={self.quant}",
        ]
        if self.backend == "modal":
            parts.append(f"modal_app={self.modal_app}")
            parts.append(f"modal_class={self.modal_class}")
            parts.append(f"modal_gpu={self.modal_gpu}")
        return " ".join(parts)


def _env(name: str) -> str:
    value = (os.environ.get(name) or "").strip()
    if not value:
        raise ValueError(f"{name} must be set in the environment (see .env.example)")
    return value


def load_ocr_config(*, quant_override: str | None = None) -> OcrConfig:
    """Load OCR config from env; ``quant_override`` wins over ``YAWS_OCR_QUANT`` (CLI)."""
    backend = _env("YAWS_OCR_BACKEND").lower()
    if backend not in {"local", "modal"}:
        raise ValueError(f"YAWS_OCR_BACKEND must be 'local' or 'modal', got {backend!r}")
    model = _env("YAWS_OCR_MODEL")
    quant = (quant_override or _env("YAWS_OCR_QUANT")).strip().lower()
    if quant not in {"bf16", "q8"}:
        raise ValueError(f"YAWS_OCR_QUANT must be 'bf16' or 'q8', got {quant!r}")

    modal_app = modal_class = modal_gpu = ""
    if backend == "modal":
        modal_app = _env("YAWS_MODAL_APP")
        modal_class = _env("YAWS_MODAL_CLASS")
        modal_gpu = _env("YAWS_MODAL_GPU")

    return OcrConfig(
        backend=backend,
        model=model,
        quant=quant,
        modal_app=modal_app,
        modal_class=modal_class,
        modal_gpu=modal_gpu,
    )


def modal_tokens_present() -> bool:
    """True when both Modal token env vars are non-empty (values never logged)."""
    tid = (os.environ.get("MODAL_TOKEN_ID") or "").strip()
    secret = (os.environ.get("MODAL_TOKEN_SECRET") or "").strip()
    return bool(tid and secret)
