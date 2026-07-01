# Recuperator Calculation Module — Specification

**Status:** Draft — ready for implementation  
**Source:** `legacy/recuperator.html` + `legacy/scripts/recuperator.js`  
**Target module:** `backend/src/modules/recuperator/`  
**Base API path:** `/api/v1/recuperator`  
**Swagger tag:** `Recuperator Calculations`

---

## 1. Overview

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

## 5. Material Registry — `RecuperatorMaterialService`

The legacy code carries 21 materials used in recuperator/furnace layers.  
These are **not** currently present in the refractory `MaterialEntry` library as named
lookup entries because they require temperature-dependent `λ(T)` polynomials and
emissivity `ε(T)` polynomials — not a single scalar value.

### 5.1 Required action in the refractory module

**Create** `backend/src/modules/recuperator/services/recuperator-material.service.ts`  
(not inside the existing refractory module — the refractory module stores mix-design
compositions, not heat-exchange surface materials with λ(T) curves).

The service must expose:
```typescript
getLambda(material: RecuperatorMaterial, T_K: number): number   // W/(m·K)
getEmissivity(material: RecuperatorMaterial, T_K: number): number  // dimensionless 0–1
```

### 5.2 `RecuperatorMaterial` enum

```typescript
export enum RecuperatorMaterial {
  CHAMOTTE_SOLID      = 'chamotte_solid',
  CHAMOTTE_1300       = 'chamotte_1300',
  CHAMOTTE_1000       = 'chamotte_1000',
  CHAMOTTE_900        = 'chamotte_900',
  CHAMOTTE_600        = 'chamotte_600',
  CHAMOTTE_400        = 'chamotte_400',
  MULLITE_2300        = 'mullite_2300',
  QUARTZ_2000         = 'quartz_2000',
  QUARTZ_1000         = 'quartz_1000',
  QUARTZ_SAND_1       = 'quartz_sand_1',
  QUARTZ_SAND_05      = 'quartz_sand_05',
  QUARTZ_SAND_02      = 'quartz_sand_02',
  ALUMINA_2500        = 'alumina_2500',
  ALUMINA_1300        = 'alumina_1300',
  ALUMINA_SAND_1      = 'alumina_sand_1',
  ALUMINA_SAND_05     = 'alumina_sand_05',
  ALUMINA_SAND_02     = 'alumina_sand_02',
  SILICON_CARBIDE     = 'silicon_carbide',
  BASALT_FIBER_MAT    = 'basalt_fiber_mat',
  AISI_304            = 'AISI_304',
  MILD_STEEL          = 'mild_steel',
}
```

### 5.3 Thermal conductivity `λ(T)` — polynomial `λ = a + b·T_C` [W/(m·K)]

All polynomials ported from `legacy/scripts/recuperator.js` lines 1960–2035:

| Material key | Formula (T_C = Celsius) |
|---|---|
| `chamotte_solid`   | `0.7 + 0.00064 · T_C` |
| `chamotte_1300`    | `0.47 + 0.00035 · T_C` |
| `chamotte_1000`    | `0.35 + 0.00035 · T_C` |
| `chamotte_900`     | `0.29 + 0.00023 · T_C` |
| `chamotte_600`     | `0.13 + 0.00028 · T_C` |
| `chamotte_400`     | `0.10 + 0.00021 · T_C` |
| `mullite_2300`     | `1.55 + 0.0002 · T_C` |
| `quartz_2000`      | `0.815 + 0.00067 · T_C` |
| `quartz_1000`      | `0.55 + 0.0003 · T_C` |
| `quartz_sand_1`    | `0.55 + 0.0003 · T_C` (same as quartz_1000) |
| `quartz_sand_05`   | `0.55 + 0.0003 · T_C` (same as quartz_1000) |
| `quartz_sand_02`   | `0.55 + 0.0003 · T_C` (same as quartz_1000) |
| `alumina_2500`     | `1.9 + 0.0016 · T_C` |
| `alumina_1300`     | `0.84 − 0.00035 · T_C` |
| `alumina_sand_1`   | `0.84 − 0.00035 · T_C` (same as alumina_1300) |
| `alumina_sand_05`  | `0.84 − 0.00035 · T_C` (same as alumina_1300) |
| `alumina_sand_02`  | `0.84 − 0.00035 · T_C` (same as alumina_1300) |
| `silicon_carbide`  | `13.73 − 0.004555 · T_C` |
| `basalt_fiber_mat` | `0.139 − 7.97×10⁻⁵·T_C + 1.3×10⁻⁷·T_C² + 2.73×10⁻¹⁰·T_C³` |
| `AISI_304`         | `9.705 + 0.0176·T_K − 1.60×10⁻⁶·T_K²` (uses Kelvin!) |
| `mild_steel`       | `6.56×10⁻⁸·T_C³ − 8.34×10⁻⁵·T_C² − 8.06×10⁻⁴·T_C + 49.16` |

