# CH07 — DimensionlessNumbersService

**Sources:**
- `legacy/scripts/src/thermalExchange/fluidDynamics.ts` — Re, Gr, Ra (single geometry)
- `legacy/scripts/src/dto/form.dto.ts` — FormDto: cylinder, sphere, cube, rectangularPrism, prism
- `legacy/furnaceCombustion/modules/HeatTransfer.js` — Nu: Gunn (packed bed), Churchill–Chu (vertical cylinder)
- `legacy/scripts/recuperator.js` — Nu: Mills/Gnielinski (pipe); surface/ray-length for sphere, cylinder, cube; channel forms: circle, square, triangle, circle_in_ring

**Target:** `backend/src/modules/thermodynamics/services/dimensionless-numbers.service.ts`
**Controller:** `POST /thermodynamics/dimensionless`, `POST /thermodynamics/body-geometry`

**Appendix:** `CH07_APPENDIX_CORRELATIONS.md` — exact formulas from original Churchill & Whitaker papers

---

## Two input modes

The service supports **two fully independent input modes** for Nu calculation.

### Mode A — Raw numbers
Caller pre-computes all fluid properties and passes plain numbers.  
Does **not** call `GasPropertiesService`. Fully stateless.

### Mode B — Fluid + conditions
Caller names a known fluid and provides temperature/pressure/flow conditions.  
Service resolves properties via `GasPropertiesService` / `FluidPropertiesService` internally,  
then proceeds identically to Mode A.

The same `NusseltParams` DTO covers both modes — Mode B fields are optional additions.  
If `fluid` is present, Mode B is used; otherwise Mode A is assumed and raw properties are required.

---

## Two geometry enums

### `BodyGeometry` — enclosure / furnace body shapes
Used for: surface area, mean beam length (radiation), characteristic dimension for natural convection.

```typescript
export enum BodyGeometry {
  // From legacy FormDto + recuperator.js surfaceFunction / getRayLength
  SPHERE                = 'sphere',            // a = radius
  CYLINDER              = 'cylinder',          // a = radius, b = height
  CUBE                  = 'cube',              // a = side
  RECTANGULAR_PRISM     = 'rectangularPrism',  // a = width, b = depth, c = height
  TRIANGULAR_PRISM      = 'prism',             // a = base, b = triangle height, c = length

  // Extensions — not in legacy
  CONE                  = 'cone',              // a = base radius, b = height
  TRUNCATED_CONE        = 'truncated_cone',    // a = r_bottom, b = r_top, c = height
  HOLLOW_CYLINDER       = 'hollow_cylinder',   // a = inner radius, b = outer radius, c = height
  ELLIPSOID             = 'ellipsoid',         // a, b, c = semi-axes
  HEMISPHERICAL_DOME    = 'hemispherical_dome',// a = radius (includes flat base)
}
```

### `FlowGeometry` — flow channel / convection configurations
Used for: Re, Nu, h, hydraulic diameter.

```typescript
export enum FlowGeometry {
  // ── Internal forced convection ─────────────────────────────────────────
  PIPE_CIRCULAR             = 'pipe_circular',
  PIPE_ANNULUS              = 'pipe_annulus',           // D_h = D_o − D_i
  DUCT_SQUARE               = 'duct_square',
  DUCT_RECTANGULAR          = 'duct_rectangular',
  DUCT_TRIANGULAR           = 'duct_triangular',        // equilateral
  DUCT_TRIANGULAR_SCALENE   = 'duct_triangular_scalene',
  DUCT_ELLIPTICAL           = 'duct_elliptical',
  DUCT_TRAPEZOIDAL          = 'duct_trapezoidal',
  PARALLEL_PLATES           = 'parallel_plates',        // D_h = 2·gap
  HELICAL_COIL              = 'helical_coil',
  CORRUGATED_PIPE           = 'corrugated_pipe',
  RIBBED_CHANNEL            = 'ribbed_channel',

  // ── External forced convection ─────────────────────────────────────────
  FLAT_PLATE                = 'flat_plate',
  FLAT_PLATE_ROUGH          = 'flat_plate_rough',
  CYLINDER_CROSSFLOW        = 'cylinder_crossflow',
  SPHERE_FORCED             = 'sphere_forced',
  TUBE_BANK_INLINE          = 'tube_bank_inline',
  TUBE_BANK_STAGGERED       = 'tube_bank_staggered',
  CONE_CROSSFLOW            = 'cone_crossflow',
  ELLIPTICAL_CYLINDER       = 'elliptical_cylinder',

  // ── Natural convection ─────────────────────────────────────────────────
  VERTICAL_PLATE            = 'vertical_plate',
  VERTICAL_CYLINDER         = 'vertical_cylinder',
  HORIZONTAL_CYLINDER       = 'horizontal_cylinder',
  HORIZONTAL_PLATE_HOT_UP   = 'horizontal_plate_hot_up',
  HORIZONTAL_PLATE_HOT_DOWN = 'horizontal_plate_hot_down',
  INCLINED_PLATE            = 'inclined_plate',         // angle_deg from vertical
  SPHERE_NATURAL            = 'sphere_natural',
  CONCENTRIC_CYLINDERS      = 'concentric_cylinders',
  CONCENTRIC_SPHERES        = 'concentric_spheres',
  HORIZONTAL_CAVITY         = 'horizontal_cavity',
  VERTICAL_CAVITY           = 'vertical_cavity',

  // ── Mixed (combined forced + natural) ─────────────────────────────────
  MIXED_PIPE_VERTICAL       = 'mixed_pipe_vertical',
  MIXED_PLATE_VERTICAL      = 'mixed_plate_vertical',

  // ── Packed / porous beds ───────────────────────────────────────────────
  PACKED_BED                = 'packed_bed',
  PACKED_BED_CYLINDER       = 'packed_bed_cylinder',
  FLUIDIZED_BED             = 'fluidized_bed',

  // ── Phase change ──────────────────────────────────────────────────────
  CONDENSATION_VERTICAL_PLATE  = 'condensation_vertical_plate',
  CONDENSATION_HORIZONTAL_TUBE = 'condensation_horizontal_tube',
  POOL_BOILING              = 'pool_boiling',

  // ── Rotating / special ─────────────────────────────────────────────────
  ROTATING_DISK             = 'rotating_disk',
  ROTATING_CYLINDER         = 'rotating_cylinder',
  IMPINGING_JET_SINGLE      = 'impinging_jet_single',
  IMPINGING_JET_ARRAY       = 'impinging_jet_array',
}
```

