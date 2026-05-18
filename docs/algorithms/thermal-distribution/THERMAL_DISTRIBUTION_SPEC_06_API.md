# THERMAL DISTRIBUTION SPEC — TypeScript API

**Version:** 2.0

---

## 1. Core Types

```typescript
// ─── Boundary Condition ───────────────────────────────────────────────────────

/**
 * BC_I  — Dirichlet (1st kind): surface temperature = Tc instantaneously.
 *          Applies when Bi ≥ 100 (water / salt quenching).
 * BC_III — Convective (3rd kind): −λ·∂T/∂n = α·(T − Tc).
 *          Applies when 0.1 < Bi < 100 (furnace, air, oil quenching).
 */
export type BoundaryConditionKind = 'BC_I' | 'BC_III';

// ─── Initial Temperature Profile (BC_III only) ────────────────────────────────

/**
 * uniform   — T(x, 0) = T0 = const.  Standard base-case series.
 * parabolic — T(x, 0) = Tctr − (Tctr − Tsurf)·(x/R)².
 *             Uses exact analytical modifier Cm/Cn*; no numerical integration.
 * arbitrary — T(x, 0) = f(x) via user-supplied callback.
 *             Fourier coefficients computed numerically (Simpson's rule).
 */
export type InitialProfileKind = 'uniform' | 'parabolic' | 'arbitrary';

// ─── Geometry ─────────────────────────────────────────────────────────────────

export type Geometry =
  | 'plate'           // Infinite Plate (thickness 2R)
  | 'cylinder'        // Infinite Cylinder (radius R)
  | 'sphere'          // Solid Sphere (radius R)
  | 'hollow_cylinder' // Hollow Cylinder (R1 ≤ r ≤ R2)
  | 'parallelepiped'  // Finite Parallelepiped (2R1 × 2R2 × 2R3), product rule
  | 'finite_cylinder' // Finite Cylinder (radius R, half-length l), product rule
  | 'auto';           // Automated topology classification (HC-16)

export interface ShapeInput {
  geometry: Geometry;
  // 1D solvers
  halfThickness?: number;  // plate: R = halfThickness
  radius?: number;         // cylinder / sphere: R
  innerRadius?: number;    // hollow cylinder: R1
  outerRadius?: number;    // hollow cylinder: R2
  // product-rule solvers
  halfX?: number;          // parallelepiped: R1
  halfY?: number;          // parallelepiped: R2
  halfZ?: number;          // parallelepiped: R3 (or finite cylinder axial half-length l)
  // complex bodies (Path A/B)
  V?: number;              // true volume (m³)
  A?: number;              // exposed surface area (m²)
}

// ─── Dimensionless scale modes ────────────────────────────────────────────────

/** Use true geometric half-dimension R as the profile scaling radius. */
export type RDistMode = 'true_dimension' | 'V_over_A';

// ─── Convergence & quadrature ─────────────────────────────────────────────────

export type GaussNodes = 8 | 16 | 32 | 64;

export interface AverageOptions {
  /**
   * series — exact Bn analytical summation (default for 1D / product-rule bodies).
   * gauss  — Gauss-Legendre quadrature (mandatory for hollow cylinder / complex bodies).
   * auto   — series where available, gauss otherwise.
   */
  mode: 'series' | 'gauss' | 'auto';
  gaussNodes?: GaussNodes;       // default: 32
  simpsonNodes?: number;         // for arbitrary-profile coefficient integration; default: 128
}

export interface ProductSolutionOptions {
  mode: 'auto' | 'manual';
  perpScale?: 'avg' | 'area_weighted';  // default: 'area_weighted'
}
```

---

## 2. Main Options Object

