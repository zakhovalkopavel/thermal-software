"""
Unit tests for build_compound_points and CompoundPoint.legend: compound of the system, temperature from the invariant on the ring or the melting point.
"""
from __future__ import annotations

from phase_diagrams.builders.compound_points_builder import build_compound_points
from phase_diagrams.models.compound_point import CompoundPoint
from phase_diagrams.models.diagram_node import DiagramNode

COMPOUNDS = [
    {"id": "silica", "notation": "S", "formula": "SiO2", "oxideMoles": {"SiO2": 1},
     "melting": {"behaviour": "congruent", "temperature_C": 1725}},
    {"id": "quartz", "notation": "S", "formula": "SiO2", "oxideMoles": {"SiO2": 1}, "modificationOf": "silica"},
    {"id": "wollastonite", "notation": "CS", "formula": "CaO·SiO2", "oxideMoles": {"CaO": 1, "SiO2": 1},
     "melting": {"behaviour": "congruent", "temperature_C": 1544}},
    {"id": "rankinite", "notation": "C3S2", "formula": "3CaO·2SiO2", "oxideMoles": {"CaO": 3, "SiO2": 2},
     "melting": {"behaviour": "incongruent", "temperature_C": 1464}},
    {"id": "periclase", "notation": "M", "formula": "MgO", "oxideMoles": {"MgO": 1}},
]


def _system(**extra) -> dict:
    return {"components": ["CaO", "MgO", "SiO2"], "phases": ["quartz", "wollastonite", "rankinite"],
            "invariantPoints": [], **extra}


def _ring(label: str, pixel: tuple[float, float], wt: list[float]) -> DiagramNode:
    return DiagramNode(label, "ring", pixel, wt)


def test_ring_takes_the_compound_of_the_system_and_its_melting_point():
    nodes = [_ring("C1", (100.0, 200.0), [48.3, 0.0, 51.7]), _ring("C2", (300.0, 100.0), [0.0, 0.0, 100.0]),
             DiagramNode("X1", "junction", (5.0, 5.0), [30.0, 30.0, 40.0])]
    points = build_compound_points(_system(), nodes, COMPOUNDS, pixel_origin=(10.0, 20.0))
    assert [(p.tag, p.pixel, p.compound, p.temperature_C) for p in points] == [
        ("CS", (110.0, 220.0), "wollastonite", 1544), ("S", (310.0, 120.0), "silica", 1725)]
    assert points[0].legend() == "CS  CaO·SiO2, wollastonite (1544 °C)"


def test_compound_outside_the_system_phases_is_not_matched():
    points = build_compound_points(_system(), [_ring("C1", (0.0, 0.0), [0.0, 100.0, 0.0])], COMPOUNDS)
    assert points[0].compound is None and points[0].tag == "C1"
    assert points[0].legend() == "C1  0.0 / 100.0 / 0.0 wt%, no compound of the system (no temperature)"


def test_invariant_on_the_ring_gives_the_temperature():
    invariant = {"id": "t-edge", "temperature_C": 1460, "sources": [{"ref": "slag-atlas-1995", "pixel": [205, 300]}]}
    nodes = [_ring("C1", (200.0, 300.0), [58.2, 0.0, 41.8]), _ring("C2", (400.0, 300.0), [59.0, 0.0, 41.0])]
    points = build_compound_points(_system(invariantPoints=[invariant]), nodes, COMPOUNDS)
    assert points[0].legend() == "C3S2  3CaO·2SiO2, rankinite (1460 °C, t-edge)"
    assert points[1].legend() == "C3S2  3CaO·2SiO2, rankinite (1464 °C, incongruent)"


def test_legend_of_a_ring_without_compound_on_an_invariant():
    point = CompoundPoint("C5", (0.0, 0.0), [59.8, -0.1, 40.3], temperature_C=1120, invariant="nas-edge-n2s-melting")
    assert point.legend() == "C5  point nas-edge-n2s-melting, 59.8 / 0.0 / 40.3 wt% (1120 °C)"
