# CH07 — DimensionlessNumbersService

**Sources:**
- `legacy/scripts/src/thermalExchange/fluidDynamics.ts` — Re, Gr, Ra (single geometry)
- `legacy/scripts/src/dto/form.dto.ts` — FormDto: cylinder, sphere, cube, rectangularPrism, prism
- `legacy/furnaceCombustion/modules/HeatTransfer.js` — Nu: Gunn (packed bed), Churchill–Chu (vertical cylinder)
- `legacy/scripts/recuperator.js` — Nu: Mills/Gnielinski (pipe); surface/ray-length for sphere, cylinder, cube; channel forms: circle, square, triangle, circle_in_ring

**Target:** `backend/src/modules/thermodynamics/services/dimensionless-numbers.service.ts`
**Controller:** `POST /thermodynamics/dimensionless`, `POST /thermodynamics/body-geometry`

---

## Design principle

All inputs are **plain numbers** — pre-computed fluid properties + geometry dimensions.
Does **not** call `GasPropertiesService` internally. Fully stateless — callable from any context and directly from the API.

---

## Two geometry enums

The legacy mixes two concepts. They are separated here:

### `BodyGeometry` — enclosure / furnace body shapes
Used for: surface area, mean beam length (radiation), characteristic dimension for natural convection, wall heat flux.

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
  PIPE_CIRCULAR             = 'pipe_circular',           // a = D  (diameter)
  PIPE_ANNULUS              = 'pipe_annulus',             // a = D_i, b = D_o  (D_h = D_o − D_i)
  DUCT_SQUARE               = 'duct_square',              // a = side
  DUCT_RECTANGULAR          = 'duct_rectangular',         // a = width, b = height
  DUCT_TRIANGULAR           = 'duct_triangular',          // a = side (equilateral)
  DUCT_TRIANGULAR_SCALENE   = 'duct_triangular_scalene',  // a, b, c = sides
  DUCT_ELLIPTICAL           = 'duct_elliptical',          // a = semi-major, b = semi-minor
  DUCT_TRAPEZOIDAL          = 'duct_trapezoidal',         // a = top, b = bottom, c = height
  PARALLEL_PLATES           = 'parallel_plates',          // a = gap (D_h = 2a)
  HELICAL_COIL              = 'helical_coil',             // a = tube D, b = coil D, c = pitch
  CORRUGATED_PIPE           = 'corrugated_pipe',          // a = D, b = rib height e, c = pitch p
  RIBBED_CHANNEL            = 'ribbed_channel',           // a = D_h, b = rib height e, c = pitch p

  // ── External forced convection ─────────────────────────────────────────
  FLAT_PLATE                = 'flat_plate',               // L = length
  FLAT_PLATE_ROUGH          = 'flat_plate_rough',         // L = length, b = roughness ks
  CYLINDER_CROSSFLOW        = 'cylinder_crossflow',       // a = D
  SPHERE_FORCED             = 'sphere_forced',            // a = D
  TUBE_BANK_INLINE          = 'tube_bank_inline',         // a = D, S_T, S_L
  TUBE_BANK_STAGGERED       = 'tube_bank_staggered',      // a = D, S_T, S_L
  CONE_CROSSFLOW            = 'cone_crossflow',           // a = base D, b = half-angle
  ELLIPTICAL_CYLINDER       = 'elliptical_cylinder',      // a = major axis, b = minor axis (flow along major)

  // ── Natural convection ─────────────────────────────────────────────────
  VERTICAL_PLATE            = 'vertical_plate',           // L = height
  VERTICAL_CYLINDER         = 'vertical_cylinder',        // L = height (Churchill–Chu, same as plate when D/L >> 35/Gr^0.25)
  HORIZONTAL_CYLINDER       = 'horizontal_cylinder',      // a = D
  HORIZONTAL_PLATE_HOT_UP   = 'horizontal_plate_hot_up',  // L = A/P
  HORIZONTAL_PLATE_HOT_DOWN = 'horizontal_plate_hot_down',
  INCLINED_PLATE            = 'inclined_plate',           // L = length, angle_deg from vertical
  SPHERE_NATURAL            = 'sphere_natural',           // a = D
  CONCENTRIC_CYLINDERS      = 'concentric_cylinders',     // a = D_i, b = D_o (annular gap, natural conv)
  CONCENTRIC_SPHERES        = 'concentric_spheres',       // a = D_i, b = D_o
  HORIZONTAL_CAVITY         = 'horizontal_cavity',        // a = gap H, aspect ratio b = L/H (heated below)
  VERTICAL_CAVITY           = 'vertical_cavity',          // a = gap L, b = height H, aspect ratio H/L

  // ── Mixed (combined forced + natural) ─────────────────────────────────
  MIXED_PIPE_VERTICAL       = 'mixed_pipe_vertical',      // vertical pipe, upward or downward flow
  MIXED_PLATE_VERTICAL      = 'mixed_plate_vertical',     // vertical plate with parallel forced flow

  // ── Packed / porous beds ───────────────────────────────────────────────
  PACKED_BED                = 'packed_bed',               // a = D_p, epsilon — Gunn
  PACKED_BED_CYLINDER       = 'packed_bed_cylinder',      // a = D_p, b = L_p, epsilon — D_eq = 6V/S
  FLUIDIZED_BED             = 'fluidized_bed',            // a = D_p, epsilon — Wen & Yu / Molerus

  // ── Phase change (future) ─────────────────────────────────────────────
  CONDENSATION_VERTICAL_PLATE  = 'condensation_vertical_plate',  // Nusselt film condensation
  CONDENSATION_HORIZONTAL_TUBE = 'condensation_horizontal_tube', // Nusselt / Chen
  POOL_BOILING              = 'pool_boiling',             // Rohsenow correlation (future)

  // ── Rotating / special ─────────────────────────────────────────────────
  ROTATING_DISK             = 'rotating_disk',            // a = r, omega
  ROTATING_CYLINDER         = 'rotating_cylinder',        // a = D, omega, b = gap
  IMPINGING_JET_SINGLE      = 'impinging_jet_single',     // a = D_jet, b = H/D
  IMPINGING_JET_ARRAY       = 'impinging_jet_array',      // a = D_jet, b = H/D, c = pitch
}
```

---

## `GeometryDims`

```typescript
export interface GeometryDims {
  a?: number;         // radius / side / width / D_inner / D_particle / semi-major
  b?: number;         // height / D_outer / semi-minor / depth
  c?: number;         // length / 3rd dimension
  L?: number;         // explicit characteristic length override
  epsilon?: number;   // porosity (packed bed)
  S_T?: number;       // transverse pitch (tube bank)
  S_L?: number;       // longitudinal pitch (tube bank)
  angle_deg?: number; // inclination angle (inclined plate, degrees from vertical)
}
```

---

## Service interface

```typescript
@Injectable()
export class DimensionlessNumbersService {