---

## `GeometryDims`

```typescript
export interface GeometryDims {
  a?: number;         // radius / side / width / D_inner / D_particle / semi-major
  b?: number;         // height / D_outer / semi-minor / depth
  c?: number;         // length / 3rd dimension
  L?: number;         // explicit characteristic length override (bypasses auto-compute)
  epsilon?: number;   // porosity (packed bed)
  S_T?: number;       // transverse pitch (tube bank)
  S_L?: number;       // longitudinal pitch (tube bank)
  angle_deg?: number; // inclination from vertical (inclined plate, degrees)
  omega?: number;     // angular velocity [rad/s] (rotating geometries)
}
```

---

## Known fluid identifiers

```typescript
export type KnownFluid =
  | 'air'
  | 'N2' | 'O2' | 'CO2' | 'CO' | 'H2' | 'H2O' | 'CH4'
  | 'SO2' | 'SO3' | 'NO' | 'NO2' | 'NH3'
  | 'water'          // liquid water
  | 'gas_mix';       // arbitrary mixture — requires composition field
```

---

## Service interface

```typescript
@Injectable()
export class DimensionlessNumbersService {

  // ── Dimensionless numbers — Mode A (raw) ──────────────────────────────
  reynolds(rho: number, w: number, L: number, mu: number): number
  reynoldsKinematic(w: number, L: number, nu: number): number
  prandtl(mu: number, Cp_J_kgK: number, lambda: number): number
  grashof(T_hot_K: number, T_cold_K: number, L: number, nu: number): number
  rayleigh(T_hot_K: number, T_cold_K: number, L: number, nu: number, Pr: number): number

  // ── Main Nu calculator — accepts both modes ────────────────────────────
  nusselt(params: NusseltParams): NusseltResult

  hFromNusselt(Nu: number, lambda: number, L: number): number

  // ── Flow channel geometry ──────────────────────────────────────────────
  hydraulicDiameter(area: number, perimeter: number): number
  channelArea(geometry: FlowGeometry, dims: GeometryDims): number
  channelPerimeter(geometry: FlowGeometry, dims: GeometryDims): number
  characteristicLength(geometry: FlowGeometry, dims: GeometryDims): number

  // ── Body geometry ──────────────────────────────────────────────────────
  bodyArea(geometry: BodyGeometry, dims: GeometryDims, insulationH?: number): number
  bodyVolume(geometry: BodyGeometry, dims: GeometryDims): number
  meanBeamLength(geometry: BodyGeometry, dims: GeometryDims): number
}
```

---

## `NusseltParams`, `NusseltResult`, `CorrelationName`

### `CorrelationName` — complete catalog

Every value corresponds to an exact formula defined in this spec and in `CH07_APPENDIX_CORRELATIONS.md`.

