# CH08 — Geometry Enumerations and Body Formulas

This file owns all geometry-related type definitions and formulas that are pure geometry
(no fluid properties, no empirical correlations).  Nusselt correlations for each
`FlowGeometry` value are in the five appendixes referenced from the main spec.

---

## `FlowGeometry` — flow channel / convection configurations

Used for: Reynolds number, Nusselt number, heat transfer coefficient, hydraulic diameter.

```typescript
export enum FlowGeometry {
  // ── Internal forced convection ─────────────────────────────────────────────
  PIPE_CIRCULAR             = 'pipe_circular',
  PIPE_ANNULUS              = 'pipe_annulus',           // D_h = D_o − D_i
  DUCT_SQUARE               = 'duct_square',
  DUCT_RECTANGULAR          = 'duct_rectangular',
  DUCT_TRIANGULAR           = 'duct_triangular',        // equilateral
  DUCT_TRIANGULAR_SCALENE   = 'duct_triangular_scalene',
  DUCT_ELLIPTICAL           = 'duct_elliptical',
  DUCT_TRAPEZOIDAL          = 'duct_trapezoidal',
  PARALLEL_PLATES           = 'parallel_plates',        // D_h = 2·gap
  HELICAL_COIL              = 'helical_coil',           // a = pipe radius, b = coil radius
  CORRUGATED_PIPE           = 'corrugated_pipe',
  RIBBED_CHANNEL            = 'ribbed_channel',

  // ── External forced convection ─────────────────────────────────────────────
  FLAT_PLATE                = 'flat_plate',
  FLAT_PLATE_ROUGH          = 'flat_plate_rough',
  CYLINDER_CROSSFLOW        = 'cylinder_crossflow',
  SPHERE_FORCED             = 'sphere_forced',
  TUBE_BANK_INLINE          = 'tube_bank_inline',       // S_T, S_L required
  TUBE_BANK_STAGGERED       = 'tube_bank_staggered',    // S_T, S_L required
  CONE_CROSSFLOW            = 'cone_crossflow',
  ELLIPTICAL_CYLINDER       = 'elliptical_cylinder',

  // ── Natural convection ─────────────────────────────────────────────────────
  VERTICAL_PLATE            = 'vertical_plate',
  VERTICAL_CYLINDER         = 'vertical_cylinder',      // D/L ≥ 35/Gr^0.25 required
  HORIZONTAL_CYLINDER       = 'horizontal_cylinder',
  HORIZONTAL_PLATE_HOT_UP   = 'horizontal_plate_hot_up',
  HORIZONTAL_PLATE_HOT_DOWN = 'horizontal_plate_hot_down',
  INCLINED_PLATE            = 'inclined_plate',         // angle_deg from vertical
  SPHERE_NATURAL            = 'sphere_natural',
  CONCENTRIC_CYLINDERS      = 'concentric_cylinders',   // a = D_inner/2, b = D_outer/2
  CONCENTRIC_SPHERES        = 'concentric_spheres',     // a = r_inner, b = r_outer
  HORIZONTAL_CAVITY         = 'horizontal_cavity',      // heated from below
  VERTICAL_CAVITY           = 'vertical_cavity',        // H/L aspect ratio via b, c

  // ── Mixed (combined forced + natural) ─────────────────────────────────────
  MIXED_PIPE_VERTICAL       = 'mixed_pipe_vertical',
  MIXED_PLATE_VERTICAL      = 'mixed_plate_vertical',

  // ── Packed / porous beds ───────────────────────────────────────────────────
  PACKED_BED                = 'packed_bed',             // a = D_particle, epsilon required
  PACKED_BED_CYLINDER       = 'packed_bed_cylinder',    // a = D_p, b = L_p (cylinders)
  FLUIDIZED_BED             = 'fluidized_bed',

  // ── Phase change ──────────────────────────────────────────────────────────
  CONDENSATION_VERTICAL_PLATE  = 'condensation_vertical_plate',
  CONDENSATION_HORIZONTAL_TUBE = 'condensation_horizontal_tube',
  POOL_BOILING              = 'pool_boiling',

  // ── Rotating / special ─────────────────────────────────────────────────────
  ROTATING_DISK             = 'rotating_disk',          // omega required
  ROTATING_CYLINDER         = 'rotating_cylinder',      // omega, a = r_inner, b = r_outer
  IMPINGING_JET_SINGLE      = 'impinging_jet_single',   // a = nozzle radius, b = H (standoff)
  IMPINGING_JET_ARRAY       = 'impinging_jet_array',
}
```

---

## `BodyGeometry` — enclosure / furnace body shapes

