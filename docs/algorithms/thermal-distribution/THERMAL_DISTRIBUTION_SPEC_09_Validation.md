# THERMAL DISTRIBUTION SPEC — Validation & Testing (EN)

**Version:** 1.7  
**Purpose:** Establish validation methodology, error thresholds, and testing protocols for all supported methods and geometries.

---

## 1. Validation Objectives & Acceptance Criteria

### 1.1 Global Acceptance Criteria

All candidate methods must satisfy these thresholds against reference (benchmark) results:

**Temperature Average (Tavg):**
- Relative error: |Tavg(candidate) − Tavg(ref)| / Tavg(ref) ≤ **1e−3** (0.1%)
- Condition: N ≥ 32, Bi ∈ {0.1, 1.0, 10.0}
- Applies to: all geometries, all methods (B1, B2, spectral variants)

**Profile Accuracy (L2 norm on normalized coordinate):**
- RMS error: √(∫[0,1] [S(x)−Sref(x)]² w(x) dx) ≤ **1e−2** (1%)
- Weight w(x): depends on geometry (slab: 1; cylinder: 2x; sphere: 3x²)
- Line coverage: at least 3-5 evenly spaced lines per geometry

**Convergence (N-dependent):**
- Gauss-Legendre N ∈ {16, 32, 64}
- Monotonic decrease in error as N increases
- Saturation at N=64 indicates adequate quadrature order

### 1.2 Acceptance Levels

| Method | Status | Condition |
|--------|--------|-----------|
| **Spectral (A)** | Reference | Always accepts for calibration |
| **Power B2 (2-point)** | Candidate | Must pass §1.1 criteria |
| **Power B2 (LS: weight=1)** | Candidate | Must pass §1.1 criteria |
| **Power B2 (LS: weight=x)** | Candidate | Must pass §1.1 criteria |
| **Power B2 (LS: weight=x²)** | Candidate | Must pass §1.1 criteria |
| **Power B1** | Candidate | Must pass §1.1 criteria |
| **Product-Solution** | Reference | For composite/variable-section bodies |

---

## 2. Testing Protocols by Dimension

### 2.1 1D Geometries (Slab, Cylinder, Sphere)

**Reference Methods:**
- Slab: Spectral (cot λ = λ/Bi; basis cos(λx))
- Cylinder: Spectral (λJ₁(λ)/J₀(λ) = −Bi; basis J₀(λx))
- Sphere: Spectral (λ cot λ = 1−Bi; basis sin(λx)/(λx))

**Validation Approach:**
1. Generate Tavg(Bi) for Bi ∈ {0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0}
2. Compute temperature profile T(x) at N ∈ {16, 32, 64} for each Bi
3. Compare all candidate methods against spectral reference
4. Report relative error (Tavg) and RMS error (profile) per Bi/N

**Test Cases:**
- N=16: basic validation
- N=32: standard validation (minimum for production)
- N=64: regression/accuracy baseline

**Success Criteria:**
- All candidates pass §1.1 at N≥32
- Spectral monotonically converges (N: 16→32→64)
- B2 (LS:x²) typically closest to spectral

**Runtime Benchmarks (per Bi/N combination):**
- Spectral: <1 ms (pre-cached eigenvalues)
- B1: <0.5 ms
- B2: <1 ms
- Expected total 1D suite: <200 ms

---

### 2.2 2D Geometries (Finite Cylinder, Rectangular Prism)

**Reference Method:**
- Product-Solution: S(r,z) = Sr(r) × Sz(z)
- Sr: cylindrical basis (Bessel/slab depending on geometry)
- Sz: slab basis (1D plated profile along axis)
- 2D averaging: quadrature 16×16, 32×32, or 64×64

**Validation Approach:**
1. Select aspect ratios: H/D ∈ {0.5, 1.0, 2.0} (finite cylinder)
2. Generate 2D reference (product-solution, N=64)
3. Compare B1/B2 methods (applied per-axis)
4. Verify that 1D product average = 2D numerical quadrature

**Test Cases:**
```
Finite Cylinder (r×z):
  H/D = 0.5: thin disk
  H/D = 1.0: cubic-like
  H/D = 2.0: tall cylinder
  
Rectangular Prism (x×y×z):
  A:B:C ∈ {1:1:0.5, 1:1:1, 1:1:2}
```

