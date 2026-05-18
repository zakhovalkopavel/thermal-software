# Heat Conduction Solver: Overview, Architecture & Mathematical Catalog

## 1. Objective & Scope

This specification defines a unified, high-performance, and mathematically rigorous backend heat conduction solver module that covers both:

- **Boundary Conditions of the First Kind (BC I):** Analytical solutions for 1D/3D bodies where the surface temperature is instantaneously enforced (applies to water quenching and aqueous salt solutions under stable nucleate boiling regimes, where $Bi \to \infty$).
- **Boundary Conditions of the Third Kind (BC III):** Analytical and numerical solutions for 1D/3D bodies with convective-radiative surface exchange, supporting variable (arbitrary or parabolic) and uniform initial temperature profiles (applies to gas-medium processing, furnace heating, and oil-quenching baths).

The module is **language-agnostic**: all algorithms are expressed as strict pseudo-code ready for direct translation into the production backend. No Python-specific library dependencies or naming conventions are permitted.

---

## 2. Structural & Architectural Constraints

### 2.1. Calculation Integrity & Mathematical Preservation

- **Strict Formula Retention:** No mathematical expressions, steps, or equations may be compressed, skipped, or omitted.
- **No Placeholders:** Every equation, transcendental statement, amplitude modifier ($A_n, B_n, C_n, D_n, E_n$), and variable definition must be written out in full.
- **Complete English Translation:** All variable names, labels, or geometry descriptions originating in other languages must be translated into clear, professional English.

### 2.2. Scale & Transformation Pipeline

To handle arbitrary non-zero ambient temperatures ($T_{\text{c}} \neq 0$), every geometry solver enforces the following three-step loop:

1. **Input Inversion / Shift:** Transform absolute initial profiles $T(\vec{x}, 0) = f(\vec{x})$ into excess temperature profiles $\vartheta(\vec{x}, 0)$ relative to the ambient $T_{\text{c}}$:
   $$f_1(\vec{x}) = T_{\text{c}} - f(\vec{x})$$

2. **Core Solver Execution:** Evaluate all transcendental root-finding and Fourier series summation loops strictly in terms of the excess/dimensionless scale $\vartheta$ or $\theta$.

3. **Output Reconstruction:** Convert excess fields back to absolute temperature before exposing to the API layer:
   $$T(\vec{x}, \tau) = T_{\text{c}} - \vartheta(\vec{x}, \tau)$$
   $$\bar{T}(\tau) = T_{\text{c}} - \bar{\vartheta}(\tau)$$

### 2.3. Strict Code Reuse — Product Rule Integration

For multi-dimensional geometries (Finite Parallelepiped and Finite Cylinder), **no dedicated 2D/3D spatial meshing or multi-nested numerical solver loops** shall be implemented. Instead:

- The solver invokes the standalone **1D Infinite Plate** and **1D Infinite Cylinder** components.
- The multi-dimensional relative temperature field is computed as a direct scalar cross-product of the 1D outputs:
  $$\Theta_{\text{multi}}(\vec{x}, \tau) = \prod_{i} \Theta_{\text{1D,component}_i}(\vec{x}_i, \tau)$$

### 2.4. Computational Performance Strategy — Initial Profile Routing

When evaluating the Infinite Plate, Infinite Cylinder, and Solid Sphere under BC III, the system dynamically checks the initial profile type:

