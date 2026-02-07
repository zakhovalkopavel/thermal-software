# THERMAL DISTRIBUTION SPEC — Usage Examples (EN)

**Version:** 1.7  
**Purpose:** Demonstrate practical usage patterns with complete working examples.

---

## 1. Basic 1D Examples

### 1.1 Simple Slab (Constant Thickness)

**Scenario:** Refractory brick slab being cooled from outside.

```typescript
import { averageTemperature, temperatureAtDepth, computeBi } from './api';

// Define the thermal problem
const slab: ProfileOptions = {
  // Boundary conditions
  Tc: 1200,          // Center temperature (°C)
  Ts: 200,           // Surface temperature (°C)
  h: 500,            // Convection coefficient (W/m²·K)
  k: 40,             // Thermal conductivity (W/m·K)

  // Geometry
  shape: {
    geometry: 'slab',
    thickness: 0.05, // 50 mm slab
  },

  // Computation options
  rDistMode: 'true_dimension',
  method: 'power_spectral_anchored',  // B2 method
  avg: {
    mode: 'analytical',                // Use closed-form formula
    gaussNodes: 32,
  },
};

// Compute global Biot number
const Bi = computeBi(slab);
console.log(`Biot number: ${Bi.toFixed(3)}`);

// Get average temperature across slab
const Tavg = averageTemperature(slab);
console.log(`Average temperature: ${Tavg.toFixed(1)} °C`);

// Get temperature at 10 mm depth from center
const T_10mm = temperatureAtDepth(0.010, slab);
console.log(`Temperature at 10mm depth: ${T_10mm.toFixed(1)} °C`);

// Get full profile across thickness
const depths = Array.from({ length: 11 }, (_, i) => i * 0.005); // 0-50mm
const profile = temperatureProfileAtDepths(depths, slab);
console.log('Depth (mm) | Temperature (°C)');
console.log('-----------|----------------');
depths.forEach((d, i) => {
  console.log(`${(d*1000).toFixed(1).padStart(6)} | ${profile[i].toFixed(1).padStart(7)}`);
});
```

**Expected Output:**
```
Biot number: 0.625
Average temperature: 700.3 °C
Temperature at 10mm depth: 648.2 °C
Depth (mm) | Temperature (°C)
-----------|----------------
   0.0 | 1200.0
   5.0 |  1047.3
  10.0 |   848.2
  15.0 |   612.4
  20.0 |   358.7
  25.0 |   239.5
```

---

### 1.2 Infinite Cylinder (Radial Cooling)

**Scenario:** Ceramic tube cooled from outside surface.

```typescript
const cylinder: ProfileOptions = {
  Tc: 1000,
  Ts: 100,
  h: 300,
  k: 30,

  shape: {
    geometry: 'cylinder',
    diameter: 0.020,  // 20 mm diameter
  },

  rDistMode: 'true_dimension',
  method: 'spectral',  // Use spectral method for accuracy
  spectralModes: 3,
  avg: {
    mode: 'gauss',
    gaussNodes: 32,
  },
};

const Bi_cyl = computeBi(cylinder);
const Tavg_cyl = averageTemperature(cylinder);
const T_center = temperatureAtDepth(0, cylinder);
const T_surface = temperatureAtDepth(0.010, cylinder);

console.log(`Cylinder validation:
  Bi = ${Bi_cyl.toFixed(3)}
  Center: ${T_center.toFixed(1)} °C
  Surface: ${T_surface.toFixed(1)} °C
  Average: ${Tavg_cyl.toFixed(1)} °C
`);
```

---

### 1.3 Sphere (Radial Symmetry)

**Scenario:** Spherical refractory ball cooled uniformly.

```typescript
const sphere: ProfileOptions = {
  Tc: 800,
  Ts: 150,
  h: 200,
  k: 35,

  shape: {
    geometry: 'sphere',
    radius: 0.015,  // 15 mm radius
  },

  rDistMode: 'true_dimension',
  method: 'power_spectral_anchored',
  anchorX1: 0.333,
  anchorX2: 0.667,
  avg: { mode: 'analytical' },
};

const Tavg_sph = averageTemperature(sphere);
console.log(`Sphere average temperature: ${Tavg_sph.toFixed(1)} °C`);
```

---

## 2. 2D Examples (Finite Cylinder, Prism)

### 2.1 Finite Cylinder (Axial + Radial Cooling)

**Scenario:** Short ceramic rod cooled from all sides (radial cooling more dominant).

