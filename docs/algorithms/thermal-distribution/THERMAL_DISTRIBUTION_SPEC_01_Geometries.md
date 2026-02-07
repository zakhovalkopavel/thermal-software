# THERMAL DISTRIBUTION SPEC — Geometries (EN)

## 1. Baselines and scaling
- **Characteristic length**: Lc = V/S for Biot, always. Profile scaling **Rdist** chosen for convenience; may differ from Lc.
- **Slab (thickness L):** Rdist = L/2.
- **Infinite cylinder (D):** Rdist = D/2.
- **Sphere (R):** Rdist = R.
- **Prisms / thin bodies:** Rdist = Lmin/2 if a unique thickness direction exists; otherwise use V/S.
- **Ring/annulus:** radial flow → Rdist = t/2; axial cooling → Rdist = V/S per unit length.
- **Thin torus:** Rdist ≈ r/2 (minor radius).

## 2. Cones & frustums
**Cone** (height H, base radius R₀): product-solution on {r, z}. Use slab along z (H/2); radial sub-profile uses 
local radius R(z) = R₀ × (1 - z/H). Volume average uses cross-section A(z) = π × R(z)².

**Frustum** (H, top R₁, bottom R₂): as cone but R(z) = R₁ + (R₂ - R₁) × z/H. Use 'perpScale' = 'area_weighted' 
by default when deriving effective transverse scales.

## 3. Pyramids & truncated pyramids
**Pyramid** (rectangular base A₀ × B₀, height H): product-solution on {x, y, z}. Slab along z (H/2). Local 
half-sizes A(z)/2, B(z)/2 with A(z) = A₀ × (1 - z/H), B(z) = B₀ × (1 - z/H). Cross-section: Asect(z) = A(z) × B(z).

**Frustum pyramid**: A(z) = A₁ + (A₀ - A₁) × z/H, B(z) = B₁ + (B₀ - B₁) × z/H. Same rules for separation and averaging.

## 4. Axis selection for product-solution
- Slab/prism: {x, y, z}
- Finite cylinder: {r, z}
- Ring/annulus: {r} (and z if axial cooling present)
- Cone/frustum: {r, z}
- Pyramid/frustum pyramid: {x, y, z}

## 5. Biot invariance
Global Biot is always computed from Lc = V/S regardless of Rdist. Effective per-axis Bi (e.g., Biz, Bi⊥) may be 
used **internally** in product-solution, but this never overrides the global Biot policy.
