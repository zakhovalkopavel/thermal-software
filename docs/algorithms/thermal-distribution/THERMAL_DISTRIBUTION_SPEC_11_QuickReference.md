# THERMAL DISTRIBUTION SPEC — Quick Reference (EN)

**Purpose:** Bulleted formula and concept summary for quick lookup.

---

## Core Definitions

**Characteristic Length:** Lc = V/S (volume / surface area) — **invariant**, always use for Bi

**Biot Number:** Bi = h·Lc / k (convection × length / conductivity)

**Normalized Coordinates:**
- From center: x ∈ [0, 1] (0 = center, 1 = boundary)
- From boundary: ξ = 1 − x ∈ [0, 1]

**Boundary Conditions:**
- T(center) = Tc
- T(surface) = Ts
- Temperature range: [Ts, Tc]

---

## Eigenvalue Equations (Reference Spectra)

**Slab:** cot(λ) = λ / Bi

**Infinite Cylinder:** λ · J₁(λ) / J₀(λ) = −Bi

**Sphere:** λ · cot(λ) = 1 − Bi (most common reference)

---

## Basis Functions

**Slab:** cos(λ·x)

**Cylinder:** J₀(λ·x) (Bessel function of first kind)

**Sphere:** sin(λ·x) / (λ·x)

---

## Spectral Solution

**General form (normalized):**
```
T(x) = Ts + (Tc − Ts) · F(x) / F(0)
F(x) = Σ aₙ · φₙ(x)    (sum over modes n=1 to 3)
```

**Standard coefficients:**
```
Cₙ = 4·(sin(λₙ) − λₙ·cos(λₙ)) / (2·λₙ − sin(2·λₙ))
aₙ = Cₙ
F(0) = Σ aₙ·λₙ
```

**Eigenvalue root finding:** λ₁(Bi) blended approximation for Newton initializer

---

## Power-Law Models

**B1 (Heuristic):**
```
T(x) = Ts + (Tc − Ts)·(1 − xⁿ)
n(Bi) = 1 + Bi / (1 + Bi)
```

**B2 (Spectral-Anchored):**
- Two-point anchor (x₁=1/3, x₂=2/3):
```
n = ln((1 − S(x₁)) / (1 − S(x₂))) / ln(x₁ / x₂)
```
- Least-squares anchor: minimize ∫w(x)·[S(x) − (1 − xⁿ)]² dx with w ∈ {1, x, x²}

Where S(x) = F(x) / F(0) from spectral method

---

## Volume Averaging (Closed Forms for Power Law)

**Slab:**
```
Aslab = 1 − 1/(n+1)
Tavg = Ts + (Tc − Ts)·Aslab
```

**Cylinder:**
```
Acyl = 1 − 2/(n+2)
Tavg = Ts + (Tc − Ts)·Acyl
```

**Sphere:**
```
Asph = n / (n+3)
Tavg = Ts + (Tc − Ts)·Asph
```

**Separable composition (e.g., finite cylinder r×z):**
```
Tavg = Ts + (Tc − Ts)·Acyl(nᵣ)·Aslab(nz)
```

---

## 1D Volume Average Weights (Analytical)

**Slab:** ∫₀¹ T(ξ) dξ

**Cylinder:** 2·∫₀¹ T(x)·x dx (weight: 2x)

**Sphere:** 3·∫₀¹ T(x)·x² dx (weight: 3x²)

**Energy:** E = ρ·c·V·Tavg

---

## Product-Solution Method

**Definition (separable coordinates):**
```
T(x,y,z) = Ts + (Tc − Ts)·∏ᵢ Sᵢ(xᵢ)
```

**Effective transverse scale (`perpScale`):**
- `'avg'`: R⊥ = (1/H)·∫₀ᴴ Rloc(z) dz
- `'area_weighted'`: R⊥ = (∫ Rloc·A(z) dz) / (∫ A(z) dz) — **default**

**Biot invariance:** Global Bi = h·(V/S)/k always; per-axis Bi internal only

---

## Gauss-Legendre Quadrature

**Mapping [-1,1] → [0,1]:** tᵢ = (ξᵢ + 1)/2, wᵢ = Wᵢ/2

**1D approximations:**
- Slab: Tavg ≈ Σ wᵢ·T(tᵢ)
- Cylinder: Tavg ≈ 2·Σ wᵢ·T(tᵢ)·tᵢ
- Sphere: Tavg ≈ 3·Σ wᵢ·T(tᵢ)·tᵢ²

**Node selection:**
- N=16: Low curvature, fast
- N=32: Standard production
- N=64: High accuracy, regression baseline

---

## Geometries (Rdist Selection & Local Radius/Dimensions)

**Slab (thickness L):** Rdist = L/2

**Infinite cylinder (diameter D):** Rdist = D/2

**Sphere (radius R):** Rdist = R

**Prism (aspect A:B:C):** Rdist = Lmin/2 (or V/S if complex)

**Ring/annulus (thickness t):** Rdist = t/2 (radial), V/S per unit length (axial)

**Torus (minor radius r):** Rdist ≈ r/2

**Cone (height H, base R₀):** Rdist,z = H/2; Rdist,r = R₀(local), R(z) = R₀·(1 − z/H)

**Frustum cone:** R(z) = R₁ + (R₂ − R₁)·z/H

**Pyramid (height H, base A₀×B₀):** Rdist,z = H/2; A(z) = A₀·(1 − z/H), B(z) = B₀·(1 − z/H)

