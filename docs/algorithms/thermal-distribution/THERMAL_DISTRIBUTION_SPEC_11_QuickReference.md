# THERMAL DISTRIBUTION SPEC — Quick Reference

**Version:** 2.0  
**Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968.

---

## Core Definitions

| Symbol | Formula | Notes |
|---|---|---|
| `Fo` | `ā·τ / R²` | Fourier number; `R` = half-dimension |
| `Bi` | `α·R / λ̄` | Biot number; same `R` as `Fo` |
| `ā` | mean thermal diffusivity | averaged over `[T0, Tc]` |
| `λ̄` | mean thermal conductivity | averaged over `[T0, Tc]` |
| `ϑ` | `Tc − T(x, τ)` | excess temperature (BC III scale) |
| `Θ` | `(T − Ts) / (T₀ − Ts)` | dimensionless temperature (BC I) |

---

## Boundary Condition Selection

| Bi | BC Type | Physical scenario |
|---|---|---|
| ≥ 100 | **BC I** (Dirichlet) | Water / salt quench; `Ts = Tc` instantly |
| 0.1 – 100 | **BC III** (Convective) | Furnace, air, oil; `−λ·∂T/∂n = α·(T − Tc)` |

---

## BC I — Eigenvalues (Fixed, No Root-Finding)

| Geometry | `μn` | Spec |
|---|---|---|
| Plate | `(2n−1)·π/2` | HC-02 |
| Cylinder | roots of `J₀(μ) = 0` (2.4048, 5.5201, …) | HC-03 |
| Sphere | `n·π` | HC-04 |

**BC I temperature field:**

- Plate: `Θ(x,τ) = Σ Aₙ·cos(μₙ·x/R)·exp(−μₙ²·Fo)`   `Aₙ = (−1)^(n+1)·2/μₙ`
- Cylinder: `Θ(r,τ) = Σ Aₙ·J₀(μₙ·r/R)·exp(−μₙ²·Fo)`   `Aₙ = 2/(μₙ·J₁(μₙ))`
- Sphere: `Θ(r,τ) = Σ Aₙ·sin(μₙ·r/R)/(μₙ·r/R)·exp(−μₙ²·Fo)`   `Aₙ = 2·(−1)^(n+1)`

**BC I volume-average coefficients `Bₙ`:**

| Geometry | `Bₙ` |
|---|---|
| Plate | `8 / [(2n−1)²·π²]` |
| Cylinder | `4 / μₙ²` |
| Sphere | `6 / (n²·π²)` |

`T̄(τ) = Ts + (T₀ − Ts)·Σ Bₙ·exp(−μₙ²·Fo)`

---

## BC III — Eigenvalue Equations

| Geometry | Transcendental equation | Spec |
|---|---|---|
| Plate | `ctg(μ) = (μ² − Bi²) / (2μ·Bi)` | HC-08 Ch. VI Sec. 3 p. 195 |
| Cylinder | `μ·J₁(μ) − Bi·J₀(μ) = 0` | HC-09 Ch. VI Sec. 6 p. 240 |
| Sphere | `tan(μ) = μ / (1 − Bi)` | HC-10 Ch. VI Sec. 5 p. 224 |
| Hollow Cylinder | Bessel-Neumann coupled (see HC-11) | HC-11 Ch. VI Sec. 7 p. 255 |

**Newton-Raphson:** 1–3 iterations to double precision. Re-solve when `|ΔBi/Bi| > 0.01`.

---

## BC III Uniform — Amplitude & Mean Coefficients

**Plate** `(Ch. VI, Sec. 3)`:
- `Aₙ = 2·sin(μₙ) / (μₙ + sin(μₙ)·cos(μₙ))`
- `Bₙ = 2·Bi² / [μₙ²·(Bi² + Bi + μₙ²)]`

**Cylinder** `(Ch. VI, Sec. 6)`:
- `Aₙ = 2·Bi / [J₀(μₙ)·(μₙ² + Bi²)]`
- `Bₙ = 4·Bi² / [μₙ²·(μₙ² + Bi²)]`

**Sphere** `(Ch. VI, Sec. 5)`:
- `Aₙ = (−1)^(n+1)·2·Bi·√(μₙ² + (Bi−1)²) / (μₙ² + Bi² − Bi)`
- `Bₙ = 6·Bi² / [μₙ²·(μₙ² + Bi² − Bi)]`

---

## BC III Parabolic Initial Profile — Shape Modifiers

