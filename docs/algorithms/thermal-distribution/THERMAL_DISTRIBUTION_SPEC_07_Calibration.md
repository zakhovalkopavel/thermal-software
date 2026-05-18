# THERMAL DISTRIBUTION SPEC — Calibration

**Version:** 2.0

---

## 1. Objectives & Acceptance Criteria

### 1.1 Global Acceptance Criteria

All solver implementations must satisfy these thresholds compared to the **analytical reference values** derived directly from Luikov's series:

| Metric | Threshold | Condition |
|---|---|---|
| Volume-average temperature `T̄` (relative) | ≤ 1 × 10⁻³ | N ≥ 50 series terms, Bi ∈ {0.1, 1.0, 10.0} |
| Local temperature profile L2 (normalized) | ≤ 1 × 10⁻² | All 1D and product-rule geometries |
| Series convergence: `|ΔT̄ / T̄|` between N=50 and N=100 | ≤ 1 × 10⁻⁷ | Confirms series has converged |
| Eigenvalue accuracy: `|μn·cot(μn) − (μn² − Bi²)/(2Bi)|` | ≤ 1 × 10⁻¹² | After Newton-Raphson |

**Reference method:** Luikov analytical Fourier series with N = 200 terms.
**Implementation under test:** same series with N = 50 or N = 100.

---

## 2. Parametric Test Grids by Geometry

### 2.1 Infinite Plate — BC I
*(HC-02: Ch. IV, Sec. 3)*

**Eigenvalues:** `μn = (2n − 1)·π/2` — no root-finding needed.

**Test grid:** Fo ∈ {0.05, 0.1, 0.3, 0.5, 1.0, 2.0}

**Verification points:** `x/R ∈ {0.0, 0.25, 0.50, 0.75, 1.0}`

**Expected:** `Θ(0, Fo) → 1` at `Fo=0`; `Θ → 0` as `Fo → ∞`. Mean `Θ̄` from `B_n = 8/[(2n−1)²π²]`.

---

### 2.2 Infinite Plate — BC III
*(HC-08: Ch. VI, Sec. 3)*

**Biot grid:** {0.1, 0.5, 1.0, 5.0, 10.0, 50.0}

**Fo grid:** {0.05, 0.1, 0.3, 0.5, 1.0, 2.0}

**Eigenvalue equation:** `ctg(μ) = (μ² − Bi²) / (2μ·Bi)`

**Test cases (naming convention):** `plate_BC3_Bi01_Fo05`, `plate_BC3_Bi10_Fo10`, …

**Sub-tests per case:**
1. Uniform initial profile: base-case `An`, `Bn`
2. Parabolic initial profile: analytical modifier `Cm`; verify `Cm·Am·cos(0)` = base at `T0ctr=T0surf`
3. Arbitrary initial profile (linear ramp): numerical `Dm` vs closed-form integral

---

### 2.3 Infinite Cylinder — BC I & BC III
*(HC-03 / HC-09)*

**BC I eigenvalues:** roots of `J₀(μn) = 0` (2.4048, 5.5201, …)

**BC III eigenvalue equation:** `μ·J₁(μ) − Bi·J₀(μ) = 0`

**Test grid:** same as 2.2 above.

**Bessel function verification:** check `J₀` and `J₁` implementations against tabulated values at μ ∈ {2.4048, 5.5201, 8.6537}.

---

### 2.4 Solid Sphere — BC I & BC III
*(HC-04 / HC-10)*

**BC I eigenvalues:** `μn = n·π`

**BC III eigenvalue equation:** `tan(μ) = μ / (1 − Bi)`

**Center limit check:** verify `lim_{x→0} sin(μx)/(μx) = 1` numerically for `x = 1e-10`.

**Test grid:** same as 2.2.

---

### 2.5 Hollow Cylinder — BC III
*(HC-11: Ch. VI, Sec. 7)*