```typescript
export type CorrelationName =
  // ── PIPE_CIRCULAR / duct (via D_h) ─────────────────────────────────────
  | 'mills'                        // [Leg 871] default laminar
  | 'sieder_tate_laminar'          // [Leg 877] μ-correction laminar
  | 'fully_developed_uniform_T'    // Nu = 3.66 [I7 §8.4]
  | 'fully_developed_uniform_q'    // Nu = 4.36 [I7 §8.4]
  | 'transitional'                 // [Leg 882] 0.008·Re^0.9·Pr^0.43
  | 'gnielinski'                   // [Leg 892] default turbulent
  | 'gnielinski_v2'                // Churchill (1977) friction-based variant — see Appendix §A2
  | 'dittus_boelter'               // [Leg 908]
  | 'sieder_tate_turbulent'        // [Leg 903]
  | 'mikheev'                      // [Leg 918] Russian — 0.021·Re^0.8·Pr^0.43
  | 'petukhov'                     // [I7 §8.5]
  | 'whitaker_pipe'                // Whitaker (1972) AIChE — 0.015·Re^0.83·Pr^(1/3)·(μ/μ_w)^0.14 — see Appendix §W1

  // ── HELICAL_COIL ───────────────────────────────────────────────────────
  | 'seban_mclaughlin'             // [VDI L1.3]

  // ── CORRUGATED_PIPE / RIBBED_CHANNEL ───────────────────────────────────
  | 'webb_eckert_goldstein'        // [I7 §8.7, VDI G8]
  | 'isachenko_roughness'          // simplified turbulent

  // ── FLAT_PLATE ─────────────────────────────────────────────────────────
  | 'flat_plate_laminar'           // 0.664·Re^0.5·Pr^(1/3) [I7 §7.2]
  | 'flat_plate_turbulent'         // 0.037·Re^0.8·Pr^(1/3) [I7 §7.2]
  | 'flat_plate_mixed'             // (0.037·Re^0.8−871)·Pr^(1/3) [I7 §7.2]
  | 'churchill_ozoe'               // Churchill & Ozoe (1973) all Re/Pr — see Appendix §A3
  | 'whitaker_flat_plate'          // Whitaker (1972) — see Appendix §W2

  // ── CYLINDER_CROSSFLOW ─────────────────────────────────────────────────
  | 'churchill_bernstein'          // Churchill & Bernstein (1977) — default; see Appendix §A4
  | 'hilpert'                      // range-table [I7 §7.4, C5 §7-3]
  | 'whitaker_cylinder'            // Whitaker (1972) — see Appendix §W3

  // ── SPHERE_FORCED ──────────────────────────────────────────────────────
  | 'sphere_ranz_marshall'         // [Leg 841] 2+0.4·Re^0.5·Pr^(1/3) — default
  | 'sphere_diffusion'             // [Leg 839] 2+0.17·Re^(2/3) — Russian lit, source TBD
  | 'whitaker_sphere'              // Whitaker (1972) full form — default alternative; see Appendix §W4

  // ── TUBE_BANK ──────────────────────────────────────────────────────────
  | 'zukauskas'                    // [I7 §7.5]
  | 'whitaker_tube_bank'           // Whitaker (1972) — see Appendix §W5

  // ── VERTICAL_PLATE / VERTICAL_CYLINDER ────────────────────────────────
  | 'churchill_chu'                // auto-selects laminar/all-Ra — default
  | 'churchill_chu_laminar'        // [Leg 819] Ra < 1e9; Churchill & Chu (1975a) Eq.(1) — see Appendix §A5
  | 'churchill_chu_all_ra'         // [Leg 820] all Ra; Churchill & Chu (1975a) Eq.(2) — see Appendix §A5

  // ── HORIZONTAL_CYLINDER ───────────────────────────────────────────────
  | 'morgan'                       // range-table [I7 §9.6] — default
  | 'churchill_chu_horizontal'     // Churchill & Chu (1975b) all Ra — see Appendix §A6

  // ── HORIZONTAL_PLATE ──────────────────────────────────────────────────
  | 'mcadams_hot_up'               // 0.54·Ra^0.25 / 0.15·Ra^(1/3) [I7 §9.7]
  | 'mcadams_hot_down'             // 0.27·Ra^0.25 [I7 §9.7]

  // ── INCLINED_PLATE ────────────────────────────────────────────────────
  | 'churchill_inclined'           // Churchill (1977) g_eff form — see Appendix §A7

  // ── SPHERE_NATURAL ────────────────────────────────────────────────────
  | 'churchill_sphere_natural'     // Churchill [I7 §9.9] — see Appendix §A8

  // ── CONCENTRIC_CYLINDERS / SPHERES ────────────────────────────────────
  | 'raithby_hollands_cylinders'   // [I7 §9.7]
  | 'raithby_hollands_spheres'     // [I7 §9.7]

  // ── CAVITIES ──────────────────────────────────────────────────────────
  | 'hollands'                     // horizontal cavity [I7 §9.9]
  | 'globe_dropkin'                // horizontal cavity [I7 §9.9]
  | 'macgregor_emery'              // vertical cavity [I7 §9.9]

  // ── MIXED CONVECTION ──────────────────────────────────────────────────
  | 'mixed_power_sum'              // Churchill (1977) n=3 blend [I7 §9.10, C5 §15-2]

  // ── PACKED BED ────────────────────────────────────────────────────────
  | 'gunn'                         // [Leg HeatTransfer.js 22] — default
  | 'wakao_funazkri'               // Wakao & Funazkri (1978) [VDI M8]
  | 'whitaker_packed_bed'          // Whitaker (1972) — see Appendix §W6

  // ── PHASE CHANGE ──────────────────────────────────────────────────────
  | 'nusselt_condensation'         // [I7 §10.6]
  | 'chen_condensation'            // [I7 §10.6]

  // ── ROTATING ──────────────────────────────────────────────────────────
  | 'dorfman_disk'                 // [VDI H4]
  | 'bjorklund_kays'               // [VDI H5]

  // ── IMPINGING JET ─────────────────────────────────────────────────────
  | 'martin_jet_single'            // Martin (1977) [VDI G8]
  | 'martin_jet_array'             // Martin (1977) [VDI G8]
```

---

## `NusseltParams`

```typescript
export interface NusseltParams {
  geometry: FlowGeometry;

  // ── Mode A: raw fluid properties (all required if fluid is absent) ─────
  rho_kg_m3?: number;       // density
  mu_Pa_s?: number;         // dynamic viscosity at film temperature
  mu_s_Pa_s?: number;       // dynamic viscosity at wall/surface temperature (for μ/μ_s correction)
  Cp_J_kgK?: number;        // specific heat
  lambda_W_mK?: number;     // thermal conductivity
  w_m_s?: number;           // flow velocity (0 = natural convection)

  // ── Mode B: fluid by name + conditions ────────────────────────────────
  fluid?: KnownFluid;
  composition?: Record<string, number>;  // mole fractions, required when fluid='gas_mix'
  T_fluid_K?: number;       // bulk fluid temperature
  T_surface_K?: number;     // surface / wall temperature
  P_Pa?: number;            // pressure (default 101325)

  // ── Geometry ──────────────────────────────────────────────────────────
  dims?: GeometryDims;

  // ── Pre-computed dimensionless numbers (override auto-compute) ─────────
  Re?: number;
  Pr?: number;
  Gr?: number;
  Ra?: number;

  // ── Control ───────────────────────────────────────────────────────────
  forceRegime?: 'laminar' | 'turbulent' | 'transitional';
  preferredCorrelation?: CorrelationName;  // validated against geometry/regime/range; see selector logic
  compareAll?: boolean;                    // populate allCorrelations in result
  isDiffusion?: boolean;                   // sphere: false→Ranz-Marshall [Leg 841], true→diffusion [Leg 839]
  isHeating?: boolean;                     // Dittus-Boelter n exponent: true→0.4, false→0.3
}
```

---

### `NusseltResult`

```typescript
export interface NusseltResult {
  Nu: number;
  h_W_m2K?: number;                          // only if lambda and L are determinable
  correlation: CorrelationName;
  regime: 'laminar' | 'turbulent' | 'transitional' | 'natural' | 'mixed';
  isNatural: boolean;

  // ── Preferred correlation feedback ────────────────────────────────────
  preferredRequested?: CorrelationName;      // echoes preferredCorrelation if given
  preferredUsed: boolean;                    // true if preferred was valid and used
  preferredRejectedReason?: string;          // why preferred was not used (if applicable)

  // ── Range validation ──────────────────────────────────────────────────
  warning?: string;                          // out-of-range notice for the selected correlation
  rangeValid: boolean;                       // false if any input is outside correlation bounds

  // ── Comparison ────────────────────────────────────────────────────────
  allCorrelations?: Partial<Record<CorrelationName, {
    Nu: number;
    rangeValid: boolean;
    warning?: string;
  }>>;
}
```

