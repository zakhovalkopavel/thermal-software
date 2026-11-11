"""Flatten OCR table HTML into Yaws row lines (page-ocr; no llama-server)."""
from __future__ import annotations

from types import SimpleNamespace

from page_ocr.lines import lines_from_prediction, table_html_to_lines


_SAMPLE = """
<table>
<tr><td>NO</td><td>FORMULA</td><td>NAME</td><td>A</td><td>B</td><td>TMIN</td><td>TMAX</td></tr>
<tr><td>12</td><td>Ar</td><td>ARGON</td><td>20.786</td><td>0.0000E+00</td><td>100</td><td>1500</td></tr>
<tr><td>10</td><td>Al<sub>2</sub>O<sub>3</sub></td><td>ALUMINUM OXIDE</td><td>—</td></tr>
</table>
"""


def test_table_html_to_lines_joins_cells_and_subscripts():
    lines = table_html_to_lines(_SAMPLE)
    assert lines[0].startswith("NO FORMULA NAME")
    assert lines[1] == "12 Ar ARGON 20.786 0.0000E+00 100 1500"
    assert lines[2].startswith("10 Al2O3 ALUMINUM OXIDE")


def test_lines_from_prediction_prefers_largest_table():
    prediction = SimpleNamespace(
        blocks=[
            SimpleNamespace(skipped=False, html="<p>HEAT CAPACITY</p>"),
            SimpleNamespace(skipped=False, html="<table><tr><td>1</td><td>H2</td></tr></table>"),
            SimpleNamespace(skipped=False, html=_SAMPLE),
        ]
    )
    lines = lines_from_prediction(prediction)
    assert lines[0] == "HEAT CAPACITY"
    assert lines[1].startswith("NO FORMULA NAME")
    assert any(ln.startswith("12 Ar ARGON") for ln in lines)