### 5.4 Emissivity `ε(T)` — polynomial `ε = a + b×10⁻⁵·T + c×10⁻⁸·T² + d×10⁻¹⁰·T³`

Clamped to `[tMin_K, tMax_K]`. Ported from `legacy/scripts/recuperator.js` lines 1850–1937:

| Material | a | b | c | d | T_min K | T_max K |
|---|---|---|---|---|---|---|
| `chamotte_solid`   | 0.84 | -20 | 0 | 0 | 673 | 1673 |
| `chamotte_1300`    | 0.84 | -20 | 0 | 0 | 673 | 1673 |
| `chamotte_1000`    | 0.84 | -20 | 0 | 0 | 673 | 1673 |
| `chamotte_900`     | 0.84 | -20 | 0 | 0 | 673 | 1673 |
| `chamotte_600`     | 0.84 | -20 | 0 | 0 | 673 | 1673 |
| `chamotte_400`     | 0.84 | -20 | 0 | 0 | 673 | 1673 |
| `mullite_2300`     | exponential: `26.186 × T⁻⁰·⁵⁵⁵` | — | — | — | 600 | 2000 |
| `quartz_2000`      | 0.9  | -10 | 0 | 0 | 673 | 1673 |
| `quartz_1000`      | 0.9  | -10 | 0 | 0 | 673 | 1673 |
| `quartz_sand_*`    | 0.9  | -10 | 0 | 0 | 673 | 1673 |
| `alumina_2500`     | 0.98 | -53 | 10.2 | 0 | 300 | 1800 |
| `alumina_1300`     | exponential: `5.6674 × T⁻⁰·³⁶⁶⁴` | — | — | — | 600 | 2000 |
| `alumina_sand_*`   | 0.98 | -53 | 10.2 | 0 | 300 | 1800 |
| `silicon_carbide`  | 0.8  | 15.4 | -9.01 | 0 | 400 | 1850 |
| `basalt_fiber_mat` | 0.92 | 0 | 0 | 0 | 300 | 400 |
| `AISI_304`         | 0.42 | 30  | 0 | 0 | 600 | 1400 |
| `mild_steel`       | 0.173 | 68.6 | -25.6 | 0 | 100+273 | 1050+273 |

> Note: exponential form is `ε = a × T^b` (T in Kelvin).  
> Polynomial form is `ε = a + b×10⁻⁵·T + c×10⁻⁸·T² + d×10⁻¹⁰·T³` (T in Kelvin).

---

## 6. Service Algorithms

### 6.1 `CombustionService` — Adiabatic Flame Temperature

**Purpose:** Compute flame temperature `T_flame` and smoke mole/weight composition for
a solid-carbon fuel.

**Method signature:**
```typescript
findMaxFlameT(params: {
  tAir_K: number;            // Air inlet temperature
  mPerSecond_kg_s: number;   // Fuel mass flow [kg/s]
  kExcessAir: number;        // Excess-air coefficient λ
  wH2O_massFraction?: number; // Added moisture in air [mass fraction]
  pO2?: number;              // O₂ fraction in air (default 0.21)
  fuelQ_J_kg?: number;       // Fuel heating value (default 30 000 000 J/kg)
  maxIterations?: number;
}): {
  tFlame_K: number;
  smokeComposition: { N2: number; O2: number; CO2: number; CO: number; H2O: number; H2: number };
  mSmokePerSecond_kg_s: number;
  mAirPerSecond_kg_s: number;
}
```