---

## Preferred-correlation selector logic

This logic runs inside `nusselt()` whenever `preferredCorrelation` is supplied.

```
1. Resolve regime (laminar / turbulent / transitional / natural) from Re, Ra, Gr
   (or compute from fluid properties if Mode B).

2. Look up the validity table for (geometry, preferredCorrelation):
     a. Does this correlation exist for this geometry?           → if no: REJECT (reason: "not applicable to geometry")
     b. Is the current regime within the correlation's range?    → if no: REJECT (reason: "regime outside range")
     c. Are Re/Pr/Ra within the numeric validity bounds?         → if no: REJECT (reason: "Re/Pr/Ra out of bounds: <detail>")

3. If NOT rejected:
     → use preferred; set preferredUsed = true

4. If rejected:
     → run best-equation selector (see below) to pick fallback
     → set preferredUsed = false
     → set preferredRejectedReason = reason string
     → set warning if fallback is also marginal
```

### Best-equation selector

The fallback (and default when no `preferredCorrelation` is given) runs the following rules **in priority order**:

#### Internal pipe / duct (PIPE_CIRCULAR and D_h-variants)
```
isNatural  → 'churchill_chu'     (vertical cylinder, legacy logic preserved — [Leg 922–968])
laminar    → 'mills'             ([Leg 871])
transient  → Re < 3000 ? 'transitional' : 'gnielinski'   ([Leg 967])
turbulent  → 'gnielinski'        ([Leg 968])
```

#### External cylinder crossflow
```
always     → 'churchill_bernstein'   (valid all Re·Pr^0.5 > 0.2; Churchill & Bernstein 1977)
fallback   → 'hilpert'               (if Re in [0.4, 4e5] and Pr ≥ 0.7)
```

#### External sphere forced
```
isDiffusion=false → 'sphere_ranz_marshall'   ([Leg 841])
isDiffusion=true  → 'sphere_diffusion'       ([Leg 839])
whitaker_sphere available as named alternative when 3.5 ≤ Re ≤ 7.6e4 and 0.71 ≤ Pr ≤ 380
```

#### Vertical plate / cylinder natural
```
Ra < 1e9  → 'churchill_chu_laminar'    ([Leg 819])
Ra ≥ 1e9  → 'churchill_chu_all_ra'    ([Leg 820])
'churchill_chu' = auto-apply above rule (legacy default)
```

#### Horizontal cylinder natural
```
always → 'morgan'  (default, range-table)
'churchill_chu_horizontal' always valid as alternative (all Ra)
```

#### Flat plate
```
Re_L ≤ 5e5            → 'flat_plate_laminar'
Re_L > 5e5            → 'flat_plate_mixed'
all Re, Pr            → 'churchill_ozoe'  (preferred if Pr < 0.05 or Pr > 50)
```

#### Packed bed
```
default               → 'gunn'  (0 ≤ Re ≤ 1e5, 0.35 ≤ ε ≤ 1.0)
Re > 1e5 or ε < 0.35 → 'wakao_funazkri'
```

#### All other geometries: single correlation; best-equation = that correlation.

---

## Nu correlations per `FlowGeometry` — exact formulas and sources

> **Abbreviations:**
> [I7] = Incropera, *Fundamentals of Heat and Mass Transfer*, 7th ed.
> [C5] = Cengel & Ghajar, *Heat and Mass Transfer*, 5th ed.
> [VDI] = VDI Heat Atlas, 2nd ed. (Springer 2010)
> [Leg] = `recuperator.js` formula taken verbatim — coefficients must not be changed
> [App §Xn] = full formula with all bounds in CH07_APPENDIX_CORRELATIONS.md

---

### Internal forced — `PIPE_CIRCULAR` (and D_h-based ducts)

All duct variants compute `D_h = 4A/P` then delegate to PIPE_CIRCULAR correlations.

| Correlation | Regime | Exact formula | Source |
|---|---|---|---|
| `mills` | laminar, default | `Nu = 3.66 + (0.065·Re·Pr·D/L) / (1 + 0.4·(Re·Pr·D/L)^(2/3))` | [Leg 871]; [I7 §8.4] |
| `sieder_tate_laminar` | laminar | `Nu = 1.86·(Re·Pr·D/L)^(1/3)·(μ/μ_s)^0.14` | [Leg 877]; [C5 §8-3] |
| `fully_developed_uniform_T` | laminar, L/D→∞ | `Nu = 3.66` | [I7 §8.4] |
| `fully_developed_uniform_q` | laminar, L/D→∞ | `Nu = 4.36` | [I7 §8.4] |
| `transitional` | 2300 ≤ Re ≤ 10000 | `Nu = 0.008·Re^0.9·Pr^0.43` | [Leg 882] |
| `gnielinski` | turbulent, default | `Nu = (f/8)·(Re−1000)·Pr / (1+12.7·√(f/8)·(Pr^(2/3)−1))`, `f = (0.79·ln Re − 1.64)^−2` | [Leg 892–895]; [I7 §8.5] |
| `gnielinski_v2` | turbulent | Churchill (1977) friction-based — full form with all bounds | [App §A2] |
| `dittus_boelter` | turbulent | `Nu = 0.023·Re^0.8·Pr^n`, n=0.4 heating / n=0.3 cooling | [Leg 908–915]; [I7 §8.5] |
| `sieder_tate_turbulent` | turbulent | `Nu = 0.027·Re^0.8·Pr^(1/3)·(μ/μ_s)^0.14` | [Leg 903]; [C5 §8-3] |
| `mikheev` | turbulent | `Nu = 0.021·Re^0.8·Pr^0.43·(Pr/Pr_s)^0.25·ε_l`, ε_l=1.2 | [Leg 918–919]; Mikheev 1956 |
| `petukhov` | turbulent | `Nu = (f/8)·Re·Pr / (1.07 + 12.7·√(f/8)·(Pr^(2/3)−1))` | [I7 §8.5]; [VDI G1] |
| `whitaker_pipe` | turbulent | `Nu = 0.015·Re^0.83·Pr^(1/3)·(μ/μ_w)^0.14` — 10⁴≤Re≤5×10⁵, 0.7≤Pr≤700 | [App §W1] |

