# THERMAL DISTRIBUTION SPEC — Usage Examples

**Version:** 2.0

---

## 1. BC I — Water Quenching (Dirichlet, Bi → ∞)

### 1.1 Solid Cylinder — Water Quench from 850 °C

```typescript
import {
  temperatureAtDepth, temperatureProfile,
  averageTemperature, computeCriteria,
} from './thermal-distribution';

// AISI 304 stainless, 50 mm diameter bar, quenched in water
const opts = {
  bcType: 'BC_I' as const,
  shape: { geometry: 'cylinder' as const, radius: 0.025 },
  T0: 850,          // initial uniform temperature (°C)
  Tc: 20,           // water temperature (°C)
  tau: 30,          // elapsed time (s)
  lambda: 16.0,     // λ̄ at (850+20)/2 ≈ 435 °C
  thermalDiffusivity: 3.8e-6,  // ā (m²/s)
  seriesTerms: 100,
  avg: { mode: 'series' as const },
};

const { Fo } = computeCriteria(opts);
console.log(`Fo = ${Fo.toFixed(4)}`);
// → Fo = ā·τ/R² = 3.8e-6 × 30 / 0.025² = 0.1824

const Tcenter = temperatureAtDepth(0, opts);
const Tsurface = temperatureAtDepth(1, opts);
const Tavg = averageTemperature(opts);

console.log(`T_center  = ${Tcenter.toFixed(1)} °C`);
console.log(`T_surface = ${Tsurface.toFixed(1)} °C`);
console.log(`T_average = ${Tavg.toFixed(1)} °C`);

// Profile at 5 normalized depths
const profile = temperatureProfile([0, 0.25, 0.5, 0.75, 1.0], opts);
profile.forEach((T, i) => console.log(`  x=${[0,0.25,0.5,0.75,1][i]}  T=${T.toFixed(1)} °C`));
```

---

### 1.2 Solid Sphere — Normalizing After Forging

```typescript
const sphereOpts = {
  bcType: 'BC_I' as const,
  shape: { geometry: 'sphere' as const, radius: 0.030 },
  T0: 1100,
  Tc: 25,
  tau: 60,
  lambda: 15.5,
  thermalDiffusivity: 3.6e-6,
  seriesTerms: 100,
  avg: { mode: 'series' as const },
};

const { Fo: FoSphere } = computeCriteria(sphereOpts);
// BC I sphere: eigenvalues μn = n·π; An = 2·(−1)^(n+1); Bn = 6/(n²π²)
const Tbar = averageTemperature(sphereOpts);
console.log(`T̄ at τ=60 s: ${Tbar.toFixed(1)} °C`);
```

---

## 2. BC III — Furnace Heating (Convective)

### 2.1 Infinite Plate — Furnace Heating with Uniform Initial Profile

```typescript
// Refractory slab, 60 mm thick, heated in furnace
const plateOpts = {
  bcType: 'BC_III' as const,
  shape: { geometry: 'plate' as const, halfThickness: 0.030 },
  T0: 20,           // initial temperature
  Tc: 1000,         // furnace gas temperature
  alpha: 80,        // convective HTC (W/(m²·K))
  lambda: 1.5,
  thermalDiffusivity: 6.0e-7,
  tau: 3600,        // 1 hour
  initialProfile: 'uniform' as const,
  seriesTerms: 100,
  avg: { mode: 'series' as const },
};

const { Bi, Fo } = computeCriteria(plateOpts);
console.log(`Bi = ${Bi.toFixed(3)}, Fo = ${Fo.toFixed(4)}`);
// Eigenvalue eq: ctg(μ) = (μ² − Bi²)/(2μ·Bi)

const Tcenter = temperatureAtDepth(0, plateOpts);
const Tavg = averageTemperature(plateOpts);
console.log(`T_center = ${Tcenter.toFixed(1)} °C`);
console.log(`T̄ = ${Tavg.toFixed(1)} °C`);
```

---

### 2.2 Sphere — BC III with Parabolic Initial Profile

```typescript
// Part emerged from quench bath partially pre-cooled (non-uniform initial temp)
const parabolaOpts = {
  bcType: 'BC_III' as const,
  shape: { geometry: 'sphere' as const, radius: 0.025 },
  T0: 500,             // uniform T0 (used only for Fourier criteria)
  Tc: 50,              // oil bath temperature
  alpha: 1200,
  lambda: 16,
  thermalDiffusivity: 4.0e-6,
  tau: 10,
  initialProfile: 'parabolic' as const,
  T0Ctr: 650,          // hot core
  T0Surf: 350,         // pre-cooled surface
  seriesTerms: 100,
  avg: { mode: 'series' as const },
};

// Uses analytical modifier Cn = ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 3/μn²)
// No numerical integration — exact and fast.
const Tavg = averageTemperature(parabolaOpts);
console.log(`T̄ = ${Tavg.toFixed(1)} °C`);
```

