# THERMAL DISTRIBUTION SPEC — Calibration (EN)

## 1. Objectives & Acceptance Criteria

### 1.1 Global Acceptance Criteria

All calibration must satisfy these thresholds:

**Temperature Average (Tavg):**
- Relative error: |Tavg(candidate) − Tavg(ref)| / Tavg(ref) ≤ **1e−3** (0.1%)
- Applies at: N ≥ 32, Bi ∈ {0.1, 1.0, 10.0}
- All geometries, all candidate methods

**Profile Accuracy (L2 norm):**
- RMS error: √(∫[0,1] [S(x)−Sref(x)]² w(x) dx) ≤ **1e−2** (1%)
- Weight w(x): geometry-dependent (slab: 1; cylinder: 2x; sphere: 3x²)
- Minimum 3-5 profile lines per geometry

**Reference Methods:**
- 1D: Spectral (eigenvalue-based) with 2-3 modes
- Multi-D: Product-Solution with adequate quadrature (N=32-64)

**Candidate Methods:**
- B2 (2-point anchor)
- B2 (LS: weights {1, x, x²})
- B1 (heuristic, for comparison)

---

## 2. Parametric Grids by Geometry

### 2.1 Slab (Thickness L)

**Biot grid:** {0.1, 1.0, 10.0}  
**Profile line:** thickness direction ξ ∈ [0, 1]  
**Quadrature:** N ∈ {16, 32, 64}

**Calibration cases:**
```
slab_Bi01_N16, slab_Bi01_N32, slab_Bi01_N64
slab_Bi10_N16, slab_Bi10_N32, slab_Bi10_N64
slab_Bi100_N16, slab_Bi100_N32, slab_Bi100_N64
```

**Expected accuracy:**
- N=16: Tavg error ~1e-5, RMS ~1e-3
- N=32: Tavg error ~1e-7, RMS ~1e-5
- N=64: Tavg error ~1e-9, RMS <1e-6

---

### 2.2 Infinite Cylinder (Diameter D)

**Biot grid:** {0.1, 1.0, 10.0}  
**Profile lines:** radial x ∈ [0, 1]  
**Quadrature:** N ∈ {16, 32, 64}

**Basis:** Bessel J₀(λx) with eigenvalue equation λJ₁(λ)/J₀(λ) = −Bi

**Calibration cases:** As slab (same Bi×N combinations)

---

### 2.3 Sphere (Radius R)

**Biot grid:** {0.1, 1.0, 10.0}  
**Profile line:** radial x ∈ [0, 1]  
**Quadrature:** N ∈ {16, 32, 64}

**Basis:** sin(λx)/(λx) with eigenvalue equation λ cot λ = 1 − Bi

**Calibration cases:** As slab

---

### 2.4 Finite Cylinder (Diameter D, Height H)

**Biot grid:** {0.1, 1.0, 10.0}  
**Shape parameters:** H/D ∈ {0.5, 1.0, 2.0}  
**Method:** Product-Solution {r, z}  
**Quadrature:** N ∈ {16, 32, 64} (applies to z-axis; r local)

**Profile lines:**
1. Axial (x=0, z from 0 to 1)
2. Radial at z/H ∈ {0.0, 0.5, 1.0}

**Calibration cases:**
```
fcyl_HD05_Bi01_N32, fcyl_HD10_Bi01_N32, fcyl_HD20_Bi01_N32
fcyl_HD05_Bi10_N32, fcyl_HD10_Bi10_N32, fcyl_HD20_Bi10_N32
```

---

### 2.5 Rectangular Prism (A × B × C)

**Biot grid:** {0.1, 1.0, 10.0}  
**Aspect ratios:** {1:1:0.5, 1:1:1, 1:1:2}  
**Method:** Product-Solution {x, y, z}  
**Quadrature:** N ∈ {16, 32} (3D: N² or N³ expensive)

**Profile lines:**
1. Along x (y=0, z=0)
2. Along y (x=0, z=0)
3. Along z (x=0, y=0)

---

### 2.6 Cone (Height H, Base Radius R₀)

**Biot grid:** {0.1, 1.0, 10.0}  
**Slenderness:** H/R₀ ∈ {0.5, 1.0, 2.0}  
**Method:** Product-Solution {r, z} with R(z)=R₀(1−z/H)  
**Quadrature:** Nz ∈ {32, 64} (axial integration)

**Profile lines:**
1. Axial (r=0, z ∈ [0, H])
2. Radial at z/H ∈ {0.0, 0.5, 1.0}

**Cross-section weight:** A(z) = π R(z)²

---

### 2.7 Frustum (Top R₁, Bottom R₂, Height H)

**Biot grid:** {0.1, 1.0, 10.0}  
**Parameters:** (R₁/R₂) ∈ {0, 0.25, 0.5, 0.75}, H/R₂ ∈ {0.5, 1.0, 2.0}  
**Method:** Product-Solution {r, z} with R(z)=R₁+(R₂−R₁)z/H  
**Quadrature:** Nz ∈ {32, 64}

**Note:** R₁/R₂ = 0 reduces to cone; R₁/R₂ = 1 reduces to cylinder

---

### 2.8 Pyramid (Base A₀ × B₀, Height H)

**Biot grid:** {0.1, 1.0, 10.0}  
**Slenderness:** H/min(A₀,B₀) ∈ {0.5, 1.0, 2.0}  
**Method:** Product-Solution {x, y, z} with A(z)=A₀(1−z/H), B(z)=B₀(1−z/H)  
**Quadrature:** Nz ∈ {32, 64}

**Profile lines:** Axial + transverse (x,y axes) at z/H ∈ {0, 0.5, 1}

---

### 2.9 Frustum Pyramid (Base A₀ × B₀, Top A₁ × B₁, Height H)

