# Recuperator Materials and Service Algorithms

**Parent index:** [RECUPERATOR_SPEC.md](./RECUPERATOR_SPEC.md)

---

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
8. ~~Use `GasPropertiesService.cpMixture()` to get average Cp of products~~
9. ~~Solve `T_flame − T_air − Q / (Cp_mix(T_flame) · mGasAfter) = 0`~~

> **Superseded (September 2026):** the carbon-equivalent model (steps 1–9) is removed. The
> recuperator request selects one of the four combustion modes (`combustion.mode` =
> `solid-direct` | `solid-two-step` | `fluid` | `bed`) and uses that mode's flue gas
> (`CombustionService.flueGas()`: element balance + water-gas shift Kp(T), absolute-enthalpy
> balance solved with `brentq`). See
> [`algorithms/combustion/07_RecuperatorFlueGas.md`](algorithms/combustion/07_RecuperatorFlueGas.md)
> and [`algorithms/combustion/`](algorithms/combustion/README.md).

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
4. Find inner surface temperature `tInner ∈ [tAmbient, tFlame]` with `brentq` on
   `h(tInner) = flux_inner − flux_outer` (flux_outer = 0 if the traverse drops below tAmbient; see SPEC_06 §6.5):
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
   d. `brentq` stops on its temperature tolerance (1e-6)
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
