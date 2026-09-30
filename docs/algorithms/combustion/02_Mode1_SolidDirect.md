# 02 — Mode 1: Direct Solid Fuel Combustion

**Service:** `SolidCombustionService.direct()` · **Endpoint:** `POST /combustion/solid/direct`

Simplified model: fuel + air react in one step to equilibrium products at the flame temperature.
Excess air λ may be below, equal to or above 1.

## Algorithm

```
fuel      = preset (fuelId) or custom (elemental analysis + ΔHf or LHV)
m_fuel    = mFuel_kgs  or  fPower_W / LHV
O2_air    = λ · O2_stoich(fuel elements)
air       = O2_air + N2 (pO2) + humidity (wH2Om)
T_flame   = FlameSolver.solveStep({ fuel @ T_fuel, air @ T_air, heatLoss_W })
```

This is the enthalpy balance

```
Σ n_j(T_flame)·h_j(T_flame) + m_ash·h_ash + n_char·h_C + Q_loss = Σ n_air·h_air(T_air) + m_fuel·h_fuel(T_fuel)
```

with h = ΔHf + sensible enthalpy — the "(Cp_mean·T + ΔHf_mean)·m" form of the specification written per species.

| λ | Products |
|---|---|
| ≥ 1 | CO2, H2O, SO2, N2, O2 |
| rich, O > C | CO, CO2, H2, H2O by WGS Kp(T_flame) |
| very rich, O ≤ C | CO, H2, unburnt char |

## Properties (tested)

- lean (λ = 1.2): complete combustion, element and energy balances close
- mass balance: fuel + air = gas + ash + char
- rich (λ = 0.8): no O2, CO and H2 present, WGS equilibrium at T_flame
- very rich (λ = 0.3): unburnt char
- `fPower_W` gives `mFuel = P / LHV`
- a heat loss lowers and air preheat raises T_flame; λ = 1 is hotter than λ = 0.7 and 1.4
- the charcoal preset is used unchanged

## Use in the recuperator

The recuperator can use this mode with `combustion.mode = 'solid-direct'`; the flue gas is the
`combustion` step — see [07_RecuperatorFlueGas.md](07_RecuperatorFlueGas.md).