**Biot grid:** {0.1, 1.0, 10.0}  
**Parameters:** (A₁/A₀, B₁/B₀) ∈ {(0,0), (0.5,0.5), (0.75,0.75), (1,1)}, H/min ∈ {0.5, 1.0, 2.0}  
**Method:** Product-Solution {x, y, z}  
**Quadrature:** Nz ∈ {32, 64}

---

## 3. Data Schema & Format

### 3.1 Calibration Test Case Structure

```typescript
interface CalibTestCase {
  id: string;                           // Unique identifier
  shape: {
    geometry: string;                   // 'slab', 'cone', etc.
    params: Record<string, number>;     // Geometry-specific (H, R, A, B, etc.)
    V?: number; S?: number;             // Volume, surface area
  };
  conditions: {
    h: number;                          // Convection coefficient
    k: number;                          // Thermal conductivity
    Tc?: number; Ts?: number;           // Optional explicit boundary temps
  };
  Bi: number;                           // Global Biot = h×Lc/k
  gaussNodes: number;                   // N ∈ {16, 32, 64}
  reference: {
    method: 'spectral' | 'product_solution';
    Tavg: number;                       // Normalized average (0-1)
    profile: {
      x: number[];                      // Normalized coordinates [0, 1]
      T: number[];                      // Normalized temperatures [0, 1]
    };
  };
  candidates: Array<{
    method: 'power_heuristic' | 'power_spectral_anchored';
    anchor?: string;                    // '2pt' | 'LS:1' | 'LS:x' | 'LS:x2'
    Tavg: number;
    profile: {
      x: number[];
      T: number[];
    };
  }>;
  errors: {
    relTavg: Record<string, number>;    // Relative error per candidate
    L2Profile: Record<string, number>;  // L2 error per candidate
  };
  meta: {
    runtime_ms: number;                 // Execution time
    newtonIter?: number;                // Newton iterations (spectral)
    computed_at: string;                // ISO timestamp
  };
}
```

---

## 4. JSON Calibration Examples

### 4.1 Slab Example

```json
{
  "id": "slab_Bi01_N32",
  "shape": {
    "geometry": "slab",
    "params": { "thickness": 0.020 },
    "V": 1.0,
    "S": 1.0
  },
  "conditions": { "h": 500, "k": 40 },
  "Bi": 1.0,
  "gaussNodes": 32,
  "reference": {
    "method": "spectral",
    "Tavg": 0.550,
    "profile": {
      "x": [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
      "T": [1.0, 0.920, 0.785, 0.605, 0.390, 0.0]
    }
  },
  "candidates": [
    {
      "method": "power_spectral_anchored",
      "anchor": "2pt",
      "Tavg": 0.551,
      "profile": {
        "x": [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
        "T": [1.0, 0.918, 0.783, 0.608, 0.392, 0.0]
      }
    }
  ],
  "errors": {
    "relTavg": { "power_spectral_anchored@2pt": 0.00182 },
    "L2Profile": { "power_spectral_anchored@2pt": 0.00341 }
  },
  "meta": {
    "runtime_ms": 0.34,
    "newtonIter": 2,
    "computed_at": "2026-02-07T15:30:00Z"
  }
}
```

### 4.2 Cone Example

```json
{
  "id": "cone_H50R15_Bi10_N32",
  "shape": {
    "geometry": "cone",
    "params": { "height": 0.050, "baseRadius": 0.015 },
    "V": 1.1781e-5,
    "S": 0.00412
  },
  "conditions": { "h": 500, "k": 40 },
  "Bi": 10.0,
  "gaussNodes": 32,
  "reference": {
    "method": "product_solution",
    "Tavg": 0.312,
    "profile": {
      "x": [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
      "T": [1.0, 0.756, 0.521, 0.315, 0.125, 0.0]
    }
  },
  "candidates": [
    {
      "method": "power_spectral_anchored",
      "anchor": "LS:x2",
      "Tavg": 0.314,
      "profile": {
        "x": [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
        "T": [1.0, 0.758, 0.524, 0.318, 0.128, 0.0]
      }
    }
  ],
  "errors": {
    "relTavg": { "power_spectral_anchored@LS:x2": 0.00641 },
    "L2Profile": { "power_spectral_anchored@LS:x2": 0.00847 }
  },
  "meta": {
    "runtime_ms": 2.15,
    "newtonIter": 2,
    "computed_at": "2026-02-07T15:32:00Z"
  }
}
```

---

## 5. Calibration Workflow

### 5.1 Generation Process

1. **Define test case** (geometry + Bi + N)
2. **Compute reference** (spectral or product-solution)
3. **Compute candidates** (B1, B2 variants)
4. **Calculate errors** (Tavg relative, profile L2)
5. **Record metadata** (runtime, Newton iterations)
6. **Store as JSON** in calibration-data/

### 5.2 Validation Process

1. **Load test case** from JSON
2. **Run candidate methods** in test environment
3. **Compare against stored reference**
4. **Check error thresholds** (§1.1 criteria)
5. **Report pass/fail** per case

### 5.3 CI Integration

```bash
# Generate calibration suite
npm run calibrate:generate

# Run calibration validation
npm test -- calibration.spec.ts

# Report results
npm run calibrate:report
```

---

## 6. Best Practices

- **Reference first:** Always generate spectral/product-solution as baseline
- **Comprehensive grids:** Test all Bi values and geometry parameters listed
- **Multiple N values:** Check N=16, 32, 64 convergence
- **Archive results:** Keep calibration-data/ in version control
- **Regression detection:** CI should flag any degradation vs baseline
- **Document assumptions:** Store geometry V, S calculations for reproducibility

---

**Calibration Spec Complete**  
**Version:** 1.7 (Expanded)  
**Status:** Production-ready with examples
