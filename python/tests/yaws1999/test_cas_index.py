"""Two-column CAS registry index splitting."""
from __future__ import annotations

from yaws1999.cas_index import (
    looks_like_cas_index,
    parse_cas_index_entry,
    parse_cas_index_lines,
    split_cas_index_line,
)


def test_split_dual_column_line():
    line = "78-97-7 LACTONITRILE C3H5NO 95-80-7 TOLUENEDIAMINE C7H10N2"
    parts = split_cas_index_line(line)
    assert parts == [
        "78-97-7 LACTONITRILE C3H5NO",
        "95-80-7 TOLUENEDIAMINE C7H10N2",
    ]


def test_split_single_column_line():
    line = "103-03-2 1-NITROPROPANE C3H7NO2"
    assert split_cas_index_line(line) == [line]


def test_parse_entry_cleans_formula_oxygen():
    entry = parse_cas_index_entry(
        "79-09-4 PROPIONIC ACID C3H602",
        650,
        column=0,
        line=1,
        raw="79-09-4 PROPIONIC ACID C3H602 96-33-3 METHYL ACRYLATE C4H602",
    )
    assert entry is not None
    assert entry.cas == "79-09-4"
    assert entry.name == "PROPIONIC ACID"
    assert entry.formula == "C3H6O2"
    assert entry.formula_raw == "C3H602"

    glyceryl = parse_cas_index_entry(
        "102-76-1 GLYCERYL TRIACETATE C9H1406",
        650,
        column=1,
        line=2,
        raw="x",
    )
    assert glyceryl is not None
    assert glyceryl.formula == "C9H14O6"

    phenol = parse_cas_index_entry(
        "80-46-6 p-tert-AMYLPHENOL C11H160",
        650,
        column=0,
        line=3,
        raw="x",
    )
    assert phenol is not None
    assert phenol.formula == "C11H16O"

    # Must not turn carbon count C10 into C1O.
    butyl = parse_cas_index_entry(
        "98-54-4 p-tert-BUTYLPHENOL C10H140",
        650,
        column=0,
        line=4,
        raw="x",
    )
    assert butyl is not None
    assert butyl.formula == "C10H14O"


def test_parse_page_column_major_order():
    lines = [
        "659",
        "78-97-7 LACTONITRILE C3H5NO 95-80-7 TOLUENEDIAMINE C7H10N2",
        "78-99-9 1,1-DICHLOROPROPANE C3H6Cl2 95-87-4 2,5-XYLENOL C8H10O",
    ]
    parsed = parse_cas_index_lines(lines, 650)
    assert parsed.dual_lines == 2
    assert len(parsed.entries) == 4
    assert [e.cas for e in parsed.entries] == [
        "78-97-7",
        "78-99-9",
        "95-80-7",
        "95-87-4",
    ]
    assert [e.column for e in parsed.entries] == [0, 0, 1, 1]
    # Left column first, then right — sequential table-style ids.
    assert [e.id for e in parsed.entries] == [1, 2, 3, 4]
    row = parsed.entries[0].to_dict()
    assert row == {
        "id": 1,
        "cas": "78-97-7",
        "name": "LACTONITRILE",
        "formula": "C3H5NO",
    }
    assert "line" not in row
    assert "djvuPage" not in row
    assert "raw" not in row
    assert "column" not in row


def test_looks_like_cas_index_on_sample():
    lines = [
        "659",
        "78-97-7 LACTONITRILE C3H5NO 95-80-7 TOLUENEDIAMINE C7H10N2",
        "78-99-9 1,1-DICHLOROPROPANE C3H6Cl2 95-87-4 2,5-XYLENOL C8H10O",
        "79-00-5 1,1,2-TRICHLOROETHANE C2H3Cl3 95-92-1 DIETHYL OXALATE C6H10O4",
        "79-01-6 TRICHLOROETHYLENE C2HCl3 95-93-2 1,2,4,5-TETRAMETHYLBENZENE C10H14",
        "79-02-7 DICHLOROACETALDEHYDE C2H2Cl2O 96-14-0 3-METHYLPENTANE C6H14",
    ]
    assert looks_like_cas_index(lines) is True
    assert looks_like_cas_index(["Table 1-1 Heat Capacity", "1 H2 HYDROGEN 1 2 3"]) is False