```typescript
export interface ProfileOptions {
  // ── Boundary condition & transport ─────────────────────────────────────────
  bcType: BoundaryConditionKind;

  /** Ambient / quenching medium temperature (°C). */
  Tc: number;

  /** Initial uniform body temperature (°C). */
  T0: number;

  /** Time elapsed since process start (seconds). */
  tau: number;

  /** Heat transfer coefficient α (W/(m²·K)). Required for BC_III. */
  alpha?: number;

  /** Thermal conductivity λ̄ (W/(m·K)) — mean over [T0, Tc]. */
  lambda: number;

  /** Thermal diffusivity ā (m²/s) — mean over [T0, Tc]. */
  thermalDiffusivity: number;

  // ── Geometry ────────────────────────────────────────────────────────────────
  shape: ShapeInput;
  rDistMode?: RDistMode;               // default: 'true_dimension'

  // ── Initial profile (BC_III) ────────────────────────────────────────────────
  initialProfile?: InitialProfileKind; // default: 'uniform'
  T0Ctr?: number;                      // parabolic: center temperature
  T0Surf?: number;                     // parabolic: surface temperature
  arbitraryProfileFn?: (x: number) => number; // arbitrary: f(x) callback

  // ── Product-rule configuration ──────────────────────────────────────────────
  productSolution?: ProductSolutionOptions;

  // ── Per-axis Biot for product-rule bodies ───────────────────────────────────
  /** BC_III parallelepiped: Biot per face pair [Bi1, Bi2, Bi3]. */
  biPerAxis?: [number, number, number];
  /** BC_III finite cylinder: [Bi_lateral, Bi_endface]. */
  biCylinder?: [number, number];

  // ── Solver precision ────────────────────────────────────────────────────────
  seriesTerms?: number;              // Fourier terms N, default: 100
  rootFinderTol?: number;            // Eigenvalue convergence, default: 1e-12
  rootFinderMaxIter?: number;        // Newton iterations, default: 50

  // ── Volume average ──────────────────────────────────────────────────────────
  avg: AverageOptions;

  // ── Non-linear time stepping (oil quenching) ────────────────────────────────
  /** Per-step α = f(Ts) override. Overrides `alpha` when provided. */
  alphaCurve?: (Ts: number) => number;
  /** Time step size for sequential interval method (seconds). */
  timeStep?: number;
}
```

---

## 3. Computed Criteria

```typescript
export interface ThermalCriteria {
  Bi: number;   // Biot number — α·R/λ  (Infinity for BC_I)
  Fo: number;   // Fourier number — ā·τ/R²
  Rdist: number;
  Rbi: number;
}
```

---

## 4. API Functions

```typescript
/**
 * Temperature at a single normalized depth.
 * @param relDepth  0 = center, 1 = surface
 */
export function temperatureAtDepth(relDepth: number, opts: ProfileOptions): number;

/**
 * Temperature profile along the primary spatial axis.
 * Returns one value per entry in `relativeDepths`.
 */
export function temperatureProfile(
  relativeDepths: number[],
  opts: ProfileOptions,
): number[];

/**
 * Volume-average temperature T̄(τ).
 * Uses Bn series (1D / product-rule) or Gauss-Legendre (hollow cylinder / complex).
 */
export function averageTemperature(opts: ProfileOptions): number;

/**
 * Compute Biot and Fourier numbers for the current configuration.
 * For BC_I, Bi is returned as Infinity.
 */
export function computeCriteria(opts: ProfileOptions): ThermalCriteria;

/**
 * Extract Rdist and Rbi from ShapeInput.
 */
export function computeCharacteristicLengths(
  shape: ShapeInput,
  mode?: RDistMode,
): { Rdist: number; Rbi: number };

/**
 * Run the non-linear sequential interval loop (oil quenching).
 * Returns a time-series of {tau, Tsurface, Tcenter, Taverage}.
 */
export function runTimeSteppingLoop(
  opts: ProfileOptions,
): Array<{ tau: number; Tsurface: number; Tcenter: number; Taverage: number }>;
```

---

## 5. Eigenvalue Cache

Transcendental roots `μn(Bi)` are expensive. The solver must:

1. Cache the root array keyed by `(geometry, Bi, seriesTerms)`.
2. Invalidate and re-solve whenever `Bi` changes between time steps.
3. Use the Newton-Raphson secant update from the previous root set as the initial guess when `|ΔBi/Bi| < 0.01`.

```typescript
export interface EigenvalueCache {
  geometry: Geometry;
  Bi: number;
  terms: number;
  roots: number[];   // μ₁ … μN
}
```
