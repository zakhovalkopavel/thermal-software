# 06 — API

**Controller:** `CombustionController` · **Base path:** `/api/v1/combustion` · Swagger tag `combustion`
(request examples in Swagger use the charcoal presets, an LHV-based charcoal and natural gas).

| Method | Path | Service | Mode | Request → Response |
|---|---|---|---|---|
| GET | `/fuels` | `CombustionService.fuels()` | — | → `FuelSummaryDto[]` |
| POST | `/solid/direct` | `SolidCombustionService.direct()` | 1 | `SolidDirectInputDto` → `SolidDirectResultDto` |
| POST | `/solid/two-step` | `SolidCombustionService.twoStep()` | 2 | `SolidTwoStepInputDto` → `SolidTwoStepResultDto` |
| POST | `/fluid` | `FluidCombustionService.calculate()` | 3 | `FluidFuelInputDto` → `FluidFuelResultDto` |
| POST | `/bed` | `BedCombustionService.calculate()` | 4 | `BedCombustionInputDto` → `BedCombustionResultDto` |

POST endpoints return **201** on success. Fields marked `?` are optional; defaults in brackets.
The former `POST /calculate` (carbon-equivalent recuperator contract) is removed; the recuperator
selects a mode instead (§6.8, [07](07_RecuperatorFlueGas.md)).

---

## 6.1 `GET /fuels`

All presets of `FUEL_REGISTRY` with derived properties (dry air, 21 % O2):

```typescript
class FuelSummaryDto {
  id: string;                    // 'charcoal-briquette' | 'charcoal-oak' | 'map-pro'
  name: string;
  phase: 'solid' | 'liquid' | 'gas';
  lhv_Jkg: number;               // lower heating value [J/kg]
  heatOfFormation_Jkg: number;   // formation enthalpy at 298.15 K [J/kg]
  moleFractions?: Record<string, number>;  // gas presets only
  stoichAir_kgkg: number;        // stoichiometric dry air [kg/kg fuel]
}
```

The same object is returned as `fuel` in every mode result; custom fuels have `id` = `'custom'`
(name = given `name` or "Custom fuel"), custom gases `id` = `'custom-gas'`.

## 6.2 Common fuel inputs (modes 1, 2, 4 and liquid mode 3)

```typescript
class CondensedFuelSelectionDto {        // base of mode 4 input
  fuelId?: 'charcoal-briquette' | 'charcoal-oak';   // exactly one of fuelId / fuel
  fuel?: CondensedFuelDto;
  tFuel_K?: number;              // fuel inlet temperature [298.15]
  pO2?: number;                  // [0.21], 0.01–1
  wH2Om?: number;                // [0]
}

class CondensedFuelSupplyDto extends CondensedFuelSelectionDto {   // base of modes 1, 2
  mFuel_kgs?: number;            // exactly one of mFuel_kgs / fPower_W
  fPower_W?: number;             // LHV basis → mFuel = fPower / LHV
}

class CondensedFuelDto {
  name?: string;
  elementalComp: { C, H, O, N: number; S?: number; ash: number; moisture?: number };  // mass fractions, sum 1 ± 0.001
  heatOfFormation_J_kg?: number; // one of heatOfFormation_J_kg / lhv_J_kg is required
  lhv_J_kg?: number;
  specificHeat_J_kgK?: number;   // [1500]
  porosity?: number;             // bed model, 0.01–0.99
  bulkDensity_kg_m3?: number;    // bed model
  particleSize_m?: number;       // bed model, ≥ 1e-4
  activityFactor?: number;       // bed model
  emissivity?: number;           // bed model
}
```

## 6.3 Step result (`CombustionStepResultDto`)

Returned for every reacting step (`combustion`, `generator`, `burnout`):

```typescript
class CombustionStepResultDto {
  tOut_K: number;                // outlet temperature [K]
  excessAir: number;             // O2 supplied / O2 needed by this step's inventory
  products: {
    moleFlows_mols: Record<string, number>;   // N2, O2, CO2, CO, H2O, H2, SO2 always; inerts when fed
    massFlows_kgs:  Record<string, number>;
    moleFractions:  Record<string, number>;
    massFractions:  Record<string, number>;
  };
  mGas_kgs: number;              // gaseous products [kg/s]
  charCarbon_kgs: number;        // unburnt carbon [kg/s]
  ash_kgs: number;
  reactantEnthalpy_W: number;    // absolute enthalpy flows [W]
  productEnthalpy_W: number;
  heatLoss_W: number;
  wgsKp: number | null;          // WGS Kp at tOut (rich regime only)
  elementBalanceResidual: number;
}
```

## 6.4 `POST /solid/direct` — mode 1