def test_formula_first_single_and_dual_lines():
    """Appendix C layout: FORMULA NAME CAS (page 648 leftovers, dual cols)."""
    single = parse_cas_index_entry(
        "SiCl4 SILICON TETRACHLORIDE 10026-04-7",
        648,
        column=0,
        line=1,
        raw="x",
    )
    assert single is not None
    assert single.cas == "10026-04-7"
    assert single.formula == "SiCl4"
    assert single.name == "SILICON TETRACHLORIDE"

    dual = split_cas_index_line(
        "Ge GERMANIUM 7440-56-4 NaI SODIUM IODIDE 7681-82-5"
    )
    assert dual == [
        "Ge GERMANIUM 7440-56-4",
        "NaI SODIUM IODIDE 7681-82-5",
    ]
    parsed = parse_cas_index_lines(
        [
            "657",
            "SiCl4 SILICON TETRACHLORIDE 10026-04-7",
            "SiF4 SILICON TETRAFLUORIDE 7783-61-1",
            "Sm SAMARIUM 7440-19-9",
            "Sn TIN 7440-31-5",
            "Sr STRONTIUM 7440-24-6",
        ],
        648,
    )
    assert looks_like_cas_index(parsed and [
        "657",
        "SiCl4 SILICON TETRACHLORIDE 10026-04-7",
        "SiF4 SILICON TETRAFLUORIDE 7783-61-1",
        "Sm SAMARIUM 7440-19-9",
        "Sn TIN 7440-31-5",
        "Sr STRONTIUM 7440-24-6",
    ])
    assert [e.cas for e in parsed.entries] == [
        "10026-04-7",
        "7783-61-1",
        "7440-19-9",
        "7440-31-5",
        "7440-24-6",
    ]


def test_missing_cas_left_column_splits_inorganic_right():
    """Page 657 transition: ----- organics | CAS inorganics."""
    line = "----- DECYL-PROPYL-SULFIDE C13H28S 1317-98-2 ANTIMONY TRIOXIDE Sb203"
    parts = split_cas_index_line(line)
    assert parts[0].startswith("-----")
    assert parts[1].startswith("1317-98-2")
    parsed = parse_cas_index_lines(
        [
            "INORGANICS The following compilation for inorganics provides the compound list by CAS registry number, name, and chemical formula.",
            "666",
            line,
            "----- DODECYL-METHYL-SULFIDE C13H28S 1327-53-3 ARSENIC TRIOXIDE As203",
            "----- ETHYL-UNDECYL-SULFIDE C13H28S 1333-74-0 HYDROGEN H2",
            "----- 1- TRIDECANETHIOL C13H28S 1336-21-6 AMMONIUM HYDROXIDE NH50",
            "----- 2- BUTYLNAPHTHALENE C14H16 1344-28-1 ALUMINUM OXIDE Al203",
        ],
        657,
    )
    assert looks_like_cas_index(
        [
            "INORGANICS The following compilation for inorganics provides the compound list by CAS registry number, name, and chemical formula.",
            "666",
            line,
            "----- DODECYL-METHYL-SULFIDE C13H28S 1327-53-3 ARSENIC TRIOXIDE As203",
            "----- ETHYL-UNDECYL-SULFIDE C13H28S 1333-74-0 HYDROGEN H2",
            "----- 1- TRIDECANETHIOL C13H28S 1336-21-6 AMMONIUM HYDROXIDE NH50",
            "----- 2- BUTYLNAPHTHALENE C14H16 1344-28-1 ALUMINUM OXIDE Al203",
        ]
    )
    assert [e.cas for e in parsed.entries] == [
        "1317-98-2",
        "1327-53-3",
        "1333-74-0",
        "1336-21-6",
        "1344-28-1",
    ]
    assert parsed.entries[0].name == "ANTIMONY TRIOXIDE"
    assert parsed.entries[0].formula == "Sb2O3"
