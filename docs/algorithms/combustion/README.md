# Combustion Module — Algorithms

**Module:** `backend/src/modules/combustion/` · **Base path:** `/api/v1/combustion`
**Legacy sources:** `legacy/furnaceCombustion/` (bed model `furnace_combustion_model.js`,
`modules/ChemicalKinetics.js`, `classes/FuelDatabase.js`), `legacy/scripts/recuperator.js` (`findMaxFlameT`)

All four calculation modes share one energy balance (absolute enthalpies, solved with `brentq`)
and one product-composition routine (element balance + water-gas shift equilibrium). The
recuperator selects one of the four modes and uses its flue gas (`CombustionService.flueGas()`).

| Chapter | Content |
|---|---|
| [01_SharedPhysics.md](01_SharedPhysics.md) | Enthalpy reference, fuel data, product equilibrium, flame solver, validation |
| [02_Mode1_SolidDirect.md](02_Mode1_SolidDirect.md) | Mode 1 — direct (one-step) solid fuel combustion |
| [03_Mode2_TwoStep.md](03_Mode2_TwoStep.md) | Mode 2 — generator gas (step 1) + burnout with secondary air (step 2) |
| [04_Mode3_Fluid.md](04_Mode3_Fluid.md) | Mode 3 — gaseous (incl. hydrocarbon gases, MAP gas) and liquid fuels |
| [05_Mode4_Bed.md](05_Mode4_Bed.md) | Mode 4 — packed bed by layers with chemical kinetics and wall losses |
| [06_API.md](06_API.md) | REST endpoints, request/response DTOs, defaults, errors |
| [07_RecuperatorFlueGas.md](07_RecuperatorFlueGas.md) | `flueGas()` — mode selection and flue gas for the recuperator |

## Modes at a glance

| Mode | Endpoint | Fuel | Steps | Temperature(s) solved |
|---|---|---|---|---|
| 1 | `POST /solid/direct` | solid (preset or elemental analysis) | fuel + air → products | T_flame |
| 2 | `POST /solid/two-step` | solid | fuel + primary air → generator gas; + secondary air → flue gas | T_step1, T_flame |
| 3 | `POST /fluid` | gas (species mole fractions / preset) or liquid (elemental analysis) | fuel + air → products | T_flame |
| 4 | `POST /bed` | solid with bed properties | layer march with kinetics → generator gas; burnout as mode 2 step 2 | T_gas, T_solid per layer, T_step1, T_flame |
## Service map

```
CombustionController ──► CombustionService (facade; flueGas() = selected mode for the recuperator)
                           ├── SolidCombustionService   (modes 1, 2)
                           ├── FluidCombustionService   (mode 3)
                           └── BedCombustionService     (mode 4)
                                 ├── ChemicalKineticsService
                                 ├── MultilayerWallService      (ThermalExchangeModule)
                                 └── Transport / Diffusion / Aerodynamics (ThermodynamicsModule)
shared core:
  FlameSolverService ──► CombustionEnthalpyService ──► GasPropertiesService.absoluteEnthalpy (NASA-7)
                     └─► ProductEquilibriumService  ──► GasPropertiesService.gibbsEnergy   (WGS Kp)
utils: element-balance (formula parsing, air flows, residuals), fuel-resolver (preset/custom fuel,
       fuel flow from power), step-result mapper
data:  data/fuels (charcoal-briquette, charcoal-oak, map-pro)
```

`CombustionModule` imports `ThermodynamicsModule` and `ThermalExchangeModule` and exports
`CombustionService`, `CombustionEnthalpyService`, `FlameSolverService`.

## Units and conventions

- SI units throughout; field suffixes give the unit (`_K`, `_W`, `_kgs`, `_mols`, `_Jkg`, `_m`).
- Excess air ratio λ (`kExcessAir`) = O2 supplied / stoichiometric O2 of the fuel.
- Air: dry air with O2 volume fraction `pO2` (default 0.21, rest N2) plus humidity `wH2Om`
  [kg H2O / kg dry air]. Humidity is O2-neutral.
- Heating values are **lower** heating values (water as vapour), as fired.
- Reference state for formation enthalpies: 298.15 K, 1 atm.

## Known limitations

- The verified briquette/oak ΔHf (−8.5 / −8.2 MJ/kg) give LHV ≈ 22.9 / 23.5 MJ/kg. Gasification
  C → CO is then nearly thermoneutral and the mode 2 generator with cold primary air cools to
  ≈ 180–320 K (formally valid root, physically meaningless). Use preheated primary air or an
  LHV-based fuel definition (`lhv_J_kg`, e.g. 30 MJ/kg). The preset data is kept unchanged.
- No dissociation beyond the water-gas shift (CO2 ⇌ CO + ½O2, H2O ⇌ H2 + ½O2 are not modelled);
  lean/stoichiometric flame temperatures above ≈ 2300 K are overestimated.
- Bed kinetics has no sulphur chemistry (fuels with S are rejected) and no reverse methanation;
  the legacy Boudouard constants make the reduction zone sluggish (see [05](05_Mode4_Bed.md)).
- The MAP-Pro preset composition (C3H6 0.995 / C3H8 0.005) is to be confirmed against the supplier SDS.
- Of the hydrocarbon fuel gases only C2H6, C3H8, C4H10 have Sutherland parameters (Eakin1963); iC4H10,
  C2H2, C3H4, aC3H4, C3H6 are skipped by `TransportService` mixture μ/λ (their μ, λ are Perry 8th ed.
  DIPPR 102 in the compound files). Allene (`aC3H4`) has no Lennard-Jones parameters, so
  `DiffusionService` rejects it.
