"""Appendix E name / synonym list parsing."""
from __future__ import annotations

from yaws1999.synonym_index import (
    group_synonym_rows,
    looks_like_synonym_index,
    parse_synonym_index_entry,
    parse_synonym_index_lines,
)


def test_parse_entry_basic():
    entry = parse_synonym_index_entry(
        "2-AB C4H11N sec-BUTYLAMINE 13952-84-6",
        660,
        line_no=1,
        raw="2-AB C4H11N sec-BUTYLAMINE 13952-84-6",
    )
    assert entry is not None
    assert entry.synonym == "2-AB"
    assert entry.formula == "C4H11N"
    assert entry.name == "sec-BUTYLAMINE"
    assert entry.cas == "13952-84-6"


def test_parse_entry_multiword_synonym_and_oxygen_cleanup():
    entry = parse_synonym_index_entry(
        "ACETIC ACID VINYL ESTER C4H602 VINYL ACETATE 108-05-4",
        660,
        line_no=2,
        raw="x",
    )
    assert entry is not None
    assert entry.synonym == "ACETIC ACID VINYL ESTER"
    assert entry.formula == "C4H6O2"
    assert entry.formula_raw == "C4H602"
    assert entry.name == "VINYL ACETATE"
    assert entry.cas == "108-05-4"


def test_parse_entry_missing_cas_placeholder():
    entry = parse_synonym_index_entry(
        "BUTYL-DECYL-SULFIDE C14H30S BUTYL-DECYL-SULFIDE -----",
        673,
        line_no=3,
        raw="x",
    )
    assert entry is not None
    assert entry.cas is None
    assert entry.formula == "C14H30S"
    assert entry.name == "BUTYL-DECYL-SULFIDE"


def test_parse_entry_digit_free_formula():
    entry = parse_synonym_index_entry(
        "CARBON MONOXIDE CO CARBON MONOXIDE 630-08-0",
        700,
        line_no=1,
        raw="x",
    )
    assert entry is not None
    assert entry.synonym == "CARBON MONOXIDE"
    assert entry.formula == "CO"
    assert entry.name == "CARBON MONOXIDE"
    assert entry.cas == "630-08-0"


def test_parse_page_groups_synonyms_by_cas():
    lines = [
        "Appendix ECOMPOUND LIST BY NAME AND SYNONYM",
        "ORGANICS The following compilation for organics provides the compound list",
        "669",
        "Name (Synonym) Formula Name in Tables CAS Reg. No",
        "2-AB C4H11N sec-BUTYLAMINE 13952-84-6",
        "ACETAAL C6H14O2 ACETAL 105-57-7",
        "ACETAL C6H14O2 ACETAL 105-57-7",
        "ABIETIC ACID C20H30O2 ABIETIC ACID 514-10-3",
    ]
    parsed = parse_synonym_index_lines(lines, 660)
    assert len(parsed.entries) == 3
    assert parsed.entries[0].synonyms == ["2-AB"]
    assert parsed.entries[1].to_dict() == {
        "id": 2,
        "synonyms": ["ACETAAL", "ACETAL"],
        "formula": "C6H14O2",
        "name": "ACETAL",
        "cas": "105-57-7",
    }
    assert parsed.entries[2].cas == "514-10-3"
    assert parsed.unparsed == []
    row = parsed.entries[0].to_dict()
    assert "synonym" not in row
    assert "line" not in row
    assert "djvuPage" not in row
    assert "raw" not in row


def test_group_synonym_rows_merges_across_pages():
    rows = [
        {
            "id": 1,
            "synonyms": ["ACETAAL", "ACETAL"],
            "formula": "C6H14O2",
            "name": "ACETAL",
            "cas": "105-57-7",
        },
        {
            "id": 5,
            "synonyms": ["ACETIC ALDEHYDE"],
            "formula": "C2H4O",
            "name": "ACETALDEHYDE",
            "cas": "75-07-0",
        },
        {
            "synonym": "ACETALDEHYD",
            "formula": "C2H4O",
            "name": "ACETALDEHYDE",
            "cas": "75-07-0",
        },
    ]
    grouped = group_synonym_rows(rows)
    assert len(grouped) == 2
    assert grouped[0].synonyms == ["ACETAAL", "ACETAL"]
    assert grouped[1].synonyms == ["ACETIC ALDEHYDE", "ACETALDEHYD"]
    assert grouped[1].cas == "75-07-0"


def test_looks_like_synonym_index_on_sample():
    lines = [
        "669",
        "Name (Synonym) Formula Name in Tables CAS Reg. No",
        "2-AB C4H11N sec-BUTYLAMINE 13952-84-6",
        "ABIETIC ACID C20H30O2 ABIETIC ACID 514-10-3",
        "ACENAPHTHENE C12H10 ACENAPHTHENE 83-32-9",
        "ACETAL C6H14O2 ACETAL 105-57-7",
        "ACETALDEHYDE C2H4O ACETALDEHYDE 75-07-0",
    ]
    assert looks_like_synonym_index(lines) is True
    assert looks_like_synonym_index(["Table 1-1 Heat Capacity", "1 H2 HYDROGEN"]) is False
    # Book index mentions the appendix title but is not a synonym table.
    assert (
        looks_like_synonym_index(
            [
                "Index",
                "Compound list by name and synonym, 663-772 Conversion table, 643",
            ]
        )
        is False
    )
