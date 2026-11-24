from metal_data.andrews import andrews_ac1_C, andrews_ac3_C, andrews_critical_temperatures
from references import RefKey


def test_andrews_ac1_ac3_carbon_steel():
    # Pure Fe-C ~0.25 wt% C → Ac3 ≈ 910 - 203*sqrt(0.25) = 910 - 101.5 = 808.5 °C
    comp = {"C": 0.25, "Mn": 0.45, "Si": 0.0, "Ni": 0.0, "Cr": 0.0}
    ac3 = andrews_ac3_C(comp)
    assert abs(ac3 - (910.0 - 203.0 * (0.25**0.5))) < 1e-6
    ac1 = andrews_ac1_C(comp)
    assert abs(ac1 - (723.0 - 10.7 * 0.45)) < 1e-6
    crit = andrews_critical_temperatures(comp)
    assert crit is not None
    assert crit["ref"] == RefKey.Andrews1965.value
    assert abs(crit["Ac3_K"] - (ac3 + 273.15)) < 1e-3