**Frustum pyramid:** A(z) = A₁ + (A₀ − A₁)·z/H; B(z) = B₁ + (B₀ − B₁)·z/H

---

## Variable-Section Axial Averaging

**Formula:**
```
Tavg = (1/V)·∫₀ᴴ (∫_Ω(z) T dA) dz
     ≈ (1/V)·Σⱼ wⱼ·A(z)·T̄_Ω(zⱼ)
```

**Weights by geometry:**
- Cone: A(z) = π·R(z)²
- Pyramid: A(z) = A(z)·B(z)

**Quadrature:** Gauss-Legendre along z, local 1D profiles across section

---

## Newton-Raphson for λ₁(Bi)

**Function:** f(λ) = λ·cot(λ) − (1 − Bi)

**Derivative:** f'(λ) = cot(λ) − λ·csc²(λ)

**Blended initializer (Bi ≈ 0.1…10):**
```
λ₁^blend = w·(π/2 − 1/(Bi+α)) + (1−w)·√(3·Bi)/(1+β·Bi)
w = Biᵖ / (Biᵖ + qᵖ)

Typical: α≈0.5, β≈0.2, q≈1.0, p≈1.4
```

**Refinement:** 1-2 Newton steps to double precision

---

## API Overview

**Main functions:**
- `temperatureAtDepth(d, opts)` → T at distance d
- `temperatureProfileAtDepths(depths[], opts)` → T[] for array
- `averageTemperature(opts)` → Tavg
- `computeBi(opts)` → Bi (always via V/S)
- `computeCharacteristicLengths(shape, mode)` → {Rdist, Rbi}

**ProfileOptions fields:**
```typescript
Tc, Ts              // Boundary temperatures
h, k                // Convection, conductivity
shape               // Geometry + parameters
method              // 'spectral' | 'power_heuristic' | 'power_spectral_anchored' | 'product_solution'
avg.mode            // 'analytical' | 'gauss' | 'auto'
avg.gaussNodes      // 8, 16, 32, 64
spectralModes       // 1, 2, 3
```

---

## Acceptance Criteria

**Tavg relative error:** |T(candidate) − T(ref)| / T(ref) ≤ **1e−3**

**Profile L2 error:** RMS ≤ **1e−2**

**Conditions:** N ≥ 32, Bi ∈ {0.1, 1, 10}

**Applies to:** All candidate methods (B1, B2, variants) vs spectral/product-solution

---

## Common Mistakes to Avoid

1. **Wrong Bi calculation:** Always use Lc = V/S, not arbitrary length
2. **Profile normalization:** Check T(0) = Tc and T(max) = Ts
3. **Quadrature order:** N=16 insufficient for Bi>5; use N≥32 production
4. **Method mismatch:** B1 poor for Bi>5; use B2 or spectral
5. **Variable sections:** Must use product-solution or numerical quadrature
6. **Separability assumption:** Only valid for product-solution geometries
7. **perpScale:** Use 'area_weighted' for cones/pyramids, not 'avg'

---

## Performance Typical Values

| Method | Time (ms) | Accuracy |
|--------|-----------|----------|
| B1 | 0.3 | ±1% (engineering) |
| B2 (2pt) | 0.8 | ±0.1% (good) |
| B2 (LS:x²) | 1.2 | ±0.02% (excellent) |
| Spectral (3 modes) | 2.1 | <1e-9 (reference) |
| Product-solution 2D | 5–10 | Reference for 2D |
| Product-solution 3D | 20–50 | Reference for 3D |

---

## When to Use Which Method

**Spectral (A):**
- When: Accuracy paramount, Bi ≤ 10, 1D or quasi-3D
- Cost: Highest
- Accuracy: Excellent

**Power B2 (LS:x²):**
- When: Balance needed, practical engineering
- Cost: Low
- Accuracy: <0.02% vs spectral (excellent for engineering)
- **Recommended default**

**Power B1:**
- When: Speed critical, Bi >5
- Cost: Minimal
- Accuracy: ±1% acceptable

**Product-Solution:**
- When: Multi-axis or variable-section geometry
- Cost: Depends on quadrature (N² or N³)
- Accuracy: Excellent for separable problems
- **Must use for cones/pyramids**

---

## Troubleshooting

**Error: "Bi mismatch"**
→ Check V/S calculation (units consistency)

**Error: "T out of bounds"**
→ Verify Tc > Ts and T values in [Ts, Tc]

**Error: "Convergence failed (Newton)"**
→ Check Bi range (0.01 to 100 is safe); avoid λ ≈ m·π starts

**Large disagreement B2 vs Spectral**
→ Check Bi (B2 may diverge at Bi >20); use spectral instead

**Profile wiggles (oscillations)**
→ Increase N (use N=64 for debug); check product-solution per-axis alignment

---

## Bibliography References

See THERMAL_DISTRIBUTION_SPEC_08_Bibliography.md for:
- Recktenwald (transient conduction)
- University of Washington (1D solutions)
- Simon Fraser University (Biot, Lc)
- NTHU OCW (time-dependent conduction)
- Michigan Tech (Heisler/Gurney-Lurie)
- Golub & Welsch (Gauss quadrature)
- Bogaert (iteration-free quadrature)

---

**Quick Reference Complete**  
**Version:** 1.7  
**Status:** Ready for bookmark/print

