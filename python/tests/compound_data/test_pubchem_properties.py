"""PubChem experimental values cite pubchem + refNumber, and scalar properties prefer JANAF, then NIST."""
from __future__ import annotations

from pathlib import Path

from chemicals_tables.property_value import PropertyValue
from chemicals_tables.source_link import SourceLink
from chemicals_tables.table_spec import TableSpec
from compound_data.compound_record import CompoundRecord
from compound_data.janaf_links import attach_janaf
from compound_data.merger import order_values
from compound_data.pubchem_properties import attach_pubchem_properties
from compound_data.pubchem_sources import PubchemSources
from janaf.janaf_table import JanafTable
from janaf.janaf_transition import JanafTransition
from pubchem.experimental_value import ExperimentalCitation, ExperimentalProperty, ExperimentalQuantity
from pubchem.pubchem_answer import PubchemAnswer
from pubchem.pubchem_query import PubchemQuery
from pubchem.pubchem_record import PubchemRecord
from pubchem.pubchem_view import PubchemView
from references import RefKey

RETRIEVED = "2026-10-14T09:30:00+00:00"
PATH = Path("shared/sources/compound-data/pubchem/pubchem-inorganic.jsonl")


def _link(key: str, ref: RefKey | None, ref_text: str | None = None) -> SourceLink:
    return SourceLink("t", key, "", ref, 1, ref_text=ref_text)


def _record(cas: str = "7647-14-5") -> CompoundRecord:
    return CompoundRecord(
        id=cas, cas=cas, formula="NaCl", hill="ClNa", display_formula="NaCl", elements=["Na", "Cl"],
        compound_class="inorganic", group="Na",
    )


def _pubchem(*properties: ExperimentalProperty) -> PubchemSources:
    query = PubchemQuery.cas("7647-14-5")
    body = {"PropertyTable": {"Properties": [{
        "CID": 5234, "MolecularFormula": "ClNa", "MolecularWeight": "58.44", "Title": "Sodium chloride",
    }]}}
    view = PubchemView(5234, RETRIEVED, 200, "https://pubchem.ncbi.nlm.nih.gov/compound/5234", values=properties)
    record = PubchemRecord(query, "inorganic", PubchemAnswer(RETRIEVED, 200, query.url, body), experimental=(view,))
    table = TableSpec("PubChem REST (inorganic)", "idPubchemRestInorganic", str(PATH), None)
    return PubchemSources({"7647-14-5": (record, PATH, 9)}, {PATH: table})


def test_scalar_order_is_janaf_nist_pubchem_then_others_and_the_constants_csv_last():
    record = _record()
    record.properties["meltingPoint"] = [
        PropertyValue(1, RefKey.CRC95, _link("crcConstants", RefKey.CRC95)),
        PropertyValue(2, RefKey.Yaws2014, _link("yawsTb", RefKey.Yaws2014)),
        PropertyValue(3, None, _link("idPubchemRestInorganic", None, "pubchem151")),
        PropertyValue(4, RefKey.NISTWebBook, _link("shomate", RefKey.NISTWebBook)),
        PropertyValue(5, RefKey.NISTJANAF, _link("Na-001", RefKey.NISTJANAF)),
        PropertyValue(6, RefKey.CRC95, _link("crcHfus", RefKey.CRC95)),
    ]
    order_values(record)
    assert [v.value for v in record.properties["meltingPoint"]] == [5, 4, 3, 6, 2, 1]
    assert record.properties["meltingPoint"][2].to_dict()["ref"] == "pubchem151"
    assert record.refs() == ["CRC95", "NISTJANAF", "NISTWebBook", "Yaws2014"]


def test_pubchem_melting_point_is_kelvin_and_not_a_main_reference():
    cite = ExperimentalCitation("801 °C", (ExperimentalQuantity(801, "°C"),), "CRC", 151)
    sources = _pubchem(ExperimentalProperty("Melting Point", (cite,)))
    record = _record()
    counts = attach_pubchem_properties([record], sources)
    value = record.properties["meltingPoint"][0]
    assert value.value == 1074.15 and value.to_dict()["ref"] == "pubchem151" and value.ref is None
    assert record.refs() == []
    assert counts == {"pubchemProperties": 1, "pubchemPropertiesSkipped": 0}


def test_density_keeps_the_density_and_drops_the_temperature_next_to_it():
    cite = ExperimentalCitation(
        "Density (at 15 °C): 3.95 g/cm³",
        (ExperimentalQuantity(15, "°C", "Density (at"), ExperimentalQuantity(3.95, "g/cm³", ")")),
        "CRC", 12,
    )
    reduced = ExperimentalCitation("120 °C at 20 mm Hg", (ExperimentalQuantity(120, "°C at 20 mm Hg"),), "CRC", 13)
    record = _record()
    counts = attach_pubchem_properties(
        [record], _pubchem(ExperimentalProperty("Density", (cite,)), ExperimentalProperty("Boiling Point", (reduced,))),
    )
    assert record.properties["density"][0].value == 3950.0
    assert record.properties["density"][0].to_dict()["ref"] == "pubchem12"
    assert "boilingPoint" not in record.properties
    assert counts["pubchemProperties"] == 1 and counts["pubchemPropertiesSkipped"] == 1


def test_janaf_transitions_become_melting_and_boiling_points():
    table = JanafTable("Na-001", "Sodium", "Na", "Na1", "cr,l", transitions=[
        JanafTransition(370.87, "CRYSTAL <--> LIQUID", 20),
        JanafTransition(1156.0, "LIQUID <--> GAS", 40),
        JanafTransition(900.0, "CRYSTAL <--> GAS", 30),
    ])
    records = {"7440-23-5": _record("7440-23-5")}
    records["7440-23-5"].hill = "Na"
    attach_janaf(records, [table], {("Na", "cr,l", "Sodium"): ("7440-23-5", 1)})
    record = records["7440-23-5"]
    assert record.properties["meltingPoint"][0].value == 370.87
    assert record.properties["meltingPoint"][0].to_dict()["ref"] == ["NISTJANAF", 20, "Na-001"]
    assert record.properties["boilingPoint"][0].to_dict()["ref"] == ["NISTJANAF", 40, "Na-001"]
    assert len(record.properties) == 2