Used for: surface area, volume, mean beam length (radiation), characteristic dimension
for natural convection.  Source of `SPHERE`, `CYLINDER`, `CUBE` formulas:
[`recuperator.js:1804`](../../../legacy/scripts/recuperator.js#L1804) —
[`recuperator.js:1826`](../../../legacy/scripts/recuperator.js#L1826).

```typescript
export enum BodyGeometry {
  // ── Legacy shapes — verbatim from recuperator.js surfaceFunction / getRayLength ──
  SPHERE                = 'sphere',            // a = radius
  CYLINDER              = 'cylinder',          // a = radius, b = height
  CUBE                  = 'cube',              // a = side

  // ── Legacy shapes from FormDto ─────────────────────────────────────────────
  RECTANGULAR_PRISM     = 'rectangularPrism',  // a = width, b = depth, c = height
  TRIANGULAR_PRISM      = 'prism',             // a = base, b = triangle height, c = length

  // ── Extensions ─────────────────────────────────────────────────────────────
  CONE                  = 'cone',              // a = base radius, b = height
  TRUNCATED_CONE        = 'truncated_cone',    // a = r_bottom, b = r_top, c = height
  HOLLOW_CYLINDER       = 'hollow_cylinder',   // a = inner radius, b = outer radius, c = height
  ELLIPSOID             = 'ellipsoid',         // a, b, c = semi-axes
  HEMISPHERICAL_DOME    = 'hemispherical_dome',// a = radius (includes flat base)
}
```

---

## `GeometryDims`

```typescript
export interface GeometryDims {
  a?: number;         // radius / side / width / D_inner / D_particle / semi-major
  b?: number;         // height / D_outer / semi-minor / depth / coil radius
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

## `KnownFluid`

```typescript
export type KnownFluid =
  | 'air'
  | 'N2' | 'O2' | 'CO2' | 'CO' | 'H2' | 'H2O' | 'CH4'
  | 'SO2' | 'SO3' | 'NO' | 'NO2' | 'NH3'
  | 'water'          // liquid water
  | 'gas_mix';       // arbitrary mixture — requires composition field
```

---

## Hydraulic diameter table

All duct variants compute `D_h = 4·A/P` then delegate to `PIPE_CIRCULAR` correlations.

| FlowGeometry | Area A | Perimeter P | D_h |
|---|---|---|---|
| `PIPE_CIRCULAR` | `π·a²` | `2π·a` | `2a` |
| `PIPE_ANNULUS` | `π(b²−a²)` | `2π(a+b)` | `2(b−a)` |
| `DUCT_SQUARE` | `a²` | `4a` | `a` |
| `DUCT_RECTANGULAR` | `a·b` | `2(a+b)` | `2ab/(a+b)` |
| `DUCT_TRIANGULAR` | `(√3/4)·a²` | `3a` | `a/√3` |
| `DUCT_ELLIPTICAL` | `π·a·b` | `≈π(3(a+b)−√((3a+b)(a+3b)))` | `4A/P` |
| `DUCT_TRAPEZOIDAL` | `(a+c)/2·b` | `a+c+2·√(b²+((c−a)/2)²)` | `4A/P` |
| `PARALLEL_PLATES` | `a·b` | `2(a+b)` | `2a` (a = gap) |

For `HELICAL_COIL`: `D_h = 2a` (pipe inner radius). Dean number: `De = Re·√(a/b)`.

---

## `BodyGeometry` surface area, volume, and mean beam length

### Surface area

> ⚠️ `SPHERE`, `CYLINDER`, `CUBE` formulas taken verbatim from
> [`recuperator.js:1804`](../../../legacy/scripts/recuperator.js#L1804).
> Coefficients must not be changed.

`h` = insulation thickness (0 when no insulation).

| Geometry | Formula |
|---|---|
| `SPHERE` | `4π(a+h)²` — [`recuperator.js:1814`](../../../legacy/scripts/recuperator.js#L1814) |
| `CYLINDER` | `2π(a+h)² + 2π(a+h)(b+2h)` — [`recuperator.js:1811`](../../../legacy/scripts/recuperator.js#L1811) |
| `CUBE` | `6(a+2h)²` — [`recuperator.js:1815`](../../../legacy/scripts/recuperator.js#L1815) |
| `RECTANGULAR_PRISM` | `2(ab+bc+ac)` + per-face insulation |
| `TRIANGULAR_PRISM` | `a·b + 3·(a·c)` (equilateral triangle cross-section approx) |
| `CONE` | `π·a·√(a²+b²) + π·a²` |
| `TRUNCATED_CONE` | `π(a+b)·√((a−b)²+c²) + π(a²+b²)` |
| `HOLLOW_CYLINDER` | `2π·b·c + 2π(b²−a²)` (outer lateral + annular ends) |
| `ELLIPSOID` | `4π·((a^p·b^p + a^p·c^p + b^p·c^p)/3)^(1/p)`, `p = 1.6075` (Thomsen approximation) |
| `HEMISPHERICAL_DOME` | `3π·a²` (hemisphere + flat base circle) |

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

### Mean beam length (Hottel approximation)

> ⚠️ `SPHERE`, `CYLINDER`, `CUBE` taken verbatim from
> [`recuperator.js:1826`](../../../legacy/scripts/recuperator.js#L1826).

| Geometry | Formula |
|---|---|
| `SPHERE` | `0.6·2a` — [`recuperator.js:1838`](../../../legacy/scripts/recuperator.js#L1838) |
| `CYLINDER` | `3.6·a·b / (2a + 2b)` — [`recuperator.js:1841`](../../../legacy/scripts/recuperator.js#L1841) |
| `CUBE` | `0.6·a` — [`recuperator.js:1844`](../../../legacy/scripts/recuperator.js#L1844) |
| General fallback | `3.6·V / S` (Hottel: `L_m = 3.6·V/A`) |