**Default selection logic (preserved verbatim from [Leg 922–968]):**
```
isNatural   = w===0 OR (laminar AND Nu_natural/L > Nu_Mills/D)
                     OR (transient AND Nu_natural/L > Nu_transient/D)
                     OR (turbulent AND Nu_natural/L > Nu_Gnielinski/D)
return isNatural  → Nu_natural (Churchill-Chu)
       laminar    → mills
       transient  → Re < 3000 ? transitional : gnielinski
       turbulent  → gnielinski
```

---

### Internal — `HELICAL_COIL`

| Regime | Formula | Source |
|---|---|---|
| Laminar | `Nu = 0.036·Re^0.5·Pr^0.43·(D/D_c)^0.1` | Seban & McLaughlin; [VDI L1.3] |
| Turbulent | `Nu = Nu_straight·(1 + 3.6·(1−D/D_c)·(D/D_c)^0.8)` | Seban & McLaughlin; [VDI L1.3] |
| Critical Re | `Re_cr = 2300·(1 + 8.6·(D/D_c)^0.45)` | Schmidt (1967); [C5 §8-4] |

---

### Internal — `CORRUGATED_PIPE` / `RIBBED_CHANNEL`

| Range | Formula | Source |
|---|---|---|
| `0.01 ≤ e/D ≤ 0.05`, `10 ≤ p/e ≤ 40` | `St·Pr^(2/3) = (f/2) / (1 + √(f/2)·f(e+))`, Webb-Eckert-Goldstein | [I7 §8.7], [VDI G8] |
| Simplified turbulent | `Nu = 0.023·Re^0.8·Pr^0.4·(1 + 1.77·(e/D))` | Isachenko et al. |

---

### External forced — `FLAT_PLATE`

| Correlation | Regime | Formula | Source |
|---|---|---|---|
| `flat_plate_laminar` | Re ≤ 5×10⁵ | `Nu_L = 0.664·Re_L^0.5·Pr^(1/3)` | [I7 §7.2] |
| `flat_plate_turbulent` | Re > 5×10⁵ | `Nu_L = 0.037·Re_L^0.8·Pr^(1/3)` | [I7 §7.2] |
| `flat_plate_mixed` | mixed | `Nu_L = (0.037·Re_L^0.8 − 871)·Pr^(1/3)` | [I7 §7.2] |
| `churchill_ozoe` | all Re, Pr | full blended form — see [App §A3] | Churchill & Ozoe (1973) |
| `whitaker_flat_plate` | all Re | `Nu = (0.4·Re^0.5 + 0.06·Re^(2/3))·Pr^0.4·(μ/μ_s)^0.25` | [App §W2] |

---

### External forced — `CYLINDER_CROSSFLOW`

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `churchill_bernstein` | full blended form — see [App §A4] | all Re, Pr·Re^0.5 > 0.2 | Churchill & Bernstein (1977) |
| `hilpert` | `Nu = C·Re^m·Pr^(1/3)` (C, m from table below) | 0.4 ≤ Re ≤ 4×10⁵ | [I7 §7.4], [C5 §7-3] |
| `whitaker_cylinder` | full form with μ/μ_s correction — see [App §W3] | 10 ≤ Re ≤ 1.5×10⁵, 0.65 ≤ Pr ≤ 300 | Whitaker (1972) |

**Hilpert constants:**

| Re range | C | m |
|---|---|---|
| 0.4–4 | 0.989 | 0.330 |
| 4–40 | 0.911 | 0.385 |
| 40–4000 | 0.683 | 0.466 |
| 4000–40000 | 0.193 | 0.618 |
| 40000–400000 | 0.027 | 0.805 |

---

### External forced — `ELLIPTICAL_CYLINDER`

`Nu = C·Re_a^m·Pr^(1/3)`, C and m from Owen (1952); tabulated in [VDI F5].

---

### External forced — `CONE_CROSSFLOW`

`Nu ≈ 0.58·Re^0.5·Pr^(1/3)` for apex upstream, from Yuge (1960); [VDI F6].

---

### External forced — `TUBE_BANK_INLINE` / `TUBE_BANK_STAGGERED`

**Zukauskas:**
`Nu = C₁·C₂·Re_D,max^m·Pr^0.36·(Pr/Pr_s)^0.25`
`Re_D,max = V·S_T/(S_T−D)·D/ν`  (inline; diagonal check for staggered)

| Re_D,max | C₁ inline | C₁ staggered | m |
|---|---|---|---|
| 10–100 | 0.80 | 0.90 | 0.40 |
| 100–10³ | 0.27 | 0.35·(S_T/S_L)^0.2 | 0.63 |
| 10³–2×10⁵ | 0.21 | 0.40 | 0.70 |
| 2×10⁵–2×10⁶ | 0.021 | 0.022 | 0.84 |

Row correction C₂: 1.0 for N_L ≥ 20 rows; table in [I7 §7.5].

**Whitaker tube bank** — see [App §W5].

---

### External forced — `SPHERE_FORCED`

> ⚠️ [Leg] lines 838–841 contain **two distinct sphere correlations** (verbatim — must not change).

| Correlation | Formula | Source |
|---|---|---|
| `sphere_ranz_marshall` (default) | `Nu = 2 + 0.4·Re^0.5·Pr^(1/3)` | [Leg 841]; Ranz & Marshall, *Chem.Eng.Prog.* 48:141, 1952 |
| `sphere_diffusion` | `Nu = 2 + 0.17·Re^(2/3)` | [Leg 839]; ⚠️ Russian lit — source TBD |
| `whitaker_sphere` | full form with (μ/μ_s)^0.25 — see [App §W4] | Whitaker (1972) AIChE |

