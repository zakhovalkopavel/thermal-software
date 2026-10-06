"""
Golden-file tests for write_system_json: the compact layout of the binary system files.
"""
from __future__ import annotations

import json

import pytest

from pd_helpers import FIXTURES
from phase_diagrams.output.system_json_writer import write_system_json


@pytest.mark.parametrize("name", ["al2o3-mgo.json", "mgo-sio2.json"])
def test_golden_layout(name):
    text = (FIXTURES / "golden" / name).read_text(encoding="utf-8")
    assert write_system_json(json.loads(text)) == text


def test_round_trip_keeps_values():
    text = (FIXTURES / "golden" / "mgo-sio2.json").read_text(encoding="utf-8")
    data = json.loads(text)
    assert json.loads(write_system_json(data)) == data


def test_non_ascii_written_verbatim():
    out = write_system_json({"system": "A-B", "units": {"temperature_C": "°C"}})
    assert "°C" in out
