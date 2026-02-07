# THERMAL DISTRIBUTION SPEC — Method A: Spectral (EN)

## 1. Spherical canonical form
Eigenvalues λₙ satisfy:
    λ × cot(λ) = 1 - Bi

Basis (dimensionless radius): φₙ(x) = sin(λₙ × x) / x with φₙ(0) = λₙ.
Normalized 3-mode profile:
    T(x) = Ts + (Tc - Ts) × F(x) / F(0)
    F(x) = Σ(n=1 to 3) aₙ × φₙ(x)

One standard coefficient form:
    Cₙ = 4 × (sin(λₙ) - λₙ × cos(λₙ)) / (2λₙ - sin(2λₙ))
    aₙ := Cₙ
    F(0) = Σ aₙ × λₙ

1-3 modes are typically sufficient; cache λₙ, aₙ vs Bi.

## 2. λ₁(Bi) blended start + Newton
Define:
    f(λ) = λ × cot(λ) - (1 - Bi)
    f'(λ) = cot(λ) - λ × csc²(λ)

Avoid starting near m × π. Blended initializer (Bi ≈ 0.1 … 10):
    λ₁^blend(Bi) = w(Bi) × (π/2 - 1/(Bi + α)) + (1 - w(Bi)) × √(3×Bi) / (1 + β×Bi)
    w = Biᵖ / (Biᵖ + qᵖ)

with typical α ≈ 0.5, β ≈ 0.2, q ≈ 1.0, p ≈ 1.4; refine by 1-2 Newton steps to double precision. 
Precompute on a Bi grid and interpolate.

## 3. Slab and cylinder spectral references
For completeness (geometrically exact references used in calibration and product-solution sub-profiles):
- **Slab**: cot(λ) = λ / Bi; basis cos(λ × x)
- **Infinite cylinder**: λ × J₁(λ) / J₀(λ) = -Bi; profile via J₀(λ × x)

## 4. Practical notes
- Use 1-3 modes for steady profile shapes.
- Cache roots per Bi; linear or spline interpolation is adequate for λ₁.
- Guard Newton against singular starts (λ ≈ m × π).