**Algorithm** (ported from `recuperator.js::findMaxFlameT`):

1. Compute carbon mass from fuel heating value: `mCarbon = (fuelQ / carbonQ) · mPerSecond`
2. Stoichiometric air: `mAir = kExcessAir · 32/(pO₂·12) · mCarbon`
3. Nitrogen/oxygen split: `mN₂ = mAir·(1−pO₂)·28 / ((1−pO₂)·28 + 32·pO₂)`, `mO₂ = mAir − mN₂`
4. CO₂/CO ratio from λ: `kCO₂ = λ≥1 ? 1 : 2λ−1`, `kCO = λ≥1 ? 0 : 2−2λ`
5. Moisture reactions: compute `kH₂O`, `kH₂` (water-gas shift CO + H₂O → CO₂ + H₂)
6. Compute mass of each species; derive weight fractions
7. Build gas composition by weight fraction
8. Use **`GasPropertiesService.cpMixture()`** to get average Cp of products
9. Iterate: `T_flame = T_air + Q / (Cp_mix · mGasAfter)` until convergence (ΔT < 1 K)

> `GasPropertiesService` already covers N₂, O₂, CO₂, CO, H₂O, H₂ via the NASA-7 / polynomial
> registry. Map legacy species names to `Species` enum values: `N2`, `O2`, `CO2`, `CO`, `H2O`, `H2`.

---

### 6.2 `RecuperatorGeometryService` — Channel Cross-Sections

**Purpose:** Compute `S_air`, `S_smoke`, `L_air` (perimeter) for each hole-form geometry.

```typescript
getAirArea(params: ChannelParams): number       // m²
getSmokeArea(params: ChannelParams): number     // m²
getAirPerimeter(params: ChannelParams): number  // m (hydraulic boundary length)
getSmokePerimeter(params: ChannelParams): number
```

**Algorithm** (ported from `recuperator.js::getArea`, `recuperator.js::getPerimeter`):

| `holeForm` | Air cross-section S_air | Smoke cross-section S_smoke |
|---|---|---|
| `circle` | `π·d₀²/4 · nAir` | `π·d₀²/4 · nSmoke` |
| `square` | `d₀² · nAir` | `d₀² · nSmoke` |
| `triangle` | `d₀²·√3/4 · nAir` | derived ring area · nSmoke |
| `circle_in_ring` | `π·d₀²/4 / nPasses` | `π·(d_smoke²−d_air_outer²)/4` |

For `circle_in_ring`: `d_smoke = d₀ − 2·h_core` (smoke tube inner diameter), `d_air_outer = d₀ + 2·h0`.

---

### 6.3 `RecuperatorService` — Counter-Flow Heat Exchanger Loop

**Main method:**
```typescript
calculate(input: RecuperatorInputDto): RecuperatorResultDto
```

**Algorithm** (ported from `recuperator.js::calculateCriteria` + `recuperator.js::calculate`):

#### Step 1 — Initialisation
1. Convert all inputs to SI (K, m, kg/s).
2. Call `CombustionService.findMaxFlameT()` → `tFlame`, `smokeComposition`, flow rates.
3. Compute `tSmokeStart = min(tFlame / 1.33, 1750 K)` (furnace efficiency factor).
4. Compute `tSmokeEnd_initial = tAirStart · 1.33`.
5. Compute air/smoke flow cross-sections via `RecuperatorGeometryService`.
6. Compute air inlet velocity: `wAirStart = mAirPerSecond / (ρ_air(tAirStart) · S_air)`.

#### Step 2 — Energy balance criteria function `f(tSmokeEnd, tAirEnd)`
Given trial outlet temperatures, compute:

1. **Velocities at each end** — scale by density ratio (ideal-gas expansion):
   `wAirEnd = wAirStart · ρ(tAirStart) / ρ(tAirEnd)`

