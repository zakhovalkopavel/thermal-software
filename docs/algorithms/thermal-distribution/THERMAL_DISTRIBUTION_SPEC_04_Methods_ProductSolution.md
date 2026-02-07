# THERMAL DISTRIBUTION SPEC — Product-Solution Method (EN)

## 1. Definition
    T(x) = Ts + (Tc - Ts) × ∏ᵢ Sᵢ(xᵢ)

Each axis uses a normalized 1D sub-profile (spectral or power-law). This is the preferred strategy for bodies with separable coordinates (finite cylinders, prisms, cones/frustums, pyramids).

## 2. Axis selection & normalization
- Use slab sub-profiles along axial thicknesses; use cylindrical (Bessel) or slab sub-profiles across transverse directions depending on geometry.
- Normalize per-axis coordinates to [0, 1] using convenient Rdist per axis.

## 3. Effective transverse scale (`perpScale`)
- `'avg'`: R⊥,avg = (1/H) × ∫₀ᴴ Rloc(z) dz
- `'area_weighted'` (default for variable cross-sections):
    R⊥,A = (∫₀ᴴ Rloc(z) × Asect(z) dz) / (∫₀ᴴ Asect(z) dz)

## 4. Biot invariance
Global Bi via Lc = V/S never changes; "per-axis" Bi values are internal constructs that must not override the global policy.

## 5. Notes for cones/frustums/pyramids
- Cones & frustums: axes {r, z}; R(z) linear in z.
- Pyramids & truncated pyramids: axes {x, y, z}; A(z), B(z) linear in z; cross-section Asect(z) = A(z) × B(z).

