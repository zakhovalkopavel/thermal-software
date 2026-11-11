"""Warm Hugging Face GGUF cache → local VLM paths, no Hub calls."""
from __future__ import annotations

import os
from pathlib import Path

import pytest

from phase_diagrams.nbs.nbs_vlm_ocr import (
    VLM_QUANT_FILES,
    _GGUF_MODEL_FILE,
    _GGUF_MMPROJ_FILE,
    _GGUF_REPO_DIR,
    apply_vlm_quant,
    _prefer_cached_ggufs,
    find_cached_gguf_paths,
)


def _fake_hub(tmp_path: Path, *, size: int = 32) -> tuple[Path, Path, Path]:
    snap = tmp_path / "hub" / _GGUF_REPO_DIR / "snapshots" / "abc123"
    snap.mkdir(parents=True)
    model = snap / _GGUF_MODEL_FILE
    mmproj = snap / _GGUF_MMPROJ_FILE
    model.write_bytes(b"m" * size)
    mmproj.write_bytes(b"p" * size)
    return tmp_path / "hub", model.resolve(), mmproj.resolve()


def test_apply_vlm_quant_sets_model_file(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SURYA_GGUF_LOCAL_MODEL_PATH", "/old/bf16.gguf")
    monkeypatch.setenv("SURYA_GGUF_LOCAL_MMPROJ_PATH", "/old/mmproj.gguf")
    assert apply_vlm_quant("q8") == VLM_QUANT_FILES["q8"]
    assert os.environ["SURYA_GGUF_MODEL_FILE"] == "surya-2.5-Q8_0.gguf"
    assert "SURYA_GGUF_LOCAL_MODEL_PATH" not in os.environ
    assert apply_vlm_quant("bf16") == _GGUF_MODEL_FILE


def test_apply_vlm_quant_rejects_unknown():
    with pytest.raises(ValueError, match="unknown"):
        apply_vlm_quant("q4")


def test_find_cached_gguf_paths_resolves_snapshot(tmp_path: Path):
    hub, model, mmproj = _fake_hub(tmp_path)
    assert find_cached_gguf_paths(hub) == (model, mmproj)


def test_find_cached_gguf_paths_none_when_missing(tmp_path: Path):
    assert find_cached_gguf_paths(tmp_path / "hub") is None


def test_prefer_cached_ggufs_sets_local_and_offline(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    hub, model, mmproj = _fake_hub(tmp_path)
    monkeypatch.setenv("HF_HUB_CACHE", str(hub))
    monkeypatch.delenv("SURYA_GGUF_LOCAL_MODEL_PATH", raising=False)
    monkeypatch.delenv("SURYA_GGUF_LOCAL_MMPROJ_PATH", raising=False)
    monkeypatch.delenv("HF_HUB_OFFLINE", raising=False)
    monkeypatch.delenv("SURYA_HF_ONLINE", raising=False)

    _prefer_cached_ggufs()

    assert os.environ["SURYA_GGUF_LOCAL_MODEL_PATH"] == str(model)
    assert os.environ["SURYA_GGUF_LOCAL_MMPROJ_PATH"] == str(mmproj)
    assert os.environ["HF_HUB_OFFLINE"] == "1"


def test_prefer_cached_ggufs_respects_surya_hf_online(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    hub, _, _ = _fake_hub(tmp_path)
    monkeypatch.setenv("HF_HUB_CACHE", str(hub))
    monkeypatch.setenv("SURYA_HF_ONLINE", "1")
    monkeypatch.delenv("SURYA_GGUF_LOCAL_MODEL_PATH", raising=False)
    monkeypatch.delenv("HF_HUB_OFFLINE", raising=False)

    _prefer_cached_ggufs()

    assert "SURYA_GGUF_LOCAL_MODEL_PATH" not in os.environ
    assert "HF_HUB_OFFLINE" not in os.environ


def test_prefer_cached_ggufs_keeps_explicit_hf_hub_offline(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    hub, model, _ = _fake_hub(tmp_path)
    monkeypatch.setenv("HF_HUB_CACHE", str(hub))
    monkeypatch.setenv("HF_HUB_OFFLINE", "0")
    monkeypatch.delenv("SURYA_GGUF_LOCAL_MODEL_PATH", raising=False)
    monkeypatch.delenv("SURYA_HF_ONLINE", raising=False)

    _prefer_cached_ggufs()

    assert os.environ["SURYA_GGUF_LOCAL_MODEL_PATH"] == str(model)
    assert os.environ["HF_HUB_OFFLINE"] == "0"
