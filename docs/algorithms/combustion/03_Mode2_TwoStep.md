# 03 — Mode 2: Two-Step Solid Fuel Combustion

**Service:** `SolidCombustionService.twoStep()` · **Endpoint:** `POST /combustion/solid/two-step`

## Step 1 — generator gas

The fuel is gasified with primary air; carbon goes to CO. The default primary air is the O2 that
brings the O/C ratio to 1 (after S → SO2), net of the fuel's own oxygen:

```
O2_toCO = max(0, (C + 2S − O_fuel) / 2)
λ1      = primaryExcessAir ?? O2_toCO / O2_stoich         (must be ≤ total λ)
Q_gen   = generatorHeatLoss_W ?? generatorHeatFlux_Wm2 · generatorSurface_m2
T_step1 = FlameSolver.solveStep({ fuel @ T_fuel, primary air (λ1) @ T_air1, Q_gen })
```

T_step1 is **computed** from this energy balance; the WGS equilibrium is evaluated at T_step1.
Char (if O ≤ C) and ash stay in step 1.

## Step 2 — burnout

```
secondary air = (λ − λ1) · O2_stoich  @ T_air2 (default T_air1)
T_flame = FlameSolver.burnGasStream(generator gas @ T_step1, secondary air @ T_air2, furnaceHeatLoss_W)
```

i.e. `H_prod2(T_flame) + Q_furnace = H_air2(T_air2) + H_prod1(T_step1)`.

## Properties (tested)

- Hess: with zero losses the step 2 outlet equals mode 1 at the same total λ
- zero secondary air → T_flame = T_step1 (within 0.01 K)
- step 2 equals mode 3 applied to the generator gas
- element and energy balances close in both steps

## Note on the verified charcoal data

With ΔHf = −8.5 MJ/kg (LHV ≈ 22.95 MJ/kg) C → CO releases little heat, and with cold primary air
T_step1 ≈ 180–320 K. Use preheated primary air, or `lhv_J_kg` (e.g. 30 MJ/kg) in a custom fuel.