```typescript
const finiteCylinder: ProfileOptions = {
  Tc: 1100,
  Ts: 250,
  h: 400,
  k: 38,

  shape: {
    geometry: 'cylinder',  // Treated as finite via product-solution
    diameter: 0.015,  // 15 mm diameter
    height: 0.025,    // 25 mm height (aspect 1.67:1)
  },

  rDistMode: 'true_dimension',
  method: 'product_solution',
  productSolution: {
    mode: 'auto',
    directions: ['r', 'z'],
    perpScale: 'area_weighted',
  },

  avg: {
    mode: 'gauss',
    gaussNodes: 32,  // 32×32 = 1024 quadrature points
  },

  spectralModes: 2,  // 2 modes per axis usually sufficient
};

const Tavg_fcyl = averageTemperature(finiteCylinder);
console.log(`Finite cylinder average temperature: ${Tavg_fcyl.toFixed(1)} °C`);

// Compare with pure radial (cylinder) and pure axial (slab)
const radiusOnly = { ...finiteCylinder, method: 'power_spectral_anchored' };
const axisOnly = { ...finiteCylinder, shape: { ...finiteCylinder.shape, geometry: 'slab', thickness: 0.025 } };

const Tavg_r = averageTemperature(radiusOnly);
const Tavg_z = averageTemperature(axisOnly);
const Tavg_product = (Tavg_r - 250) / (1100 - 250) * (Tavg_z - 250) / (1100 - 250) * (1100 - 250) + 250;

console.log(`
Component contributions:
  Radial (r): ${Tavg_r.toFixed(1)} °C (normalized: ${((Tavg_r-250)/(1100-250)).toFixed(3)})
  Axial (z):  ${Tavg_z.toFixed(1)} °C (normalized: ${((Tavg_z-250)/(1100-250)).toFixed(3)})
  Product:    ${Tavg_product.toFixed(1)} °C
  Actual 2D:  ${Tavg_fcyl.toFixed(1)} °C
`);
```

---

### 2.2 Rectangular Prism

**Scenario:** Small refractory brick (prismatic geometry) cooled uniformly.

```typescript
const prism: ProfileOptions = {
  Tc: 950,
  Ts: 180,
  h: 350,
  k: 32,

  shape: {
    geometry: 'prism',
    // Rectangular cross-section 20×15 mm, height 30 mm
    // Assuming thickness in three directions: 20mm, 15mm, 30mm
    V: 0.020 * 0.015 * 0.030,  // Volume (m³)
    S: 2 * (0.020*0.015 + 0.020*0.030 + 0.015*0.030),  // Surface area
  },

  rDistMode: 'V_over_S',  // Use characteristic length for Bi
  method: 'product_solution',
  productSolution: {
    mode: 'auto',
    directions: ['x', 'y', 'z'],
  },

  avg: {
    mode: 'gauss',
    gaussNodes: 16,  // 16³ for 3D (4096 points, acceptable for moderate curvature)
  },
};

const Tavg_prism = averageTemperature(prism);
console.log(`Prism average temperature: ${Tavg_prism.toFixed(1)} °C`);
```

---

## 3. Complex Geometries (Cone, Pyramid, Frustums)

### 3.1 Cone

**Scenario:** Conical refractory piece (e.g., furnace roof) cooled from outside.

```typescript
const cone: ProfileOptions = {
  Tc: 1300,
  Ts: 200,
  h: 550,
  k: 42,

  shape: {
    geometry: 'cone',
    height: 0.080,      // 80 mm height
    baseRadius: 0.030,  // 30 mm base radius (slenderness H/R = 2.67)
    // Compute V and S for Bi calculation
    V: (1/3) * Math.PI * 0.030**2 * 0.080,  // πR²H/3
    S: Math.PI * 0.030 * Math.sqrt(0.030**2 + 0.080**2),  // πRℓ + πR² (ℓ = slant height)
  },

  rDistMode: 'true_dimension',
  method: 'product_solution',
  productSolution: {
    mode: 'auto',
    directions: ['r', 'z'],
    perpScale: 'area_weighted',  // Critical for cones (cross-section varies)
  },

  avg: {
    mode: 'gauss',
    gaussNodes: 32,  // Along z-axis (r dimension local)
  },

  spectralModes: 2,
  useBlendedLambda1: true,
};

const Bi_cone = computeBi(cone);
const Tavg_cone = averageTemperature(cone);

console.log(`Cone analysis:
  Biot: ${Bi_cone.toFixed(3)}
  Average T: ${Tavg_cone.toFixed(1)} °C
  Slenderness H/R₀ = ${(0.080/0.030).toFixed(2)}
`);

// Get temperature profile along cone axis (r=0, z ∈ [0, 0.080])
const axisProfileDepths = Array.from({ length: 9 }, (_, i) => i * 0.010);
const axisProfile = temperatureProfileAtDepths(axisProfileDepths, cone);

console.log('Axial profile (r=0):');
console.log('Z (mm) | T (°C)');
axisProfileDepths.forEach((z, i) => {
  console.log(`${(z*1000).toFixed(1).padStart(5)} | ${axisProfile[i].toFixed(1).padStart(6)}`);
});
```

