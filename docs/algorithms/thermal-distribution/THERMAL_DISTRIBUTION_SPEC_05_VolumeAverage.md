# THERMAL DISTRIBUTION SPEC — Volume Average & Quadrature (EN)

## 1. Canonical 1D weights
- **Slab:** T_avg = ∫₀¹ T(ξ) dξ
- **Cylinder:** T_avg = 2 × ∫₀¹ T(x) × x dx
- **Sphere:** T_avg = 3 × ∫₀¹ T(x) × x² dx
- **Energy:** E = ρ × c × V × T_avg

## 2. Variable cross-section bodies (axis integration)
    T_avg = (1/V) × ∫₀ᴴ (∫_Ω(z) T dA) dz ≈ (1/V) × Σⱼ wⱼ × Asect(zⱼ) × T̄_Ω(zⱼ)

Use Gauss-Legendre on z with N = 16/32/64 depending on curvature and Bi.

## 3. Gauss-Legendre quadrature
Map [-1, 1] → [0, 1] by tᵢ = (ξᵢ + 1) / 2, wᵢ = Wᵢ / 2. Use tensor-product rules for 2D/3D integrals. 
Store node/weight tables for N ∈ {8, 16, 32, 64}; allow on-the-fly generation.
