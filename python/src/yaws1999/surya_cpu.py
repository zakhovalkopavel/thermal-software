"""
yaws1999.surya_cpu — CPU-friendly defaults for Surya / llama-server.

Yaws pages are OCR'd sequentially. Surya's default ``SURYA_INFERENCE_PARALLEL=8``
allocates ~8×12k KV-cache slots and hurts single-page latency on CPU laptops.

Thread defaults use **all logical CPUs** (SMT included: typically 2× physical cores).
Override with ``LLAMA_CPP_EXTRA_ARGS`` / ``SURYA_INFERENCE_PARALLEL`` in the environment
(compose / ``.env``).
"""
from __future__ import annotations

import os
from pathlib import Path


def logical_cpu_count() -> int:
    """Hardware threads visible to the process (SMT included)."""
    base = Path("/sys/devices/system/cpu")
    if base.is_dir():
        online = sorted(base.glob("cpu[0-9]*"), key=lambda p: int(p.name[3:]))
        if online:
            return max(1, len(online))
    return max(1, os.cpu_count() or 4)


def physical_cpu_count() -> int:
    """Physical cores (unique SMT sibling groups). Kept for diagnostics/tests."""
    seen: set[str] = set()
    base = Path("/sys/devices/system/cpu")
    if base.is_dir():
        for sib in base.glob("cpu[0-9]*/topology/thread_siblings_list"):
            try:
                seen.add(sib.read_text(encoding="utf-8").strip())
            except OSError:
                continue
        if seen:
            return max(1, len(seen))
    # Heuristic when topology is unavailable: assume 2-way SMT.
    return max(1, logical_cpu_count() // 2)


def apply_yaws_cpu_defaults() -> dict[str, str]:
    """Set Surya/llama env knobs when the caller has not already set them.

    Returns the values that are in effect (for logging).
    """
    threads = str(logical_cpu_count())
    applied: dict[str, str] = {}

    def _setdefault(key: str, value: str) -> None:
        if not os.environ.get(key, "").strip():
            os.environ[key] = value
        applied[key] = os.environ[key]

    # One page at a time → one slot (much smaller KV cache / less RAM bandwidth).
    _setdefault("SURYA_INFERENCE_PARALLEL", "1")
    # All logical CPUs; EXTRA_ARGS is appended to llama-server spawn.
    extra = os.environ.get("LLAMA_CPP_EXTRA_ARGS", "").strip()
    if not extra:
        os.environ["LLAMA_CPP_EXTRA_ARGS"] = f"--threads {threads} --threads-batch {threads}"
    applied["LLAMA_CPP_EXTRA_ARGS"] = os.environ["LLAMA_CPP_EXTRA_ARGS"]
    applied["SURYA_INFERENCE_PARALLEL"] = os.environ["SURYA_INFERENCE_PARALLEL"]
    applied["logical_cpus"] = threads
    applied["physical_cpus"] = str(physical_cpu_count())
    return applied