  // ── Dimensionless numbers ──────────────────────────────────────────────
  reynolds(rho: number, w: number, L: number, mu: number): number
  reynoldsKinematic(w: number, L: number, nu: number): number
  prandtl(mu: number, Cp_J_kgK: number, lambda: number): number
  grashof(T_hot_K: number, T_cold_K: number, L: number, nu: number): number
  rayleigh(T_hot_K: number, T_cold_K: number, L: number, nu: number, Pr: number): number
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

```typescript
// All correlation names — every value corresponds to an exact formula in the spec
export type CorrelationName =
  // ── PIPE_CIRCULAR / duct (via D_h) ──────────────────────────────────────
  | 'mills'                      // [Leg line 871] — default laminar
  | 'sieder_tate_laminar'        // [Leg line 877]
  | 'fully_developed_uniform_T'  // Nu = 3.66  [I7 §8.4]
  | 'fully_developed_uniform_q'  // Nu = 4.36  [I7 §8.4]
  | 'transitional'               // [Leg line 882] — default transitional
  | 'gnielinski'                 // [Leg lines 892-895] — default turbulent
  | 'dittus_boelter'             // [Leg lines 908-915]
  | 'sieder_tate_turbulent'      // [Leg line 903]
  | 'mikheev'                    // [Leg lines 918-919] — 0.021·Re^0.8·Pr^0.43
  | 'petukhov'                   // [I7 §8.5] — not in legacy
  // ── HELICAL_COIL ────────────────────────────────────────────────────────
  | 'seban_mclaughlin'           // [VDI L1.3]
  // ── CORRUGATED_PIPE / RIBBED_CHANNEL ────────────────────────────────────
  | 'webb_eckert_goldstein'      // [I7 §8.7, VDI G8]
  | 'isachenko_roughness'        // simplified turbulent
  // ── FLAT_PLATE ───────────────────────────────────────────────────────────
  | 'flat_plate_laminar'         // 0.664·Re^0.5·Pr^(1/3)  [I7 §7.2]
  | 'flat_plate_turbulent'       // 0.037·Re^0.8·Pr^(1/3)  [I7 §7.2]
  | 'flat_plate_mixed'           // (0.037·Re^0.8−871)·Pr^(1/3)  [I7 §7.2]
  | 'churchill_ozoe'             // all Re/Pr  [I7 §7.2]
  // ── CYLINDER_CROSSFLOW ───────────────────────────────────────────────────
  | 'churchill_bernstein'        // [I7 §7.4] — default
  | 'hilpert'                    // [I7 §7.4, C5 §7-3]
  // ── SPHERE_FORCED ────────────────────────────────────────────────────────
  | 'sphere_ranz_marshall'        // [Leg line 841]  Nu = 2+0.4·Re^0.5·Pr^(1/3)  Ranz-Marshall (1952) — default
  | 'sphere_diffusion'            // [Leg line 839]  Nu = 2+0.17·Re^(2/3)  ⚠️ source unverified
  | 'whitaker'                    // [I7 §7.4] Nu = 2+(0.4·Re^0.5+0.06·Re^(2/3))·Pr^0.4·(μ/μ_s)^0.25 — not in legacy
  // ── TUBE_BANK ────────────────────────────────────────────────────────────
  | 'zukauskas'                  // [I7 §7.5]
  // ── VERTICAL_PLATE / VERTICAL_CYLINDER ───────────────────────────────────
  | 'churchill_chu'              // auto-selects laminar/all-Ra per legacy logic — default
  | 'churchill_chu_laminar'      // [Leg line 819]  Ra < 1e9
  | 'churchill_chu_all_ra'       // [Leg line 820]  Ra ≥ 1e9
  // ── HORIZONTAL_CYLINDER ──────────────────────────────────────────────────
  | 'morgan'                     // [I7 §9.6] — default
  | 'churchill_chu_horizontal'   // [I7 §9.6]
  // ── HORIZONTAL_PLATE ─────────────────────────────────────────────────────
  | 'mcadams_hot_up'             // 0.54·Ra^0.25 / 0.15·Ra^(1/3)  [I7 §9.7]
  | 'mcadams_hot_down'           // 0.27·Ra^0.25  [I7 §9.7]
  // ── SPHERE_NATURAL ───────────────────────────────────────────────────────
  | 'churchill_sphere_natural'   // [I7 §9.9]
  // ── CONCENTRIC_CYLINDERS / SPHERES ───────────────────────────────────────
  | 'raithby_hollands_cylinders' // [I7 §9.7]
  | 'raithby_hollands_spheres'   // [I7 §9.7]
  // ── CAVITIES ─────────────────────────────────────────────────────────────
  | 'hollands'                   // horizontal cavity  [I7 §9.9]
  | 'globe_dropkin'              // horizontal cavity  [I7 §9.9]
  | 'macgregor_emery'            // vertical cavity  [I7 §9.9]
  // ── MIXED CONVECTION ─────────────────────────────────────────────────────
  | 'mixed_power_sum'            // [I7 §9.10, C5 §15-2]
  // ── PACKED BED ───────────────────────────────────────────────────────────
  | 'gunn'                       // [Leg HeatTransfer.js lines 22-27] — default
  | 'wakao_funazkri'             // [VDI M8]
  // ── PHASE CHANGE ─────────────────────────────────────────────────────────
  | 'nusselt_condensation'       // [I7 §10.6]
  | 'chen_condensation'          // [I7 §10.6]
  // ── ROTATING ─────────────────────────────────────────────────────────────
  | 'dorfman_disk'               // [VDI H4]
  | 'bjorklund_kays'             // [VDI H5]
  // ── IMPINGING JET ────────────────────────────────────────────────────────
  | 'martin_jet_single'          // [VDI G8]
  | 'martin_jet_array'           // [VDI G8]

export interface NusseltParams {
  geometry: FlowGeometry;
  Re?: number;
  Pr?: number;
  Gr?: number;
  Ra?: number;
  dims?: GeometryDims;
  isDiffusion?: boolean;              // false → Ranz-Marshall (default) [Leg line 841]; true → diffusion form [Leg line 839]
  forceRegime?: 'laminar' | 'turbulent' | 'transitional';
  correlationName?: CorrelationName;  // explicit override; if omitted uses default selection logic
  compareAll?: boolean;               // if true, populates allCorrelations in result
}

export interface NusseltResult {
  Nu: number;
  correlation: CorrelationName;
  regime: 'laminar' | 'turbulent' | 'transitional' | 'natural';
  isNatural: boolean;                 // matches legacy `isNatural` flag
  warning?: string;                   // out-of-range notice
  allCorrelations?: Partial<Record<CorrelationName, number>>;  // when compareAll=true
}
```

---

## Nu correlations per `FlowGeometry` — exact formulas and sources

> **Abbreviations:**  
> [I7] = Incropera, *Fundamentals of Heat and Mass Transfer*, 7th ed.  
> [C5] = Cengel & Ghajar, *Heat and Mass Transfer*, 5th ed.  
> [VDI] = VDI Heat Atlas, 2nd ed. (Springer 2010)  
> [Leg] = `recuperator.js` formula taken verbatim — coefficients must not be changed

---

### Internal forced convection — `PIPE_CIRCULAR` (and D_h-based ducts)

All duct variants (`PIPE_ANNULUS`, `DUCT_SQUARE`, `DUCT_RECTANGULAR`, `DUCT_TRIANGULAR*`,
`DUCT_ELLIPTICAL`, `DUCT_TRAPEZOIDAL`, `PARALLEL_PLATES`) compute `D_h = 4A/P` first,
then delegate to `PIPE_CIRCULAR` correlations.

> ⚠️ Formulas marked `[Leg]` are taken verbatim from `recuperator.js`. Coefficients must not be changed.
> Implementation must cite both the legacy line number and the textbook reference.

| Regime | Condition | Exact formula (from legacy) | Source |
|---|---|---|---|
| **Laminar — Mills** | Re < 2300 | `Nu = 3.66 + (0.065·Re·Pr·D/L) / (1 + 0.4·(Re·Pr·D/L)^(2/3))` | [Leg] line 871 — "Mills combines the entrance effects and fully developed flow"; [I7] §8.4 |
| **Laminar — Sieder-Tate** | Re < 2300, μ-correction | `Nu = 1.86·(Re·Pr·D/L)^(1/3)·(μ/μ_s)^0.14` | [Leg] line 877; [C5] §8-3 |
| **Laminar — fully developed** | Re < 2300, L/D → ∞ | `Nu = 3.66` (uniform T wall); `Nu = 4.36` (uniform heat flux) | [I7] §8.4 (not in legacy — add as named constants) |
| **Transitional** | 2300 ≤ Re ≤ 10000 | `Nu = 0.008·Re^0.9·Pr^0.43` | [Leg] line 882 |
| **Turbulent — Gnielinski** | 3000 ≤ Re ≤ 5×10⁶, 0.5 ≤ Pr ≤ 2000 | `Nu = (f/8)·(Re−1000)·Pr / (1+12.7·√(f/8)·(Pr^(2/3)−1))`, `f = (0.79·ln Re − 1.64)^−2` | [Leg] lines 892–895; [I7] §8.5 |
| **Turbulent — Dittus-Boelter** | Re ≥ 10⁴, 0.6 ≤ Pr ≤ 160, L/D ≥ 60 | `Nu = 0.023·Re^0.8·Pr^n`, n=0.4 heating / n=0.3 cooling | [Leg] lines 908–915 — "Dittus-Boelter [10-12]"; [I7] §8.5 |
| **Turbulent — Sieder-Tate** | Re ≥ 10⁴, 0.7 ≤ Pr ≤ 16700, L/D ≥ 10 | `Nu = 0.027·Re^0.8·Pr^(1/3)·(μ/μ_s)^0.14` | [Leg] line 903; [C5] §8-3 |
| **Turbulent — Mikheev (Russian)** | Re ≥ 10⁴ | `Nu = 0.021·Re^0.8·Pr^0.43·(Pr/Pr_s)^0.25·ε_l`, ε_l=1.2 in legacy | [Leg] lines 918–919 — Russian comment "Величина коэффициента…"; Mikheev, *Heat Transfer*, Gosenergoizdat, 1956 |
| **Turbulent — Petukhov** | 10⁴ ≤ Re ≤ 5×10⁶, 0.5 ≤ Pr ≤ 200 | `Nu = (f/8)·Re·Pr / (1.07 + 12.7·√(f/8)·(Pr^(2/3)−1))` | Not in legacy — add; [I7] §8.5, [VDI] G1 |

**Default selection logic (preserved from legacy `recuperator.js` lines 922–968):**
```
isLaminar   = Re < 2300
isTransient = 2300 ≤ Re ≤ 10000
isTurbulent = Re > 10000
isNatural   = w === 0
              OR (laminar AND Nu_natural/L > Nu_Mills/D)
              OR (transient AND Nu_natural/L > Nu_transient/D)
              OR (turbulent AND Nu_natural/L > Nu_Gnielinski/D)

return isNatural  → Nu_natural (Churchill-Chu)
       laminar    → Nu_Mills
       transient  → Re < 3000 ? Nu_transient : Nu_Gnielinski
       turbulent  → Nu_Gnielinski
```
`Nu_LaminarSiederTate`, `Nu_TurbulentSiederTate`, `Nu_TurbulentDittusBoelter`, `Nu_TurbulentMikheev`
are computed but **not selected by default** — available via `correlationName` override in `NusseltParams`.

---

### Internal — `HELICAL_COIL`
Tube bent into helix enhances Nu and shifts transition Re.

| Regime | Formula | Source |
|---|---|---|
| Laminar | `Nu = 0.036·Re^0.5·Pr^0.43·(D/D_c)^0.1`, D_c = coil diameter | [VDI] L1.3 |
| Turbulent | `Nu = Nu_straight · (1 + 3.6·(1−D/D_c)·(D/D_c)^0.8)` | Seban & McLaughlin; [VDI] L1.3 |
| Critical Re shift | `Re_cr = 2300·(1 + 8.6·(D/D_c)^0.45)` | Schmidt (1967); [C5] §8-4 |

---

### Internal — `CORRUGATED_PIPE` / `RIBBED_CHANNEL`
Periodic roughness (rib height `e`, pitch `p`).

| Range | Formula | Source |
|---|---|---|
| `0.01 ≤ e/D ≤ 0.05`, `10 ≤ p/e ≤ 40` | `St·Pr^(2/3) = f/2 / (1 + √(f/2)·f(e+))`, Webb-Eckert-Goldstein roughness function | [I7] §8.7, [VDI] G8 |
| Simplified turbulent | `Nu = 0.023·Re^0.8·Pr^0.4·(1 + 1.77·(e/D))` | Isachenko et al. |

---

### External forced — `FLAT_PLATE`

| Regime | Formula | Source |
|---|---|---|
| Laminar avg, Pr ≥ 0.6 | `Nu_L = 0.664·Re_L^0.5·Pr^(1/3)` | [I7] §7.2 |
| Turbulent avg, Re > 5×10⁵ | `Nu_L = 0.037·Re_L^0.8·Pr^(1/3)` | [I7] §7.2 |
| Mixed (laminar+turbulent) | `Nu_L = (0.037·Re_L^0.8 − 871)·Pr^(1/3)` | [I7] §7.2 |
| **Churchill–Ozoe (all Re, Pr)** | `Nu_x = 0.3387·Re_x^0.5·Pr^(1/3) / (1+(0.0468/Pr)^(2/3))^0.25` | [I7] §7.2 |

---

### External forced — `FLAT_PLATE_ROUGH`
Sand-grain roughness `ks`:

`Nu = (f/2)·Re·Pr / (1 + √(f/2)·(Pr−1+ln((1+Pr·u_e⁺·ks⁺/11.25)/Pr)))` — [VDI] F2.

---

### External forced — `CYLINDER_CROSSFLOW`

| Formula | Validity | Source |
|---|---|---|
| Churchill–Bernstein: `Nu = 0.3 + 0.62·Re^0.5·Pr^(1/3) / (1+(0.4/Pr)^(2/3))^0.25 · (1+(Re/282000)^(5/8))^0.8` | all Re, Pr·Re^0.5 > 0.2 | [I7] §7.4 |
| Hilpert: `Nu = C·Re^m·Pr^(1/3)` with table of C, m | 0.4 ≤ Re ≤ 4×10⁵ | [I7] §7.4, [C5] §7-3 |

**Hilpert constants table (must be in source code):**

| Re range | C | m |
|---|---|---|
| 0.4–4 | 0.989 | 0.330 |
| 4–40 | 0.911 | 0.385 |
| 40–4000 | 0.683 | 0.466 |
| 4000–40000 | 0.193 | 0.618 |
| 40000–400000 | 0.027 | 0.805 |

---

### External forced — `ELLIPTICAL_CYLINDER`
Flow along major axis `a`, minor axis `b`:

`Nu = C·Re_a^m·Pr^(1/3)`, constants C, m from Owen (1952); tabulated in [VDI] F5.

---

### External forced — `SPHERE_FORCED`

> ⚠️ `recuperator.js` lines 838–841 has **two distinct sphere correlations** — both taken verbatim.

**Convective sphere — `'sphere_convective'` (default, `isDiffusion = false`):**  
`Nu = 2 + 0.4·Re^0.5·Pr^(1/3)` — [Leg] line 841  
This is the **Ranz-Marshall** correlation (1952). Source: Ranz & Marshall, *Chem. Eng. Prog.*, 48:141–146, 1952.  
⚠️ This is **not** Whitaker — Whitaker has two Re terms and a μ/μ_s correction (see below).

**Diffusion sphere — `'sphere_diffusion'` (`isDiffusion = true`):**  
`Nu = 2 + 0.17·Re^(2/3)` — [Leg] line 839  
> 🔍 Source unconfirmed. Does not match standard Western references. Closest Western form is Frössling (1938): `Sh = 2 + 0.552·Re^0.5·Sc^(1/3)`. The form `Nu = 2 + 0.17·Re^(2/3)` appears in Russian combustion engineering literature — likely Vulis, *Thermal Regime of Combustion*, 1961. **Source must be confirmed before implementation.**

**Full Whitaker — `'whitaker'` (not in legacy, add as alternative):**  
`Nu = 2 + (0.4·Re^0.5 + 0.06·Re^(2/3))·Pr^0.4·(μ/μ_s)^0.25`  
Validity: 3.5 ≤ Re ≤ 7.6×10⁴, 0.71 ≤ Pr ≤ 380 — Whitaker (1972); [I7] §7.4

---

### External forced — `CONE_CROSSFLOW`
Apex pointing upstream:

`Nu = C·Re^m` with C, m from Yuge (1960); approximation `Nu ≈ 0.58·Re^0.5·Pr^(1/3)` for apex-up — [VDI] F6.

---

### External forced — `TUBE_BANK_INLINE` / `TUBE_BANK_STAGGERED`

**Zukauskas correlation:**
`Nu = C₁·C₂·Re_D,max^m·Pr^0.36·(Pr/Pr_s)^0.25`

| Re_D,max | C₁ (inline) | C₁ (staggered) | m |
|---|---|---|---|
| 10–100 | 0.80 | 0.90 | 0.40 |
| 100–10³ | 0.27 | 0.35·(S_T/S_L)^0.2 | 0.63 |
| 10³–2×10⁵ | 0.21 | 0.40 | 0.70 |
| 2×10⁵–2×10⁶ | 0.021 | 0.022 | 0.84 |

Row correction factor C₂: 1.0 for N_L ≥ 20 rows; table values for fewer rows — [I7] §7.5.  
`Re_D,max = V_max·D/ν`, `V_max = V·S_T/(S_T−D)` (inline) or diagonal check (staggered).

---

### External forced — `SPHERE_FORCED`

> ⚠️ `recuperator.js` lines 838–841 contains **two distinct sphere correlations**.
> Both are taken verbatim. The attribution below corrects the misleading label that existed in the spec.

**Convective sphere — default** (`isDiffusion = false`):
`Nu = 2 + 0.4·Re^0.5·Pr^(1/3)` — [Leg] line 841

This is the **Ranz-Marshall** correlation (1952), originally derived for evaporating droplets and widely used for heat transfer to spheres in gas streams.  
Source: Ranz & Marshall, *Chem. Eng. Prog.*, 48:141–146, 1952.  
⚠️ **Not Whitaker.** Whitaker's formula has two Re terms and a μ/μ_s correction — see below.

**Diffusion sphere** (`isDiffusion = true`):
`Nu = 2 + 0.17·Re^(2/3)` — [Leg] line 839

> 🔍 **Review needed:** The coefficient `0.17` and exponent `2/3` do not match standard Western references.  
> Closest Western form is Frossling (1938): `Sh = 2 + 0.552·Re^0.5·Sc^(1/3)`.  
> `Nu = 2 + 0.17·Re^(2/3)` appears in Russian combustion engineering literature  
> (likely Vulis, *Thermal Regime of Combustion*, 1961, or Knorre et al.).  
> **⚠️ Source must be identified and cited before implementation.**

**Full Whitaker** (not in legacy — add as `'whitaker'` named alternative):
`Nu = 2 + (0.4·Re^0.5 + 0.06·Re^(2/3))·Pr^0.4·(μ/μ_s)^0.25`  
Validity: 3.5 ≤ Re ≤ 7.6×10⁴, 0.71 ≤ Pr ≤ 380 — Whitaker (1972); [I7] §7.4

---

### Natural convection — `VERTICAL_PLATE` / `VERTICAL_CYLINDER`

> ⚠️ Both forms below are taken verbatim from `recuperator.js` lines 818–820 and 856–860.
> The Ra boundary **Ra < 10⁹** is exactly as in the legacy. Do not change.

**Churchill–Chu — laminar (Ra < 10⁹):**
`Nu = 0.68 + 0.67·Ra^(1/4) / (1+(0.492/Pr)^(9/16))^(4/9)` — [Leg] line 819; [I7] §9.6

**Churchill–Chu — all Ra (Ra ≥ 10⁹ or general):**
`Nu = (0.825 + 0.387·Ra^(1/6) / (1+(0.492/Pr)^(9/16))^(8/27))²` — [Leg] line 820; [I7] §9.6

**Vertical cylinder validity check (from legacy lines 813–815 and 853–857):**
`D/L ≥ 35/Gr_L^(1/4)` — if satisfied, use vertical plate correlations; otherwise treat as pipe.

---

### Natural convection — `HORIZONTAL_CYLINDER`

**Morgan correlation (range-based, default):**

| Ra_D | C | n |
|---|---|---|
| 10⁻¹⁰–10⁻² | 0.675 | 0.058 |
| 10⁻²–10² | 1.02 | 0.148 |
| 10²–10⁴ | 0.850 | 0.188 |
| 10⁴–10⁷ | 0.480 | 0.250 |
| 10⁷–10¹² | 0.125 | 0.333 |

`Nu = C·Ra_D^n` — [I7] §9.6

**Churchill–Chu alternative (all Ra):**
`Nu = (0.60 + 0.387·Ra_D^(1/6) / (1+(0.559/Pr)^(9/16))^(8/27))²` — [I7] §9.6

---

### Natural convection — `HORIZONTAL_PLATE_HOT_UP` / `HOT_DOWN`

| Regime | Formula | Source |
|---|---|---|
| Hot up, 10⁴ ≤ Ra ≤ 10⁷ | `Nu = 0.54·Ra^(1/4)` | [I7] §9.7 |
| Hot up, 10⁷ ≤ Ra ≤ 10¹¹ | `Nu = 0.15·Ra^(1/3)` | [I7] §9.7 |
| Hot down, 10⁵ ≤ Ra ≤ 10¹¹ | `Nu = 0.27·Ra^(1/4)` | [I7] §9.7 |

Characteristic length: `L_c = A_s / P` (surface area / perimeter)

---

### Natural convection — `INCLINED_PLATE`
Use vertical plate correlations (Churchill–Chu) with `g_eff`:
- Upper surface facing down (heated): `g_eff = g·cos(θ)`, θ from vertical — [I7] §9.8
- Upper surface facing up (heated): use horizontal plate correlations for θ > 60°

---

### Natural convection — `SPHERE_NATURAL`

`Nu = 2 + 0.589·Ra_D^(1/4) / (1+(0.469/Pr)^(9/16))^(4/9)`  
Validity: Ra ≤ 10¹¹, Pr ≥ 0.7 — Churchill [I7] §9.9

---

### Natural convection — `CONCENTRIC_CYLINDERS`
Annular gap between two long horizontal concentric cylinders.

**Raithby–Hollands effective conductivity:**
`k_eff/k = 0.386·(Pr / (0.861+Pr))^(1/4) · Ra_c^(1/4)`  
`Ra_c = (ln(D_o/D_i))^4 / (r_i^(−3/5) + r_o^(−3/5))^5 · Ra_δ`  
where `δ = (D_o−D_i)/2`, `Ra_δ = g·β·ΔT·δ³/(ν·α)` — [I7] §9.7

Heat transfer per unit length: `q' = 2π·k_eff·ΔT / ln(D_o/D_i)`

---

### Natural convection — `CONCENTRIC_SPHERES`

**Raithby–Hollands for spheres:**
`k_eff/k = 0.74·(Pr/(0.861+Pr))^(1/4) · Ra_δ^(1/4) / (1 − (r_i/r_o)⁻⁵/⁷)^(5/4)`  
`δ = (r_o − r_i)`, Ra_δ based on δ — [I7] §9.7

---

### Natural convection — `HORIZONTAL_CAVITY` (heated below — Bénard convection)

**Globe–Dropkin:**
`Nu = 0.069·Ra^(1/3)·Pr^0.074`, validity: 3×10⁵ ≤ Ra ≤ 7×10⁹ — [I7] §9.9

**Hollands et al.:**
`Nu = 1 + 1.44·[1 − 1708/Ra]⁺ + [(Ra/5830)^(1/3) − 1]⁺`  
`[·]⁺` = set to 0 if negative — [I7] §9.9

---

### Natural convection — `VERTICAL_CAVITY`
Vertical rectangular enclosure, heated side wall, aspect ratio H/L.

**MacGregor–Emery (tilted to vertical):**

| H/L | Ra range | Nu |
|---|---|---|
| 2–10 | 10³–10¹⁰ | `Nu = 0.22·(Pr/(0.2+Pr)·Ra)^0.28·(H/L)^(−1/4)` |
| 1–2 | 10⁴–10⁷ | `Nu = 0.18·(Pr/(0.2+Pr)·Ra)^0.29` |
| 10–40 | 10⁴–10⁷ | `Nu = 0.42·Ra^(1/4)·Pr^0.012·(H/L)^(−0.3)` |
| 10–40 | 10⁶–10⁹ | `Nu = 0.046·Ra^(1/3)` |

Source: [I7] §9.9

---

### Mixed convection — `MIXED_PIPE_VERTICAL`

Combined forced + natural for vertical pipe:
`Nu_comb = (Nu_forced^n ± Nu_natural^n)^(1/n)`, n=3 (aiding: +, opposing: −)  
`Nu_natural` from Churchill–Chu for vertical cylinder.  
Dominant regime if `Gr/Re² > 0.1` (natural significant) — [I7] §9.10, [C5] §15-2

---

### Mixed convection — `MIXED_PLATE_VERTICAL`

`Nu = (Nu_forced³ + Nu_natural³)^(1/3)` (aiding flows)  
`Nu = |Nu_forced³ − Nu_natural³|^(1/3)` (opposing flows) — [C5] §15-2

---

### Packed / porous beds — `PACKED_BED`

**Gunn correlation (gas-to-particle, verbatim from `HeatTransfer.js`):**
`Nu = (7−10ε+5ε²)·(1+0.7·Re_p^0.2·Pr^(1/3)) + (1.33−2.4ε+1.2ε²)·Re_p^0.7·Pr^(1/3)`  
Validity: 0 ≤ Re ≤ 10⁵, 0.35 ≤ ε ≤ 1.0 — [Leg] `HeatTransfer.js` lines 22–27; Gunn (1978)

**Wakao–Funazkri (gas-to-particle, with axial dispersion correction):**
`Nu = 2 + 1.1·Re_p^0.6·Pr^(1/3)` — Wakao & Funazkri (1978); [VDI] M8

---

### Packed bed — `PACKED_BED_CYLINDER`
`D_eq = 6·V_p / S_p = 3·D_p·L_p / (D_p/2 + L_p)` → use Gunn with `D_eq`.

---

### Packed bed — `FLUIDIZED_BED`

**Wen & Yu (minimum fluidization):**
`Re_mf = (C₁² + C₂·Ar)^0.5 − C₁`, C₁=33.7, C₂=0.0408, `Ar = D_p³·ρ_f·(ρ_s−ρ_f)·g/μ²`

**Molerus & Wirth (heat transfer to immersed surface):**
`Nu = (1−ε)·Nu_slow + ε·Nu_fast` — [VDI] L3.4

---

### Phase change — `CONDENSATION_VERTICAL_PLATE`

**Nusselt film condensation (laminar):**
`Nu_L = h_L·L/k_l = 0.943·[ρ_l·(ρ_l−ρ_v)·g·h_fg'·L³ / (μ_l·k_l·ΔT)]^(1/4)`  
`h_fg' = h_fg + 0.68·Cp_l·ΔT` (modified latent heat) — [I7] §10.6

**Turbulent film (Re_δ > 1800):**
`Nu = Re_δ^(1/3)·Pr_l^0.5/(1.08·Re_δ^(1.22) − 5.2)` — Chen (1961); [I7] §10.6

---

### Phase change — `CONDENSATION_HORIZONTAL_TUBE`

**Nusselt horizontal tube:**
`Nu_D = h·D/k_l = 0.725·[ρ_l·(ρ_l−ρ_v)·g·h_fg'·D³ / (μ_l·k_l·ΔT)]^(1/4)` — [I7] §10.6

---

### Rotating — `ROTATING_DISK`

**Laminar (Re_ω < 2.5×10⁵):**
`Nu_avg = 0.36·Re_ω^0.5·Pr^0.6`, `Re_ω = ω·r²/ν` — Dorfman; [VDI] H4

**Turbulent (Re_ω > 2.5×10⁵):**
`Nu_avg = 0.0195·Re_ω^0.8·Pr^0.6` — [VDI] H4

---

### Rotating — `ROTATING_CYLINDER`
Outer cylinder stationary, inner rotating (Taylor–Couette):

`Nu = 0.386·(Ta·Pr)^0.5`, `Ta = ω²·r_i·δ³/ν²`, `δ = r_o−r_i` (for Ta^0.5·Pr > 1) — Bjorklund & Kays; [VDI] H5

---

### Impinging jet — `IMPINGING_JET_SINGLE`

**Martin correlation (single round jet):**
`Nu = G·Re_D^0.5·Pr^0.42`  
`G = D/r·[(1 − 1.1·D/r) / (1 + 0.1·(H/D−6)·D/r)]^0.5`  
Validity: 2000 ≤ Re_D ≤ 4×10⁵, 2 ≤ H/D ≤ 12, 2.5 ≤ r/D ≤ 7.5 — Martin (1977); [VDI] G8

---

### Impinging jet — `IMPINGING_JET_ARRAY`

**Martin correlation (array of round jets):**
`Nu = K·G·Re_D^0.5·Pr^0.42`  
K = 1 + (H/D / (0.6/√f))^6)^(−0.05), f = jet area fraction — Martin (1977); [VDI] G8

