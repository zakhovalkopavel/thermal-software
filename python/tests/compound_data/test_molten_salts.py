"""Pure molten salts become liquid equations. A mixture is stored apart from compound records."""
from __future__ import annotations

import json
import math
from pathlib import Path

from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.source_link import SourceLink
from compound_data.compound_record import CompoundRecord
from compound_data.constants.molten_salt_source import MOLTEN_SALT_DIR, MOLTEN_SALT_R
from compound_data.merger import order_values
from compound_data.molten_salt_links import attach_molten_salts
from compound_data.molten_salt_mixtures import read_molten_salt_mixtures, write_molten_salt_mixtures
from references import RefKey

HEADER = (
    "Density in g/cm3\n"
    "Salt,Composition range,Data type,T min (K),T max (K),Uncertainty,Data 1,Data 2,Data 3,Data 4,Data 5,Comment\n"
)
ROWS = """\
NaCl,100,P1,1080,1210,1%,2.1393,-5.43E-4,,,,,
NaCl,100,P1,1080,1500,2%,1.9,-4.0E-4,,,,,a wider range
AgBr-AgCl,22.7-77.3,P1,720,850,,5.818,-0.00108,,,,,
AgBr-AgCl,100-0,P1,720,870,,6.31,-0.00104,,,,,
AgBr-AgCl,100,P1,720,870,,6.31,-0.00104,,,,,
AgBr-KCl,0-100 AgBr,I1,1073,,,1.5,0.02,,,,,
AgI-AgNO3,0-100,DP,,,,3.954,498K,,,,,
Data compiled and evaluated by the Molten Salts Data Center-RPI, notes
"""


def _record(id_: str, formula: str, hill: str, elements: list[str]) -> CompoundRecord:
    return CompoundRecord(
        id=id_, cas=id_, formula=formula, hill=hill, display_formula=formula, elements=elements,
        compound_class="inorganic", group=elements[0],
    )


def _dir(tmp_path: Path) -> Path:
    path = tmp_path / "density-csv.csv"
    path.write_text(HEADER + ROWS, encoding="utf-8")
    return tmp_path


def test_a_different_equation_is_kept_and_the_same_one_is_not(tmp_path: Path):
    salt = _record("7647-14-5", "NaCl", "ClNa", ["Na", "Cl"])
    salt.equations["density"] = {"liquid": [
        EquationValue(
            EquationType.linear, RefKey.CRC95, {"a": 1.0, "b": -0.001}, 1000, 1100,
            SourceLink("CRC molten", "crcMolten", "", RefKey.CRC95, 4, "NaCl"),
        ),
    ]}
    issues, counts, _tables = attach_molten_salts([salt], _dir(tmp_path))
    order_values(salt)

    values = salt.equations["density"]["liquid"]
    assert issues == []
    assert values[0].ref == RefKey.CRC95
    assert [v.vars for v in values[1:]] == [
        {"a": 2.1393, "b": -0.000543},
        {"a": 1.9, "b": -0.0004},
    ]
    assert values[1].k == 1000 and values[1].min == 1080 and values[1].max == 1210
    assert values[1].source.to_ref() == ["NISTMoltenSalts", 3, "moltenSaltDensity"]
    assert counts["moltenFilled"] == 2 and counts["moltenSame"] == 0

    again, again_counts, _tables = attach_molten_salts([salt], _dir(tmp_path))
    assert again == []
    assert again_counts["moltenFilled"] == 0 and again_counts["moltenSame"] == 2
    assert len(salt.equations["density"]["liquid"]) == 3


def test_a_mixture_is_not_a_compound_record(tmp_path: Path):
    directory = _dir(tmp_path)
    mixtures, tables, counts = read_molten_salt_mixtures(directory)
    by_id = {mix["id"]: mix for mix in mixtures}

    assert "NaCl" not in by_id
    assert "Data compiled and evaluated by the Molten Salts Data Center-RPI, notes" not in by_id
    binary = by_id["AgBr-AgCl"]
    assert binary["components"] == [
        {"formula": "AgBr", "hill": "AgBr"}, {"formula": "AgCl", "hill": "AgCl"},
    ]
    assert "cas" not in binary
    fits = binary["properties"]["density"]
    assert [fit["composition"] for fit in fits] == [[22.7, 77.3], [100.0, 0.0]]
    assert fits[0]["type"] == "linear" and fits[0]["k"] == 1000
    assert fits[1]["ref"] == ["NISTMoltenSalts", 6, "moltenSaltDensity"]

    isotherm = by_id["AgBr-KCl"]["properties"]["density"][0]
    assert isotherm["composition"] == {"range": [0.0, 100.0], "of": "AgBr"}
    assert isotherm["dataType"] == "I1" and "type" not in isotherm
    assert isotherm["vars"] == {"a": 1.5, "b": 0.02} and isotherm["min"] == 1073

    point = by_id["AgI-AgNO3"]["properties"]["density"][0]
    assert point["dataType"] == "DP" and point["T"] == 498 and point["value"] == 3.954
    assert counts == {"moltenMixtures": 3, "moltenMixtureValues": 4, "moltenMixtureSkipped": 0}
    assert [table.key for table in tables] == ["moltenSaltDensity"]

    written = json.loads(write_molten_salt_mixtures(tmp_path / "out", mixtures, tables, "2026-11-02T00:00:00+00:00")
                         .read_text(encoding="utf-8"))
    assert written["url"] == "https://data.nist.gov/pdr/lps/ark:/88434/mds2-2298"
    assert written["count"] == 3
    assert all("cas" not in mix for mix in written["mixtures"])


def test_real_extract_keeps_agbr_on_the_compound_and_the_binary_apart():
    agbr = _record("7727-15-3", "AgBr", "AgBr", ["Ag", "Br"])
    _issues, _counts, _tables = attach_molten_salts([agbr], MOLTEN_SALT_DIR)
    density = agbr.equations["density"]["liquid"][0]
    assert density.vars == {"a": 6.307, "b": -0.001035} and density.min == 720 and density.max == 940
    viscosity = agbr.equations["viscosity"]["liquid"][0]
    assert viscosity.type == EquationType.dipprN101
    assert viscosity.vars["c2"] == float(f"{12920.41 / MOLTEN_SALT_R:.12g}")
    assert math.isclose(
        math.exp(viscosity.vars["c1"] + viscosity.vars["c2"] / 800) * viscosity.k,
        0.3806 * math.exp(12920.41 / (MOLTEN_SALT_R * 800)) * 0.001,
    )

    mixtures, tables, counts = read_molten_salt_mixtures(MOLTEN_SALT_DIR)
    ids = {mix["id"] for mix in mixtures}
    assert "AgBr" not in ids and "AgBr-AgCl" in ids
    assert not any(mix["id"].startswith("Data ") for mix in mixtures)
    assert "moltenSaltConductivity" in {table.key for table in tables}
    assert counts["moltenMixtures"] > 700 and counts["moltenMixtureValues"] > 8000