---

### Natural convection — `VERTICAL_PLATE` / `VERTICAL_CYLINDER`

> ⚠️ Both forms verbatim from [Leg 818–820]. Ra boundary **Ra < 10⁹** must not change.

| Correlation | Formula | Source |
|---|---|---|
| `churchill_chu_laminar` | `Nu = 0.68 + 0.67·Ra^(1/4) / (1+(0.492/Pr)^(9/16))^(4/9)` | [Leg 819]; Churchill & Chu (1975a) Eq.(1) — [App §A5] |
| `churchill_chu_all_ra` | `Nu = (0.825 + 0.387·Ra^(1/6) / (1+(0.492/Pr)^(9/16))^(8/27))²` | [Leg 820]; Churchill & Chu (1975a) Eq.(2) — [App §A5] |
| `churchill_chu` | auto-selects laminar for Ra < 1e9, all_ra otherwise | [Leg 819–820] |

**Vertical cylinder validity (from [Leg 813–815, 853–857]):**
`D/L ≥ 35/Gr_L^(1/4)` → use vertical plate; otherwise treat as pipe.

---

### Natural convection — `HORIZONTAL_CYLINDER`

| Correlation | Formula | Source |
|---|---|---|
| `morgan` (default) | `Nu = C·Ra_D^n` (range-table) | [I7 §9.6] |
| `churchill_chu_horizontal` | all Ra form — see [App §A6] | Churchill & Chu (1975b) |

**Morgan table:**

| Ra_D | C | n |
|---|---|---|
| 10⁻¹⁰–10⁻² | 0.675 | 0.058 |
| 10⁻²–10² | 1.02 | 0.148 |
| 10²–10⁴ | 0.850 | 0.188 |
| 10⁴–10⁷ | 0.480 | 0.250 |
| 10⁷–10¹² | 0.125 | 0.333 |

---

### Natural convection — `HORIZONTAL_PLATE_HOT_UP` / `HOT_DOWN`

| Regime | Formula | Source |
|---|---|---|
| Hot up, 10⁴ ≤ Ra ≤ 10⁷ | `Nu = 0.54·Ra^(1/4)` | [I7 §9.7] |
| Hot up, 10⁷ ≤ Ra ≤ 10¹¹ | `Nu = 0.15·Ra^(1/3)` | [I7 §9.7] |
| Hot down, 10⁵ ≤ Ra ≤ 10¹¹ | `Nu = 0.27·Ra^(1/4)` | [I7 §9.7] |

`L_c = A_s / P`

---

### Natural convection — `INCLINED_PLATE`

`g_eff = g·cos(θ)`, θ from vertical.
- Upper surface heated facing down: use Churchill–Chu with `g_eff` — [App §A7]
- Upper surface heated facing up + θ > 60°: use horizontal plate correlations

---

### Natural convection — `SPHERE_NATURAL`

`Nu = 2 + 0.589·Ra_D^(1/4) / (1+(0.469/Pr)^(9/16))^(4/9)` — Churchill; [I7 §9.9] — [App §A8]
Validity: Ra ≤ 10¹¹, Pr ≥ 0.7.

---

### Natural convection — `CONCENTRIC_CYLINDERS`

**Raithby–Hollands:**
`k_eff/k = 0.386·(Pr/(0.861+Pr))^(1/4)·Ra_c^(1/4)`
`Ra_c = (ln(D_o/D_i))^4 / (r_i^(−3/5) + r_o^(−3/5))^5 · Ra_δ`
`q' = 2π·k_eff·ΔT / ln(D_o/D_i)` — [I7 §9.7]

---

### Natural convection — `CONCENTRIC_SPHERES`

**Raithby–Hollands:**
`k_eff/k = 0.74·(Pr/(0.861+Pr))^(1/4)·Ra_δ^(1/4) / (1−(r_i/r_o)^(−5/7))^(5/4)` — [I7 §9.7]

---

### Natural convection — `HORIZONTAL_CAVITY`

| Correlation | Formula | Validity |
|---|---|---|
| `hollands` | `Nu = 1 + 1.44·[1−1708/Ra]⁺ + [(Ra/5830)^(1/3)−1]⁺` | 1708 ≤ Ra ≤ 10⁸ — [I7 §9.9] |
| `globe_dropkin` | `Nu = 0.069·Ra^(1/3)·Pr^0.074` | 3×10⁵ ≤ Ra ≤ 7×10⁹ — [I7 §9.9] |

`[·]⁺` = max(·, 0)

---

### Natural convection — `VERTICAL_CAVITY`

**MacGregor–Emery:**

| H/L | Ra range | Formula |
|---|---|---|
| 1–2 | 10⁴–10⁷ | `Nu = 0.18·(Pr/(0.2+Pr)·Ra)^0.29` |
| 2–10 | 10³–10¹⁰ | `Nu = 0.22·(Pr/(0.2+Pr)·Ra)^0.28·(H/L)^(−1/4)` |
| 10–40 | 10⁴–10⁷ | `Nu = 0.42·Ra^(1/4)·Pr^0.012·(H/L)^(−0.3)` |
| 10–40 | 10⁶–10⁹ | `Nu = 0.046·Ra^(1/3)` |

Source: [I7 §9.9]

---

### Mixed convection — `MIXED_PIPE_VERTICAL` / `MIXED_PLATE_VERTICAL`

**Churchill (1977) n=3 power-sum blend** — [App §A1]:
`Nu_comb = (Nu_forced^3 ± Nu_natural^3)^(1/3)`
`+` aiding flow, `−` opposing flow.
Significant if `Gr/Re² > 0.1` — [I7 §9.10], [C5 §15-2]

---