---

## `BodyGeometry` formulas

### Surface area (with insulation thickness `h = 0` default)

> ⚠️ SPHERE, CYLINDER, CUBE formulas taken verbatim from `recuperator.js` `surfaceFunction()` lines 1804–1824.

| Geometry | Formula | Source |
|---|---|---|
| `SPHERE` | `4π(a+h)²` | [Leg] line 1807 |
| `CYLINDER` | `2π(a+h)² + 2π(a+h)(b+2h)` | [Leg] line 1811 |
| `CUBE` | `6(a+2h)²` | [Leg] line 1815 |
| `RECTANGULAR_PRISM` | `2(ab+bc+ac)` + per-face insulation correction | [I7] geometry |
| `TRIANGULAR_PRISM` | `a·b + 3·(a·c)` (equilateral base approx) | geometry |
| `CONE` | `π·a·√(a²+b²) + π·a²` | geometry |
| `TRUNCATED_CONE` | `π(a+b)·√((a−b)²+c²) + π(a²+b²)` | geometry |
| `HOLLOW_CYLINDER` | `2π·b·c + 2π(b²−a²)` (outer lateral + annular tops) | geometry |
| `ELLIPSOID` | Knud Thomsen approximation: `4π·((a^p·b^p + a^p·c^p + b^p·c^p)/3)^(1/p)`, p=1.6075 | Thomsen |
| `HEMISPHERICAL_DOME` | `3π·a²` (curved surface + flat base) | geometry |