2. **HTC on each side** — use **`DimensionlessCalculationService.nusselt()`** for convection
   with appropriate `FlowGeometry`:
   - Single tubes → `PIPE_CIRCULAR`
   - `circle_in_ring` smoke side → `PIPE_CIRCULAR` with inner diameter
   - `circle_in_ring` air side → `PIPE_ANNULUS` with `a = d_smoke`, `b = d_air_outer`
   - Then call **`RadiationService.totalGasHTC()`** to add gas radiation component.

3. **Wall thermal resistance** — for `circle_in_ring` geometry, use `calculateSurface`
   (see §6.4); for other geometries use flat-wall approximation with `getAverageAlpha`
   (harmonic series of α_air + wall resistance + α_smoke).

4. **Logarithmic-mean temperature difference:**
   `LMTD = log_mean(tSmokeEnd − tAirStart, tSmokeStart − tAirEnd)`

5. **Energy flows** — use **`GasPropertiesService.cpMixture()`** to compute:
   - `Q_air = mAirPerSecond · Cp_air(tAirStart..tAirEnd) · (tAirEnd − tAirStart)`
   - `Q_smoke = mSmokePerSecond · Cp_smoke(tSmokeStart..tSmokeEnd) · (tSmokeStart − tSmokeEnd)`

6. **Required length:**
   `L = Q_air / (α_avg · LMTD · L_air_perimeter)`

7. **Criteria:** `|L − L_wanted| + |Q_smoke − Q_air − Q_loss|`

#### Step 3 — Optimisation loop
Grid-search on 8-neighbourhood of `(tSmokeEnd, tAirEnd)` with shrinking step.
Stop when `criteria < threshold` or `ΔT < 0.2 K`.
Maximum iterations: caller-provided (default 500).

---

### 6.4 `calculateSurface` — Cylindrical Wall Heat Transfer

Used for `circle_in_ring` geometry where the wall is curved.
All thermal resistances are added in cylindrical coordinates:

```
α_overall · d₁ = 1 / (1/α₁ + d₁/(α₂·d₂) + h₃·d₁/(λ₃·d_lm) + h₄·d₁/(λ₄·d_lm2))
```

Where `d_lm` = logarithmic mean of inner/outer diameters.

At each iteration, interface temperatures `tSurface1`, `tSurface2`, `tSurface3` are
updated from the overall resistance formula until convergence (max 20 iterations).

**Call `RecuperatorMaterialService.getLambda()`** for `λ₃` and `λ₄`.  
**Call `RadiationService.totalGasHTC()`** for each gas side.

---

### 6.5 `FurnaceMultilayerService`

**Main method:**
```typescript
calculate(input: FurnaceInputDto): FurnaceResultDto
```

**Algorithm** (ported from `recuperator.js::heatFluxFurnaceMultyLayer`):

1. Assign `layers[i].start` / `layers[i].end` positions in metres.
2. Compute inner surface geometry:  `surfaceFunction(form, a, b, c)` → s_inner, s_outer.
3. Call **`DimensionlessNumbersService.meanBeamLength()`** → ray length for radiation.
4. Binary-search inner surface temperature `tInner ∈ [tAmbient, tFlame]`:
   a. Call `furnaceFluxInnerRecursion`: iterate gas end-temperature `tGasEnd` via
      `GasPropertiesService.cpMixture()` until `tGasEnd` converges.
   b. Step through layers (finite-difference along radial direction):
      - `λ(T)` → `RecuperatorMaterialService.getLambda()`
      - `ε(T)` → `RecuperatorMaterialService.getEmissivity()`
      - surface at each radial position → `surfaceFunction`
      - `dT = flux · dr / (S_avg · λ(T))`
   c. Outer HTC → `getFullNaturalConvectionAlpha`:
      - below 423 K: simple correlation `α = 9.8 + 0.07·(T_surface − T_room)`
      - above 423 K: **`DimensionlessCalculationService.nusselt()`** (natural convection,
        `VERTICAL_PLATE` or `HORIZONTAL_CYLINDER`) + **`RadiationService.solidRadiationHTC()`**
   d. Stop when `|flux_inner² − flux_outer²| / (flux_inner · flux_outer) < 0.001`
5. Collect between-layer temperatures.

---

## 7. Refractory Module — Required Additions

The legacy code references the following material IDs that are **not yet present** in the
refractory `MaterialEntry` library (checked against `materials-index.ts`):