**Success Criteria:**
- Tvavg(product method) = Tavg(2D-quadrature) to < 1e−10 tolerance
- Product factors: Acyl(n) × Aslab(n) vs direct 2D quadrature
- Error growth controlled: all below 1e−3 relative

**Runtime Benchmarks:**
- 2D quadrature (16×16): ~5 ms
- Product method: <1 ms
- Expected 2D suite: <100 ms

---

### 2.3 3D Geometries (Rectangular Prism, General Polyhedra)

**Reference Method:**
- Product-Solution: S(x,y,z) = Sx(x) × Sy(y) × Sz(z)
- 3D averaging: tensor quadrature 8×8×8, 16×16×16, or 32×32×32

**Validation Approach:**
1. Select aspect ratios: (A:B:C) from {1:1:1, 1:2:3, 1:1:0.5, 2:2:1}
2. Generate 3D reference (product-solution, N=32³)
3. Compare 1D product average (3-factor multiplication) vs 3D quadrature
4. Verify separability holds (no cross-terms)

**Test Cases:**
```
Rectangular Prisms:
  1:1:1 (cube)
  1:2:1 (elongated)
  1:1:2 (thick slab)
  
N-gonal Prisms: inscribed circle radius, height variations
```

**Success Criteria:**
- Product factors match 3D quadrature to < 1e−9 tolerance
- Demonstrated separability (T(r,z) = Tr(r)·Tz(z) exactly)
- Low-N (8³) sufficient for low curvature

**Runtime Benchmarks:**
- 3D quadrature (8×8×8): ~10 ms
- Product method: <2 ms
- Expected 3D suite: <50 ms

---

## 3. Variable-Section Geometries (Cone, Pyramid, Frustums)

### 3.1 Cone Validation

**Reference Method:**
- Product-Solution with axial quadrature (Gauss-Legendre along z)
- Radial sub-profile: local R(z) = R₀(1−z/H)
- Axial averaging: weight A(z) = πR(z)²

**Test Grid:**
- Slenderness H/R₀ ∈ {0.5, 1.0, 2.0}
- Bi ∈ {0.1, 1.0, 10.0}
- Gauss nodes Nz ∈ {16, 32, 64}

**Validation Lines:**
1. Axial line (r=0, z ∈ [0,H]): demonstrates z-gradient
2. Radial lines at z/H ∈ {0.0, 0.5, 1.0}: shows R(z) dependence
3. Cross-sections at z/H ∈ {0.25, 0.75}: intermediate behavior

**Success Criteria:**
- Tavg error < 1e−3 vs reference (Nz≥32)
- Profile RMS < 1e−2 per line
- Smooth transitions across z-levels

---

### 3.2 Pyramid Validation

**Reference Method:**
- Product-Solution with axial quadrature
- Local dimensions: A(z) = A₀(1−z/H), B(z) = B₀(1−z/H)
- Axial averaging: weight A(z)×B(z)

**Test Grid:**
- Aspect ratio H/min(A₀,B₀) ∈ {0.5, 1.0, 2.0}
- Base aspect (A₀/B₀) ∈ {0.5, 1.0, 2.0}
- Bi ∈ {0.1, 1.0, 10.0}
- Gauss nodes Nz ∈ {32, 64}

**Validation Lines:**
1. Axial (x=0, y=0, z ∈ [0,H])
2. x-axis at y=0, multiple z-levels
3. y-axis at x=0, multiple z-levels
4. Diagonal in cross-section (45°)

**Success Criteria:**
- Tavg error < 1e−3 (Nz≥32)
- All lines RMS < 1e−2
- Non-uniform cross-section captured correctly

---

### 3.3 Frustum (Cone & Pyramid) Validation

**Cone Frustum:**
- R(z) = R₁ + (R₂−R₁)×z/H
- Test: (R₁/R₂) ∈ {0, 0.25, 0.5, 0.75}, H/R₂ ∈ {0.5, 1.0, 2.0}

**Pyramid Frustum:**
- A(z) = A₁ + (A₀−A₁)×z/H (similar for B)
- Test: (A₁/A₀) ∈ {0, 0.25, 0.5, 0.75}, H/min ∈ {0.5, 1.0, 2.0}

**Success Criteria:**
- Same as cone/pyramid (Tavg <1e−3, RMS <1e−2)
- Smooth transition from frustum → full cone (A₁→0 or R₁→0)

---

## 4. Regression Test Suite Structure

### 4.1 Test Data Organization

