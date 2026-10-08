"""
Unit tests for build_topology_report and TernaryCalibration.to_page: field circuits, temperature points, rings, isotherm routes.
"""
from __future__ import annotations

import pytest

from phase_diagrams.builders.topology_report_builder import build_topology_report
from phase_diagrams.models.diagram_node import DiagramNode
from phase_diagrams.models.ternary_calibration import TernaryCalibration

CORNERS = {"SiO2": [500, 100], "CaO": [100, 800], "MgO": [900, 800]}
CALIBRATION = TernaryCalibration(["CaO", "MgO", "SiO2"], {k: (float(v[0]), float(v[1])) for k, v in CORNERS.items()})
PIXELS = {"t-a": (300.0, 450.0), "t-b": (500.0, 500.0), "t-c": (700.0, 450.0), "t-d": (500.0, 800.0)}


def _wt(pixel: tuple[float, float]) -> dict[str, float]:
    return CALIBRATION.to_wt(*pixel)


def _invariant(point_id: str, temperature, phases: list[str]) -> dict:
    return {"id": point_id, "temperature_C": temperature, "phases": phases, "liquid_wt": _wt(PIXELS[point_id]),
            "sources": [{"ref": "slag-atlas-1995", "pixel": list(PIXELS[point_id])}]}


def _system(**extra) -> dict:
    return {
        "components": ["CaO", "MgO", "SiO2"],
        "digitization": {"calibration": CORNERS},
        "invariantPoints": [_invariant("t-a", 1500, ["p", "q"]), _invariant("t-b", 1400, ["p", "q", "r"]),
                            _invariant("t-c", 1450, ["p", "r"]), _invariant("t-d", 1600, ["q", "r"])],
        "boundaryCurves": [{"fields": ["p", "q"], "path": ["t-a", "t-b"]}, {"fields": ["p", "r"], "path": ["t-b", "t-c"]},
                           {"fields": ["q", "r"], "path": ["t-b", "t-d"]}],
        **extra,
    }


def _nodes(*extra: DiagramNode) -> list[DiagramNode]:
    nodes = [DiagramNode(f"I{i}", "invariant", p, list(_wt(p).values()), point_id) for i, (point_id, p) in enumerate(PIXELS.items(), 1)]
    nodes += [DiagramNode(f"V{i}", "corner", (float(p[0]), float(p[1])), list(_wt(p).values()), c)
              for i, (c, p) in enumerate(CORNERS.items(), 1)]
    return nodes + list(extra)


def _section(report: str, title: str) -> list[str]:
    block = report.split(f"## {title}\n\n```text\n", 1)[1].split("\n```", 1)[0]
    return block.splitlines()


def test_to_page_inverts_to_wt_with_and_without_a_warp():
    warp = [[1100, 1100], [1000, 0], [0, 1000], [5, -3], [2, 4], [-3, 6]]
    for calibration in (CALIBRATION, TernaryCalibration(CALIBRATION.components, CALIBRATION.corners, warp, (10.0, 20.0))):
        page = (430.0, 620.0)
        assert calibration.to_page(calibration.to_wt(*page)) == pytest.approx(page, abs=0.01)


def test_field_circuits_close_along_the_edge_through_the_corners():
    circuits = _section(build_topology_report("t", _system(), _nodes()), "Field circuits")
    assert circuits == ["p: I1 - I2 - I3 - V1 - I1", "q: I1 - I2 - I4 - V2 - I1", "r: I4 - I2 - I3 - V3 - I4"]


def test_field_circuits_show_stored_arrows_flipped_when_a_segment_is_reversed():
    curves = [{"fields": ["p", "q"], "path": ["t-a", "t-b"], "arrows": [">"]},
              {"fields": ["p", "r"], "path": ["t-b", "t-c"], "arrows": ["<"]},
              {"fields": ["q", "r"], "path": ["t-b", "t-d"], "arrows": ["<"]}]
    report = build_topology_report("t", _system(boundaryCurves=curves), _nodes(), source="candidates/t.json")
    assert "System file: candidates/t.json" in report
    assert _section(report, "Field circuits") == ["p: I1 → I2 ← I3 - V1 - I1", "q: I1 → I2 ← I4 - V2 - I1",
                                                  "r: I4 → I2 ← I3 - V3 - I4"]


def test_open_field_and_field_without_phase_show_a_gap():
    system = _system(boundaryCurves=[{"fields": ["s", None], "path": ["t-b"]}])
    assert _section(build_topology_report("t", system, _nodes()), "Field circuits") == ["s: I2 - ? - I2", "(no phase): I2 - ? - I2"]


def test_end_from_another_system_file_is_placed_by_its_wt_not_its_pixel():
    edge = DiagramNode("E1", "edge", (700.0, 450.0), list(_wt((700.0, 450.0)).values()))
    shared = [{"id": "x-edge", "liquid_wt": _wt((700.0, 450.0)), "sources": [{"ref": "slag-atlas-1995", "pixel": [10, 10]}]}]
    system = _system(invariantPoints=[_invariant("t-a", 1500, ["p", "q"]), _invariant("t-b", 1400, ["p", "q"])],
                     boundaryCurves=[{"fields": ["p", "q"], "path": ["t-a", "t-b"]}, {"fields": ["p", "r"], "path": ["t-b", "x-edge"]}])
    nodes = [n for n in _nodes(edge) if n.invariant not in ("t-c", "t-d")]
    circuits = _section(build_topology_report("t", system, nodes, shared_invariants=shared), "Field circuits")
    assert circuits[0] == "p: I1 - I2 - E1 - V1 - I1"


def test_temperature_points_and_compound_rings():
    ring = CALIBRATION.page_to_stored(*CALIBRATION.to_page({"CaO": 48.3, "MgO": 0.0, "SiO2": 51.7}))
    nodes = _nodes(DiagramNode("C1", "ring", ring, [48.3, 0.0, 51.7]))
    compounds = [{"id": "wollastonite", "formula": "CaO·SiO2", "oxideMoles": {"CaO": 1, "SiO2": 1}}]
    report = build_topology_report("t", _system(), nodes, compounds=compounds)
    assert "I2  1400  t-b (p, q, r)" in _section(report, "Points with a temperature (°C)")
    assert _section(report, "Compound rings") == ["C1  wollastonite (CaO·SiO2)  (48.3 / 0.0 / 51.7): no point in the system file"]


def test_isotherm_route_lists_points_on_the_line_and_writes_unlabelled_ends_as_pixels():
    junction = DiagramNode("X1", "junction", (400.0, 375.0), list(_wt((400.0, 375.0)).values()))
    away = DiagramNode("X2", "junction", (450.0, 600.0), list(_wt((450.0, 600.0)).values()))
    polyline = [list(_wt(PIXELS["t-a"]).values()), list(_wt((500.0, 300.0)).values())]
    system = _system(isotherms=[{"field": "p", "temperature_C": 1600, "polyline_wt": polyline},
                                {"field": "p", "temperature_C": 1700, "part": 2, "polyline_wt": None}])
    report = build_topology_report("t", system, _nodes(junction, away), user_nodes={"U•": (500.4, 300.2)})
    assert _section(report, "Isotherms") == ["p 1600: I1 → X1 → U•", "p 1700 (part 2): not traced"]


def test_inferred_isotherm_is_marked_with_its_anchors():
    system = _system(isotherms=[{"field": "p", "temperature_C": 1500, "inferred": {"from": [1400, 1600], "step": 100},
                                 "polyline_wt": None}])
    assert _section(build_topology_report("t", system, _nodes()), "Isotherms") == [
        "p 1500 (inferred from 1400/1600, step 100): not traced"]
