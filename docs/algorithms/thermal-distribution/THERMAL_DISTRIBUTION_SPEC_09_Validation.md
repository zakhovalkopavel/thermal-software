# THERMAL DISTRIBUTION SPEC — Validation & Testing

**Version:** 2.0

---

## 1. Validation Objectives & Acceptance Criteria

### 1.1 Global Acceptance Criteria

All solver-under-test implementations are validated against the **Luikov analytical series** (N=200 terms) as the reference:

| Metric | Threshold | Condition |
|---|---|---|
| `T̄` relative error | ≤ 1 × 10⁻³ | N=100 terms, Bi ∈ {0.1, 1, 10} |
| Profile L2 (normalized) | ≤ 1 × 10⁻² | All geometries, all Fo |
| Eigenvalue residual | ≤ 1 × 10⁻¹² | After Newton-Raphson |
| Series convergence N=50→100 | ≤ 1 × 10⁻⁷ | Relative change in `T̄` |
| BC_I center `T(0, τ=0)` | = `T₀` ± 1 × 10⁻⁶ | Initial condition preservation |
| BC_III surface `T(R, τ→∞)` | → `Tc` ± 1 × 10⁻⁴ | Steady-state convergence |

### 1.2 Method Acceptance Table

| Implementation | Status | Notes |
|---|---|---|
| **BC I — Plate/Cylinder/Sphere** | Reference identity | Fixed eigenvalues, no root-finding |
| **BC III — Plate/Cylinder/Sphere uniform** | Reference + under test | Newton eigenvalues + Fourier series |
| **BC III — Plate/Cylinder/Sphere parabolic** | Under test | Must match uniform when `T0ctr = T0surf` |
| **BC III — Sphere/Cylinder arbitrary profile** | Under test | Numerical Simpson's coefficients |
| **BC III — Hollow Cylinder** | Under test | Bessel-Neumann root-finding |
| **Product rule — Parallelepiped** | Under test | Product must equal direct 3D quadrature |
| **Product rule — Finite Cylinder** | Under test | Product must equal direct 2D quadrature |
| **Complex body (β-scaling, Luikov universal)** | Engineering test | 5–12 % tolerance acceptable |

---

## 2. Testing Protocols by Geometry Group

### 2.1 BC I — Infinite Plate, Cylinder, Sphere

**No root-finding required.** Eigenvalues are:
- Plate: `μn = (2n−1)·π/2`
- Cylinder: roots of `J₀(μ) = 0` — validate against known table `{2.4048, 5.5201, 8.6537, 11.7915, ...}`
- Sphere: `μn = n·π`

**Tests:**
1. `Θ(0, Fo=0) = 1` for all geometries (initial condition)
2. `Θ(1, Fo) = 0` for all time (surface pinned at `Ts`)
3. `Θ(0, Fo→∞) → 0` (thermal equilibrium)
4. `Θ̄(Fo)` monotonically decreasing
5. `|Θ̄_N50 − Θ̄_N200| / Θ̄_N200 < 1×10⁻⁷` at Fo = 0.1

**Runtime target:** < 1 ms per `(Fo, x)` evaluation.

---

### 2.2 BC III — Uniform Initial Profile

**Root-finding validation (all 3 geometries):**

1. For each `Bi ∈ {0.1, 0.5, 1, 5, 10, 50}`:
   - Verify residual `|f(μn)| < 1×10⁻¹²` after Newton-Raphson for n = 1..10
   - Verify roots are strictly increasing: `μ₁ < μ₂ < ... < μN`
   - Verify no root falls within `δ = 0.01` of any singularity branch

2. **Plate eigenvalue equation:** `ctg(μ) = (μ² − Bi²) / (2μ·Bi)` *(Ch. VI, Sec. 3, p. 195)*

3. **Cylinder eigenvalue equation:** `μ·J₁(μ) − Bi·J₀(μ) = 0` *(Ch. VI, Sec. 6, p. 240)*

4. **Sphere eigenvalue equation:** `tan(μ) = μ / (1 − Bi)` *(Ch. VI, Sec. 5, p. 224)*

**Temperature field tests:**
1. `Θ(1, τ) → 0` as `τ → ∞` (surface → medium)
2. At Fo=0: `Θ(x, 0) = 1` for all `x` (uniform initial profile)
3. `T̄(τ)` from `Bn` series matches Gauss-Legendre N=64 to `< 1×10⁻⁵`

---

### 2.3 BC III — Parabolic Initial Profile

**Key test — reduction identity:**
When `T0ctr = T0surf = T0` (uniform), the parabolic solver with modifier `Cm`/`Cn*` must produce **identical** output to the uniform base-case solver.

