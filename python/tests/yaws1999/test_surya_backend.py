"""Client OCR dispatch: local vs Modal (Modal calls are mocked)."""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock

import numpy as np
import pytest

from yaws1999.ocr_config import load_ocr_config
from yaws1999.surya_backend import ocr_page_image


def _modal_env(monkeypatch) -> None:
    monkeypatch.setenv("YAWS_OCR_BACKEND", "modal")
    monkeypatch.setenv("YAWS_OCR_MODEL", "test/ocr-model")
    monkeypatch.setenv("YAWS_OCR_QUANT", "bf16")
    monkeypatch.setenv("YAWS_MODAL_APP", "test-surya-app")
    monkeypatch.setenv("YAWS_MODAL_CLASS", "SuryaOcr")
    monkeypatch.setenv("YAWS_MODAL_GPU", "T4")


def test_modal_requires_tokens(monkeypatch):
    _modal_env(monkeypatch)
    monkeypatch.delenv("MODAL_TOKEN_ID", raising=False)
    monkeypatch.delenv("MODAL_TOKEN_SECRET", raising=False)
    image = np.zeros((8, 8, 3), dtype=np.uint8)
    with pytest.raises(RuntimeError, match="MODAL_TOKEN"):
        ocr_page_image(image, config=load_ocr_config())


def test_modal_one_image_remote(monkeypatch):
    _modal_env(monkeypatch)
    monkeypatch.setenv("MODAL_TOKEN_ID", "ak-test")
    monkeypatch.setenv("MODAL_TOKEN_SECRET", "as-test")
    cfg = load_ocr_config()

    remote = MagicMock(
        return_value={
            "model": cfg.model,
            "quant": cfg.quant,
            "blocks": [
                {"html": "<p>HEAT CAPACITY</p>", "skipped": False},
                {
                    "html": (
                        "<table><tr><td>12</td><td>Ar</td><td>ARGON</td>"
                        "<td>20.786</td></tr></table>"
                    ),
                    "skipped": False,
                },
            ],
        }
    )
    instance = MagicMock()
    instance.ocr_page.remote = remote
    cls_factory = MagicMock(return_value=instance)

    fake_modal = SimpleNamespace(Cls=SimpleNamespace(from_name=MagicMock(return_value=cls_factory)))
    monkeypatch.setitem(__import__("sys").modules, "modal", fake_modal)

    image = np.zeros((16, 16, 3), dtype=np.uint8)
    lines = ocr_page_image(image, config=cfg)

    assert lines[0] == "HEAT CAPACITY"
    assert lines[1].startswith("12 Ar ARGON")
    fake_modal.Cls.from_name.assert_called_once_with(cfg.modal_app, cfg.modal_class)
    remote.assert_called_once()
    png_bytes = remote.call_args.args[0]
    assert isinstance(png_bytes, (bytes, bytearray))
    assert png_bytes[:8] == b"\x89PNG\r\n\x1a\n"
