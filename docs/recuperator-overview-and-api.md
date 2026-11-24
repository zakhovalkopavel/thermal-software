# Recuperator Overview, Structure, and API

**Parent index:** [RECUPERATOR_SPEC.md](./RECUPERATOR_SPEC.md)

---

The recuperator module calculates heat exchange efficiency between combustion smoke and
preheated air in a counter-flow tubular recuperator.  It also calculates the furnace and
generator (combustion chamber) thermal performance.

The legacy code contains three sub-calculations that are exposed as separate API endpoints:

| Sub-calculation | Endpoint | Description |
|----------------|----------|-------------|
| Recuperator     | `POST /recuperator/calculate`   | Counter-flow heat exchanger: smoke → air preheating |
| Furnace insulation | `POST /recuperator/furnace`  | Multi-layer furnace thermal loss + gas end-temperature |
| Generator insulation | `POST /recuperator/generator` | Same algorithm as furnace, different geometry input |

---

## 2. Existing Services to Reuse

All physics must delegate to already-implemented backend services.  
**Do not reimplement** any of the following.

### 2.1 Thermodynamics module (`ThermodynamicsModule`)

| Service | Methods to call | Purpose in recuperator |
|---------|----------------|------------------------|
| `GasPropertiesService` | `cpMixture()`, `cpSpecies()`, `density()`, `molecularWeight()` | Gas heat-capacity integrals, air/smoke density |
| `TransportService` | `viscosityMix()`, `thermalConductivityMix()`, `viscosity()`, `thermalConductivity()` | μ and λ for air and smoke at each temperature step |
| `DimensionlessNumbersService` | `reynolds()`, `prandtl()`, `grashof()`, `rayleigh()`, `nusselt()`, `htc()`, `channelArea()`, `characteristicLength()` | Nu → convective α for air and smoke channels |
| `DimensionlessCalculationService` | `resolveFluid()`, `resolveDimensionlessProperties()`, `nusselt()` | Full fluid + Nu resolution in one call |
| `RadiationService` | `gasRadiationHTC()`, `solidRadiationHTC()`, `totalGasHTC()`, `gasEmissivity()` | Gas-phase radiation α (Hottel–Mikheev), surface radiation |

### 2.2 Thermal-distribution module (`ThermalDistributionModule`)

Not used for the recuperator core algorithm.  
It is used only if transient (time-dependent) warm-up of the recuperator body is added later.

### 2.3 Refractory module (`RefractoryModule`)

The recuperator uses named **solid materials** for wall layers and the core tube.
The material thermal properties (`λ(T)`, emissivity `ε(T)`) must come from a new
`RecuperatorMaterialService` that reads from a constant registry (see §5).

---

## 3. Module Structure

```
backend/src/modules/recuperator/
  recuperator.module.ts
  controllers/
    recuperator.controller.ts
  services/
    recuperator.service.ts          # Main orchestration: counter-flow HX loop
    furnace-multilayer.service.ts   # Multi-layer furnace/generator thermal loss
    combustion.service.ts           # Flame temperature + smoke composition
    recuperator-material.service.ts # λ(T), ε(T) for recuperator wall materials
    recuperator-geometry.service.ts # Channel areas, perimeters, equivalent diameters
  dto/
    recuperator-input.dto.ts
    furnace-input.dto.ts
    generator-input.dto.ts
    recuperator-result.dto.ts
    furnace-result.dto.ts
    generator-result.dto.ts
    layer.dto.ts
    recuperator-layer.dto.ts
  enums/
    hole-form.enum.ts
    furnace-form.enum.ts
    recuperator-material.enum.ts
  interfaces/
    layer-props.interface.ts
    surface-result.interface.ts
    alpha-result.interface.ts
```

---

## 4. API Endpoints

### 4.1 `POST /recuperator/calculate`

Executes the full counter-flow recuperator optimisation loop (iterative solver).

**Request body — `RecuperatorInputDto`:**

```typescript
{
  // ── Geometry ─────────────────────────────────────────
  holeForm: HoleForm;              // 'circle_in_ring' | 'circle' | 'square' | 'triangle'
  d0_mm: number;                   // Primary hole diameter (mm); for 'circle_in_ring': outer smoke-tube outer diameter
  h0_mm: number;                   // Air-ring depth for 'circle_in_ring' (mm)
  nAir: number;                    // Number of air channels
  nSmoke: number;                  // Number of smoke channels
  nPasses: number;                 // Air passes (divides air cross-section per pass)
  smokeTurbulence: boolean;        // Enable turbulence multiplier for smoke Re

  // ── Wall layers (recuperator tube wall, inside → outside) ─────────────
  layers: RecuperatorLayerDto[];   // max 3 active layers (h_mm > 0)
  core: RecuperatorLayerDto;       // Core structural material + thickness

  // ── Operating conditions ──────────────────────────────
  tAirStart_C: number;             // Air inlet temperature (°C), typically 20
  fPower_kW: number;               // Furnace thermal power (kW)
  kExcessAir: number;              // Excess-air coefficient λ (e.g. 1.3)
  wH2O_massFraction: number;       // Added moisture mass fraction in air (0..1)

  // ── Solver ────────────────────────────────────────────
  wantedRecuperatorLength_m: number;  // Target recuperator length (m) — goal of optimisation
  maxIterations: number;              // Iteration cap (200–500 typical)
}
```

**`RecuperatorLayerDto`:**
```typescript
{
  material: RecuperatorMaterial;   // enum key (see §5)
  h_mm: number;                    // Layer thickness (mm); 0 = layer inactive
}
```