| Legacy key | Required MaterialEntry `materialId` |
|---|---|
| `chamotte_solid` | `chamotte_solid` |
| `chamotte_1300`  | `chamotte_lw_1300` |
| `chamotte_1000`  | `chamotte_lw_1000` |
| `chamotte_900`   | `chamotte_lw_900` |
| `chamotte_600`   | `chamotte_lw_600` |
| `chamotte_400`   | `chamotte_lw_400` |
| `mullite_2300`   | `mullite_solid_2300` |
| `quartz_2000`    | `quartz_solid_2000` |
| `quartz_1000`    | `quartz_lw_1000` |
| `quartz_sand_1`  | `quartz_sand_1mm` |
| `quartz_sand_05` | `quartz_sand_05mm` |
| `quartz_sand_02` | `quartz_sand_02mm` |
| `alumina_2500`   | already present as `alumina_tabular` / `alumina_calcined` — map to closest |
| `alumina_1300`   | `alumina_lw_1300` |
| `alumina_sand_1` | `alumina_sand_1mm` |
| `alumina_sand_05`| `alumina_sand_05mm` |
| `alumina_sand_02`| `alumina_sand_02mm` |
| `silicon_carbide`| `silicon_carbide_sic` — check if present in `materials-carbide-nitride.data.ts` |
| `basalt_fiber_mat` | `basalt_fiber_mat` |
| `AISI_304`       | `stainless_aisi_304` |
| `mild_steel`     | `mild_steel` |

> **Action required:** For each missing `materialId`, add a `MaterialEntry` to the appropriate
> `materials-*.data.ts` file.  Use composition, density, and thermal properties from the
> legacy `getLambda()` reference values at 20 °C.  For steel/metal materials, add to a new
> `materials-metal.data.ts` file.

### Required new `MaterialEntry` properties for refractory module

Each entry needs at minimum:
```typescript
{
  materialId: '<id>',
  name: '<human readable>',
  type: 'aggregate',  // or 'additive' for fibre mat
  materialGroup: ['<group>'],  // e.g. ['oxide'] for chamotte; ['metal'] for steels
  composition: { ... },         // oxide or alloy composition wt%
  rho_true_after_firing_kgm3: <value>,
  thermalProperties: {
    thermalConductivity_WmK: <value at 20°C>,  // from getLambda(material, 293 K)
    specificHeat_JkgK: <value>,
    thermalExpansion_perK: <value>,
  },
  meltingPoint_C: <value>,
  chemicalShrinkage_volFrac: 0,
  activationEnergy_Jmol: 0,
  isActive: true,
}
```

Reference density values from legacy literature:

| Material | ρ [kg/m³] | Note |
|---|---|---|
| chamotte_solid    | 1900 | Dense firebrick Al₂O₃ ~35–45% |
| chamotte_1300     | 1300 | Lightweight firebrick |
| chamotte_1000     | 1000 | |
| chamotte_900      |  900 | |
| chamotte_600      |  600 | |
| chamotte_400      |  400 | |
| mullite_2300      | 2300 | High-Al₂O₃ brick |
| quartz_2000       | 2000 | Dense silica brick SiO₂ ~95% |
| quartz_1000       | 1000 | Lightweight silica |
| quartz_sand_*     |1600–1700| Bulk sand density |
| alumina_2500      | 2500 | Dense corundum Al₂O₃ ~99% |
| alumina_1300      | 1300 | Lightweight Al₂O₃ |
| alumina_sand_*    |1700–1900| |
| silicon_carbide   | 3100 | SiC |
| basalt_fiber_mat  |  200 | Insulation mat |
| AISI_304          | 7900 | Stainless steel |
| mild_steel        | 7850 | Carbon steel |

---

## 8. `HoleForm` and `FurnaceForm` Enums

```typescript
// enums/hole-form.enum.ts
export enum HoleForm {
  CIRCLE_IN_RING = 'circle_in_ring',
  CIRCLE         = 'circle',
  SQUARE         = 'square',
  TRIANGLE       = 'triangle',
}

// enums/furnace-form.enum.ts
export enum FurnaceForm {
  SPHERE   = 'sphere',
  CYLINDER = 'cylinder',
  CUBE     = 'cube',
}
```