**Formula of the modifier:**

| Geometry | Modifier |
|---|---|
| Plate | `Cm = ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 1/μm²)` |
| Cylinder | `Cn* = ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 2/μn²)` |
| Sphere | `Cn = ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 3/μn²)` |

**Tests:**
1. Reduction identity passes at `< 1×10⁻⁸` numeric precision
2. With `T0ctr > T0surf` (cold surface, hot core): `T(1, τ)` initially below `T0`, rises toward `Tc`
3. `T̄(0)` = volume average of parabola = `T0surf + (T0ctr − T0surf)·{1/3, 1/2, 3/5}` for plate/cylinder/sphere

---

### 2.4 BC III — Arbitrary Initial Profile (Simpson's Rule Coefficients)

**Test: linear ramp `f(x) = T0_max − (T0_max − T0_min)·x/R`**

Since the integral has a closed form, compare numerical Simpson's coefficients against the analytical result:

| Geometry | Analytical coefficient check |
|---|---|
| Plate | `∫₀ᴿ f₁(x)·cos(μm·x/R) dx` — elementary integral |
| Cylinder | `∫₀ᴿ r·f₁(r)·J₀(μn·r/R) dr` — Bessel integral identity |
| Sphere | `∫₀ᴿ r·f₁(r)·sin(μn·r/R) dr` — trigonometric integral |

**Acceptance:** relative error of `Cn` against closed-form ≤ `1×10⁻⁴` at N=128 Simpson nodes.

---

### 2.5 Hollow Cylinder — BC III

**Root-finding:** coupled Bessel-Neumann equation (Ch. VI, Sec. 7, p. 255, Eq. 6). Verify:
- At least 10 positive roots found in `(0, 200/R₁]`
- `W₀(pn, R₁)` and `W₀(pn, R₂)` satisfy the boundary equations

**Volume average:** Gauss-Legendre N=32; check convergence `|T̄_N32 − T̄_N64| < 1×10⁻⁶`.

---

### 2.6 Product Rule — Parallelepiped & Finite Cylinder

**Architecture test (must pass exactly):**

```
|Θ_product(x,y,z,τ) − Θ_x(τ)·Θ_y(τ)·Θ_z(τ)| < 1e-14
```

This is a pure code-level assertion — not a calibration result — that the product-rule architecture is implemented without deviation.

**Volume-average cross-check:** direct Gauss-Legendre 3D quadrature (N=32) must agree with
the product of three 1D means to `< 1×10⁻⁸`.

---

## 3. Test Suite File Structure

```
backend/test/unit/thermal-distribution/
├── bc1/
│   ├── plate.spec.ts
│   ├── cylinder.spec.ts
│   └── sphere.spec.ts
├── bc3/
│   ├── plate.uniform.spec.ts
│   ├── plate.parabolic.spec.ts
│   ├── plate.arbitrary.spec.ts
│   ├── cylinder.uniform.spec.ts
│   ├── cylinder.parabolic.spec.ts
│   ├── sphere.uniform.spec.ts
│   ├── sphere.parabolic.spec.ts
│   ├── hollow-cylinder.spec.ts
│   ├── parallelepiped.product-rule.spec.ts
│   └── finite-cylinder.product-rule.spec.ts
├── calibration/
│   ├── calibration.spec.ts
│   └── calibration-data/
│       ├── plate/ *.json
│       ├── cylinder/ *.json
│       └── ...
└── helpers/
    ├── luikov-reference.ts    // N=200 series reference
    ├── bessel.ts              // J0, J1 table verification
    └── metrics.ts             // L2, relError
```

---

## 4. CI Integration

```bash
# Full suite
npm test -- thermal-distribution

# By BC type
npm test -- thermal-distribution/bc3

# By geometry
npm test -- --testNamePattern="hollow-cylinder"

# Calibration regression only
npm test -- thermal-distribution/calibration
```

**Pass / Fail thresholds:** all §1.1 criteria, enforced per test. CI blocks merge on any failure.

---

## 5. Performance Benchmarks

| Geometry | Operation | Target |
|---|---|---|
| Plate/Cylinder/Sphere BC I | `T(x, τ)` N=100 terms | < 0.5 ms |
| Plate/Cylinder/Sphere BC III uniform | `T(x, τ)` + root-finding (cached) | < 1 ms |
| BC III parabolic / arbitrary | `T(x, τ)` first call (no cache) | < 5 ms |
| Hollow Cylinder | `T̄` Gauss N=32 | < 3 ms |
| Parallelepiped / Finite Cylinder | Product-rule `3×` or `2×` plate/cyl | < 2 ms |
| Time-stepping loop (oil quench) | 100 steps × BC III | < 200 ms |
