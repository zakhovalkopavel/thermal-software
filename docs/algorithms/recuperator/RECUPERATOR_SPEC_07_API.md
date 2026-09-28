# RECUPERATOR SPEC — 07 API

---

## 7.1 Endpoints

| Method | Path | Module | Service method | Description |
|---|---|---|---|---|
| `POST` | `/combustion/calculate` | `combustion` | `CombustionService.calculate()` | Flame temp + smoke composition |
| `GET`  | `/metals/thermal-properties` | `metals` | `MetalThermalService.getThermalProperties()` | λ(T) and ε(T) for metals |
| `POST` | `/thermal-exchange/multilayer-wall` | `thermal-exchange` | `MultilayerWallService.calculate()` | Multilayer wall heat loss |
| `POST` | `/recuperator/calculate` | `recuperator` | `RecuperatorService.calculate()` | Counter-flow HX optimisation |

---

## 7.2 Combustion Calculation

### 7.2.1 Request — `CombustionInputDto`

```typescript
class CombustionInputDto {
  fPower_W: number;              // Furnace power [W]
  fuelQ_Jkg: number;             // Lower heating value [J/kg]
  carbonQ_Jkg?: number;          // Carbon LHV [J/kg], default 32,900,000
  kExcessAir: number;            // Excess air ratio (e.g. 1.3)
  tAirStart_K: number;           // Inlet air temperature [K]
  pO2?: number;                  // O₂ fraction in air, default 0.21
  wH2Om?: number;                // Water mass fraction in air, default 0
  generatorHeatLoss_W?: number;  // Generator surface heat loss [W]
}
```

### 7.2.2 Response — `CombustionResultDto`

```typescript
class CombustionResultDto {
  tFlame_K: number;              // Adiabatic flame temperature [K]
  tSmokeStart_K: number;         // Smoke start temperature [K]
  mFuel_kgs: number;             // Fuel mass flow [kg/s]
  mAir_kgs: number;              // Air mass flow [kg/s]
  mSmoke_kgs: number;            // Smoke mass flow [kg/s]
  composition: {
    before: { N2, O2, CO2, CO, H2O, H2: number };  // mole fractions
    after:  { N2, O2, CO2, CO, H2O, H2: number };
  };
  pCO2: number;                  // CO₂ partial pressure (mole fraction)
  pH2O: number;                  // H₂O partial pressure (mole fraction)
}
```

---

## 7.3 Metals Thermal Properties

### 7.3.1 Query — `MetalThermalQueryDto`

```typescript
class MetalThermalQueryDto {
  material: MetalMaterial;  // 'aisi_304' | 'mild_steel'
  T_K: number;              // Temperature [K]
}
```

### 7.3.2 Response — `MetalThermalResultDto`

```typescript
class MetalThermalResultDto {
  material: MetalMaterial;
  T_K: number;
  lambda_WmK: number;
  emissivity: number;
}
```

---

## 7.4 Multilayer Wall Calculation

### 7.4.1 Shared types

```typescript
// thermal-exchange/dto/layer.dto.ts
type WallMaterialKey = RefractoryThermalMaterial | MetalMaterial;

class LayerDto {
  material: WallMaterialKey;  // any of the 21 material keys
  thicknessMm: number;        // [mm]
}

// thermal-exchange/dto/smoke-composition.dto.ts
class SmokeCompositionDto {
  N2: number; O2: number; CO2: number;
  CO: number; H2O: number; H2: number;  // mole fractions, sum ≈ 1
}
```

### 7.4.2 Request — `MultilayerWallInputDto`

```typescript
class MultilayerWallInputDto {
  geometry: WallGeometry;           // 'flat' | 'cylinder' | 'sphere'
  a_m: number;                      // Inner dimension [m]
  b_m?: number;                     // Cylinder length or flat-wall height [m]
  layers: LayerDto[];               // Inside → outside
  w_ms: number;                     // Gas velocity [m/s]
  composition: SmokeCompositionDto; // Gas mole fractions
  mPerSecond_kgs: number;           // Gas mass flow [kg/s]
  tFlame_K: number;                 // Hot gas temperature [K]
  tAmbient_K: number;               // Ambient temperature [K]
  innerEmissivity: number;          // Inner surface emissivity
  numberOfSteps?: number;           // FD steps (default 50)
  endFactor?: number;               // Convergence criterion (default 0.001)
}
```

### 7.4.3 Response — `MultilayerWallResultDto`

```typescript
class MultilayerWallResultDto {
  tInner_K: number;                 // Inner surface temperature [K]
  tOuter_K: number;                 // Outer surface temperature [K]
  tGasEnd_K: number;                // Gas exit temperature [K]
  tGasAverage_K: number;            // Log-mean gas temperature [K]
  betweenLayers: Array<{ name: string; tCelsius: number }>;
  fluxInner_W: number;              // Heat entering from flame [W]
  fluxOuter_W: number;              // Heat leaving outer surface [W]
  fluxInnerDensity_Wm2: number;     // Inner surface flux density [W/m²]
  sInner_m2: number;                // Inner surface area [m²]
  sOuter_m2: number;                // Outer surface area [m²]
  alphaInner: { total_Wm2K, convection_Wm2K, radiation_Wm2K: number };
  alphaOuter_Wm2K: number;
  totalThickness_mm: number;
}
```

---

## 7.5 Recuperator Calculation

### 7.5.1 Request — `RecuperatorInputDto`

```typescript
class RecuperatorInputDto {
  fPower_W: number;
  fuelQ_Jkg: number;
  kExcessAir: number;
  tAirStart_K: number;
  holeForm: HoleForm;                    // 'square'|'circle'|'triangle'|'circle_in_ring'
  d0_m: number;                          // Nominal channel dimension [m]
  h0_m: number;                          // Air channel radial depth [m] (circle_in_ring)
  refractoryThickness_m: number;         // Wall thickness [m]
  nAir: number;                          // Number of air channels
  nSmoke: number;                        // Number of smoke channels
  nPasses?: number;                      // Air passes (circle_in_ring, default 1)
  smokeTurbulence?: boolean;
  wantedRecuperatorLength_m: number;     // Target HX length [m]
  thermalInsulationThickness_m: number;  // Outer insulation [m]
  refractoryLambda_WmK: number;          // Wall λ [W/(m·K)]
  refractoryEmissivity: number;
  surfaceEmissivity: number;
  surfaceArea_m2: number;
  wH2Om?: number;
  airPreheat_K?: number;
}
```

### 7.5.2 Response — `RecuperatorResultDto`

```typescript
class RecuperatorResultDto {
  recuperatorLength_m: number;
  tAirEnd_K: number;
  tSmokeEnd_K: number;
  tSmokeStart_K: number;
  tFlame_K: number;
  maxFlameTemp_K: number;
  energyReturnedPercent: number;
  airEnergyIncrease_W: number;
  smokeEnergyDecrease_W: number;
  smokeTotalEnergy_W: number;
  alphaAverage_Wm2K: number;
  averageDeltaT_K: number;
  sSmoke_m2: number;
  sAir_m2: number;
  dAir_m: number;
  dSmoke_m: number;
  wSmokeStart_ms: number;
  wSmokeEnd_ms: number;
  wAirStart_ms: number;
  wAirEnd_ms: number;
  mFuel_kgh: number;
}
```

---

## 7.6 HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Calculation succeeded |
| 400 | Invalid input (validation error) |
| 422 | Calculation did not converge |
| 500 | Internal server error |
