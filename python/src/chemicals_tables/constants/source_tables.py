"""
chemicals_tables.constants.source_tables — Every chemicals table the dataset reads.

Dict keys are the table names used in the build report; ``TableSpec.key`` is the short file key
written in the dataset (``ref: [RefKey, line, fileKey]``) and listed in ``sources.json``. Paths are
relative to the source folder (``shared/sources/compound-data/chemicals/``), which keeps the
chemicals repo layout. All scalar columns are already SI in the chemicals copies, except the
Lennard-Jones diameter σ (Å, scaled to m); ε/k stays in K.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [37] CRC95, [38] Yaws2014, [34] Perry8, [7] Poling5, [40] TRC1994,
      [39] Zabransky1996, [32] NISTWebBook, [41] VDI2010, [42] Magalhaes2013
"""
from __future__ import annotations

from chemicals_tables.property_column import PropertyColumn as P
from chemicals_tables.table_spec import TableSpec
from references import RefKey


def _crc_standard_columns() -> dict[str, P]:
    columns: dict[str, P] = {}
    for suffix, phase in (("s", "solid"), ("l", "liquid"), ("g", "gas")):
        columns[f"Hf{suffix}"] = P("enthalpyFormation298", "J/mol", phase)
        columns[f"Gf{suffix}"] = P("gibbsEnergy298", "J/mol", phase)
        columns[f"S0{suffix}"] = P("entropy298", "J/(mol K)", phase)
        columns[f"Cp{suffix}"] = P("heatCapacity298", "J/(mol K)", phase)
    return columns


def _lennard_jones_columns() -> dict[str, P]:
    return {
        "molecular_diameter": P("collisionDiameter", "m", scale=1e-10, extra=(("potential", "lennardJones"),)),
        "Stockmayer": P("epsilonToKb", "K", extra=(("potential", "lennardJones"),)),
    }