### Packed / porous beds — `PACKED_BED`

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `gunn` (default) | `Nu = (7−10ε+5ε²)·(1+0.7·Re_p^0.2·Pr^(1/3)) + (1.33−2.4ε+1.2ε²)·Re_p^0.7·Pr^(1/3)` | 0 ≤ Re ≤ 10⁵, 0.35 ≤ ε ≤ 1.0 | [Leg HeatTransfer.js 22–27]; Gunn (1978) |
| `wakao_funazkri` | `Nu = 2 + 1.1·Re_p^0.6·Pr^(1/3)` | Re > 0 | Wakao & Funazkri (1978); [VDI M8] |
| `whitaker_packed_bed` | full form — see [App §W6] | 10 ≤ Re ≤ 10⁴ | Whitaker (1972) |

`PACKED_BED_CYLINDER`: `D_eq = 3·D_p·L_p / (D_p/2 + L_p)` → use same correlations.

---

### Packed bed — `FLUIDIZED_BED`

**Wen & Yu (minimum fluidization):**
`Re_mf = (C₁² + C₂·Ar)^0.5 − C₁`, C₁=33.7, C₂=0.0408
`Ar = D_p³·ρ_f·(ρ_s−ρ_f)·g / μ²`

**Molerus & Wirth (heat transfer to immersed surface):**
`Nu = (1−ε)·Nu_slow + ε·Nu_fast` — [VDI L3.4]

---

### Phase change — `CONDENSATION_VERTICAL_PLATE`

**Nusselt film condensation (laminar):**
`Nu_L = 0.943·[ρ_l·(ρ_l−ρ_v)·g·h_fg'·L³ / (μ_l·k_l·ΔT)]^(1/4)`
`h_fg' = h_fg + 0.68·Cp_l·ΔT` — [I7 §10.6]

**Chen turbulent (Re_δ > 1800):**
`Nu = Re_δ^(1/3)·Pr_l^0.5 / (1.08·Re_δ^1.22 − 5.2)` — [I7 §10.6]

---

### Phase change — `CONDENSATION_HORIZONTAL_TUBE`

`Nu_D = 0.725·[ρ_l·(ρ_l−ρ_v)·g·h_fg'·D³ / (μ_l·k_l·ΔT)]^(1/4)` — [I7 §10.6]

---

### Rotating — `ROTATING_DISK`

| Regime | Formula | Re_ω |
|---|---|---|
| Laminar | `Nu = 0.36·Re_ω^0.5·Pr^0.6` | < 2.5×10⁵ |
| Turbulent | `Nu = 0.0195·Re_ω^0.8·Pr^0.6` | > 2.5×10⁵ |

`Re_ω = ω·r²/ν` — Dorfman; [VDI H4]

---

### Rotating — `ROTATING_CYLINDER`

`Nu = 0.386·(Ta·Pr)^0.5`, `Ta = ω²·r_i·δ³/ν²`, `δ = r_o−r_i`
Validity: Ta^0.5·Pr > 1 — Bjorklund & Kays; [VDI H5]

---

### Impinging jet — `IMPINGING_JET_SINGLE`

`Nu = G·Re_D^0.5·Pr^0.42`
`G = D/r · [(1−1.1·D/r)/(1+0.1·(H/D−6)·D/r)]^0.5`
Validity: 2000 ≤ Re ≤ 4×10⁵, 2 ≤ H/D ≤ 12, 2.5 ≤ r/D ≤ 7.5 — Martin (1977); [VDI G8]

---

### Impinging jet — `IMPINGING_JET_ARRAY`

`Nu = K·G·Re_D^0.5·Pr^0.42`
`K = (1+(H/D/(0.6/√f))^6)^(−0.05)`, f = jet area fraction — Martin (1977); [VDI G8]

---

## `BodyGeometry` formulas

### Surface area

> ⚠️ SPHERE, CYLINDER, CUBE verbatim from [Leg] `recuperator.js` `surfaceFunction()` lines 1804–1824.

| Geometry | Formula (h = insulation thickness) | Source |
|---|---|---|
| `SPHERE` | `4π(a+h)²` | [Leg 1807] |
| `CYLINDER` | `2π(a+h)² + 2π(a+h)(b+2h)` | [Leg 1811] |
| `CUBE` | `6(a+2h)²` | [Leg 1815] |
| `RECTANGULAR_PRISM` | `2(ab+bc+ac)` + per-face insulation | geometry |
| `TRIANGULAR_PRISM` | `a·b + 3·(a·c)` (equilateral approx) | geometry |
| `CONE` | `π·a·√(a²+b²) + π·a²` | geometry |
| `TRUNCATED_CONE` | `π(a+b)·√((a−b)²+c²) + π(a²+b²)` | geometry |
| `HOLLOW_CYLINDER` | `2π·b·c + 2π(b²−a²)` | geometry |
| `ELLIPSOID` | `4π·((a^p·b^p+a^p·c^p+b^p·c^p)/3)^(1/p)`, p=1.6075 | Thomsen approx |
| `HEMISPHERICAL_DOME` | `3π·a²` | geometry |

### Volume

| Geometry | Formula |
|---|---|
| `SPHERE` | `(4/3)π·a³` |
| `CYLINDER` | `π·a²·b` |
| `CUBE` | `a³` |
| `RECTANGULAR_PRISM` | `a·b·c` |
| `TRIANGULAR_PRISM` | `(1/2)·a·b·c` |
| `CONE` | `(1/3)π·a²·b` |
| `TRUNCATED_CONE` | `(π/3)·c·(a²+ab+b²)` |
| `HOLLOW_CYLINDER` | `π(b²−a²)·c` |
| `ELLIPSOID` | `(4/3)π·a·b·c` |
| `HEMISPHERICAL_DOME` | `(2/3)π·a³` |

### Mean beam length (Hottel)

> ⚠️ SPHERE, CYLINDER, CUBE verbatim from [Leg] `getRayLength()` lines 1826–1843.