---

### 2.3 Finite Cylinder — Product Rule (BC III)

```typescript
// Short billet: R = 40 mm, H = 80 mm (l = 40 mm = R)
const finiteCylOpts = {
  bcType: 'BC_III' as const,
  shape: {
    geometry: 'finite_cylinder' as const,
    radius: 0.040,
    halfZ: 0.040,       // axial half-length l
  },
  biCylinder: [8.0, 6.0] as [number, number],
  // biCylinder[0] = Bi_lateral, biCylinder[1] = Bi_endface
  T0: 900,
  Tc: 30,
  alpha: undefined,     // biCylinder overrides per-axis
  lambda: 16,
  thermalDiffusivity: 4.0e-6,
  tau: 20,
  seriesTerms: 100,
  avg: { mode: 'series' as const },
};

// Internally: Θ = Θ_cyl(r, τ; Bi_lat) × Θ_plate(z, τ; Bi_end)
// T̄ = Tc − (Tc − T0) × B̄_cyl × B̄_plate
const Tavg = averageTemperature(finiteCylOpts);
console.log(`Finite cylinder T̄ = ${Tavg.toFixed(1)} °C`);
```

---

## 3. Oil Quenching — Non-Linear Time-Stepping

```typescript
import { runTimeSteppingLoop } from './thermal-distribution';
import { computeAlpha } from './heat-transfer-coefficient'; // HTC_00 entry point

const oilQuenchOpts = {
  bcType: 'BC_III' as const,
  shape: { geometry: 'cylinder' as const, radius: 0.020 },
  T0: 850,
  Tc: 80,               // oil bath temperature
  lambda: 16,
  thermalDiffusivity: 4.0e-6,
  // α(Ts) supplied as a curve — routes through film/nucleate/convection regimes
  alphaCurve: (Ts: number) => computeAlpha(Ts, { medium: 'oil', Tsat: 80 }),
  timeStep: 0.5,        // Δτ = 0.5 s per interval
  seriesTerms: 100,
  avg: { mode: 'series' as const },
};

// Run for 120 s total
const trail = runTimeSteppingLoop({ ...oilQuenchOpts, tau: 120 });

// Print every 10 s
trail
  .filter((_, i) => i % 20 === 0)
  .forEach(({ tau, Tsurface, Tcenter, Taverage }) =>
    console.log(
      `τ=${tau.toFixed(0).padStart(6)} s` +
      `  Ts=${Tsurface.toFixed(1)}` +
      `  Tc=${Tcenter.toFixed(1)}` +
      `  T̄=${Taverage.toFixed(1)}`
    )
  );
```

---

## 4. Hollow Cylinder — BC III

```typescript
// Pipe wall: inner R1=20 mm, outer R2=40 mm
const hollowOpts = {
  bcType: 'BC_III' as const,
  shape: {
    geometry: 'hollow_cylinder' as const,
    innerRadius: 0.020,
    outerRadius: 0.040,
  },
  T0: 600,
  Tc: 20,
  alpha: 500,          // same α on both surfaces
  lambda: 16,
  thermalDiffusivity: 4.0e-6,
  tau: 15,
  seriesTerms: 50,
  avg: { mode: 'gauss' as const, gaussNodes: 32 },
  // Hollow cylinder has no closed-form mean → Gauss-Legendre is mandatory
};

const Tavg = averageTemperature(hollowOpts);
console.log(`Hollow cylinder T̄ = ${Tavg.toFixed(1)} °C`);
```

---

## 5. Complex Body — β-Scaling (Path B)

```typescript
// Gear blank approximated as a solid cylinder (β=2)
import { computeCharacteristicLengths } from './thermal-distribution';

const gearOpts = {
  bcType: 'BC_III' as const,
  shape: {
    geometry: 'auto' as const,
    V: 1.26e-4,    // m³
    A: 8.9e-3,     // m²  →  V/A = 0.01416 m  →  Req = 2 × 0.01416 = 28.3 mm
  },
  rDistMode: 'V_over_A' as const,
  T0: 820,
  Tc: 60,
  alpha: 900,
  lambda: 15,
  thermalDiffusivity: 3.8e-6,
  tau: 25,
  seriesTerms: 100,
  avg: { mode: 'series' as const },
};

const lengths = computeCharacteristicLengths(gearOpts.shape, 'V_over_A');
console.log(`Rdist = ${(lengths.Rdist * 1000).toFixed(1)} mm`);

const Tavg = averageTemperature(gearOpts);
console.log(`Gear blank T̄ = ${Tavg.toFixed(1)} °C`);
```