**Test grid:** wall-ratio `η = R₁/R₂ ∈ {0.2, 0.4, 0.6, 0.8}`, Bi₁ ∈ {1, 5, 10}, Bi₂ ∈ {1, 5, 10}

**Eigenvalue equation:** coupled Bessel-Neumann transcendental (Ch. VI, Sec. 7, p. 255, Eq. 6)

**Volume average:** Gauss-Legendre N=32; verify convergence at N=64 (< 10⁻⁸ change).

**Test cases:** `hcyl_eta02_Bi1_1_Fo05`, …

---

### 2.6 Finite Parallelepiped — BC I & BC III — Product Rule
*(HC-06 / HC-12)*

**Architecture test:** assert `Θ_3D = Θ_x · Θ_y · Θ_z` where each factor is computed independently by the plate solver.

**Test grid:** aspect ratios `R₂/R₁ ∈ {0.5, 1, 2}`, `R₃/R₁ ∈ {0.5, 1, 2}`, Bi ∈ {0.1, 1, 10}

**Test cases:** `parall_BC3_R111_Bi1_Fo1`, `parall_BC3_R112_Bi10_Fo05`, …

---

### 2.7 Finite Cylinder — BC I & BC III — Product Rule
*(HC-07 / HC-13)*

**Architecture test:** assert `Θ_finite = Θ_cyl · Θ_plate`

**Test grid:** `H/(2R) ∈ {0.5, 1.0, 2.0}`, Bi₁ (lateral) ∈ {1, 5, 10}, Bi₂ (end-face) ∈ {1, 5, 10}

---

## 3. Test Case Data Schema

```typescript
interface CalibTestCase {
  id: string;                    // e.g. "plate_BC3_Bi10_Fo05_uniform"
  geometry: string;              // 'plate' | 'cylinder' | 'sphere' | ...
  bcType: 'BC_I' | 'BC_III';
  initialProfile: 'uniform' | 'parabolic' | 'arbitrary';
  params: {
    R: number;                   // characteristic half-dimension (m)
    T0: number; Tc: number;      // temperatures (°C)
    alpha?: number; lambda: number; thermalDiffusivity: number;
    tau: number;                 // time (s)
    Bi?: number; Fo?: number;    // computed criteria
    R1?: number; R2?: number;    // hollow cylinder
    biPerAxis?: number[];        // [Bi1, Bi2, Bi3] for parallelepiped
  };
  reference: {
    method: 'luikov_series_N200';
    seriesTerms: 200;
    Taverage: number;            // T̄(τ) in °C
    profile: { x: number[]; T: number[] }; // x ∈ [0,1], T in °C
  };
  underTest: {
    seriesTerms: 50 | 100;
    Taverage: number;
    profile: { x: number[]; T: number[] };
  };
  errors: {
    relTaverage: number;         // |T̄_test − T̄_ref| / |T̄_ref|
    L2Profile: number;           // √(∫[S_test − S_ref]² w(x) dx)
  };
  meta: { computed_at: string; runtime_ms: number };
}
```

---

## 4. Calibration Workflow

1. **Generate reference data:** run Luikov series with N=200 terms for each test case. Store as JSON in `calibration-data/`.
2. **Run implementation:** execute the solver with N=50 and N=100.
3. **Compare & compute errors:** relative `T̄` error and L² profile error.
4. **Check thresholds:** against criteria in §1.1.
5. **Check eigenvalue accuracy:** verify Newton-Raphson residuals.
6. **Regression guard:** CI fails if any error worsens vs the previous version (10% margin).

---

## 5. CI Commands

```bash
# Generate reference calibration data (run once per algorithm change)
npm run calibrate:generate

# Run full calibration suite against stored references
npm test -- thermal-distribution.calibration.spec.ts

# Run for a specific geometry
npm test -- --testNamePattern="plate_BC3"

# Report
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
**Version:** 2.0  
**Status:** Production-ready with examples