Applied as `Cn·Aₙ` in place of `Aₙ` (do NOT run numerical integration):

| Geometry | Modifier `Cm` / `Cn*` / `Cn` |
|---|---|
| Plate | `ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 1/μm²)` |
| Cylinder | `ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 2/μn²)` |
| Sphere | `ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 3/μn²)` |

Where `ϑ_ctr = Tc − T0ctr`, `ϑ_surf = Tc − T0surf`.

**Geometric progression of the denominator factor:** `1/μ²` → `2/μ²` → `3/μ²` for plate → cylinder → sphere.

**Unit test:** setting `T0ctr = T0surf = T0` must reproduce the exact uniform base-case output.

---

## Product Solution Rule (Multi-Dimensional)

**Finite Parallelepiped** `(Θ = Θₓ · Θᵧ · Θz)`:
- Invoke Plate solver 3 times with `(R₁,Bi₁)`, `(R₂,Bi₂)`, `(R₃,Bi₃)`
- `T̄ = Tc − (Tc − T₀)·T̄ₓ·T̄ᵧ·T̄z`

**Finite Cylinder** `(Θ = Θ_cyl · Θ_plate)`:
- Invoke Cylinder solver with `(R, Bi_lateral)` and Plate solver with `(l, Bi_endface)`

**No 2D/3D spatial meshing permitted.**

---

## Volume Average — Method Selection

| Geometry | Method |
|---|---|
| Plate, Cylinder, Sphere (BC I or BC III) | Exact `Bₙ` series |
| Hollow Cylinder | Gauss-Legendre N ≥ 32 (mandatory) |
| Parallelepiped, Finite Cylinder | Product of 1D `Bₙ` series |
| Complex / variable-section | Gauss-Legendre N ≥ 16/32 on z-axis |

---

## Complex Body Routing

```
Shape → resistance weight analysis
       ↓
   dominant axis? → β = 1 (slab) | 2 (cylinder) | 3 (sphere)
       ↓
   Req = β·V/A   →  run 1D solver
```

See `SPEC_01_Geometries.md §4` and HC-16 for full matrix.

---

## API Quick Reference

```typescript
// Main entry points
temperatureAtDepth(relDepth: number, opts: ProfileOptions): number
temperatureProfile(depths: number[], opts: ProfileOptions): number[]
averageTemperature(opts: ProfileOptions): number
computeCriteria(opts: ProfileOptions): { Bi, Fo, Rdist, Rbi }
runTimeSteppingLoop(opts: ProfileOptions): Array<{tau, Tsurface, Tcenter, Taverage}>

// Key ProfileOptions fields
bcType: 'BC_I' | 'BC_III'
T0 / Tc / tau / alpha / lambda / thermalDiffusivity
shape: { geometry, radius, halfThickness, halfX/Y/Z, innerRadius, outerRadius, V, A }
initialProfile: 'uniform' | 'parabolic' | 'arbitrary'
T0Ctr / T0Surf              // for parabolic
arbitraryProfileFn(x): number // for arbitrary
biCylinder: [Bi_lat, Bi_end] // finite cylinder
biPerAxis: [Bi1, Bi2, Bi3]   // parallelepiped
seriesTerms: 100             // Fourier terms
alphaCurve(Ts): number       // for oil quench time-stepping
```

---

## Acceptance Thresholds

| Metric | Threshold |
|---|---|
| `T̄` relative error (N=100 vs N=200) | ≤ 1 × 10⁻³ |
| Profile L2 error | ≤ 1 × 10⁻² |
| Eigenvalue Newton residual | ≤ 1 × 10⁻¹² |
| Parabolic reduction identity | ≤ 1 × 10⁻⁸ |
| Product-rule identity | ≤ 1 × 10⁻¹⁴ |

---

## Common Mistakes to Avoid

1. **Wrong `R` for `Bi`:** always use geometric half-dimension, not `V/S` (the latter only for complex-body routing).
2. **Numerical integration for parabolic profiles:** bypass it — use the exact analytical modifier `Cm`/`Cn*`.
3. **Root re-use across Bi steps:** re-solve eigenvalues when `|ΔBi/Bi| > 0.01`.
4. **3D meshing for parallelepiped/finite cylinder:** banned — use product rule only.
5. **Gauss-Legendre for simple geometries:** unnecessary — use exact `Bₙ` series.
6. **Center singularity (sphere):** `sin(μr/R)/(μr/R)` at `r=0` → limit = 1.