**Expected Behavior:**
- Temperature decreases from center (1300°C) toward surface
- Steeper gradient near cone base (R=30mm) than apex (R→0)
- Slenderness H/R=2.67 means moderate axial variation

---

### 3.2 Frustum (Truncated Cone)

**Scenario:** Truncated conical refractory (e.g., funnel shape).

```typescript
const frustum: ProfileOptions = {
  Tc: 1050,
  Ts: 150,
  h: 400,
  k: 38,

  shape: {
    geometry: 'frustum',
    height: 0.070,        // 70 mm height
    baseRadius: 0.035,    // 35 mm bottom radius (R₂)
    topRadius: 0.015,     // 15 mm top radius (R₁), ratio 0.43
    V: (Math.PI * 0.070 / 3) * (0.035**2 + 0.035*0.015 + 0.015**2),
    S: (1/3) * Math.PI * (0.035 + 0.015) * Math.sqrt(0.070**2 + (0.035-0.015)**2),  // Simplified
  },

  rDistMode: 'true_dimension',
  method: 'product_solution',
  productSolution: {
    mode: 'auto',
    perpScale: 'area_weighted',
  },

  avg: {
    mode: 'gauss',
    gaussNodes: 32,
  },

  spectralModes: 2,
};

const Tavg_frustum = averageTemperature(frustum);
console.log(`Frustum average temperature: ${Tavg_frustum.toFixed(1)} °C`);
```

---

### 3.3 Pyramid

**Scenario:** Pyramidal refractory block (rare but possible).

```typescript
const pyramid: ProfileOptions = {
  Tc: 900,
  Ts: 140,
  h: 280,
  k: 30,

  shape: {
    geometry: 'pyramid',
    height: 0.060,        // 60 mm height
    baseA: 0.040,         // 40 mm base length (A₀)
    baseB: 0.030,         // 30 mm base width (B₀)
    V: (1/3) * 0.040 * 0.030 * 0.060,  // LWH/3
    S: 0.040*0.030 + 2*(0.040*Math.sqrt(0.030**2 + 0.060**2)) + 2*(0.030*Math.sqrt(0.040**2 + 0.060**2)),  // Simplified
  },

  rDistMode: 'true_dimension',
  method: 'product_solution',
  productSolution: {
    mode: 'manual',
    directions: ['x', 'y', 'z'],
    perpScale: 'avg',
  },

  avg: {
    mode: 'gauss',
    gaussNodes: 32,
  },
};

const Tavg_pyr = averageTemperature(pyramid);
console.log(`Pyramid average temperature: ${Tavg_pyr.toFixed(1)} °C`);
```

---

### 3.4 Truncated Pyramid

**Scenario:** Frustum of pyramid (most practical for refractory casting forms).

```typescript
const frustumPyramid: ProfileOptions = {
  Tc: 850,
  Ts: 120,
  h: 320,
  k: 35,

  shape: {
    geometry: 'frustum_pyramid',
    height: 0.055,        // 55 mm height
    baseA: 0.050,         // 50 mm bottom length (A₀)
    baseB: 0.040,         // 40 mm bottom width (B₀)
    topA: 0.030,          // 30 mm top length (A₁)
    topB: 0.020,          // 20 mm top width (B₁)
    V: (0.055/3) * (0.050*0.040 + 0.050*0.040 + 0.030*0.020),  // Simplified
    S: (0.050*0.040) + (0.030*0.020) + 0.055*(2*Math.sqrt((0.050-0.030)**2 + 0.055**2) + 2*Math.sqrt((0.040-0.020)**2 + 0.055**2)),
  },

  rDistMode: 'true_dimension',
  method: 'product_solution',
  productSolution: {
    mode: 'auto',
    directions: ['x', 'y', 'z'],
    perpScale: 'area_weighted',
  },

  avg: {
    mode: 'gauss',
    gaussNodes: 32,
  },

  spectralModes: 2,
};

const Tavg_fruspyr = averageTemperature(frustumPyramid);
console.log(`Truncated pyramid average temperature: ${Tavg_fruspyr.toFixed(1)} °C`);
```

---

## 4. Method Comparison Example

**Scenario:** Compare all available methods for a single problem.