_TABLES: tuple[TableSpec, ...] = (
    # Scalar tables
    TableSpec(
        "CRC inorganic constants", "crcConstants", "chemicals/Misc/Physical Constants of Inorganic Compounds.csv",
        RefKey.CRC95,
        {"Tm": P("meltingPoint", "K"), "Tb": P("boilingPoint", "K"), "rho": P("density", "kg/m3")},
    ),
    TableSpec(
        "CRC heat of fusion", "crcHfus", "chemicals/Phase Change/CRC Handbook Heat of Fusion.tsv", RefKey.CRC95,
        {"Hfus": P("heatOfFusion", "J/mol")}, formula_column="Formula",
    ),
    TableSpec(
        "CRC standard thermodynamic", "crcStdThermo",
        "chemicals/Heat Capacity/CRC Standard Thermodynamic Properties of Chemical Substances.tsv",
        RefKey.CRC95, _crc_standard_columns(),
    ),
    TableSpec(
        "CRC solid densities", "crcSolidDensity", "chemicals/Density/CRC Solid Inorganic Constant Densities.tsv",
        RefKey.CRC95, {"Vm": P("molarVolume", "m3/mol", "solid")},
    ),
    TableSpec(
        "Yaws critical properties", "yawsCritical", "chemicals/Critical Properties/Yaws Collection.tsv",
        RefKey.Yaws2014,
        {
            "Tc": P("criticalTemperature", "K"),
            "Pc": P("criticalPressure", "Pa"),
            "Vc": P("criticalVolume", "m3/mol"),
            "omega": P("acentricFactor", "1"),
        },
    ),
    TableSpec(
        "Yaws boiling points", "yawsTb", "chemicals/Phase Change/Yaws Boiling Points.tsv", RefKey.Yaws2014,
        {"Tb": P("boilingPoint", "K")}, label_column=None,
    ),
    TableSpec(
        "Yaws Hf S0 gas", "yawsHfS0g", "chemicals/Reactions/Yaws Hf S0 (g).tsv", RefKey.Yaws2014,
        {"Hfg": P("enthalpyFormation298", "J/mol", "gas"), "S0g": P("entropy298", "J/(mol K)", "gas")},
        label_column="name",
    ),
    TableSpec(
        "Poling Lennard-Jones", "polingLJ", "chemicals/Viscosity/PolingLJ.tsv", RefKey.Poling5,
        _lennard_jones_columns(), label_column="Name", formula_column="Formula",
    ),
    TableSpec(
        "Magalhaes Lennard-Jones", "magalhaesLJ", "chemicals/Viscosity/MagalhaesLJ.tsv", RefKey.Magalhaes2013,
        _lennard_jones_columns(),
    ),
    # Coefficient tables (COEFFICIENT_TABLES)
    TableSpec("Poling databank", "poling", "chemicals/Heat Capacity/PolingDatabank.tsv", RefKey.Poling5),
    TableSpec(
        "Perry 2-153 DIPPR 100", "perry153Dippr100", "chemicals/Heat Capacity/Perry_Table_2-153_DIPPR_100.tsv",
        RefKey.Perry8,
    ),
    TableSpec(
        "Perry 2-153 DIPPR 114", "perry153Dippr114", "chemicals/Heat Capacity/Perry_Table_2-153_DIPPR_114.tsv",
        RefKey.Perry8, label_column="Name",
    ),
    TableSpec(
        "Perry 2-312", "perry312",
        "chemicals/Viscosity/Table 2-312 Vapor Viscosity of Inorganic and Organic Substances.tsv", RefKey.Perry8,
    ),
    TableSpec(
        "Perry 2-313", "perry313",
        "chemicals/Viscosity/Table 2-313 Viscosity of Inorganic and Organic Liquids.tsv", RefKey.Perry8,
    ),
    TableSpec(
        "Perry 2-314", "perry314",
        "chemicals/Thermal Conductivity/Table 2-314 Vapor Thermal Conductivity of Inorganic and Organic Substances.tsv",
        RefKey.Perry8,
    ),
    TableSpec(
        "TRC gas Cp", "trcGasCp",
        "chemicals/Heat Capacity/TRC Thermodynamics of Organic Compounds in the Gas State.tsv", RefKey.TRC1994,
    ),
    # Tables with a dedicated parser
    TableSpec(
        "Perry 2-151", "perry151", "chemicals/Heat Capacity/Perrys Table 2-151.tsv", RefKey.Perry8,
        cas_column="Ful CAS", label_column="Formula", formula_column="Formula",
    ),
    TableSpec(
        "CRC molten densities", "crcMoltenDensity",
        "chemicals/Density/CRC Inorganics densties of molten compounds and salts.tsv", RefKey.CRC95,
    ),
    TableSpec(
        "WebBook Shomate", "shomate", "chemicals/Heat Capacity/webbook_shomate_coefficients.json",
        RefKey.NISTWebBook, label_column=None,
    ),
    TableSpec(
        "Zabransky", "zabransky", "chemicals/Heat Capacity/Zabransky.tsv", RefKey.Zabransky1996,
        cas_column="CASRN", label_column="Name",
    ),
    TableSpec(
        "VDI gas viscosity", "vdiGasViscosity",
        "chemicals/Viscosity/VDI PPDS Dynamic viscosity of gases polynomials.tsv", RefKey.VDI2010,
    ),
    TableSpec(
        "VDI liquid viscosity", "vdiLiquidViscosity",
        "chemicals/Viscosity/VDI PPDS Dynamic viscosity of saturated liquids polynomials.tsv", RefKey.VDI2010,
    ),
    TableSpec(
        "VDI gas thermal conductivity", "vdiGasConductivity",
        "chemicals/Thermal Conductivity/VDI PPDS Thermal conductivity of gases.tsv", RefKey.VDI2010,
    ),
    TableSpec(
        "VDI liquid thermal conductivity", "vdiLiquidConductivity",
        "chemicals/Thermal Conductivity/VDI PPDS Thermal conductivity of saturated liquids.tsv", RefKey.VDI2010,
    ),
    TableSpec(
        "VDI liquid density", "vdiLiquidDensity", "chemicals/Density/VDI PPDS Density of Saturated Liquids.tsv",
        RefKey.VDI2010,
    ),
    TableSpec(
        "VDI enthalpy of vaporization", "vdiEnthalpyVaporization",
        "chemicals/Phase Change/VDI PPDS Enthalpies of vaporization.tsv", RefKey.VDI2010,
    ),
    TableSpec(
        "VDI surface tension", "vdiSurfaceTension", "chemicals/Interface/VDI PPDS surface tensions.tsv",
        RefKey.VDI2010,
    ),
    TableSpec(
        "VDI vapor pressure", "vdiVaporPressure",
        "chemicals/Vapor Pressure/VDI PPDS Boiling temperatures at different pressures.tsv", RefKey.VDI2010,
    ),
    # Identifier databases (no header row)
    TableSpec("Inorganic db", "idInorganic", "chemicals/Identifiers/Inorganic db.tsv", None, label_column=None),
    TableSpec(
        "pubchem small", "idPubchemSmall", "chemicals/Identifiers/chemical identifiers pubchem small.tsv", None,
        label_column=None,
    ),
    TableSpec(
        "pubchem large", "idPubchemLarge", "chemicals/Identifiers/chemical identifiers pubchem large.tsv", None,
        label_column=None,
    ),
)

SOURCE_TABLES: dict[str, TableSpec] = {t.name: t for t in _TABLES}

PROPERTY_TABLES: tuple[str, ...] = (
    "CRC inorganic constants",
    "CRC heat of fusion",
    "CRC standard thermodynamic",
    "CRC solid densities",
    "Yaws critical properties",
    "Yaws boiling points",
    "Yaws Hf S0 gas",
    "Poling Lennard-Jones",
    "Magalhaes Lennard-Jones",
)

IDENTIFIER_TABLES: tuple[str, ...] = ("Inorganic db", "pubchem small", "pubchem large")
