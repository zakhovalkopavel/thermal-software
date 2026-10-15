"""
Unit tests for the fully automatic extraction: boundary graph of a synthetic page, words read on a page, phase names and field naming, printed temperatures of nodes and curves, the system built from the graph and its comparison with a semi-manual file.
"""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw

from phase_diagrams.builders.auto_ternary_builder import build_auto_ternary
from phase_diagrams.builders.boundary_graph_builder import detect_boundary_graph
from phase_diagrams.builders.field_namer import FieldNaming, match_phase_name, name_fields
from phase_diagrams.builders.node_temperature_reader import (
    CurveTemperature,
    printed_temperature,
    read_curve_temperatures,
    read_node_temperatures,
)
from phase_diagrams.figures.page_word_reader import read_page_words
from phase_diagrams.models.boundary_graph import BoundaryEdge, BoundaryGraph, BoundaryNode
from phase_diagrams.models.page_word import PageWord
from phase_diagrams.models.ternary_calibration import TernaryCalibration
from phase_diagrams.output.auto_extraction_report import compare_auto_system

TOP, LEFT, RIGHT = (400.0, 60.0), (60.0, 650.0), (740.0, 650.0)
JUNCTION = (400.0, 420.0)
CORNERS = {"top": TOP, "left": LEFT, "right": RIGHT}
CORNER_COMPONENTS = {"top": "SiO2", "left": "CaO", "right": "Al2O3"}
CALIBRATION = TernaryCalibration(["CaO", "Al2O3", "SiO2"], {"SiO2": TOP, "CaO": LEFT, "Al2O3": RIGHT})
COMPOUNDS = [
    {"id": "cristobalite", "oxideMoles": {"SiO2": 1}},
    {"id": "lime", "oxideMoles": {"CaO": 1}},
    {"id": "corundum", "oxideMoles": {"Al2O3": 1}},
]


def _on_edge(a, b, t: float) -> tuple[float, float]:
    return a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t


def _page() -> tuple[np.ndarray, np.ndarray]:
    """Triangle with three heavy boundaries from a junction to the middle of each edge (the one to the
    bottom dashed), a heavy spur inside the left field, a thin isotherm and a leader from outside."""
    image = Image.new("L", (820, 720), 255)
    draw = ImageDraw.Draw(image)
    draw.line([TOP, LEFT, RIGHT, TOP], fill=0, width=4)
    draw.line([JUNCTION, _on_edge(TOP, LEFT, 0.5)], fill=0, width=9)
    draw.line([JUNCTION, _on_edge(TOP, RIGHT, 0.5)], fill=0, width=9)
    draw.line([JUNCTION, (400, 480)], fill=0, width=9)
    for y in range(500, 650, 45):
        draw.line([(400, y), (400, min(y + 30, 650))], fill=0, width=9)
    draw.line([_on_edge(LEFT, TOP, 0.2), (210, 575)], fill=0, width=9)
    draw.line([(470, 600), (560, 560)], fill=0, width=4)
    draw.line([(636, 404), (520, 520)], fill=0, width=3)
    page = np.asarray(image)
    return page, page < 128


def _graph() -> BoundaryGraph:
    _, mask = _page()
    return detect_boundary_graph(mask, [TOP, LEFT, RIGHT])


def _near(node: BoundaryNode, point, px: float = 8.0) -> bool:
    return float(np.hypot(node.pixel[0] - point[0], node.pixel[1] - point[1])) <= px


def test_boundary_graph_finds_the_junction_edge_points_and_the_dashed_curve():
    graph = _graph()
    junctions = [n for n in graph.nodes if n.kind == "junction"]
    edges = [n for n in graph.nodes if n.kind == "edge"]
    assert len(junctions) == 1 and _near(junctions[0], JUNCTION)
    for point in (_on_edge(TOP, LEFT, 0.5), _on_edge(TOP, RIGHT, 0.5), (400.0, 650.0), _on_edge(LEFT, TOP, 0.2)):
        assert any(_near(n, point, 16.0) for n in edges), point
    assert len(graph.edges) == 4
    dashed = [e for e in graph.edges if e.dashed]
    assert len(dashed) == 1 and abs(float(np.median(dashed[0].pixels[:, 0])) - 400.0) < 3.0
    assert not any(abs(e.pixels[:, 1].mean() - 580.0) < 30 and e.pixels[:, 0].min() > 450 for e in graph.edges)


def test_page_words_merge_the_two_readings_keeping_the_more_confident():
    page, mask = _page()
    calls = []

    def ocr(picture):
        calls.append(picture.shape)
        if len(calls) == 1:
            return [("Mulite", 60.0, 10, 10, 50, 20), ("1470", 90.0, 100, 10, 40, 20)]
        return [("Mullite", 85.0, 12, 11, 50, 20), ("955", 70.0, 200, 50, 30, 20)]

    words = read_page_words(page, mask, (100, 50, 400, 300), ocr=ocr)
    assert len(calls) == 2 and calls[0] == calls[1] == (250, 300)
    assert [(w.text, w.box) for w in words] == [("1470", (200, 60, 240, 80)), ("Mullite", (112, 61, 162, 81)),
                                                ("955", (300, 100, 330, 120))]