---

## 9. Module Registration

```typescript
// recuperator.module.ts
@Module({
  imports: [ThermodynamicsModule, RefractoryModule],
  controllers: [RecuperatorController],
  providers: [
    RecuperatorService,
    FurnaceMultilayerService,
    CombustionService,
    RecuperatorMaterialService,
    RecuperatorGeometryService,
  ],
  exports: [RecuperatorService, FurnaceMultilayerService, CombustionService],
})
export class RecuperatorModule {}
```

Register `RecuperatorModule` in `AppModule`.

---

## 10. Default Values

The following defaults mirror the legacy HTML form defaults and should be applied
when optional fields are absent:

| Field | Default |
|---|---|
| `holeForm` | `circle_in_ring` |
| `d0_mm` | 60 |
| `h0_mm` | 15 |
| `nAir` | 5 |
| `nSmoke` | 4 |
| `nPasses` | 1 |
| `smokeTurbulence` | false |
| `tAirStart_C` | 20 |
| `kExcessAir` | 1.3 |
| `wH2O_massFraction` | 0.0 |
| `fPower_kW` | 5 |
| `wantedRecuperatorLength_m` | 0.6 |
| `maxIterations` | 500 |
| `furnaceW_m_s` | 19 |
| `form` (furnace) | `cylinder` |
| `tAmbient_C` | 20 |

---

## 11. Helper Functions to Implement Locally

These small helpers exist in the legacy JS and are simple enough to implement as
private methods or utility functions within the service files:

| Legacy function | Target | Notes |
|---|---|---|
| `getLogarithmicAverage(x1,x2)` | shared util | `(x1−x2)/ln(x1/x2)`, returns `x` when `x1===x2` |
| `surfaceFunction(form,a,b,c,h)` | `RecuperatorGeometryService` | sphere/cylinder/cube surface area |
| `getRayLength(form,a,b,c)` | `RecuperatorGeometryService` | Mean beam length 3.6V/S |
| `getFormDimensions(form,a,b,c,h)` | `RecuperatorGeometryService` | `{lSurface, dSurface}` for natural convection |
| `getEquivalentDiameter(S)` | `RecuperatorGeometryService` | `sqrt(4S/π)` |
| `celsiusFromKelvin(T)` | — | Standard — use `T − 273.15` |
| `kelvinFromCelsius(T)` | — | Standard — use `T + 273.15` |

---

## 12. Test Specification

Tests should be placed under `backend/test/unit/modules/recuperator/`.

### Required test cases

| Test file | Scenarios |
|---|---|
| `recuperator-material.service.spec.ts` | λ at reference temperatures for each material; ε at reference temperatures; boundary clamping (T < T_min, T > T_max) |
| `combustion.service.spec.ts` | Flame temperature for λ=1.0 air at 20°C, 5 kW (cross-check legacy HTML default); λ=1.3; λ=0.8 (sub-stoichiometric) |
| `recuperator-geometry.service.spec.ts` | Area and perimeter for each `holeForm`; `circle_in_ring` nPasses=2 |
| `recuperator.service.spec.ts` | Full calculate() with legacy default inputs → smoke/air outlet temperatures, recuperator length within ±5% of legacy JS output |
| `furnace-multilayer.service.spec.ts` | Single-layer chamotte cylinder; multi-layer with 3 materials; outer temperature below 150°C uses simplified alpha |

---

## 13. References

- Legacy source: `legacy/scripts/recuperator.js` (2 450 lines)
- Legacy HTML: `legacy/recuperator.html`
- Hottel–Mikheev gas emissivity correlation: Михеев М.А., Михеева И.М. — Основы теплопередачи, 2-е изд., Энергия, 1977.
- Air Nusselt correlations: Gnielinski, Dittus-Boelter, natural convection per Churchill-Chu (ISO 9300 range).
- Existing backend Nusselt implementation: `DimensionlessNumbersService.nusselt()` covers all required correlations.
- `RadiationService.gasRadiationHTC()` directly implements the Hottel–Mikheev correlation already used in legacy JS lines 1120–1145.