### Mean beam length (Hottel — for gas radiation)

> ⚠️ Formulas for SPHERE, CYLINDER, CUBE taken verbatim from `recuperator.js` `getRayLength()` lines 1826–1843.

| Geometry | Formula | Source |
|---|---|---|
| `SPHERE` | `L = 0.6·2a` | [Leg] line 1829; Hottel |
| `CYLINDER` | `L = 3.6·a·b / (2a+2b)` | [Leg] line 1832; Hottel |
| `CUBE` | `L = 0.6·a` | [Leg] line 1835; Hottel |
| General fallback | `L = 3.6·V / S` | Hottel |

---

## Controller endpoints

```typescript
@Post('dimensionless')
@ApiOperation({ summary: 'Re, Pr, Gr, Ra, Nu, h for any flow geometry' })
dimensionless(@Body() dto: DimensionlessInputDto): DimensionlessResultDto

@Post('body-geometry')
@ApiOperation({ summary: 'Surface area, volume, mean beam length for any body shape' })
bodyGeometry(@Body() dto: BodyGeometryInputDto): BodyGeometryResultDto
```

### DTOs

```typescript
export class DimensionlessInputDto {
  @IsEnum(FlowGeometry)    geometry: FlowGeometry;
  @IsNumber()              rho_kg_m3: number;
  @IsNumber()              mu_Pa_s: number;
  @IsNumber()              Cp_J_kgK: number;
  @IsNumber()              lambda_W_mK: number;
  @IsOptional() @IsNumber() w_m_s?: number;
  @IsOptional() @IsNumber() T_fluid_K?: number;
  @IsOptional() @IsNumber() T_surface_K?: number;
  @IsOptional() @ValidateNested() @Type(() => GeometryDimsDto) dims?: GeometryDimsDto;
  @IsOptional() @IsEnum(['laminar','turbulent','transitional']) forceRegime?: string;
}

export class BodyGeometryInputDto {
  @IsEnum(BodyGeometry)   geometry: BodyGeometry;
  @IsOptional() @IsNumber() h?: number;
  @ValidateNested() @Type(() => GeometryDimsDto) dims: GeometryDimsDto;
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
| `reynolds(1.2, 10, 0.05, 1.8e-5)` | 3333 |
| `prandtl(1.8e-5, 1005, 0.026)` | 0.697 |
| `hydraulicDiameter` 0.05×0.1 rect duct | 0.0667 m |
| `channelArea(DUCT_SQUARE, {a:0.05})` | 0.0025 m² |
| `channelArea(PIPE_ANNULUS, {a:0.02, b:0.05})` | π/4·(0.05²−0.02²) |
| `nusselt(PIPE_CIRCULAR, Re=1000, Pr=0.7, D=0.05, L=1)` | Mills, laminar |
| `nusselt(PIPE_CIRCULAR, Re=15000, Pr=0.7)` | Gnielinski, turbulent |
| `nusselt(DUCT_SQUARE, a=0.05, Re=10000, Pr=0.7)` | via D_h → Gnielinski |
| `nusselt(PACKED_BED, Re=100, Pr=0.7, ε=0.4)` | Gunn |
| `nusselt(VERTICAL_CYLINDER, Ra=1e8, Pr=0.7)` | Churchill–Chu |
| `nusselt(SPHERE_NATURAL, Ra=1e6, Pr=0.7)` | sphere natural |
| `nusselt(HORIZONTAL_PLATE_HOT_UP, Ra=1e6, Pr=0.7)` | 0.54·Ra^0.25 |
| `nusselt(INCLINED_PLATE, Ra=1e8, Pr=0.7, angle_deg=45)` | Churchill–Chu with g_eff |
| `bodyArea(SPHERE, {a:0.1}, 0)` | 0.1257 m² |
| `bodyArea(CYLINDER, {a:0.1, b:0.3}, 0.05)` | with insulation |
| `bodyArea(TRUNCATED_CONE, {a:0.1, b:0.05, c:0.2}, 0)` | lateral + bases |
| `meanBeamLength(CUBE, {a:0.2})` | 0.12 m |
| `meanBeamLength(CYLINDER, {a:0.1, b:0.3})` | 3.6·0.1·0.3/(0.2+0.6) |
| `bodyVolume(SPHERE, {a:0.1})` | 4/3·π·0.1³ |