def test_phase_names_tolerate_misreads_and_short_words_name_nothing():
    phases = [{"id": "beta-alumina"}, {"id": "corundum"}, {"id": "mullite"}, {"id": "sodium-disilicate"},
              {"id": "sodium-metasilicate"}]
    assert match_phase_name("B-Alumina", phases) == "beta-alumina"
    assert match_phase_name("@-Alumina", phases) == "beta-alumina"
    assert match_phase_name("Mulite", phases) == "mullite"
    assert match_phase_name("Corundum,", phases) == "corundum"
    assert match_phase_name("sodium", phases) is None
    assert match_phase_name("Mul", phases) is None


def test_fields_are_named_by_label_leader_and_composition_and_a_spur_is_dropped():
    page, mask = _page()
    graph = detect_boundary_graph(mask, [TOP, LEFT, RIGHT])
    words = [PageWord("Cristobalite", 90.0, (350, 250, 450, 274)),
             PageWord("Corundum", 88.0, (640, 392, 740, 416)),
             PageWord("Corundum", 95.0, (600, 80, 700, 104)),
             PageWord("Lime", 95.0, (600, 110, 650, 134)),
             PageWord("Cristobalite", 95.0, (600, 140, 700, 164))]
    naming = name_fields(graph, CORNERS, CORNER_COMPONENTS, CALIBRATION, COMPOUNDS, words, mask)
    by_source = {naming.names[r]: naming.sources[r] for r in naming.names}
    assert by_source == {"cristobalite": "label 'Cristobalite'", "corundum": "leader of 'Corundum'",
                         "lime": "composition of lime"}
    assert sum("in the legend" in line for line in naming.log) == 3
    assert len(naming.dropped) == 1
    spur = graph.edges[naming.dropped[0]]
    assert spur.pixels[:, 0].max() < 260
    kept = [naming.curve_fields[k] for k in range(len(graph.edges)) if k not in naming.dropped]
    assert sorted(tuple(sorted(f)) for f in kept) == [("corundum", "cristobalite"), ("corundum", "lime"),
                                                      ("cristobalite", "lime")]


def test_printed_temperatures():
    assert printed_temperature("1470") == 1470
    assert printed_temperature("~1590") == 1590
    assert printed_temperature("74.0") == 740
    assert printed_temperature("1062.") == 1062
    for text in ("20", "250", "12345", "Si02", "1.5"):
        assert printed_temperature(text) is None


def test_node_temperatures_pair_labels_with_the_least_total_distance_and_avoid_round_labels():
    nodes = [BoundaryNode((100.0, 100.0), "junction"), BoundaryNode((100.0, 130.0), "edge", 0),
             BoundaryNode((400.0, 100.0), "junction"), BoundaryNode((700.0, 100.0), "end")]
    words = [PageWord("74.0", 90.0, (102, 118, 130, 128)),
             PageWord("789", 90.0, (60, 160, 90, 175)),
             PageWord("1400", 90.0, (405, 105, 440, 120)),
             PageWord("1470", 90.0, (400, 140, 440, 155)),
             PageWord("1250", 90.0, (705, 100, 740, 115))]
    found = {n: (value, word.text) for n, (value, word) in read_node_temperatures(nodes, words).items()}
    assert found == {0: (740.0, "74.0"), 1: (789.0, "789"), 2: (1470.0, "1470")}


def test_a_label_far_from_its_own_node_is_not_taken_by_another_one():
    nodes = [BoundaryNode((100.0, 100.0), "junction"), BoundaryNode((100.0, 160.0), "junction")]
    words = [PageWord("1050", 90.0, (105, 95, 130, 105)), PageWord("1062", 90.0, (120, 110, 150, 120))]
    found = read_node_temperatures(nodes, words)
    assert {n: value for n, (value, _) in found.items()} == {0: 1050.0}


def test_curve_temperatures_take_unused_non_round_labels_next_to_a_curve():
    pixels = np.column_stack([np.arange(0, 201, dtype=float), np.zeros(201)])
    words = [PageWord("1062", 90.0, (90, 10, 130, 25)), PageWord("1100", 90.0, (50, 10, 80, 25)),
             PageWord("1104", 90.0, (150, 80, 180, 95)), PageWord("1050", 90.0, (20, 10, 50, 25))]
    found = read_curve_temperatures({3: pixels}, words, taken={3})
    assert len(found) == 1
    assert found[0].edge == 3 and found[0].value == 1062 and 90 <= found[0].index <= 130


