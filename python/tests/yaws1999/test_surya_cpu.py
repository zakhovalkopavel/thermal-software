"""CPU default helpers for Surya / llama-server."""
from __future__ import annotations

from yaws1999.surya_cpu import apply_yaws_cpu_defaults, logical_cpu_count, physical_cpu_count


def test_cpu_counts_positive():
    logical = logical_cpu_count()
    physical = physical_cpu_count()
    assert logical >= 1
    assert physical >= 1
    assert logical >= physical


def test_apply_yaws_cpu_defaults_uses_logical_threads(monkeypatch):
    monkeypatch.delenv("SURYA_INFERENCE_PARALLEL", raising=False)
    monkeypatch.delenv("LLAMA_CPP_EXTRA_ARGS", raising=False)
    monkeypatch.setattr("yaws1999.surya_cpu.logical_cpu_count", lambda: 12)
    monkeypatch.setattr("yaws1999.surya_cpu.physical_cpu_count", lambda: 6)
    applied = apply_yaws_cpu_defaults()
    assert applied["SURYA_INFERENCE_PARALLEL"] == "1"
    assert applied["logical_cpus"] == "12"
    assert applied["physical_cpus"] == "6"
    assert applied["LLAMA_CPP_EXTRA_ARGS"] == "--threads 12 --threads-batch 12"


def test_apply_yaws_cpu_defaults_respects_existing(monkeypatch):
    monkeypatch.setenv("SURYA_INFERENCE_PARALLEL", "2")
    monkeypatch.setenv("LLAMA_CPP_EXTRA_ARGS", "--threads 4")
    applied = apply_yaws_cpu_defaults()
    assert applied["SURYA_INFERENCE_PARALLEL"] == "2"
    assert applied["LLAMA_CPP_EXTRA_ARGS"] == "--threads 4"
