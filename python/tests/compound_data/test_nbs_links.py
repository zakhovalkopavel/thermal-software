"""NBS 298.15 K values fill an empty phase and leave a value that is already there."""
from __future__ import annotations

from pathlib import Path

from compound_data.compound_record import CompoundRecord
from compound_data.nbs_links import attach_nbs, nbs_values
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.source_link import SourceLink
from references import RefKey

CSV = """\
,,,,,,0 K,298.15 K,,,,,,
Formula,Solvent,Name,State Description,State,Molar Mass,dH0,dH,dG,HH0,S,Cp,
O2,,,,g,31.9988,0,0,0,8.680,205.138,29.355
O2,,,,ao,31.9988,-,-11.7,16.4,-,110.9,-
O<sup>+</sup>,,,,g,15.9994,1560.716,1568.770,-,-,-,-
H2O2,in 1.0 H2O,,,,34.0148,-,-189.807,-,-,-,-
S,,,,cr,32.064,0,0,-,-,31.80,22.64
S,,,"monoclinic",cr2,32.064,-,0.33,-,-,-,-
Al2O3,,,,cr,101.961,-,-1675.7,-,-,-,79.0
C2H6O,,,,l,46.069,-,-277.6,-,-,-,-
D2O,,,,l,20.028,-,-294.6,-,-,-,-
"""


def _record(id_: str, formula: str, hill: str, elements: list[str], compound_class: str = "inorganic") -> CompoundRecord:
    return CompoundRecord(
        id=id_, cas=id_ if not id_.startswith("formula:") else None, formula=formula, hill=hill,
        display_formula=formula, elements=elements, compound_class=compound_class, group=elements[0],
    )


def _csv(tmp_path: Path) -> Path:
    path = tmp_path / "nbs.csv"
    path.write_text(CSV, encoding="utf-8")
    return path


def test_gap_is_filled_and_an_existing_phase_is_kept(tmp_path: Path):
    oxygen = _record("7782-44-7", "O2", "O2", ["O"])
    oxygen.properties["enthalpyFormation298"] = [
        PropertyValue(1.0, RefKey.CRC95, SourceLink("CRC", "crcStdThermo", "", RefKey.CRC95, 1), "gas"),
    ]
    sulfur = _record("7704-34-9", "S", "S", ["S"])
    alumina = [
        _record("1344-28-1", "Al2O3", "Al2O3", ["Al", "O"]),
        _record("11092-32-3", "Al2O3", "Al2O3", ["Al", "O"]),
    ]
    isomers = [
        _record("64-17-5", "C2H6O", "C2H6O", ["C", "H", "O"], "organic"),
        _record("115-10-6", "C2H6O", "C2H6O", ["C", "H", "O"], "organic"),
    ]
    records = [oxygen, sulfur, *alumina, *isomers]
    issues, counts = attach_nbs(records, _csv(tmp_path))

    assert oxygen.properties["enthalpyFormation298"] == [
        PropertyValue(1.0, RefKey.CRC95, SourceLink("CRC", "crcStdThermo", "", RefKey.CRC95, 1), "gas"),
    ]
    entropy = oxygen.properties["entropy298"][0]
    assert entropy.value == 205.138 and entropy.phase == "gas"
    assert entropy.to_dict()["ref"] == ["NBS1982", 3, "nbsTables"]
    assert oxygen.properties["heatCapacity298"][0].value == 29.355
    assert oxygen.properties["gibbsEnergy298"][0].value == 0

    formed = sulfur.properties["enthalpyFormation298"][0]
    assert formed.value == 0 and "variant" not in formed.to_dict()
    assert sulfur.properties["entropy298"][0].value == 31.8
    assert sulfur.properties["heatCapacity298"][0].value == 22.64

    for record in alumina:
        assert record.properties["enthalpyFormation298"][0].value == -1_675_700
        assert record.properties["heatCapacity298"][0].value == 79.0
    assert all(not record.properties for record in isomers)
    assert issues == [issues[0]] and issues[0]["issue"] == "nbsFormulaAmbiguous" and issues[0]["formula"] == "C2H6O"
    assert counts == {"nbsValues": 10, "nbsFilled": 10, "nbsNoRecord": 0, "nbsAmbiguous": 1}
    assert RefKey.NBS1982.value in oxygen.refs()


def test_real_table_keeps_the_o2_gas_heat_capacity():
    path = Path("shared/sources/NBS/NBS_Tables_with_ErratumValues.csv")
    chosen = {(item.hill, item.phase, item.property): item for item in nbs_values(path)}
    heat = chosen["O2", "gas", "heatCapacity298"]
    assert heat.value == 29.355 and heat.variant is None
    assert all("<" not in item.formula for item in chosen.values())
