"""
Unit tests for NBS Table I reference repair (notes, multi-ref wrap, no-T rows).
"""
from __future__ import annotations

from phase_diagrams.nbs.nbs_entry_index import build_nbs_index
from phase_diagrams.nbs.nbs_ref_repair import (
    PdfRefRow,
    choose_refs,
    format_dump_line,
    parse_dump_line,
    repair_dump_lines,
)


def test_parse_moves_note_from_refs_onto_temperature():
    fields = parse_dump_line("3562  CsCl-KBr  NA  580.0  SER SOLID SOL")
    assert fields is not None
    assert fields.temperature == "580.0 SER SOLID SOL"
    assert fields.refs == []


def test_choose_refs_extends_prefix_from_pdf():
    pdf = PdfRefRow(refs=["42", "55", "63", "96", "98", "156", "259", "370", "461", "815"])
    chosen, note = choose_refs(["42"], pdf)
    assert chosen == pdf.refs
    assert note is None


def test_choose_refs_keeps_dump_when_pdf_truncated():
    chosen, note = choose_refs(["2900"], PdfRefRow(refs=["29"]))
    assert chosen == ["2900"]
    assert note is not None and "truncated" in note


def test_repair_no_temperature_moves_ref():
    lines = [
        "6188  UN-W  100 APP  2700.0 GT  2736",
        "6190  PuF6-UF6  NO MINIMUM REPORTED  2099",
        "6223  Al2O3-Na2O  70  972",
    ]
    pdf = {
        6188: PdfRefRow(refs=["2736"], has_temperature=True, temperature_text="2700.0 GT"),
        6190: PdfRefRow(refs=["2099"], has_temperature=False),
        6223: PdfRefRow(refs=["972"], has_temperature=False),
    }
    new_lines, anomalies, missing = repair_dump_lines(lines, pdf)
    by = {parse_dump_line(ln).entry: parse_dump_line(ln) for ln in new_lines}  # type: ignore[union-attr]
    assert by[6190].temperature == "NA"
    assert by[6190].refs == ["2099"]
    assert by[6223].temperature == "NA"
    assert by[6223].refs == ["972"]
    assert missing == []
    assert any("temperature drop" in a for a in anomalies) is False  # 6188→6190 NA skips


def test_repair_3562_and_3583_and_monotonicity_note():
    lines = [
        "3561  CsBr-KCl  SER SOLID SOL  580.0  2758",
        "3562  CsCl-KBr  NA  580.0  SER SOLID SOL",
        "3583  CaCl2-KCl  25  583.0  42",
        "6188  UN-W  100 APP  2700.0 GT  2736",
        "6189  CsI-NaCNS  10.8  280.4  1940",
    ]
    pdf = {
        3561: PdfRefRow(refs=["2758"], has_temperature=True, temperature_text="580.0"),
        3562: PdfRefRow(refs=["2758"], has_temperature=True, temperature_text="580.0 SER SOLID SOL"),
        3583: PdfRefRow(
            refs=["42", "55", "63", "96", "98", "156", "259", "370", "461", "815"],
            has_temperature=True,
            temperature_text="583.0",
        ),
        6188: PdfRefRow(refs=["2736"], has_temperature=True, temperature_text="2700.0 GT"),
        6189: PdfRefRow(refs=["1940"], has_temperature=True, temperature_text="280.4"),
    }
    new_lines, anomalies, missing = repair_dump_lines(lines, pdf)
    by = {f.entry: f for ln in new_lines if (f := parse_dump_line(ln))}
    assert by[3562].refs == ["2758"]
    assert "SER SOLID SOL" in by[3562].temperature
    assert by[3583].refs == pdf[3583].refs
    assert any("6189: temperature drop" in a for a in anomalies)
    assert missing == []
    # Round-trip through entry parser
    text = "\n".join(format_dump_line(by[e]) for e in sorted(by)) + "\f"
    entries, unparsed = build_nbs_index(text, 8)
    assert unparsed == []
    parsed = {e.entry: e for e in entries}
    assert parsed[3562].references == ["2758"]
    assert parsed[3562].temperature_C == 580.0
    assert any("SER SOLID SOL" in n for n in parsed[3562].notes)
    assert parsed[3583].references == pdf[3583].refs
    assert parsed[6189].temperature_C == 280.4


def test_parser_null_temperature_for_no_t_rows():
    text = "6190  PuF6-UF6  NO MINIMUM REPORTED  NA  2099\f"
    entries, unparsed = build_nbs_index(text, 8)
    assert unparsed == []
    assert entries[0].temperature_C is None
    assert entries[0].references == ["2099"]
    assert any("MINIMUM" in n.upper() or "composition" in n for n in entries[0].notes)
