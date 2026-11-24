"""
chemicals_tables.constants.coefficient_tables — Coefficient tables read by ``parse_coefficient_table``.

Vars keep the source numbers verbatim; ``k`` converts the result to the backend unit.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [7] Poling5, [34] Perry8, [40] TRC1994, [38] Yaws2014
"""
from __future__ import annotations

from chemicals_tables.coefficient_spec import CoefficientSpec
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.constants.gas_constant import GAS_CONSTANT
from chemicals_tables.property_column import PropertyColumn

COEFFICIENT_TABLES: tuple[CoefficientSpec, ...] = (
    CoefficientSpec(
        table="Poling databank", type=EquationType.quartic, property="heatCapacity", phase="gas",
        vars={"a": "a0", "b": "a1", "c": "a2", "d": "a3", "e": "a4"}, k=GAS_CONSTANT,
        scalars={
            "Cpg": PropertyColumn("heatCapacity298", "J/(mol K)", "gas"),
            "Cpl": PropertyColumn("heatCapacity298", "J/(mol K)", "liquid"),
        },
    ),
    CoefficientSpec(
        table="Perry 2-153 DIPPR 100", type=EquationType.quartic, property="heatCapacity", phase="liquid",
        vars={"a": "A", "b": "B", "c": "C", "d": "D", "e": "E"}, k=1e-3,
    ),
    CoefficientSpec(
        table="Perry 2-153 DIPPR 114", type=EquationType.dipprN114, property="heatCapacity", phase="liquid",
        vars={"c1": "A", "c2": "B", "c3": "C", "c4": "D"}, k=1e-3, tc_from="Yaws critical properties",
    ),
    CoefficientSpec(
        table="Perry 2-312", type=EquationType.dipprN102, property="viscosity", phase="gas",
        vars={"c1": "C1", "c2": "C2", "c3": "C3", "c4": "C4"},
    ),
    CoefficientSpec(
        table="Perry 2-313", type=EquationType.dipprN101, property="viscosity", phase="liquid",
        vars={"c1": "C1", "c2": "C2", "c3": "C3", "c4": "C4", "c5": "C5"},
    ),
    CoefficientSpec(
        table="Perry 2-314", type=EquationType.dipprN102, property="thermalConductivity", phase="gas",
        vars={"c1": "C1", "c2": "C2", "c3": "C3", "c4": "C4"},
    ),
    CoefficientSpec(
        table="TRC gas Cp", type=EquationType.trcCp, property="heatCapacity", phase="gas",
        vars={f"a{i}": f"a{i}" for i in range(8)} | {"I": "I", "J": "J"}, k=GAS_CONSTANT,
        scalars={"Hfg": PropertyColumn("enthalpyFormation298", "J/mol", "gas")},
    ),
)