def _line(a, b) -> np.ndarray:
    n = int(max(abs(b[0] - a[0]), abs(b[1] - a[1]))) + 1
    return np.column_stack([np.linspace(a[0], b[0], n), np.linspace(a[1], b[1], n)])


def test_auto_ternary_joins_curves_through_a_node_and_inserts_saddles():
    nodes = [BoundaryNode(JUNCTION, "junction"), BoundaryNode((400.0, 540.0), "junction"),
             BoundaryNode((400.0, 650.0), "edge", 2), BoundaryNode(_on_edge(TOP, LEFT, 0.5), "edge", 0),
             BoundaryNode(_on_edge(TOP, RIGHT, 0.5), "edge", 1), BoundaryNode(_on_edge(LEFT, TOP, 0.2), "edge", 0)]

    def edge(a: int, b: int) -> BoundaryEdge:
        return BoundaryEdge(_line(nodes[a].pixel, nodes[b].pixel), (a, b))

    graph = BoundaryGraph(nodes, [edge(3, 0), edge(0, 4), edge(0, 1), edge(1, 2), edge(1, 5)])
    naming = FieldNaming(origin=(0, 0), labels=np.zeros((1, 1), int),
                         names={1: "cristobalite", 2: "lime", 3: "corundum"},
                         curve_fields=[("cristobalite", "lime"), ("cristobalite", "corundum"), ("lime", "corundum"),
                                       ("lime", "corundum"), ("lime", "lime")],
                         dropped=[4])
    word = PageWord("x", 90.0, (0, 0, 1, 1))
    temperatures = {0: (1200.0, word), 2: (1300.0, word), 3: (1300.0, word)}
    saddles = [CurveTemperature(0, 40, 1250.0, word)]
    start = {"id": "cao-al2o3-sio2", "components": ["CaO", "Al2O3", "SiO2"]}
    system = build_auto_ternary(start, graph, naming, temperatures, CALIBRATION, saddles=saddles)

    paths = {tuple(c["fields"]): c["path"] for c in system["boundaryCurves"]}
    assert paths == {("cristobalite", "lime"): ["auto-e3", "auto-1250", "auto-1200"],
                     ("cristobalite", "corundum"): ["auto-1200", "auto-e4"],
                     ("lime", "corundum"): ["auto-1200", "auto-j1", "auto-e2"]}
    points = {p["id"]: p for p in system["invariantPoints"]}
    assert set(points) == {"auto-1200", "auto-j1", "auto-e2", "auto-e3", "auto-e4", "auto-1250"}
    assert points["auto-1250"]["type"] == "saddle" and points["auto-e2"]["type"] == "binary"
    assert points["auto-1200"]["phases"] == ["corundum", "cristobalite", "lime"]
    assert points["auto-e2"]["temperature_C"] == 1300 and points["auto-j1"]["temperature_C"] is None
    assert abs(points["auto-e2"]["liquid_wt"]["SiO2"]) < 0.01
    assert all(abs(sum(p["liquid_wt"].values()) - 100.0) < 0.05 for p in points.values())
    assert system["phases"] == ["cristobalite", "lime", "corundum"]


def test_comparison_counts_points_curves_and_phases():
    def system(points, curves, phases):
        return {"components": ["CaO", "Al2O3", "SiO2"], "phases": phases,
                "invariantPoints": [{"id": i, "temperature_C": t, "liquid_wt": dict(zip(["CaO", "Al2O3", "SiO2"], wt))}
                                    for i, t, wt in points],
                "boundaryCurves": [{"fields": f, "path": p, "polyline_wt": line} for f, p, line in curves]}

    line = [[50.0, 0.0, 50.0], [30.0, 30.0, 40.0]]
    reference = system([("r1", 1200, (30.0, 30.0, 40.0)), ("r2", 1300, (60.0, 20.0, 20.0))],
                       [(["lime", "corundum"], ["r1"], line)], ["lime", "corundum", "mullite"])
    auto = system([("a1", 1200, (30.5, 29.5, 40.0)), ("a2", 1350, (10.0, 10.0, 80.0))],
                  [(["lime", "corundum"], ["a1"], line), (["lime", "field-4"], ["a2"], [[10.0, 10.0, 80.0], [0.0, 20.0, 80.0]])],
                  ["lime", "corundum", "field-4"])
    lines = compare_auto_system(auto, reference, CALIBRATION)
    text = "\n".join(lines)
    assert "Invariant points: 1 of 2 found within 1.5 wt% (1 with the same temperature); 2 automatic points." in text
    assert "Boundary curves: 100 % of the semi-manual curves" in text
    assert "lime / field-4 (a2): 0 % on a semi-manual curve" in text
    assert "Fields: 2 of 3 semi-manual phases named automatically; missing: mullite; only automatic: field-4." in text
