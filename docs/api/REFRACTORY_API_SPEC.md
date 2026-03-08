# Refractory API Specification

**Base path:** `/api/v1/refractory`  
**Controller:** `RefractoryController`  
**Swagger UI:** `http://localhost/api/docs`  
**Tag:** `Refractory Calculations`

All endpoints accept and return JSON. All `POST` endpoints return `200 OK` on success, `400 Bad Request` on invalid input.

---

## Endpoints Overview

| Method | Path | Service method | Description |
|--------|------|----------------|-------------|
| POST | `/phase-equilibrium` | `PhaseEquilibriumService.calculatePhaseEquilibrium` | Liquid/solid phase distribution at temperature |
| POST | `/mineral-phases` | `MineralPhaseService.identifyPhases` | Identify mineral phases from oxide composition |
| POST | `/blend-optimization` | `BlendOptimizerService.optimize` | Optimize particle blend for target PSD |
| POST | `/psd/andreasen` | `PSDCalculatorService.andreasenDiscrete` | Andreasen discrete PSD calculation |
| POST | `/psd/funk-dinger` | `PSDCalculatorService.funkDingerDiscrete` | Funk-Dinger discrete PSD calculation |
| POST | `/packing/cpm` | `PackingService.calculateCPM` | Compressible Packing Model density |
| POST | `/packing/furnas` | `PackingService.calculateFurnas` | Furnas packing model density |
| POST | `/participation` | `ParticipationService.calculateParticipation` | Particle reaction participation factors |
| POST | `/water-demand` | `WaterDemandService.calculateWaterDemand` | Water demand from packing fraction |
| POST | `/water-demand/range` | `WaterDemandService.calculateWaterDemandRange` | Water demand min/typical/max range |
| POST | `/shrinkage` | `ShrinkageService.calculateCompleteShrinkage` | Drying + firing shrinkage over temperature profile |
| POST | `/thermal-conductivity` | `ThermalPerformanceService.calculateThermalConductivity` | Effective thermal conductivity with porosity |
| POST | `/refractoriness` | `RefractorinessService.calculateRefractoriness` | PCE / RUL temperature from composition |
| POST | `/glass-viscosity` | `GlassViscosityService.calculateViscosity` | Glass viscosity + VFT curve + fixed points |

---

## 1. Phase Equilibrium

### `POST /phase-equilibrium`

Calculates liquid/solid phase distribution at a given temperature using the lever rule and eutectic data.