```typescript
class SolidDirectInputDto extends CondensedFuelSupplyDto {
  kExcessAir: number;            // λ, ≥ 0.01 (< 1 rich, 1, > 1 lean)
  tAir_K: number;                // ≥ 200
  heatLoss_W?: number;           // [0]
}
class SolidDirectResultDto {
  fuel: FuelSummaryDto; mFuel_kgs: number; fPower_W: number;
  mAir_kgs: number; tFlame_K: number; combustion: CombustionStepResultDto;
}
```

Example: `{ "fuelId": "charcoal-briquette", "fPower_W": 20000, "kExcessAir": 1.2, "tAir_K": 293 }`.

## 6.5 `POST /solid/two-step` — mode 2

```typescript
class SolidTwoStepInputDto extends CondensedFuelSupplyDto {
  kExcessAir: number;            // total λ (primary + secondary)
  primaryExcessAir?: number;     // [air taking all C to CO]; must be ≤ kExcessAir
  tAirPrimary_K: number;
  tAirSecondary_K?: number;      // [tAirPrimary_K]
  generatorHeatLoss_W?: number;  // overrides flux × surface
  generatorHeatFlux_Wm2?: number;// [0]; legacy typical value 7000
  generatorSurface_m2?: number;  // [0]; loss = flux × surface
  furnaceHeatLoss_W?: number;    // [0]
}
class SolidTwoStepResultDto {
  fuel: FuelSummaryDto; mFuel_kgs: number; fPower_W: number;
  primaryExcessAir: number; mAirPrimary_kgs: number; mAirSecondary_kgs: number;
  tStep1_K: number; tFlame_K: number;
  generator: CombustionStepResultDto;   // step 1
  burnout: CombustionStepResultDto;     // step 2
}
```

## 6.6 `POST /fluid` — mode 3

```typescript
class FluidFuelInputDto {
  phase: 'gas' | 'liquid';
  fuelId?: 'map-pro';            // gas: exactly one of fuelId / fuelGas
  fuelGas?: Record<string, number>;  // gas: mole fractions (normalised) of registry species
  fuel?: CondensedFuelDto;       // liquid: required (fuelId not allowed)
  mFuel_kgs?: number;            // exactly one of mFuel_kgs / fPower_W
  fPower_W?: number;
  kExcessAir: number;
  tAir_K: number;
  tFuel_K?: number;              // [298.15]
  pO2?: number; wH2Om?: number; heatLoss_W?: number;
}
class FluidFuelResultDto {
  fuel: FuelSummaryDto; mFuel_kgs: number; fPower_W: number;
  mAir_kgs: number; tFlame_K: number; combustion: CombustionStepResultDto;
}
```

`fuelGas` species: CH4, C2H6, C3H8, C4H10, iC4H10, C2H2, C3H4, aC3H4, C3H6, H2, CO, CO2, N2, H2O, Ar
(any species of `GAS_REGISTRY`). Examples:
`{ "phase": "gas", "fuelGas": { "CH4": 0.95, "CO2": 0.01, "N2": 0.04 }, "fPower_W": 10000, "kExcessAir": 1.1, "tAir_K": 573 }`,
`{ "phase": "gas", "fuelId": "map-pro", "fPower_W": 5000, "kExcessAir": 1.05, "tAir_K": 293 }`.

## 6.7 `POST /bed` — mode 4

```typescript
class BedCombustionInputDto extends CondensedFuelSelectionDto {
  bedHeight_m: number;
  diameter_m: number;            // generator inner diameter
  nLayers: number;               // 1–500
  mAirPrimary_kgs?: number;      // exactly one of mAirPrimary_kgs / airFlow_m3h
  airFlow_m3h?: number;          // at tAirPrimary_K, 1 atm
  tAirPrimary_K: number;
  steamInjectionPercent?: number;// % of the gas molar flow at the max-CO2 layer [0]
  steamT_K?: number;             // ≥ 373; required when steamInjectionPercent > 0
  generatorWallLayers?: LayerDto[];   // inside → outside; omit → adiabatic generator
  generatorWallEmissivity?: number;   // required with generatorWallLayers
  tAmbient_K?: number;           // required with generatorWallLayers or furnace
  kExcessAir?: number;           // total λ vs. burned fuel; at most one of kExcessAir / mAirSecondary_kgs
  mAirSecondary_kgs?: number;
  tAirSecondary_K?: number;      // [tAirPrimary_K]
  furnace?: { diameter_m: number; length_m: number; wallLayers: LayerDto[]; emissivity: number };
  furnaceHeatLoss_W?: number;    // at most one of furnace / furnaceHeatLoss_W
}
```

`LayerDto` = `{ material, thicknessMm }` from `thermal-exchange` (any refractory or metal material key).
The fuel must carry `porosity`, `particleSize_m` and `activityFactor` (presets do) and no sulphur.
The bed model has no hidden defaults: the example values (`COMBUSTION_EXAMPLES.BED`, `BED_WALL`, `STEAM_T_K`, `FURNACE`)
are what the Swagger examples and the frontend initial form send.