**Response — `RecuperatorResultDto`:**
```typescript
{
  // ── Temperatures ──────────────────────────────────────
  tAirEnd_C: number;               // Air outlet temperature (°C)
  tSmokeStart_C: number;           // Smoke inlet temperature (°C) — derived from flame
  tSmokeEnd_C: number;             // Smoke outlet temperature (°C)
  tFlame_C: number;                // Adiabatic flame temperature (°C)

  // ── Flow cross-sections ───────────────────────────────
  sAir_cm2: number;                // Total air cross-section (cm²)
  sSmoke_cm2: number;              // Total smoke cross-section (cm²)
  dAirEquivalent_cm: number;       // Equivalent diameter air (cm)
  dSmokeEquivalent_cm: number;     // Equivalent diameter smoke (cm)

  // ── Velocities ────────────────────────────────────────
  wAirStart_m_s: number;
  wAirEnd_m_s: number;
  wSmokeStart_m_s: number;
  wSmokeEnd_m_s: number;

  // ── Energy balance ────────────────────────────────────
  energyReturnedPercent: number;   // Recovered energy / total smoke energy × 100
  airEnergyIncrease_W: number;     // Power added to air (W)
  smokeEnergyDecrease_W: number;   // Power removed from smoke inside recuperator (W)
  smokeTotalEnergy_W: number;      // Total smoke energy from smoke inlet to air inlet temp (W)

  // ── Main result ───────────────────────────────────────
  recuperatorLength_m: number;     // Calculated length for current energy balance (m)
  fuelRate_kg_h: number;           // Fuel consumption (kg/h)

  // ── Heat-transfer coefficients ────────────────────────
  alphaSmokeSide: AlphaResultDto;  // HTC on smoke side (start/end, conv+rad+total)
  alphaAirSide: AlphaResultDto;    // HTC on air side (start/end, conv+rad+total)
  alphaAverage_W_m2K: number;      // Logarithmic-average combined HTC

  // ── Core/wall temperatures ────────────────────────────
  tCoreStart_C: number;            // Average core temperature at smoke-hot end (°C)
  tCoreEnd_C: number;              // Average core temperature at smoke-cold end (°C)
  tOuterStart_C: number;           // Outer surface temp at smoke-hot end (°C)
  tOuterEnd_C: number;             // Outer surface temp at smoke-cold end (°C)
  betweenLayers: LayerBoundaryDto[]; // Interface temperatures between wall layers

  // ── Surfaces ──────────────────────────────────────────
  sExchangeSmoke_dm2: number;      // Heat exchange surface on smoke side (dm²)
  sExchangeAir_dm2: number;        // Heat exchange surface on air side (dm²)
}
```

**`AlphaResultDto`:**
```typescript
{
  start: { convection: number; radiation: number; total: number };
  end:   { convection: number; radiation: number; total: number };
}
```

**`LayerBoundaryDto`:**
```typescript
{
  name: string;      // e.g. "chamotte_solid — basalt_fiber_mat"
  tCelsius: number;
}
```

---

### 4.2 `POST /recuperator/furnace`

Multi-layer furnace thermal loss calculation.  
Computes inner surface temperature, heat transfer coefficients, outer surface temperature,
total heat loss and gas end-temperature.

**Request body — `FurnaceInputDto`:**
```typescript
{
  form: FurnaceForm;                // 'sphere' | 'cylinder' | 'cube'
  internalSize_a_cm: number;        // Radius (sphere/cylinder) or side (cube) [cm]
  internalSize_b_cm: number;        // Height for cylinder [cm]; 0 for sphere/cube
  internalSize_c_cm: number;        // Unused (future rectangular) — send 0

  layers: LayerDto[];               // Insulation layers, inside → outside (max 5)
  // layer fields: { material: RecuperatorMaterial; h_mm: number }

  furnaceW_m_s: number;             // Gas velocity inside furnace [m/s]
  tFlame_C: number;                 // Flame/gas inlet temperature [°C]
  tAmbient_C: number;               // Ambient (room) temperature [°C]
  airPreheat_C: number;             // Air preheat temperature for max-flame calc [°C]
  smokeComposition: SmokeCompositionDto; // Mole fractions of combustion products
  mSmokePerSecond_kg_s: number;     // Smoke mass flow rate [kg/s]

  generatorSurface_dm2: number;     // Generator inner surface (dm²) — for thermal loss subtraction
  generatorHeatFlux_W_dm2: number;  // Generator inner heat flux [W/dm²]

  maxIterations: number;
}
```

**`SmokeCompositionDto`** — mole fractions (must sum ≤ 1):
```typescript
{
  N2: number; O2: number; CO2: number; CO: number; H2O: number; H2: number;
}
```

**Response — `FurnaceResultDto`:**
```typescript
{
  tInner_C: number;            // Inner surface temperature (°C)
  tOuter_C: number;            // Outer surface temperature (°C)
  tGasEnd_C: number;           // Gas end temperature after passing furnace (°C)
  tGasAverage_C: number;       // Average gas temperature (°C)
  sInner_dm2: number;          // Inner surface area (dm²)
  sOuter_dm2: number;          // Outer surface area (dm²)
  totalInsulation_mm: number;  // Total wall thickness (mm)
  maxFlame_C: number;          // Max adiabatic flame temp with preheated air (°C)

  alphaInner: {
    total: number;             // W/(m²·K)
    convection: number;
    radiation: number;
  };
  alphaOuter: number;          // W/(m²·K) — natural convection + radiation to room

  totalHeatLoss_W: number;     // Total heat lost through insulation (W)
  heatFluxInnerDensity_W_dm2: number;

  betweenLayers: LayerBoundaryDto[];  // Interface temperatures
}
```

---

### 4.3 `POST /recuperator/generator`

Identical algorithm to `/furnace` but for the combustion-air generator body.  
Uses the same `FurnaceInputDto` shape (geometry fields apply to the generator).  
Returns the same `FurnaceResultDto` shape.

---
