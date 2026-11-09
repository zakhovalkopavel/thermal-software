"""Heartbeat helper for long Surya page OCR."""
from __future__ import annotations

import time

from yaws1999.progress import heartbeat


def test_heartbeat_emits_while_blocking():
    messages: list[str] = []

    with heartbeat(messages.append, "page 1", interval_s=0.05):
        time.sleep(0.12)

    assert any("still running" in m for m in messages)
    assert any("page 1" in m for m in messages)
