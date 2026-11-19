"""Gas-viscosity equation order and per-CAS defaults from Huber2019 precision."""
from __future__ import annotations

from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.source_link import SourceLink
from compound_data.compound_record import CompoundRecord, _equation_list
from compound_data.constants.viscosity_gas_priority import (
    VISCOSITY_GAS_SOURCE_PRIORITY,
    preferred_viscosity_gas_index,
    viscosity_gas_defaults,
    viscosity_gas_rank,
)
from compound_data.merger import order_values
from references import RefKey

N2 = "7727-37-9"


def _eq(ref: RefKey, type_: EquationType, key: str = "t") -> EquationValue:
    return EquationValue(
        type=type_, ref=ref, vars={"a": 1.0}, min=100.0, max=600.0,
        source=SourceLink("test", key, "", ref, 1, "x"),
    )


def test_overall_source_order_matches_huber_mape():
    assert [r.value for r in VISCOSITY_GAS_SOURCE_PRIORITY] == [
        "Perry8", "Yaws1999", "VDI2010", "White3",
    ]


def test_viscosity_gas_rank_orders_yaws_before_vdi_and_sutherland_before_power_law():
    eqs = [
        _eq(RefKey.White3, EquationType.powerLaw, "w"),
        _eq(RefKey.VDI2010, EquationType.quartic, "v"),
        _eq(RefKey.Yaws1999, EquationType.quadratic, "y"),
        _eq(RefKey.Perry8, EquationType.dipprN102, "p"),
        _eq(RefKey.White3, EquationType.sutherland, "ws"),
    ]
    ordered = sorted(eqs, key=viscosity_gas_rank)
    assert [(e.ref.value, e.type.value) for e in ordered] == [
        ("Perry8", "dipprN102"),
        ("Yaws1999", "quadratic"),
        ("VDI2010", "quartic"),
        ("White3", "sutherland"),
        ("White3", "powerLaw"),
    ]


def test_order_values_uses_viscosity_gas_rank_only_for_gas_viscosity():
    record = CompoundRecord(
        id="cas:x", cas=N2, formula="N2", hill="N2", display_formula="N2",
        elements=["N"], compound_class="inorganic", group="N",
    )
    record.equations["viscosity"] = {
        "gas": [
            _eq(RefKey.White3, EquationType.sutherland, "w"),
            _eq(RefKey.Perry8, EquationType.dipprN102, "p"),
            _eq(RefKey.Yaws1999, EquationType.quadratic, "y"),
        ],
        "liquid": [
            _eq(RefKey.VDI2010, EquationType.ppds9, "vl"),
            _eq(RefKey.Perry8, EquationType.dipprN101, "pl"),
        ],
    }
    order_values(record)
    gas = [(e.ref.value, e.type.value) for e in record.equations["viscosity"]["gas"]]
    liquid = [e.ref.value for e in record.equations["viscosity"]["liquid"]]
    assert gas == [("Perry8", "dipprN102"), ("Yaws1999", "quadratic"), ("White3", "sutherland")]
    # Liquid still uses the general SOURCE_PRIORITY (Perry before VDI).
    assert liquid == ["Perry8", "VDI2010"]


def test_committed_defaults_cover_huber_compounds_and_set_n2_def_to_sutherland():
    defaults = viscosity_gas_defaults()
    assert len(defaults) >= 35
    assert defaults[N2].ref == RefKey.White3 and defaults[N2].type == "sutherland"
    values = [
        _eq(RefKey.Perry8, EquationType.dipprN102, "p"),
        _eq(RefKey.Yaws1999, EquationType.quadratic, "y"),
        _eq(RefKey.White3, EquationType.sutherland, "w"),
    ]
    assert preferred_viscosity_gas_index(values, N2) == 2
    assert _equation_list(values, preferred_viscosity_gas_index(values, N2))["def"] == 2
