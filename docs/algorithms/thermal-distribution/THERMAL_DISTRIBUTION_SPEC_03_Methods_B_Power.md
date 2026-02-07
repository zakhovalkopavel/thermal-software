# THERMAL DISTRIBUTION SPEC — Methods B (Power-law): B1 & B2 (EN)

## 1. B1: Heuristic power-law
    T(x) = Ts + (Tc - Ts) × (1 - xⁿ)
    n(Bi) = 1 + Bi / (1 + Bi)

Fast, monotone, single-parameter curve.

## 2. B2: Spectral-anchored power-law
Let S(x) = F(x) / F(0) be the normalized spectral curve (from Method A). Two ways to obtain n:

- **Two-point anchor** (recommended defaults x₁ = 1/3, x₂ = 2/3):
    n = ln((1 - S(x₁)) / (1 - S(x₂))) / ln(x₁ / x₂)

- **Least-squares**: minimize Φ(n) = ∫ w(x) × [S(x) - (1 - xⁿ)]² dx with w ∈ {1, x, x²}, using a 
  discrete grid x ∈ [ε, 1 - ε] (e.g., N = 64).

## 3. Closed-form volume averages for power-law profiles
For T(x) = Ts + (Tc - Ts) × (1 - xⁿ):

- **Slab**: 
    T_avg = Ts + (Tc - Ts) × (1 - 1/(n + 1))

- **Cylinder**: 
    T_avg = Ts + (Tc - Ts) × (1 - 2/(n + 2))

- **Sphere**: 
    T_avg = Ts + (Tc - Ts) × n / (n + 3)

## 4. Compositions (separable bodies)
- Finite cylinder r × z: Acyl(nᵣ) × Aslab(nz)
- Rectangular prism x × y × z: product of three slab factors