| Geometry | Formula | Source |
|---|---|---|
| `SPHERE` | `L = 0.6·2a` | [Leg 1829]; Hottel |
| `CYLINDER` | `L = 3.6·a·b / (2a+2b)` | [Leg 1832]; Hottel |
| `CUBE` | `L = 0.6·a` | [Leg 1835]; Hottel |
| General fallback | `L = 3.6·V / S` | Hottel |

---

## Controller endpoints

```typescript
@Post('dimensionless')
@ApiOperation({ summary: 'Re, Pr, Gr, Ra, Nu, h for any flow geometry — raw or fluid-named input' })
dimensionless(@Body() dto: DimensionlessInputDto): DimensionlessResultDto

@Post('body-geometry')
@ApiOperation({ summary: 'Surface area, volume, mean beam length for any body shape' })
bodyGeometry(@Body() dto: BodyGeometryInputDto): BodyGeometryResultDto
```

### DTOs

```typescript
export class DimensionlessInputDto {
  @IsEnum(FlowGeometry)              geometry: FlowGeometry;

  // Mode A
  @IsOptional() @IsNumber()          rho_kg_m3?: number;
  @IsOptional() @IsNumber()          mu_Pa_s?: number;
  @IsOptional() @IsNumber()          mu_s_Pa_s?: number;
  @IsOptional() @IsNumber()          Cp_J_kgK?: number;
  @IsOptional() @IsNumber()          lambda_W_mK?: number;
  @IsOptional() @IsNumber()          w_m_s?: number;

  // Mode B
  @IsOptional() @IsString()          fluid?: KnownFluid;
  @IsOptional() @IsObject()          composition?: Record<string, number>;
  @IsOptional() @IsNumber()          T_fluid_K?: number;
  @IsOptional() @IsNumber()          T_surface_K?: number;
  @IsOptional() @IsNumber()          P_Pa?: number;

  // Geometry
  @IsOptional() @ValidateNested() @Type(() => GeometryDimsDto)
                                     dims?: GeometryDimsDto;

  // Control
  @IsOptional() @IsEnum(CorrelationName)
                                     preferredCorrelation?: CorrelationName;
  @IsOptional() @IsBoolean()         compareAll?: boolean;
  @IsOptional() @IsEnum(['laminar','turbulent','transitional'])
                                     forceRegime?: string;
  @IsOptional() @IsBoolean()         isDiffusion?: boolean;
  @IsOptional() @IsBoolean()         isHeating?: boolean;
}

export class BodyGeometryInputDto {
  @IsEnum(BodyGeometry)              geometry: BodyGeometry;
  @IsOptional() @IsNumber()          h?: number;
  @ValidateNested() @Type(() => GeometryDimsDto)
                                     dims: GeometryDimsDto;
}

export class BodyGeometryResultDto {
  surface: number;
  volume: number;
  meanBeamLength: number;
  characteristicLength: number;
}
```

---

## Unit tests

| Test | Expected |
|---|---|
| `reynolds(1.2, 10, 0.05, 1.8e-5)` | 33333 |
| `prandtl(1.8e-5, 1005, 0.026)` | 0.697 |
| `hydraulicDiameter(0.05×0.1, 2×(0.05+0.1))` | 0.0667 m |
| `channelArea(DUCT_SQUARE, {a:0.05})` | 0.0025 m² |
| `channelArea(PIPE_ANNULUS, {a:0.02, b:0.05})` | π/4·(0.05²−0.02²) |
| Mode A: `nusselt(PIPE_CIRCULAR, Re=1000, Pr=0.7, D=0.05, L=1)` | mills, laminar |
| Mode A: `nusselt(PIPE_CIRCULAR, Re=15000, Pr=0.7)` | gnielinski, turbulent |
| Mode B: `nusselt({geometry:PIPE_CIRCULAR, fluid:'air', T_fluid_K:600, T_surface_K:400, w_m_s:5, dims:{a:0.05,c:1}})` | gnielinski or mills depending on Re |
| `nusselt(DUCT_SQUARE, a=0.05, Re=10000, Pr=0.7)` | via D_h → gnielinski |
| `nusselt(PACKED_BED, Re=100, Pr=0.7, ε=0.4)` | gunn |
| `nusselt(VERTICAL_CYLINDER, Ra=1e8, Pr=0.7)` | churchill_chu_laminar |
| `nusselt(SPHERE_NATURAL, Ra=1e6, Pr=0.7)` | churchill_sphere_natural |
| `nusselt(HORIZONTAL_PLATE_HOT_UP, Ra=1e6, Pr=0.7)` | mcadams_hot_up (0.54·Ra^0.25) |
| `nusselt(INCLINED_PLATE, Ra=1e8, Pr=0.7, angle_deg=45)` | churchill_chu with g_eff |
| `bodyArea(SPHERE, {a:0.1}, 0)` | 0.1257 m² |
| `bodyArea(CYLINDER, {a:0.1, b:0.3}, 0.05)` | with insulation |
| `bodyArea(TRUNCATED_CONE, {a:0.1, b:0.05, c:0.2}, 0)` | lateral + bases |
| `meanBeamLength(CUBE, {a:0.2})` | 0.12 m |
| `meanBeamLength(CYLINDER, {a:0.1, b:0.3})` | 3.6·0.1·0.3/(0.2+0.6) |
| `bodyVolume(SPHERE, {a:0.1})` | 4/3·π·0.1³ |
| Preferred valid: `preferredCorrelation:'whitaker_sphere', Re=5000, Pr=0.7` | whitaker_sphere used, preferredUsed=true |
| Preferred invalid: `preferredCorrelation:'whitaker_sphere', Re=1e6, Pr=0.7` | sphere_ranz_marshall used, preferredUsed=false, reason in preferredRejectedReason |
| `compareAll=true` on CYLINDER_CROSSFLOW | allCorrelations has churchill_bernstein, hilpert, whitaker_cylinder |

---

## See also

- `CH07_APPENDIX_CORRELATIONS.md` — exact formulas from original Churchill & Whitaker papers, all geometry variants, all validity bounds, best-equation selection criteria as stated by the authors themselves.
