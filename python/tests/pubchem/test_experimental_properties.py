"""Flatten Experimental Properties into heading + citation[]; catalog sources without page."""
from __future__ import annotations

from pathlib import Path

from pubchem.experimental_value import ExperimentalCitation, ExperimentalProperty, ExperimentalQuantity
from pubchem.parsers.experimental_properties import (
    citation_ref_code, depositor_ref_code, page_of, parse_experimental, parse_quantities, strip_page,
)
from pubchem.pubchem_records_writer import append_pubchem_record, compact_pubchem_files
from pubchem.pubchem_references import read_pubchem_references, register_sources
from pubchem.pubchem_view import PubchemView
from pubchem_fixtures import pubchem_record

_CRC = (
    "Lide, D.R. CRC Handbook of Chemistry and Physics 88TH Edition 2007-2008. "
    "CRC Press, Taylor & Francis, Boca Raton, FL 2007, p. 4-57"
)
_CRC_OTHER = (
    "Haynes, W.M. (ed.). CRC Handbook of Chemistry and Physics 88TH Edition 2007-2008. "
    "CRC Press, Boca Raton, FL 2007, p. 4-57"
)
_MERCK = "O'Neil, M.J. (ed.). The Merck Index - An Encyclopedia of Chemicals. Cambridge, 2013., p. 396"
_Q = ExperimentalQuantity


def _body() -> dict:
    return {
        "Record": {
            "RecordNumber": 62750,
            "Reference": [{
                "ReferenceNumber": 24, "SourceName": "Hazardous Substances Data Bank (HSDB)",
                "SourceID": "7906", "Name": "X", "Description": "Long HSDB essay — must not be stored",
                "URL": "https://example.test/hsdb", "ANID": 99, "IsToxnet": True,
            }],
            "Section": [{"TOCHeading": "Experimental Properties", "Section": [
                {"TOCHeading": "Melting Point", "Information": [{
                    "ReferenceNumber": 24,
                    "Description": "PEER REVIEWED",
                    "Reference": [_CRC, _MERCK],
                    "Value": {"StringWithMarkup": [{"String": "342.3 °C"}]},
                }]},
            ]}],
        },
    }


class TestParseQuantities:
    def test_keeps_original_and_splits_spec_number_unit(self):
        text = "Red: Triple point = 590 °C; sublimation point = 431 °C"
        assert parse_quantities(text) == [
            _Q(590.0, "°C", "Red: Triple point"),
            _Q(431.0, "°C", "sublimation point"),
        ]

    def test_range_shares_unit(self):
        assert parse_quantities("100-120 °C") == [_Q(100.0, "°C"), _Q(120.0, "°C")]

    def test_comma_thousands_and_fahrenheit(self):
        assert parse_quantities("MP: 1,605 °C") == [_Q(1605.0, "°C", "MP")]
        assert parse_quantities("1517 °F") == [_Q(1517.0, "°F")]

    def test_density_unit(self):
        assert parse_quantities("7.23 g/cm³") == [_Q(7.23, "g/cm³")]

    def test_no_quantity(self):
        assert parse_quantities("white") == []