**Request body:**
```json
{
  "composition": {
    "SiO2": 50.5,
    "Al2O3": 30.2,
    "CaO": 10.5,
    "MgO": 5.0,
    "Fe2O3": 2.5,
    "K2O": 1.0,
    "Na2O": 0.3
  },
  "temperature": 1400,
  "totalMass": 1000
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `composition` | `OxideCompositionDto` | ✅ | Oxide composition in wt% |
| `temperature` | number | ✅ | Temperature in °C |
| `totalMass` | number | ❌ | Total mass in kg (default: 1) |

**Response:**
```json
{
  "liquidFraction": 0.15,
  "solidFraction": 0.85,
  "liquidMass_kg": 150,
  "solidMass_kg": 850,
  "phases": [
    { "name": "Mullite", "fraction": 0.45, "meltingPoint_C": 1850 }
  ],
  "temperature_C": 1400,
  "warnings": []
}
```

---

## 2. Mineral Phases

### `POST /mineral-phases`

Identifies mineral phases present in the solid composition at a given temperature.

**Request body:**
```json
{
  "composition": {
    "SiO2": 50.5,
    "Al2O3": 42.0,
    "CaO": 3.0,
    "Fe2O3": 2.0,
    "Na2O": 0.5,
    "K2O": 0.3,
    "TiO2": 0.5,
    "MgO": 1.2
  },
  "temperature": 1400
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `composition` | `OxideCompositionDto` | ✅ | Oxide composition in wt% |
| `temperature` | number | ❌ | Temperature in °C (default: 1400) |

**Response:**
```json
[
  { "phase": "Mullite",    "formula": "3Al₂O₃·2SiO₂", "percent": 45.2, "meltingPoint": 1850, "description": "Primary refractory phase" },
  { "phase": "Corundum",   "formula": "Al₂O₃",         "percent": 30.1, "meltingPoint": 2054, "description": "Highly refractory alpha-alumina" },
  { "phase": "Cristobalite","formula": "SiO₂",          "percent": 12.4, "meltingPoint": 1723, "description": "High-temperature silica polymorph" }
]
```

---

## 3. Blend Optimization

### `POST /blend-optimization`

Optimizes mass fractions of particle size fractions to best match a target PSD curve (Andreasen or Funk-Dinger).

**Request body:**
```json
{
  "fractions": [
    { "dMin_mm": 5.0, "dMax_mm": 10.0, "isFixed": false, "density_kgm3": 2700 },
    { "dMin_mm": 1.0, "dMax_mm": 5.0,  "isFixed": false, "density_kgm3": 2700 },
    { "dMin_mm": 0.1, "dMax_mm": 1.0,  "isFixed": false, "density_kgm3": 2700 },
    { "dMin_mm": 0.0, "dMax_mm": 0.1,  "isFixed": false, "density_kgm3": 2700 }
  ],
  "options": {
    "targetQ": 0.26,
    "method": "Andreasen"
  }
}
```

**Fields — `fractions[]`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dMin_mm` | number | ✅ | Lower sieve size in mm |
| `dMax_mm` | number | ✅ | Upper sieve size in mm |
| `isFixed` | boolean | ❌ | If true, mass fraction is fixed (not optimized) |
| `massFraction` | number | ❌ | Fixed mass fraction (required if `isFixed: true`) |
| `density_kgm3` | number | ❌ | Particle density in kg/m³ |

**Fields — `options`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetQ` | number | ✅ | Distribution modulus q (0.2–0.4) |
| `method` | string | ❌ | `"Andreasen"` (default) or `"FunkDinger"` |

---

## 4. PSD — Andreasen

### `POST /psd/andreasen`

Calculates ideal mass fractions per Andreasen continuous distribution: `P(D) = (D/Dmax)^q`

**Request body:**
```json
{
  "fractions": [
    { "dMin_mm": 5.0,  "dMax_mm": 10.0, "isFixed": false },
    { "dMin_mm": 1.0,  "dMax_mm": 5.0,  "isFixed": false },
    { "dMin_mm": 0.1,  "dMax_mm": 1.0,  "isFixed": false },
    { "dMin_mm": 0.01, "dMax_mm": 0.1,  "isFixed": false }
  ],
  "q": 0.26
}
```

**Response:**
```json
{
  "method": "Andreasen",
  "q": 0.26,
  "Dmin_mm": 0.01,
  "Dmax_mm": 10.0,
  "massFractions": [0.312, 0.285, 0.248, 0.155],
  "massFractionsRoundedPercent": [31, 29, 25, 15]
}
```

---

## 5. PSD — Funk-Dinger

### `POST /psd/funk-dinger`

Modified Andreasen with non-zero Dmin: `P(D) = (D^q − Dmin^q) / (Dmax^q − Dmin^q)`  
Recommended `Dmin_mm = 0.001` for realistic fine particle packing.

**Request body:**
```json
{
  "fractions": [
    { "dMin_mm": 5.0,  "dMax_mm": 10.0 },
    { "dMin_mm": 1.0,  "dMax_mm": 5.0  },
    { "dMin_mm": 0.1,  "dMax_mm": 1.0  },
    { "dMin_mm": 0.01, "dMax_mm": 0.1  }
  ],
  "q": 0.26,
  "Dmin_mm": 0.001
}
```

**Response:** Same shape as Andreasen, `"method": "FunkDinger"`.

---

## 6. Packing — CPM

### `POST /packing/cpm`

Compressible Packing Model (de Larrard 1999). Accounts for wall effects and compaction.

**Request body:**
```json
{
  "massFractions": [0.31, 0.28, 0.25, 0.16],
  "densities_kgm3": [2700, 2700, 2700, 2700],
  "diameters_mm": [7.5, 3.0, 0.55, 0.055],
  "compactionPressure_MPa": 10
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `massFractions` | number[] | ✅ | Mass fraction of each fraction (must sum to 1) |
| `densities_kgm3` | number[] | ✅ | Density of each fraction in kg/m³ |
| `diameters_mm` | number[] | ✅ | Representative diameter of each fraction in mm |
| `compactionPressure_MPa` | number | ❌ | Applied compaction pressure (default: 0) |

**Response:**
```json
{
  "packingFraction": 0.748,
  "porosity": 0.252,
  "bulkDensity_kgm3": 2017,
  "method": "CPM"
}
```

---

## 7. Packing — Furnas

### `POST /packing/furnas`

Furnas model for multi-component packing (Furnas 1931). Simpler than CPM, no compaction.

**Request body:** Same schema as CPM, `compactionPressure_MPa` ignored.

---

## 8. Participation

### `POST /participation`

Calculates reaction participation factor for each particle size fraction. Finer particles have higher participation (∝ 1/√d).

**Request body:**
```json
{
  "fractions": [
    { "dMin_mm": 5.0, "dMax_mm": 10.0, "massFraction": 0.31 },
    { "dMin_mm": 1.0, "dMax_mm": 5.0,  "massFraction": 0.28 },
    { "dMin_mm": 0.1, "dMax_mm": 1.0,  "massFraction": 0.25 },
    { "dMin_mm": 0.0, "dMax_mm": 0.1,  "massFraction": 0.16 }
  ]
}
```

**Response:**
```json
{
  "totalParticipation": 0.3821,
  "participationFactors": [
    { "fractionIndex": 0, "dMin_mm": 5.0, "dMax_mm": 10.0, "dMean_mm": 7.5, "massFraction": 0.31, "participationFactor": 0.3651, "effectiveParticipation": 0.1132 }
  ],
  "normalizedParticipation": [
    { "fractionIndex": 0, "normalizedParticipation": 0.2963 }
  ]
}
```

---

## 9. Water Demand

### `POST /water-demand`

Calculates water demand as % by mass: `waterDemand = workabilityFactor × (1 − φ) × 100`

| Workability | Factor | Typical use |
|-------------|--------|-------------|
| `FIRM` | 0.38 | Vibration-intensive placement |
| `STANDARD` | 0.42 | Balanced flow and strength (default) |
| `FLOWABLE` | 0.50 | Self-flowing castables |

**Request body:**
```json
{
  "packingFraction": 0.74,
  "workability": "STANDARD"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `packingFraction` | number | ✅ | Packing fraction φ (0–1) |
| `workability` | string | ❌ | `FIRM`, `STANDARD` (default), or `FLOWABLE` |

**Response:**
```json
{ "waterDemand_pct": 10.9 }
```

---

## 10. Water Demand Range

### `POST /water-demand/range`

Returns min (FIRM), typical (STANDARD), max (FLOWABLE) water demand for a packing fraction.

**Request body:**
```json
{ "packingFraction": 0.74 }
```

**Response:**
```json
{
  "min": 9.88,
  "typical": 10.92,
  "max": 13.0
}
```

---

## 11. Shrinkage

### `POST /shrinkage`

Calculates drying and firing shrinkage over a temperature profile.

**Request body:**
```json
{
  "temperatureProfile_C": [110, 400, 800, 1000, 1200],
  "waterCementRatio": 0.35,
  "cementContent": 0.08,
  "cementType": "CAC",
  "holdTime_hours": 2
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `temperatureProfile_C` | number[] | ✅ | Temperatures in °C (ascending) |
| `waterCementRatio` | number | ❌ | w/c ratio (0–1, default 0.35) |
| `cementContent` | number | ❌ | Cement mass fraction (0–1, default 0.08) |
| `cementType` | string | ❌ | `"PC"`, `"CAC"` (default), or `"generic"` |
| `holdTime_hours` | number | ❌ | Hold time at peak temperature in hours |

**Response:**
```json
{
  "totalShrinkage_pct": 2.14,
  "dryingShrinkage_pct": 0.82,
  "firingShrinkage_pct": 1.32,
  "shrinkageByStage": [
    { "temperature_C": 110,  "shrinkage_pct": 0.82 },
    { "temperature_C": 1200, "shrinkage_pct": 2.14 }
  ]
}
```

---

## 12. Thermal Conductivity

### `POST /thermal-conductivity`

Calculates effective thermal conductivity using Maxwell-Eucken equation for porous media.  
`k_eff = k_solid × (1−P) / (1 + 0.5×P×(k_solid/k_pores − 1))`

**Request body:**
```json
{
  "composition": {
    "Al2O3": 85.0,
    "SiO2": 12.0,
    "Fe2O3": 2.0,
    "TiO2": 1.0
  },
  "temperature": 1000,
  "porosity": 0.18
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `composition` | `OxideCompositionDto` | ✅ | Oxide composition in wt% |
| `temperature` | number | ✅ | Temperature in °C |
| `porosity` | number | ❌ | Porosity fraction 0–1 (default: 0.20) |

**Response:**
```json
{
  "thermalConductivity_WmK": 3.42,
  "specificHeat_JkgK": 1100,
  "thermalDiffusivity_m2s": 1.24e-6,
  "density_kgm3": 2050,
  "temperature_C": 1000,
  "porosity": 0.18
}
```

---

## 13. Refractoriness

### `POST /refractoriness`

Calculates PCE (Pyrometric Cone Equivalent) and RUL (Refractoriness Under Load) temperature from oxide composition.

**Request body:**
```json
{
  "composition": {
    "Al2O3": 42.0,
    "SiO2": 52.0,
    "Fe2O3": 2.5,
    "CaO": 1.5,
    "Na2O": 0.8,
    "K2O": 0.5,
    "TiO2": 0.7
  },
  "standard": "ISO1893",
  "testTemperature": 1400
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `composition` | `OxideCompositionDto` | ✅ | Oxide composition in wt% |
| `standard` | string | ✅ | `ISO1893`, `ASTM_C24`, `ASTM_C71`, or `GOST4069` |
| `testTemperature` | number | ❌ | Test temperature in °C |

**Response:**
```json
{
  "PCE": 31,
  "PCE_temperature_C": 1683,
  "RUL_T05_C": 1420,
  "RUL_T1_C": 1380,
  "classification": "High Duty",
  "standard": "ISO1893",
  "warnings": []
}
```

---

## 14. Glass Viscosity

### `POST /glass-viscosity`

Calculates glass viscosity at a given temperature. Automatically selects the best model:

| Glass system | Model selected | Condition |
|---|---|---|
| Pure fused silica | `HETHERINGTON_1964` | SiO₂ > 99 wt% |
| Soda-lime-silica (SiO₂ 60–77%, Na₂O 10–17%) | `LAKATOS_1976` | Tightest accuracy, σ ≈ 3–5°C |
| Broad oxide glass (borosilicate, lead, etc.) | `FLUEGEL_2007` | SiO₂ 43–89 mol%, ~50 components |
| Industrial slag (CaO > 30%, SiO₂ < 40%) | `IIDA` (NAKAMOTO_2007 for high CaF₂) | Iida primary; Nakamoto preferred/used for high CaF₂ (>8 mol%) |
| Pure fluoride glass | `NOT_SUPPORTED` | No valid published model |

**Request body:**
```json
{
  "composition": {
    "SiO2": 72.2,
    "Na2O": 13.4,
    "CaO": 11.2,
    "MgO": 1.5,
    "Al2O3": 1.3,
    "K2O": 0.4
  },
  "temperature": 1200
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `composition` | object | ✅ | Oxide composition in **wt%**. Keys are oxide formulas: `SiO2`, `Al2O3`, `Na2O`, `K2O`, `Li2O`, `CaO`, `MgO`, `BaO`, `ZnO`, `PbO`, `ZrO2`, `SrO`, `F`, `SO3`, etc. |
| `temperature` | number | ✅ | Temperature in °C |

**Response:**
```json
{
  "logViscosity": 3.41,
  "viscosity_Pas": 2570,
  "temperature_C": 1200,
  "composition": { "SiO2": 72.2, "Na2O": 13.4, "CaO": 11.2, "MgO": 1.5, "Al2O3": 1.3, "K2O": 0.4 },
  "model": {
    "systemType": "LAKATOS_1976",
    "type": "VFT",
    "parameters": { "A": -2.43, "B": 4821, "T0": 241 }
  },
  "fixedPoints": {
    "meltingPoint_C": 1480,
    "workingPoint_C": 1210,
    "softeningPoint_C": 730,
    "annealingPoint_C": 560,
    "strainPoint_C": 516,
    "spans": {
      "meltingToStrain_C": 964,
      "workingToSoftening_C": 480,
      "softeningToAnnealing_C": 170,
      "annealingToStrain_C": 44
    }
  },
  "components": {
    "networkFormers": [{ "component": "SiO2", "wt_pct": 72.2, "role": "network former" }],
    "networkModifiers": [{ "component": "Na2O", "wt_pct": 13.4, "role": "network modifier" }],
    "intermediates": [],
    "fluorides": []
  },
  "validation": {
    "confidenceLevel": "HIGH",
    "warnings": [],
    "outOfRangeComponents": []
  },
  "metadata": {
    "reference": "Lakatos, T.; Johansson, L-G.; Simmingskőld, B. (1976). Glass Technology 13(3):88–95.",
    "validRange": "SiO₂ 60–77 wt%, Na₂O 10–17 wt%, 11 oxides"
  }
}
```

---

## Common Types

### `OxideCompositionDto`

```typescript
{
  SiO2?:   number,  // 0–100 wt%
  Al2O3?:  number,
  CaO?:    number,
  MgO?:    number,
  Fe2O3?:  number,
  K2O?:    number,
  Na2O?:   number,
  TiO2?:   number,
}
```

> For glass viscosity, additional oxides are accepted directly in the request body (not via `OxideCompositionDto`): `B2O3`, `Li2O`, `BaO`, `ZnO`, `PbO`, `ZrO2`, `SrO`, `F`, `SO3`, `MnO2`, etc.

### `FractionInputDto`

```typescript
{
  materialId?: string,      // optional material reference
  dMin_mm:     number,      // lower sieve size
  dMax_mm:     number,      // upper sieve size
  isFixed?:    boolean,     // lock this fraction's mass
  massFraction?: number,    // 0–1, required if isFixed=true
  density_kgm3?: number,    // 1000–4000 kg/m³
}
```

---

## Error Responses

All endpoints return standard NestJS error format on failure:

```json
{
  "statusCode": 400,
  "message": ["composition must be an object", "temperature must be a number"],
  "error": "Bad Request"
}
```

| Code | Meaning |
|------|---------|
| 400 | Validation error or out-of-range input |
| 404 | Resource not found |
| 500 | Internal calculation error |

---

## Controller prefix note

The global prefix in `main.ts` is `api/v1`. The controller is decorated with `@Controller('refractory')` (no extra prefix). Full path: `/api/v1/refractory/<endpoint>`.

> **Current bug:** The controller is currently decorated with `@Controller('api/v1/refractory')` causing double prefix `/api/v1/api/v1/refractory`. This must be fixed — see implementation note below.

---

## Implementation Status

| Endpoint | DTO exists | Controller method | Implemented |
|----------|-----------|-------------------|-------------|
| `/phase-equilibrium` | ✅ | ✅ | ✅ |
| `/mineral-phases` | ❌ needs DTO | ❌ | ✅ service |
| `/blend-optimization` | ✅ | ✅ | ✅ |
| `/psd/andreasen` | ❌ needs DTO | ❌ | ✅ service |
| `/psd/funk-dinger` | ❌ needs DTO | ❌ | ✅ service |
| `/packing/cpm` | ✅ | ❌ stub | ✅ service |
| `/packing/furnas` | ✅ | ❌ stub | ✅ service |
| `/participation` | ❌ needs DTO | ❌ | ✅ service |
| `/water-demand` | ❌ needs DTO | ❌ | ✅ service |
| `/water-demand/range` | ❌ needs DTO | ❌ | ✅ service |
| `/shrinkage` | ✅ | ❌ | ✅ service |
| `/thermal-conductivity` | ❌ needs DTO | ❌ | ✅ service |
| `/refractoriness` | ✅ | ❌ | ✅ service |
| `/glass-viscosity` | ✅ | ❌ | ✅ service |