- **Uniform Profile ($f = T_0 = \text{const}$):** Route directly to the base case closed-form series.
- **Parabolic Profile:** Route to the exact analytical sub-case using the geometric parabolic modifier coefficients ($C_m$ for the plate, $C_n^*$ for the cylinder, $C_n$ for the sphere). Bypass numerical integration entirely.
- **Arbitrary Profile $f(\vec{x})$:** Route to the generalized numerical integration routine (stabilized discrete Simpson's rule over $N$ radial/axial nodes) to determine the customized Fourier coefficients ($D_m$, $C_n$, or $E_n$).

---

## 3. Mathematical Citation Catalog

Every implemented formula, root-finding statement, or volumetric mean derivation maps to its original academic source. Citations use the format: `(Ch. [X], Sec. [Y], p. [Z], Eq. [W])`.

### 3.1. Infinite Plate (Thickness = $2R$)
| Item | Citation |
|---|---|
| Base Uniform Case (BC III) | `(Ch. VI, Sec. 3, p. 195, Eq. 6.3.19)` |
| Transcendental Root Equation | `(Ch. VI, Sec. 3, p. 195, Eq. 6.3.17)` |
| Amplitude Coefficient $A_n$ | `(Ch. VI, Sec. 3, p. 196, Eq. 6.3.20)` |
| Volumetric Mean Coefficient $B_n$ | `(Ch. VI, Sec. 3, p. 211, Eq. 6.3.45)` |
| Arbitrary General Profile Expansion | `(Ch. VI, Sec. 3, p. 194, Eq. 15a)` |
| Parabolic Sub-Case Profile | `(Ch. VI, Sec. 3, p. 212, Eq. 6.3.48)` |

### 3.2. Solid Sphere (Radius = $R$)
| Item | Citation |
|---|---|
| Differential Governing Energy Equation | `(Ch. VI, Sec. 5, p. 223, Eq. 1)` |
| Initial & Surface Boundaries | `(Ch. VI, Sec. 5, p. 223, Eqs. 2-4)` |
| Universal Fourier Expansion | `(Ch. VI, Sec. 5, p. 225, Eq. 19)` |
| Orthogonality Core | `(Ch. VI, Sec. 5, p. 224, Eq. 16)` |
| Base Local Profile Array | `(Ch. VI, Sec. 5, p. 228, Eq. 6.5.27)` |
| Transcendental Sphere Root Equation | `(Ch. VI, Sec. 5, p. 224, Eq. 6.5.12)` |
| Amplitude Coefficient $A_n$ | `(Ch. VI, Sec. 5, p. 228, Eq. 6.5.29)` |
| Volumetric Mean $B_n$ | `(Ch. VI, Sec. 5, p. 237, Eq. 6.5.49)` |

### 3.3. Infinite Cylinder (Radius = $R$)
| Item | Citation |
|---|---|
| Differential Matrix Energy Statement | `(Ch. VI, Sec. 6, p. 239, Eq. 1)` |
| Transcendental Bessel Root Equation | `(Ch. VI, Sec. 6, p. 240, Eq. 8)` |
| Universal Fourier-Bessel Expansion | `(Ch. VI, Sec. 6, p. 241, Eq. 10)` |
| General Coefficient Orthogonality | `(Ch. VI, Sec. 6, p. 242, Eq. 15)` |
| Optimized Amplitude Constant $A_n$ | `(Ch. VI, Sec. 6, p. 245, Eq. 27)` |

### 3.4. Infinite Hollow Cylinder ($R_1$ to $R_2$)
| Item | Citation |
|---|---|
| Hollow Governing Energy Formulation | `(Ch. VI, Sec. 7, p. 254, Eq. 1)` |
| Bessel/Neumann Transcendental Root Driver | `(Ch. VI, Sec. 7, p. 255, Eq. 6)` |
| Spatial Basis Linear Combination $W_0$ | `(Ch. VI, Sec. 7, p. 255, Eq. 7)` |
| Hollow Cylinder Numeric Expansion $E_n$ | `(Ch. VI, Sec. 7, p. 255, Eq. 10)` |

### 3.5. Finite Parallelepiped ($2R_1 \times 2R_2 \times 2R_3$)
| Item | Citation |
|---|---|
| 3D Partial Differential Block Statement | `(Ch. VI, Sec. 9, p. 263, Eq. 1)` |
| 3D Spatial Boundary System | `(Ch. VI, Sec. 9, p. 263, Eqs. 3-5)` |
| 3D Product Rule Definition | `(Ch. VI, Sec. 9, p. 264, Eq. 6)` |
| Triple Series Local Profile Array | `(Ch. VI, Sec. 9, p. 264, Eq. 7)` |
| Anisotropic Amplitude Multi-Formulas | `(Ch. VI, Sec. 9, p. 264, Eq. 8)` |

### 3.6. Finite Cylinder (Radius = $R$, Length = $2l$)
| Item | Citation |
|---|---|
| 2D Axisymmetric Differential Statement | `(Ch. VI, Sec. 8, p. 258, Eq. 1)` |
| Lateral & End-Face Flows | `(Ch. VI, Sec. 8, p. 258, Eqs. 3, 5)` |
| Double Series Local Profile Output | `(Ch. VI, Sec. 8, p. 259, Eq. 17)` |
| Double Series Volumetric Mean Output | `(Ch. VI, Sec. 8, p. 263, Eq. 18)` |

---

## 4. Document Index

### Shared Foundation
| File | Contents |
|---|---|
| [HEAT_CONDUCTION_01_MATERIAL_PROPERTIES.md](HEAT_CONDUCTION_01_MATERIAL_PROPERTIES.md) | AISI 304 thermophysical properties, mean property evaluation, effective heat transfer coefficient, input parameters |

### BC I — Boundary Conditions of the First Kind ($Bi \to \infty$)
| File | Geometry |
|---|---|
| [HEAT_CONDUCTION_02_BC1_PLATE.md](HEAT_CONDUCTION_02_BC1_PLATE.md) | Infinite Plate (thickness $2R$) |
| [HEAT_CONDUCTION_03_BC1_CYLINDER.md](HEAT_CONDUCTION_03_BC1_CYLINDER.md) | Infinite Cylinder (radius $R$) |
| [HEAT_CONDUCTION_04_BC1_SPHERE.md](HEAT_CONDUCTION_04_BC1_SPHERE.md) | Solid Sphere (radius $R$) |
| [HEAT_CONDUCTION_05_BC1_HOLLOW_CYLINDER.md](HEAT_CONDUCTION_05_BC1_HOLLOW_CYLINDER.md) | Unbounded Hollow Cylinder ($R_1 \le r \le R_2$) |
| [HEAT_CONDUCTION_06_BC1_PARALLELEPIPED.md](HEAT_CONDUCTION_06_BC1_PARALLELEPIPED.md) | Rectangular Parallelepiped ($2R_1 \times 2R_2 \times 2R_3$) — product rule |
| [HEAT_CONDUCTION_07_BC1_FINITE_CYLINDER.md](HEAT_CONDUCTION_07_BC1_FINITE_CYLINDER.md) | Finite Cylinder (radius $R$, length $2l$) — product rule |

### BC III — Boundary Conditions of the Third Kind ($0.1 < Bi < 100$)
| File | Geometry |
|---|---|
| [HEAT_CONDUCTION_08_BC3_PLATE.md](HEAT_CONDUCTION_08_BC3_PLATE.md) | Infinite Plate — uniform, arbitrary, and parabolic initial profiles |
| [HEAT_CONDUCTION_09_BC3_CYLINDER.md](HEAT_CONDUCTION_09_BC3_CYLINDER.md) | Infinite Cylinder — uniform, arbitrary, and parabolic initial profiles |
| [HEAT_CONDUCTION_10_BC3_SPHERE.md](HEAT_CONDUCTION_10_BC3_SPHERE.md) | Solid Sphere — uniform, arbitrary, and parabolic initial profiles |
| [HEAT_CONDUCTION_11_BC3_HOLLOW_CYLINDER.md](HEAT_CONDUCTION_11_BC3_HOLLOW_CYLINDER.md) | Infinite Hollow Cylinder — general Bessel-Neumann eigenvalue expansion |
| [HEAT_CONDUCTION_12_BC3_PARALLELEPIPED.md](HEAT_CONDUCTION_12_BC3_PARALLELEPIPED.md) | Finite Parallelepiped — product rule, triple series |
| [HEAT_CONDUCTION_13_BC3_FINITE_CYLINDER.md](HEAT_CONDUCTION_13_BC3_FINITE_CYLINDER.md) | Finite Cylinder — product rule, double series |

### Solver Framework
| File | Contents |
|---|---|
| [HEAT_CONDUCTION_14_TIME_STEPPING.md](HEAT_CONDUCTION_14_TIME_STEPPING.md) | Nonlinear time-stepping framework, iterative convergence loop, sequential interval method |
| [HEAT_CONDUCTION_15_BC_SELECTION_KONDRATIEV.md](HEAT_CONDUCTION_15_BC_SELECTION_KONDRATIEV.md) | Boundary condition selection criteria, Kondratiev Regular Thermal Regime, inverse IHCP solver |
| [HEAT_CONDUCTION_16_COMPLEX_GEOMETRIES.md](HEAT_CONDUCTION_16_COMPLEX_GEOMETRIES.md) | Engineering approximations for complex shapes, automated topology classification, 3D parallelepiped mapping |

---

## 5. Primary Bibliography

- **Luikov, A. V.** *Analytical Heat Diffusion Theory.* New York: Academic Press, 1968. — 685 p.
  *(Original Russian: Лыков А. В. Теория теплопроводности. — М.: Высшая школа, 1967. — 600 с.)*

