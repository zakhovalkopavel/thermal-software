# THERMAL DISTRIBUTION SPEC — Overview & Quick Start

**Version:** 2.0  
**Language:** en-US  
**Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968.

**Purpose:** Complete specification for a Node.js/TypeScript module that computes **transient temperature distributions** inside solid bodies under convective or prescribed-surface boundary conditions. All algorithms are derived directly from Luikov's exact Fourier series solutions — no heuristic approximations or power-law fits.

---
## 0.1 Scope
The module provides:
1. **Local temperature** at any normalized coordinate and time: `T(x, τ)`
2. **Temperature profile** along one or more spatial directions: `T[]`
3. **Volume-average temperature**: `T̄(τ)`
4. **Dimensional criteria**: Biot number `Bi`, Fourier number `Fo`

**Supported body classes:**

| Class | Solved by | Spec |
|---|---|---|
| Infinite Plate | BC I or BC III, exact series | [HC-02](../heat-conduction/HEAT_CONDUCTION_02_BC1_PLATE.md) / [HC-08](../heat-conduction/HEAT_CONDUCTION_08_BC3_PLATE.md) |
| Infinite Cylinder | BC I or BC III, exact series | [HC-03](../heat-conduction/HEAT_CONDUCTION_03_BC1_CYLINDER.md) / [HC-09](../heat-conduction/HEAT_CONDUCTION_09_BC3_CYLINDER.md) |
| Solid Sphere | BC I or BC III, exact series | [HC-04](../heat-conduction/HEAT_CONDUCTION_04_BC1_SPHERE.md) / [HC-10](../heat-conduction/HEAT_CONDUCTION_10_BC3_SPHERE.md) |
| Hollow Cylinder | BC I or BC III, Bessel-Neumann expansion | [HC-05](../heat-conduction/HEAT_CONDUCTION_05_BC1_HOLLOW_CYLINDER.md) / [HC-11](../heat-conduction/HEAT_CONDUCTION_11_BC3_HOLLOW_CYLINDER.md) |
| Finite Parallelepiped | Product rule ×3 plates | [HC-06](../heat-conduction/HEAT_CONDUCTION_06_BC1_PARALLELEPIPED.md) / [HC-12](../heat-conduction/HEAT_CONDUCTION_12_BC3_PARALLELEPIPED.md) |
| Finite Cylinder | Product rule: cylinder × plate | [HC-07](../heat-conduction/HEAT_CONDUCTION_07_BC1_FINITE_CYLINDER.md) / [HC-13](../heat-conduction/HEAT_CONDUCTION_13_BC3_FINITE_CYLINDER.md) |
| Complex / variable-section | β-scaling or Luikov universal | [HC-16](../heat-conduction/HEAT_CONDUCTION_16_COMPLEX_GEOMETRIES.md) |

Algorithm math specifications live in `docs/algorithms/heat-conduction/`. This directory contains the **integration, API, calibration, and validation specs** for the TypeScript module.

---
## 0.2 Boundary Condition Selection

The boundary condition type is the primary routing decision:

| Scenario | BC Type | Criterion |
|---|---|---|
| Water / salt-solution quenching (intense nucleate boiling) | **BC I** (Dirichlet) | `Bi ≥ 100`; surface instantly reaches `Tc` |
| Furnace heating, air cooling, gas convection | **BC III** (Convective) | `0.1 < Bi < 100` |
| Oil quenching | **BC III** with `α = f(Ts)` | Non-linear coefficient; see [HTC overview](../heat-transfer-coefficient/HTC_00_REGIMES_OVERVIEW.md) |

For a detailed routing flowchart see [HC-15 — BC Selection & Kondratiev](../heat-conduction/HEAT_CONDUCTION_15_BC_SELECTION_KONDRATIEV.md).

---
## 0.3 Dimensional Criteria

**Fourier number:** `Fo = ā·τ / R²`

**Biot number (BC III only):** `Bi = α_eff·R / λ̄`

Where `R` is the geometric characteristic half-dimension. The mean properties `ā` and `λ̄` are evaluated over `[Ts, Tc]` — see [HC-01 — Material Properties](../heat-conduction/HEAT_CONDUCTION_01_MATERIAL_PROPERTIES.md).

---
## 0.4 Dimensionless Temperature

**BC I:** `Θ = (T − Ts) / (T₀ − Ts)`

**BC III (excess scale):** `ϑ = Tc − T(x, τ)`

All outputs are converted back to absolute temperature: `T(x, τ) = Tc − ϑ(x, τ)`

---
## 0.5 Initial Profile Routing (BC III)

| Flag | Initial condition | Solver path |
|---|---|---|
| `'uniform'` | `T(x, 0) = T₀` | Standard base-case series |
| `'parabolic'` | `T(x, 0) = Tctr − (Tctr − Tsurf)·(x/R)²` | Analytical parabolic modifier `Cm`/`Cn*` — no quadrature |
| `'arbitrary'` | `T(x, 0) = f(x)` | Numerical Fourier coefficients via Simpson's rule |

---
## 0.6 Product Solution Rule (Multi-Dimensional Bodies)

No 2D/3D spatial meshing. Each axis uses its dedicated 1D solver; outputs are multiplied:

- **3D parallelepiped:** `Θ = Θₓ · Θᵧ · Θz`
- **Finite cylinder:** `Θ = Θ_cyl(r) · Θ_plate(z)`

Volume averages are products of 1D mean coefficients `Bn`.

---
## 0.7 Volume Average

Computed from the exact analytical `Bn` series:

`T̄(τ) = Tc − Σ Bn·exp(−μn²·Fo)`

Gauss-Legendre quadrature (N = 16/32/64) is reserved for: hollow cylinder (no closed-form mean) and complex/variable-section geometries only.

---
## 0.8 Non-Linear Time-Stepping (Oil Quenching)

For `α = f(Ts)`, the solver advances in discrete steps `Δτk`. At each step the surface temperature updates `α` for the next interval, and the final spatial profile becomes the initial condition for the next step.
See [HC-14 — Time Stepping](../heat-conduction/HEAT_CONDUCTION_14_TIME_STEPPING.md).

---
## 0.9 File Map

| File | Contents |
|---|---|
| `SPEC_00_Overview.md` *(this file)* | Purpose, BC routing, criteria, file map |
| `SPEC_01_Geometries.md` | Geometry catalog, Rdist rules, variable-section bodies |
| `SPEC_06_API.md` | TypeScript interfaces and function signatures |
| `SPEC_07_Calibration.md` | Calibration methodology, test grids, JSON schema |
| `SPEC_08_Bibliography.md` | References and sources |
| `SPEC_09_Validation.md` | Validation protocols, error thresholds, CI |
| `SPEC_10_Examples.md` | Complete working TypeScript usage examples |
| `SPEC_11_QuickReference.md` | Formula quick-lookup card |
| **Algorithm math** → `../heat-conduction/HEAT_CONDUCTION_*.md` | All Fourier series and eigenvalue equations |