```
tests/unit/refractory/algorithms/thermal-distribution/
├── calibration-data/
│   ├── slab/
│   │   ├── slab_Bi01_N16.json
│   │   ├── slab_Bi01_N32.json
│   │   ├── slab_Bi01_N64.json
│   │   ├── slab_Bi10_N16.json
│   │   └── ... (variants)
│   ├── cylinder/
│   ├── sphere/
│   ├── prism/
│   ├── cone/
│   ├── frustum/
│   ├── pyramid/
│   └── frustum_pyramid/
│
├── validation.spec.ts (main test suite)
├── helpers/
│   ├── reference-methods.ts (spectral, product-solution)
│   ├── test-data-loader.ts
│   └── metrics.ts (error calculations)
└── reports/
    └── validation-report.md (generated per CI run)
```

### 4.2 Test Data Schema

```typescript
interface CalibTestCase {
  id: string;                           // e.g., "slab_Bi01_N32"
  shape: { geometry: string; params: {} };
  conditions: { h: number; k: number; };
  Bi: number;                           // global Biot
  gaussNodes: number;                   // N ∈ {16,32,64}
  reference: {
    method: 'spectral' | 'product_solution';
    Tavg: number;
    profile: number[];                  // T values at x ∈ [0,1]
    profileX: number[];                 // x coordinates
  };
  candidates: Array<{
    method: 'power_heuristic' | 'power_spectral_anchored';
    anchor?: string;                    // e.g., "2pt", "LS:x2"
    Tavg: number;
    profile: number[];
  }>;
}
```

### 4.3 CI Integration

**Test Execution:**
```bash
# Full regression suite
npm test -- thermal-distribution.validation.spec.ts

# By geometry
npm test -- thermal-distribution.validation.spec.ts --geometry=cone

# By Bi value
npm test -- thermal-distribution.validation.spec.ts --bi=1.0

# By method
npm test -- thermal-distribution.validation.spec.ts --method=power_spectral_anchored
```

**Success/Failure Thresholds:**
- Pass: all tests within §1.1 criteria
- Fail: any test exceeds threshold (with margin report)
- Warn: approaching threshold (80% of margin)

---

## 5. Performance & Convergence Testing

### 5.1 N-Convergence Analysis

For each geometry and Bi:
1. Compute Tavg for N ∈ {8, 16, 32, 64}
2. Plot error vs N (should decrease monotonically)
3. Estimate convergence rate (usually exponential)
4. Determine minimal N for acceptable error

**Expected Results:**
- N=16: ~1e−5 relative error (high curvature Bi=10)
- N=32: ~1e−7 relative error
- N=64: ~1e−9 relative error (machine precision limit)

### 5.2 Method Comparison Plots

Generate comparison charts:
- Tavg(Bi) for all methods (reference vs candidates)
- Profile overlay (visual inspection)
- Error vs Bi (trend analysis)
- Runtime vs method (computational cost)

---

## 6. Documentation & Reporting

### 6.1 Per-Test-Run Report

Generate after each CI run:
```markdown
# Thermal Distribution Validation Report
**Date:** 2026-02-07  
**Commit:** abc123def456  

## Summary
- Total test cases: 120
- Passed: 118 ✓
- Failed: 2 ❌
- Warned: 3 ⚠️

## Failures
- cone_Bi10_N16: Power B1 exceeds threshold by 2%
- pyramid_Bi10_N32: LS:x² profile RMS at 1.05e−2

## Performance
- Total runtime: 2.34 s
- Average per case: 19.5 ms
- Fastest: B1 (0.5 ms)
- Slowest: Spectral (2.1 ms)

[detailed tables and charts follow]
```

### 6.2 Acceptance Sign-off

Before production deployment:
- [ ] All tests pass at N≥32
- [ ] No regressions vs previous version
- [ ] Performance acceptable (<5ms per Tavg call)
- [ ] Code review by 2+ developers
- [ ] Sign-off by technical lead

---

## 7. Continuous Integration Checklist

- [x] Test suite automated on every commit
- [x] Coverage tracking (target: >95%)
- [x] Performance benchmarking (target: <5ms)
- [x] Regression detection (fail if Tavg error increases >10%)
- [x] Report generation (auto-upload to artifacts)
- [x] Notification on failure (email/Slack)
- [ ] Visual diff for profile changes (optional)
- [ ] Historical tracking (error trends over time)

---

**Validation Spec Complete**  
**Version:** 1.7  
**Status:** Ready for implementation

