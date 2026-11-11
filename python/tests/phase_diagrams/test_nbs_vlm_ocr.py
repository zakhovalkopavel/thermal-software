"""Unit tests for VLM HTML → NBS dump lines (no model download)."""
from __future__ import annotations

from phase_diagrams.nbs.nbs_entry_index import build_nbs_index
from phase_diagrams.nbs.nbs_vlm_ocr import table_html_to_lines


_SAMPLE = """
<table>
<tr><th>Locator<br/>number</th><th>System</th><th>Mol%</th><th><i>T</i>,°C</th><th>References</th></tr>
<tr><td>1</td><td>BF<sub>3</sub>-N<sub>2</sub>O</td><td>76.6</td><td>-138.0±.25</td><td>575</td></tr>
<tr><td>10</td><td>TiCl<sub>4</sub>-VOCl<sub>3</sub></td><td>18.6</td><td>-88.0</td><td>659</td></tr>
<tr><td>25</td><td>AsBr<sub>3</sub>-S<sub>2</sub>Br<sub>2</sub></td><td>13.5</td><td>-56.0</td><td>453 1081</td></tr>
<tr><td>30</td><td>GeCl<sub>4</sub>-SnCl<sub>4</sub></td><td>91SERSOLIDSOL</td><td>-51.3</td><td>2732</td></tr>
<tr><td>8</td><td>PCl<sub>3</sub>-TeCl<sub>4</sub></td><td>100APP</td><td>-91.0</td><td>2821</td></tr>
<tr><td>23</td><td>FeCl<sub>3</sub>-GeCl<sub>4</sub>-TeCl<sub>4</sub></td><td>NA</td><td>-59.0APP</td><td>2849</td></tr>
</table>
"""


def test_table_html_flattens_subscripts_and_columns():
    lines = table_html_to_lines(_SAMPLE)
    by = {int(line.split()[0]): line for line in lines}
    assert by[1] == "1  BF3-N2O  76.6  -138.0 +.25  575"
    assert by[10] == "10  TiCl4-VOCl3  18.6  -88.0  659"
    assert by[25] == "25  AsBr3-S2Br2  13.5  -56.0  453 1081"
    assert by[30] == "30  GeCl4-SnCl4  91 SER SOLID SOL  -51.3  2732"
    assert by[8] == "8  PCl3-TeCl4  100 APP  -91.0  2821"
    assert by[23] == "23  FeCl3-GeCl4-TeCl4  NA  -59.0 APP  2849"


def test_vlm_html_lines_parse_through_entry_index():
    text = "\n".join(table_html_to_lines(_SAMPLE))
    entries, unparsed = build_nbs_index(text + "\f", page_offset=8)
    assert unparsed == []
    by = {e.entry: e for e in entries}
    assert by[1].system == "BF3-N2O"
    assert by[1].temperature_C == -138.0
    assert by[1].uncertainty_C == 0.25
    assert by[25].system == "AsBr3-S2Br2"
    assert by[30].composition_mol == [91.0, 9.0]
    assert by[8].approximate_composition is True
    assert by[23].approximate_temperature is True
