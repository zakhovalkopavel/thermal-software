"""OCR backend / model config from the environment (no secrets in code)."""
from __future__ import annotations

import pytest

from yaws1999.ocr_config import load_ocr_config, modal_tokens_present


def _set_local_env(monkeypatch) -> None:
    monkeypatch.setenv("YAWS_OCR_BACKEND", "local")
    monkeypatch.setenv("YAWS_OCR_MODEL", "test/local-model")
    monkeypatch.setenv("YAWS_OCR_QUANT", "bf16")


def test_load_ocr_config_from_env(monkeypatch):
    _set_local_env(monkeypatch)
    monkeypatch.delenv("YAWS_MODAL_APP", raising=False)
    monkeypatch.delenv("YAWS_MODAL_CLASS", raising=False)
    monkeypatch.delenv("YAWS_MODAL_GPU", raising=False)

    cfg = load_ocr_config()
    assert cfg.backend == "local"
    assert cfg.model == "test/local-model"
    assert cfg.quant == "bf16"
    assert cfg.modal_app == ""
    assert "backend=local" in cfg.summary()
    assert "modal_gpu" not in cfg.summary()


def test_load_ocr_config_modal_and_model(monkeypatch):
    monkeypatch.setenv("YAWS_OCR_BACKEND", "modal")
    monkeypatch.setenv("YAWS_OCR_MODEL", "org/other-ocr-model")
    monkeypatch.setenv("YAWS_OCR_QUANT", "q8")
    monkeypatch.setenv("YAWS_MODAL_APP", "test-app")
    monkeypatch.setenv("YAWS_MODAL_CLASS", "TestOcr")
    monkeypatch.setenv("YAWS_MODAL_GPU", "A10G")

    cfg = load_ocr_config()
    assert cfg.backend == "modal"
    assert cfg.model == "org/other-ocr-model"
    assert cfg.quant == "q8"
    assert cfg.modal_gpu == "A10G"
    assert "modal_gpu=A10G" in cfg.summary()


def test_missing_env_raises(monkeypatch):
    monkeypatch.delenv("YAWS_OCR_BACKEND", raising=False)
    with pytest.raises(ValueError, match="YAWS_OCR_BACKEND"):
        load_ocr_config()


def test_quant_override_wins(monkeypatch):
    _set_local_env(monkeypatch)
    monkeypatch.setenv("YAWS_OCR_QUANT", "q8")
    cfg = load_ocr_config(quant_override="bf16")
    assert cfg.quant == "bf16"


def test_invalid_backend(monkeypatch):
    _set_local_env(monkeypatch)
    monkeypatch.setenv("YAWS_OCR_BACKEND", "hybrid")
    with pytest.raises(ValueError, match="YAWS_OCR_BACKEND"):
        load_ocr_config()


def test_modal_requires_modal_env(monkeypatch):
    monkeypatch.setenv("YAWS_OCR_BACKEND", "modal")
    monkeypatch.setenv("YAWS_OCR_MODEL", "test/model")
    monkeypatch.setenv("YAWS_OCR_QUANT", "bf16")
    monkeypatch.delenv("YAWS_MODAL_APP", raising=False)
    with pytest.raises(ValueError, match="YAWS_MODAL_APP"):
        load_ocr_config()


def test_modal_tokens_present(monkeypatch):
    monkeypatch.delenv("MODAL_TOKEN_ID", raising=False)
    monkeypatch.delenv("MODAL_TOKEN_SECRET", raising=False)
    assert modal_tokens_present() is False

    monkeypatch.setenv("MODAL_TOKEN_ID", "ak-test")
    monkeypatch.setenv("MODAL_TOKEN_SECRET", "as-test")
    assert modal_tokens_present() is True
