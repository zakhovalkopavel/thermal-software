# THERMAL DISTRIBUTION SPEC — Geometries

**Version:** 2.0

## 1. Characteristic Dimension & Biot Number

- **Profile scaling radius `R`:** the geometric half-dimension used for eigenvalue normalization and Fourier number. Specific rule per geometry below.
- **Biot number:** `Bi = α_eff · R / λ̄` using the same `R` as the profile solver.
- **Complex geometries only:** use `Lc = V/S` as the characteristic dimension for the Luikov universal approximation path.

| Geometry | Profile scaling `R` |
|---|---|
| Slab (thickness `L`) | `L/2` |
| Infinite Cylinder (diameter `D`) | `D/2` |
| Solid Sphere (radius `R₀`) | `R₀` |
| Hollow Cylinder | inner `R₁`, outer `R₂` |
| Parallelepiped | `R₁`, `R₂`, `R₃` per axis |
| Finite Cylinder | `R` radial, `l` axial half-length |
| Complex body | `Req = β·V/A` with `β ∈ {1,2,3}` |

---

## 2. Supported Geometries — 1D Solvers

### 2.1 Infinite Plate (thickness `2R`)
- Coordinate `x ∈ [0, R]` from mid-plane to surface.
- **BC I spec:** [HC-02](../heat-conduction/HEAT_CONDUCTION_02_BC1_PLATE.md)
- **BC III spec:** [HC-08](../heat-conduction/HEAT_CONDUCTION_08_BC3_PLATE.md)

### 2.2 Infinite Cylinder (radius `R`)
- Coordinate `r ∈ [0, R]` from axis to surface.
- **BC I spec:** [HC-03](../heat-conduction/HEAT_CONDUCTION_03_BC1_CYLINDER.md)
- **BC III spec:** [HC-09](../heat-conduction/HEAT_CONDUCTION_09_BC3_CYLINDER.md)

### 2.3 Solid Sphere (radius `R`)
- Coordinate `r ∈ [0, R]` from center to surface.
- **BC I spec:** [HC-04](../heat-conduction/HEAT_CONDUCTION_04_BC1_SPHERE.md)
- **BC III spec:** [HC-10](../heat-conduction/HEAT_CONDUCTION_10_BC3_SPHERE.md)

### 2.4 Hollow Cylinder (inner `R₁`, outer `R₂`)
- Coordinate `r ∈ [R₁, R₂]`.
- Both surfaces convect with the same ambient temperature.
- **BC I spec:** [HC-05](../heat-conduction/HEAT_CONDUCTION_05_BC1_HOLLOW_CYLINDER.md)
- **BC III spec:** [HC-11](../heat-conduction/HEAT_CONDUCTION_11_BC3_HOLLOW_CYLINDER.md)

---

## 3. Supported Geometries — Product-Rule Solvers

### 3.1 Finite Parallelepiped (`2R₁ × 2R₂ × 2R₃`)
- Three independent axes `x, y, z`; Biot numbers `Bi₁`, `Bi₂`, `Bi₃` per face pair.
- Implemented via product of three independent Infinite Plate solvers.
- **BC I spec:** [HC-06](../heat-conduction/HEAT_CONDUCTION_06_BC1_PARALLELEPIPED.md)
- **BC III spec:** [HC-12](../heat-conduction/HEAT_CONDUCTION_12_BC3_PARALLELEPIPED.md)

### 3.2 Finite Cylinder (radius `R`, half-length `l`)
- Axes `{r, z}`; lateral Biot `Bi₁`, end-face Biot `Bi₂`.
- Implemented via Infinite Cylinder (radial) × Infinite Plate (axial).
- **BC I spec:** [HC-07](../heat-conduction/HEAT_CONDUCTION_07_BC1_FINITE_CYLINDER.md)
- **BC III spec:** [HC-13](../heat-conduction/HEAT_CONDUCTION_13_BC3_FINITE_CYLINDER.md)

---

## 4. Complex & Variable-Section Bodies

When the geometry cannot be directly mapped to the classes above, use the engineering approximation path (see [HC-16](../heat-conduction/HEAT_CONDUCTION_16_COMPLEX_GEOMETRIES.md)):

### 4.1 Universal Luikov Approximation (Path A)
Map the body onto the Solid Sphere solver using modified criteria:
- `Fo* = ā·τ / (V/A)²`
- `Bi* = α_eff·(V/A) / λ̄`

### 4.2 β-Scaling (Path B)
Classify via dominant heat-flow dimension:

| β | Flow type | Geometries | Mapped solver |
|---|---|---|---|
| 1 | 1D (slab-like) | Flat prisms, flanges, fan blades | Infinite Plate |
| 2 | 2D (rod-like) | Gears, shafts, long cones | Infinite Cylinder |
| 3 | 3D (isotropic) | Compact blocks, cube-like, bolt heads | Solid Sphere |

Equivalent radius: `Req = β·V/A`

### 4.3 Variable Cross-Section Bodies (Cones, Pyramids, Frustums)

For bodies with smoothly varying cross-sections, apply the product-solution with an axial Gauss-Legendre integration:

**Volume average:**
`T̄ = (1/V) · ∫₀ᴴ A(z) · T̄_Ω(z) dz`  (Gauss-Legendre, N = 16/32/64 on z-axis)

**Local profiles:**
- Cone / frustum cone: `{r, z}` axes; `R(z) = R₁ + (R₂ - R₁)·z/H`
- Pyramid / frustum pyramid: `{x, y, z}` axes; `A(z) = A₁ + (A₀ - A₁)·z/H`

**Axis selection:**

| Geometry | Axes | Transverse sub-profile | Axial sub-profile |
|---|---|---|---|
| Finite cylinder | `{r, z}` | Infinite Cylinder with `R(z)` | Infinite Plate with `l` |
| Cone / frustum | `{r, z}` | Infinite Cylinder with local `R(z)` | Infinite Plate with `H/2` |
| Prism / parallelepiped | `{x, y, z}` | Infinite Plate per axis | Infinite Plate |
| Pyramid / frustum pyramid | `{x, y, z}` | Infinite Plate with local `A(z)/2`, `B(z)/2` | Infinite Plate with `H/2` |

**Effective transverse scale (`perpScale`):**
- `'avg'`: `R⊥ = (1/H)·∫₀ᴴ Rloc(z) dz`
- `'area_weighted'` *(default for variable cross-sections)*: `R⊥ = (∫ Rloc(z)·A(z) dz) / (∫ A(z) dz)`

---

## 5. Axis Classification via Resistance Weights

For automated geometry routing, compute tri-axial resistance weights from the bounding box:
`W_i = (L_i / Ā_i) / Σ(L_j / Ā_j)`

Then classify by resistance weight dominance — see [HC-16 §5](../heat-conduction/HEAT_CONDUCTION_16_COMPLEX_GEOMETRIES.md) for the full classification matrix.