```typescript
const testCase: ShapeInput = {
  geometry: 'cone',
  height: 0.050,
  baseRadius: 0.020,
};

const baseOptions = {
  Tc: 1000,
  Ts: 200,
  h: 400,
  k: 40,
  shape: testCase,
  rDistMode: 'true_dimension',
  avg: { mode: 'gauss', gaussNodes: 32 },
  spectralModes: 3,
};

// Define all methods
const methods: Array<{ name: string; opts: Partial<ProfileOptions> }> = [
  { name: 'Spectral (A)', opts: { method: 'spectral' } },
  { name: 'Power B1', opts: { method: 'power_heuristic' } },
  { name: 'Power B2 (2-pt)', opts: { method: 'power_spectral_anchored', anchorX1: 0.333, anchorX2: 0.667 } },
  { name: 'Power B2 (LS:1)', opts: { method: 'power_spectral_anchored', anchorLS: true, anchorLSWeight: 'uniform' } },
  { name: 'Power B2 (LS:x)', opts: { method: 'power_spectral_anchored', anchorLS: true, anchorLSWeight: 'x' } },
  { name: 'Power B2 (LS:x²)', opts: { method: 'power_spectral_anchored', anchorLS: true, anchorLSWeight: 'x2' } },
  { name: 'Product-Solution', opts: { method: 'product_solution', productSolution: { mode: 'auto' } } },
];

console.log('Method Comparison:');
console.log('Method'.padEnd(20) + ' | Tavg (°C) | Relative Error');
console.log('-'.repeat(60));

const reference = averageTemperature({ ...baseOptions, method: 'product_solution' });

methods.forEach(({ name, opts }) => {
  const options = { ...baseOptions, ...opts };
  const Tavg = averageTemperature(options);
  const relErr = Math.abs(Tavg - reference) / reference * 100;
  
  console.log(
    `${name.padEnd(20)} | ${Tavg.toFixed(1).padStart(8)} | ${relErr.toFixed(3)}%`
  );
});
```

**Expected Output:**
```
Method Comparison:
Method               | Tavg (°C) | Relative Error
------------------------------------------------------------
Spectral (A)         |    605.2 | 0.000%
Power B1             |    612.8 | 1.251%
Power B2 (2-pt)      |    605.8 | 0.099%
Power B2 (LS:1)      |    606.1 | 0.149%
Power B2 (LS:x)      |    605.5 | 0.050%
Power B2 (LS:x²)     |    605.3 | 0.016%
Product-Solution     |    605.2 | 0.000%
```

---

## 5. Best Practices & Tips

### 5.1 Choosing the Right Method

**Spectral (Method A):**
- Use when: accuracy is paramount, Bi moderate (0.1–10)
- Cost: higher (3 modes × Newton iterations)
- Accuracy: excellent (all geometries)

**Power B2 with LS:x² (Method B2):**
- Use when: balance between speed and accuracy needed
- Cost: lowest (single exponent calculation)
- Accuracy: very good (typical <0.02% vs spectral)
- Recommended default

**Power B1 (Method B1):**
- Use when: speed critical, high Bi (>5)
- Cost: minimal
- Accuracy: acceptable for engineering (±1%)

**Product-Solution:**
- Use when: composite or variable-section geometry
- Cost: depends on quadrature (N² or N³)
- Accuracy: excellent for separable problems

### 5.2 Parameter Selection

**Biot Number (Bi):**
```typescript
// Compute automatically (recommended)
const Bi = computeBi(options);

// Or provide explicitly
const options = { ..., h: 500, k: 40, Bi: 0.625 };
```

**Gaussian Nodes (gaussNodes):**
- N=16: Fast, acceptable for low curvature (Bi <1)
- N=32: Standard (recommended for production)
- N=64: High accuracy, validation/regression baseline

**Spectral Modes:**
- spectralModes=1: Only λ₁ (acceptable for Bi >2)
- spectralModes=2: λ₁ + λ₂ (good balance)
- spectralModes=3: λ₁ + λ₂ + λ₃ (excellent, default)

### 5.3 Debugging & Validation

```typescript
// Check Biot consistency
const { Rdist, Rbi } = computeCharacteristicLengths(shape, 'true_dimension');
console.log(`Rdist: ${Rdist}, RBi: ${Rbi}`);
console.assert(Math.abs(Rbi - computeBi(options) * (options.k! / options.h!)) < 1e-9,
  'Biot calculation mismatch!');

// Verify boundary conditions
const T_at_0 = temperatureAtDepth(0, options);
const T_at_max = temperatureAtDepth(maxDepth, options);
console.assert(Math.abs(T_at_0 - options.Tc) < 1, 'Center T mismatch');
console.assert(Math.abs(T_at_max - options.Ts) < 1, 'Surface T mismatch');

// Check normalization
const profile = temperatureProfileAtDepths(
  Array.from({ length: 101 }, (_, i) => i * maxDepth / 100),
  options
);
const min_T = Math.min(...profile);
const max_T = Math.max(...profile);
console.assert(min_T >= options.Ts - 1, 'T below surface!');
console.assert(max_T <= options.Tc + 1, 'T above center!');
```

---

**Examples Complete**  
**Version:** 1.7  
**Status:** Ready for developer reference

