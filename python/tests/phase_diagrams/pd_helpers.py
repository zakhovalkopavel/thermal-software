"""
Synthetic images, NBS text and datasets shared by the phase_diagrams tests (fixtures in conftest.py).

The synthetic binary diagram maps wt% SiO2 and °C to pixels exactly:
``px = 100 + 10·wt``, ``py = 100 + 0.8·(2000 − T)``. Frame (100, 100)–(1100, 900),
x ticks every 10 wt%, y ticks every 200 °C on the left and right edges, a
1500 °C eutectic line and two liquidus branches meeting it at 40 wt%.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

FIXTURES = Path(__file__).parent / "fixtures"

NBS_SNIPPET = """\
4992      K.O-SiO.                  20APP                         762.0 APP            1330
5096      Na,O-SiO,               25.2                           789.0 :tol           2317
5802      AI,O,-MgO-Si0 2        10.5-29.5-60                  1345.0                2063
5909 Al,O,-SiO,           3 API'                            1547.0 :!:5            941
5931      Al.O,-SiO.             5                          1595.0                  867
6077    Al,O.-MgO          88.3 APP                      1925.0                  2309
6095    Al,03-MgO          32.6                          1995.0                  1442
6096    Al,03-MgO          35APP                         2000.0                  1483
6097    Al,O.-MgO          85 APP                        2000.0                  1483
2352      ErCl,-KCl                56                          426,0                1855
2812   KC1-SmCl,                 SOAPP                            488.0            832
"""


def wt_to_px(wt: float) -> float:
    return 100.0 + 10.0 * wt


def t_to_py(temperature: float) -> float:
    return 100.0 + 0.8 * (2000.0 - temperature)


def periclase_liquidus(wt: float) -> float:
    return 1800.0 - 300.0 * (wt / 40.0) ** 2


def silica_liquidus(wt: float) -> float:
    return 1500.0 + 200.0 * (wt - 40.0) / 60.0


def draw_binary(hide_left_tick: float | None = None) -> np.ndarray:
    image = Image.new("L", (1200, 1000), 255)
    draw = ImageDraw.Draw(image)
    draw.rectangle([98, 98, 1102, 902], outline=0, width=4)
    for wt in range(10, 100, 10):
        x = wt_to_px(wt)
        draw.line([(x, 900), (x, 885)], fill=0, width=3)
    for temperature in range(1800, 1000, -200):
        y = t_to_py(temperature)
        draw.line([(1100, y), (1085, y)], fill=0, width=3)
        if temperature != hide_left_tick:
            draw.line([(100, y), (115, y)], fill=0, width=3)
    draw.line([(300, t_to_py(1500)), (700, t_to_py(1500))], fill=0, width=4)
    left = [(wt_to_px(w), t_to_py(periclase_liquidus(w))) for w in np.linspace(0, 40, 200)]
    right = [(wt_to_px(w), t_to_py(silica_liquidus(w))) for w in np.linspace(40, 100, 200)]
    draw.line(left, fill=0, width=4)
    draw.line(right, fill=0, width=4)
    return np.array(image)


def binary_config_dict() -> dict:
    return {
        "system": "MgO-SiO2",
        "components": ["MgO", "SiO2"],
        "output": "systems/test.json",
        "idPrefix": "ts",
        "source": {"ref": "slag-atlas-1995", "figure": "Fig. 3.125", "printedPage": 88, "pdfPage": 108},
        "frameSearchBox": [50, 50, 1150, 950],
        "axes": {
            "x": {"component": "SiO2", "ticks": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]},
            "y": {"ticks": [2000, 1800, 1600, 1400, 1200, 1000]},
        },
        "phases": ["periclase", "silica"],
        "endMembers": {
            "periclase": {"x": 0, "labelTemperature": 1800},
            "silica": {"x": 100, "labelTemperature": 1700},
        },
        "invariants": [
            {"id": "ts-1500", "type": "binary", "reaction": "eutectic", "phases": ["periclase", "silica"],
             "label": {"temperature": 1500, "composition": 40}, "seedPixel": [500, 500], "nbs": []},
        ],
        "liquidus": [
            {"phase": "periclase", "from": "end:periclase", "to": "ts-1500",
             "segments": [{"kind": "trace", "seedPixel": [wt_to_px(20), t_to_py(periclase_liquidus(20))]}],
             "grid": [0, 10, 20, 30, 39, 40]},
            {"phase": "silica", "from": "ts-1500", "to": "end:silica",
             "segments": [{"kind": "trace", "seedPixel": [wt_to_px(70), t_to_py(silica_liquidus(70))]}],
             "grid": [40, 50, 60, 70, 80, 90, 100]},
        ],
    }


def nbs_text() -> str:
    """Real Table I lines (PDF page 116) with their OCR noise."""
    return "\f" * 115 + NBS_SNIPPET


def _write(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def valid_dataset() -> dict[str, dict]:
    """Minimal dataset that passes every validator rule (file name → content)."""
    atlas = {"ref": "slag-atlas-1995", "figure": "Fig. 3.125", "printedPage": 88, "pdfPage": 108}
    return {
        "sources.json": {
            "statusLegend": {"extracted": "", "confirmed": "", "conflict": "", "recalled": ""},
            "sources": {
                "slag-atlas-1995": {"file": None, "pageMapping": "pdfPage = printedPage + 20",
                                    "figures": [{"system": "MgO-SiO2", **{k: v for k, v in atlas.items() if k != "ref"}}]},
                "nsrds-nbs-61-1": {"file": None, "pageMapping": "pdfPage = printedPage + 8"},
                "recalled": {"file": None},
            },
        },
        "compounds.json": {
            "compounds": [
                {"id": "periclase", "oxideMoles": {"MgO": 1}},
                {"id": "silica", "oxideMoles": {"SiO2": 1}},
                {"id": "forsterite", "oxideMoles": {"MgO": 2, "SiO2": 1}},
            ]
        },
        "systems/mgo-sio2.json": {
            "system": "MgO-SiO2",
            "components": ["MgO", "SiO2"],
            "units": {"temperature_C": "°C", "liquid_wt": "wt%", "liquidus": "[wt% SiO2, °C]"},
            "source": atlas,
            "phases": ["periclase", "silica"],
            "invariantPoints": [
                {"id": "ms-1850", "type": "binary", "reaction": "eutectic", "phases": ["periclase", "silica"],
                 "temperature_C": 1850, "liquid_wt": {"MgO": 62.0, "SiO2": 38.0}, "status": "confirmed",
                 "sources": [
                     {**atlas, "pixel": [1, 2]},
                     {"ref": "nsrds-nbs-61-1", "entry": 1, "pdfPage": 116, "printedPage": 108,
                      "reported": {"temperature_C": 1855}, "converted_wt": {"MgO": 61.0, "SiO2": 39.0}},
                 ]},
            ],
            "liquidus": [
                {"phase": "periclase", "from": "periclase melting point", "to": "ms-1850", "status": "extracted",
                 "points": [[0, 2822], [20, 2400], [38.0, 1850]]},
            ],
        },
        "systems/ternary.json": {
            "system": "MgO-SiO2-X",
            "components": ["MgO", "SiO2"],
            "invariantPoints": [],
            "boundaryCurves": [{"fields": ["periclase", "silica"], "path": ["ms-1850"], "polyline_wt": [[1, 2]]}],
        },
    }


def dataset_writer(tmp_path: Path):
    """Callable writing a dataset (optionally modified) under <tmp>/shared/processed/phase-diagrams."""

    def make(modify=None) -> Path:
        data = valid_dataset()
        if modify:
            modify(data)
        root = tmp_path / "shared" / "processed" / "phase-diagrams"
        for name, content in data.items():
            if isinstance(content, str):
                (root / name).parent.mkdir(parents=True, exist_ok=True)
                (root / name).write_text(content, encoding="utf-8")
            else:
                _write(root / name, content)
        return root

    return make