class TestParseExperimental:
    def test_stem_has_no_page_or_hash(self):
        assert citation_ref_code(_CRC) == "CRCHandbook-ed88-2007"
        assert citation_ref_code(_MERCK) == "MerckIndex-2013"
        assert depositor_ref_code("Hazardous Substances Data Bank (HSDB)", "6341") == "HSDB-6341"

    def test_parse_groups_citations_under_heading(self):
        properties, refs = parse_experimental(_body(), 62750)
        qty = (_Q(342.3, "°C"),)
        assert properties == [
            ExperimentalProperty("Melting Point", (
                ExperimentalCitation("342.3 °C", qty, "CRCHandbook-ed88-2007", None, "4-57", strip_page(_CRC)),
                ExperimentalCitation("342.3 °C", qty, "MerckIndex-2013", None, "396", strip_page(_MERCK)),
            )),
        ]
        assert {r["refCode"] for r in refs} == {"CRCHandbook-ed88-2007", "MerckIndex-2013"}
        assert all("page" not in r and "p. 4-57" not in r["source"] for r in refs)

    def test_register_assigns_index_and_disambiguates_stem(self, tmp_path: Path):
        path = tmp_path / "pubchem-references.jsonl"
        properties, pending = parse_experimental(_body(), 1)
        pending.append({
            "refCode": "CRCHandbook-ed88-2007", "source": strip_page(_CRC_OTHER),
        })
        updated, new_rows = register_sources(path, properties, pending)
        assert [r["refNumber"] for r in new_rows] == [1, 2, 3]
        assert {r["refCode"] for r in new_rows} == {
            "CRCHandbook-ed88-2007", "MerckIndex-2013", "CRCHandbook-ed88-2007-2",
        }
        assert all("page" not in r for r in new_rows)
        cite = updated[0].citation[0]
        assert cite.ref_number == 1 and cite.ref_code == "CRCHandbook-ed88-2007"
        assert cite.ref_page == "4-57" and cite.source is None
        assert cite.to_json() == {
            "text": "342.3 °C",
            "values": [{"number": 342.3, "unit": "°C"}],
            "refCode": "CRCHandbook-ed88-2007", "refNumber": 1, "refPage": "4-57",
        }
        multi = parse_quantities("Red: Triple point = 590 °C; sublimation point = 431 °C")
        assert [q.to_json() for q in multi] == [
            {"spec": "Red: Triple point", "number": 590.0, "unit": "°C"},
            {"spec": "sublimation point", "number": 431.0, "unit": "°C"},
        ]

    def test_depositor_only(self):
        body = {
            "Record": {
                "Reference": [{"ReferenceNumber": 1, "SourceName": "CAMEO Chemicals", "SourceID": "8234",
                               "URL": "https://example.test/cameo"}],
                "Section": [{"TOCHeading": "Color", "Information": [
                    {"ReferenceNumber": 1, "Value": {"StringWithMarkup": [{"String": "white"}]}}]}],
            },
        }
        properties, refs = parse_experimental(body, 1)
        assert properties[0].citation[0].ref_code == "CAMEO-8234"
        assert properties[0].citation[0].text == "white"
        assert properties[0].citation[0].values == ()
        assert properties[0].citation[0].source == "CAMEO Chemicals"
        assert refs[0]["refCode"] == "CAMEO-8234" and refs[0]["url"] == "https://example.test/cameo"

    def test_empty_body(self):
        assert parse_experimental(None, 1) == ([], [])

    def test_page_helper(self):
        assert page_of("… p. 4-57") == "4-57"
        assert strip_page(_CRC).endswith("2007") and "4-57" not in strip_page(_CRC)


class TestSlimStorage:
    def test_append_writes_citation_and_catalog_without_source_on_value(self, tmp_path: Path):
        view = PubchemView.from_experimental_response(62750, "2026-10-14T10:00:00+00:00", 200, "https://x", _body())
        record = pubchem_record("12182-83-1", "inorganic", [{"CID": 62750, "MolecularFormula": "X"}],
                                experimental=(view,))
        path = tmp_path / "pubchem-inorganic.jsonl"
        append_pubchem_record(path, record)
        line = path.read_text(encoding="utf-8")
        assert '"citation":' in line
        assert '"text": "342.3 °C"' in line
        assert '"number": 342.3' in line and '"unit": "°C"' in line
        assert '"refCode": "CRCHandbook-ed88-2007"' in line
        assert '"refNumber": 1' in line
        assert '"refPage": "4-57"' in line
        assert _CRC[:40] not in line
        assert "a1b2c3d4" not in line and "Long HSDB essay" not in line
        refs = read_pubchem_references(tmp_path / "pubchem-references.jsonl")
        assert refs["CRCHandbook-ed88-2007"]["refNumber"] == 1
        assert "page" not in refs["CRCHandbook-ed88-2007"]
        assert "p. 4-57" not in refs["CRCHandbook-ed88-2007"]["source"]
        assert refs["MerckIndex-2013"]["refNumber"] == 2
        append_pubchem_record(path, record)
        assert len(read_pubchem_references(tmp_path / "pubchem-references.jsonl")) == 2
        assert compact_pubchem_files([path]) == 1  # second compound line superseded; refs keep numbers