```typescript
class BedCombustionResultDto {
  fuel: FuelSummaryDto;
  layers: BedLayerResultDto[];
  mFuel_kgs: number;             // fuel burned in the bed (output of the kinetics)
  fPower_W: number;              // LHV basis
  carbonBurnRate_kgs: number; ash_kgs: number;
  mAirPrimary_kgs: number; mSteam_kgs: number; mAirSecondary_kgs: number;
  primaryExcessAir: number;      // primary air vs. burned fuel
  generatorHeatLoss_W: number; pressureDrop_Pa: number;
  oxidationZoneHeight_m: number | null;   // top layer with CO < 1 %, O2 > 1 %
  tStep1_K: number;              // generator gas at the bed outlet
  generatorGasMoleFlows_mols: Record<string, number>;
  generatorGasMoleFractions: Record<string, number>;
  mGeneratorGas_kgs: number;
  elementBalanceResidual: number;
  energyBalanceResidual_W: number;
  tFlame_K: number;
  burnout: CombustionStepResultDto;
}

class BedLayerResultDto {
  index: number; z_m: number;    // layer centre above the grate
  tGas_K: number; tSolid_K: number; deltaT_K: number;
  moleFractions: Record<string, number>;
  carbonBurnRate_kgs: number; fuelBurnRate_kgs: number; burnRatePerArea_g_s_cm2: number;
  extents: { r1, r2, r3, r31, r32, r33, r4, r41, r42, r43: number };   // [mol/s]
  wallLoss_W: number; tWallInner_K: number | null; tWallOuter_K: number | null;
  hConv_Wm2K: number; velocity_ms: number; pressureDrop_Pa: number;
  D_O2_m2s: number; D_CO2_m2s: number; D_H2O_m2s: number;
  steamInjected: boolean;
}
```

Example: `{ "fuelId": "charcoal-briquette", "bedHeight_m": 0.5, "diameter_m": 0.3, "nLayers": 25, "airFlow_m3h": 10,
"tAirPrimary_K": 400, "tAmbient_K": 293, "generatorWallEmissivity": 0.85,
"generatorWallLayers": [{ "material": "chamotte_solid", "thicknessMm": 65 }, { "material": "chamotte_600", "thicknessMm": 65 }],
"kExcessAir": 1.3, "tAirSecondary_K": 573, "furnace": { "diameter_m": 0.4, "length_m": 1, "emissivity": 0.85, "wallLayers": [ … ] } }`.

## 6.8 `CombustionModeInputDto` — mode selection (recuperator)

No own endpoint; used as `combustion` in `POST /recuperator/calculate` and resolved by
`CombustionService.flueGas()` ([07](07_RecuperatorFlueGas.md)).

```typescript
class CombustionModeInputDto {
  mode: 'solid-direct' | 'solid-two-step' | 'fluid' | 'bed';
  solidDirect?:  SolidDirectInputDto;     // §6.4 — required for mode 'solid-direct'
  solidTwoStep?: SolidTwoStepInputDto;    // §6.5 — required for mode 'solid-two-step'
  fluid?:        FluidFuelInputDto;       // §6.6 — required for mode 'fluid'
  bed?:          BedCombustionInputDto;   // §6.7 — required for mode 'bed'
}
```

Example: `{ "mode": "fluid", "fluid": { "phase": "gas", "fuelGas": { "CH4": 0.95, "CO2": 0.01, "N2": 0.04 },
"fPower_W": 5000, "kExcessAir": 1.2, "tAir_K": 573 } }`.

## 6.9 Errors

| Status | Cause |
|---|---|
| 400 | DTO validation (types, ranges) |
| 400 | both/neither of `fuelId`/`fuel`; solid preset for gas or gas preset for solid; both/neither of `fuelId`/`fuelGas` for gas; `fuelGas` missing, unknown species, negative or all-zero fractions |
| 400 | composition sum ≠ 1 ± 0.001; custom fuel without ΔHf and LHV; both/neither of `mFuel_kgs`/`fPower_W`; LHV ≤ 0 with `fPower_W` |
| 400 | mode 2: fuel without O2 demand; primary λ above total λ |
| 400 | mode 4: missing bed properties; porosity outside (0, 1); sulphur in fuel; no carbon; none or both of `mAirPrimary_kgs` / `airFlow_m3h`; non-positive primary air; `steamT_K` missing with steam injection; `generatorWallEmissivity` missing with generator walls; `tAmbient_K` missing with generator or furnace walls; both `kExcessAir` and `mAirSecondary_kgs`; both `furnace` and `furnaceHeatLoss_W` |
| 400 | mode selection: input of the selected mode missing (``Combustion mode `bed` needs `bed` ``); input of another mode given (``Give only `fluid` for mode `fluid` (also got bed)``) |
| 422 | energy balance without root (outlet below 50 K or above 20 000 K), also per bed layer; bed consumes no fuel |
