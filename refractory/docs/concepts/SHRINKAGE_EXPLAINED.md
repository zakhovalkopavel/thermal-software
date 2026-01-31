# Shrinkage in Refractory Castables - Concepts

**Purpose:** Understanding chemical and sintering shrinkage mechanisms and prediction

---

## Overview

Shrinkage is dimensional change that occurs during:
1. **Drying** - Water removal
2. **Dehydration** - Chemical water loss from hydrated phases
3. **Sintering** - Densification at high temperatures

Understanding and predicting shrinkage is critical because:
- **Excessive shrinkage → Cracking**
- **Non-uniform shrinkage → Warping**
- **Unpredicted shrinkage → Dimensional issues**

---

## Types of Shrinkage

### 1. Chemical Shrinkage (Drying/Dehydration)

**What is it?**
Volume reduction when water leaves the cement matrix.

**When does it occur?**
- Physical drying: 20-110°C
- Chemical dehydration: 200-400°C

**Mechanism:**

```
Wet Castable → Remove Water → Dried Castable
Volume: V₁ → ΔV_chemical → V₂

Where: V₂ < V₁
```

**Formula:**

```
ΔV/V = k × (w/c) × cement_fraction

where:
k = shrinkage coefficient
  - Portland Cement (PC): k ≈ 0.064
  - Calcium Aluminate Cement (CAC): k ≈ 0.12
  - Generic cement: k ≈ 0.08
w/c = water to cement ratio
cement_fraction = mass fraction of cement in mix
```

**Example:**

```
Castable with 15% CAC, w/c = 0.35:
ΔV/V = 0.12 × 0.35 × 0.15 = 0.0063 = 0.63%

Linear shrinkage:
ΔL/L ≈ ΔV/V / 3 ≈ 0.21%
```

**Key Insight:**
Chemical shrinkage is directly proportional to:
- Cement content (more cement → more shrinkage)
- Water content (more water → more shrinkage)

### 2. Sintering Shrinkage (High Temperature)

**What is it?**
Densification as particles bond and voids close at high temperatures.

**When does it occur?**
- Initial sintering: 0.5-0.6 × T_melting
- Significant sintering: 0.6-0.8 × T_melting
- Full densification: > 0.8 × T_melting

**For alumina-silicate refractories:**
- Initial: 1000-1200°C
- Significant: 1200-1450°C
- Full: > 1450°C

**Driving Force:**
Surface energy reduction - system lowers energy by:
1. Reducing surface area
2. Eliminating porosity
3. Forming grain boundaries

**Mechanism:**
```
Green Body → Neck Formation → Pore Shrinkage → Densification
(φ = 0.60) → (φ = 0.70) → (φ = 0.85) → (φ = 0.95+)

where φ = relative density (V_solid / V_total)
```

---

## Master Sintering Curve (MSC) Model

### Concept

All time-temperature paths that produce the same density are equivalent.

**Key Parameter: Θ (theta)**

```
Θ(t,T) = ∫[0,t] exp(-Q / R×T(τ)) dτ

where:
Q = activation energy for sintering (J/mol)
R = gas constant (8.314 J/mol·K)
T(τ) = temperature at time τ (K)
t = total time
```

**Physical Meaning:**
Θ accumulates "sintering work" - combines effect of temperature and time.

### Simplified for Constant Temperature

```
Θ = t × exp(-Q / R×T)

where:
t = hold time at temperature (seconds)
T = temperature (Kelvin)
```

### Density Evolution

```
ρ_relative(Θ) = 1 / (1 + C × exp(-k × Θ))

where:
C, k = material constants (fitted from experiments)
ρ_relative = ρ_actual / ρ_theoretical (0-1)
```

**Typical Values for Alumina-Silicate:**
- Q = 450-550 kJ/mol
- C = 10-20
- k = 1×10⁻¹² to 1×10⁻¹¹

### Shrinkage from Density

```
Linear shrinkage: ΔL/L = 1 - (ρ_initial / ρ_final)^(1/3)

Volumetric shrinkage: ΔV/V = 1 - (ρ_initial / ρ_final)
```

**Example:**

```
Initial (green): ρ_rel = 0.60
Final (1450°C): ρ_rel = 0.90

ΔV/V = 1 - (0.60/0.90) = 0.333 = 33.3% volumetric
ΔL/L = 1 - (0.60/0.90)^(1/3) = 0.126 = 12.6% linear
```

---

## Diffusion-Based Model (Coble)

### Theory

Sintering rate depends on:
1. **Temperature** - Arrhenius behavior
2. **Grain Size** - Smaller grains sinter faster
3. **Material Properties** - Diffusion coefficients

**Rate Equation:**

```
dρ/dt = A × exp(-Q/RT) / G³

where:
A = prefactor (includes diffusion coefficient, surface energy)
Q = activation energy
G = grain size
ρ = relative density
```

**Physical Meaning:**
- Higher T → faster sintering (exponential)
- Smaller G → much faster (cubic dependence!)
- Material specific (A, Q different for each oxide)

### Grain Size Effect

**Example:**

```
Material A: G = 10 μm
Material B: G = 1 μm (10× smaller)

Sintering rate ratio:
Rate_B / Rate_A = (10/1)³ = 1000×

Material B sinters 1000× faster!
```

**This explains:**
- Reactive alumina (G ≈ 1-5 μm) sinters readily
- Tabular alumina (G ≈ 50-100 μm) resists sintering
- Fused alumina (G > 100 μm) minimal sintering

### Activation Energies

**Typical Values:**

| Material | Q (kJ/mol) | Notes |
|----------|------------|-------|
| α-Alumina | 477 | Lattice diffusion |
| Mullite | 500-550 | Depends on composition |
| Silica | 400-450 | Via viscous flow |
| MgO | 330-380 | Faster than alumina |
| Spinel | 480-520 | Similar to alumina |

**Interpretation:**
Higher Q means:
- More temperature-sensitive
- Requires higher T for significant sintering
- Broader processing window (for refractory applications)

---

## Total Shrinkage Calculation

### Complete Profile

```
Total = Chemical + Sintering_600°C + Sintering_800°C + ... + Sintering_1450°C
```

**Implementation:**

```typescript
// 1. Chemical shrinkage (one-time)
const chemical_linear = 
  k_cement × (w/c) × cement_fraction / 3;

// 2. Initialize density
let current_density = 0.60;  // Green state

// 3. For each firing temperature
const temperatures = [600, 800, 1000, 1200, 1450];
const shrinkage_by_temp = {};

for (const T of temperatures) {
  // Calculate new density after sintering at T
  const theta = calculate_theta(T, hold_time, Q);
  const new_density = density_from_MSC(theta);
  
  // Volumetric shrinkage at this step
  const delta_V = (new_density - current_density) / current_density;
  
  // Linear shrinkage at this step
  const delta_L = delta_V / 3;
  
  // Total linear shrinkage so far
  const total_linear = chemical_linear + delta_L;
  
  shrinkage_by_temp[T] = total_linear;
  current_density = new_density;
}
```

### Example Output

```
Temperature (°C)  | Linear Shrinkage (%)
------------------|---------------------
Dried (110°C)     | 0.15  (chemical only)
600               | 0.16  (minimal sintering)
800               | 0.18  (slight sintering)
1000              | 0.25  (moderate sintering)
1200              | 0.45  (significant sintering)
1450              | 0.80  (strong sintering)
```

---

## Factors Affecting Shrinkage

### 1. Cement Content

**More cement → More shrinkage**

```
5% CAC:  ΔL ≈ 0.1-0.3%
10% CAC: ΔL ≈ 0.2-0.5%
15% CAC: ΔL ≈ 0.3-0.8%
```

**Why?**
- Cement hydrates → volume change
- Cement dehydrates → further shrinkage
- Some cements sinter at lower T

### 2. Water Content

**More water → More chemical shrinkage**

```
w/c = 0.25: Lower shrinkage
w/c = 0.35: Medium shrinkage
w/c = 0.45: Higher shrinkage
```

**But:** Needed for workability!
**Solution:** Optimize PSD to minimize water requirement

### 3. Particle Size Distribution

**Effect on sintering:**

```
Fine particles (< 10 μm): High sintering shrinkage
Medium (10-100 μm):      Moderate shrinkage
Coarse (> 100 μm):       Low shrinkage
```

**Optimized PSD balances:**
- Enough fines for good packing
- Not too many fines to avoid excessive sintering

### 4. Grain Size of Materials

**Reactive vs Calcined vs Fused:**

```
Reactive Alumina (1-5 μm grains):
  → High sintering activity
  → Use for bonding, small amounts
  
Calcined Alumina (10-30 μm grains):
  → Moderate activity
  → Good for matrix
  
Tabular/Fused (50-200 μm grains):
  → Low activity
  → Stable aggregates
```

### 5. Temperature and Time

**Temperature:**
```
ΔT = +50°C → Sintering rate ≈ ×2-5
```

**Time:**
```
Linear with log(time) after steady-state
```

**Practical:**
- Rapid heating: Less time at intermediate T → less shrinkage
- Long holds: More shrinkage
- Thermal cycling: Cumulative effect

---

## Minimizing Shrinkage

### Strategy 1: Reduce Cement Content

**Ultra-Low Cement (ULC) Castables:**
```
Traditional: 15-25% cement → 2-4% shrinkage
ULC: 3-8% cement → 0.5-1.5% shrinkage
No-Cement: 0% → < 0.5% (sintering only)
```

**How?**
- Use colloidal binders instead of cement
- Optimize PSD for maximum packing
- Add reactive fines for matrix development

### Strategy 2: Optimize PSD

**Effect:**
```
Poor PSD (high porosity): Need more cement → more shrinkage
Optimized PSD (low porosity): Less cement → less shrinkage
```

**Target:**
- Packing fraction > 0.72
- Enables cement < 8%

### Strategy 3: Control Particle Reactivity

**Select materials:**
```
Aggregates: Low reactivity (tabular, fused)
Matrix: Moderate reactivity (calcined)
Binder: Controlled reactivity (optimized grain size)
```

### Strategy 4: Pre-Firing

**Concept:**
Accept shrinkage in first firing, then:
```
First fire → shrinkage occurs → re-grind → use as aggregate
```

**Application:**
Pre-fired chamotte, alumina - already shrunk, stable

### Strategy 5: Optimize Firing Schedule

**Rapid heating through critical range:**
```
Slow: Room → 600°C (physical water)
Fast: 600°C → 1000°C (minimize intermediate sintering)  
Slow: > 1000°C (allow controlled sintering)
```

---

## Prediction Confidence

### High Confidence Predictions

**When:**
- ✓ Materials well-characterized (density, grain size, Q)
- ✓ Cement content known
- ✓ Water content controlled
- ✓ Firing profile defined
- ✓ Calibration data available

**Expected accuracy:**
± 0.2% absolute in linear shrinkage

### Medium Confidence

**When:**
- ~ Some material data available
- ~ Cement content typical range
- ~ Standard firing profile
- ~ No calibration data

**Expected accuracy:**
± 0.5% absolute

### Low Confidence

**When:**
- ✗ Novel materials
- ✗ Unknown grain sizes
- ✗ Variable firing conditions
- ✗ No experimental data

**Expected accuracy:**
Factor of 2 uncertainty (order of magnitude only)

---

## Practical Measurement

### Experimental Methods

**1. Linear Shrinkage Test:**
```
- Cast bar specimen (typically 160×40×40 mm)
- Mark gauge length (e.g., 100 mm)
- Dry at 110°C, measure
- Fire to target T, measure
- Calculate: ΔL/L = (L_final - L_initial) / L_initial × 100%
```

**2. Bulk Density Method:**
```
- Measure dried bulk density: ρ_dried
- Fire to temperature
- Measure fired bulk density: ρ_fired
- Volumetric shrinkage: ΔV/V = 1 - ρ_dried/ρ_fired
- Linear shrinkage: ΔL/L ≈ ΔV/V / 3
```

**3. Dilatometry:**
```
- Continuous measurement during heating
- Tracks dimensional change vs temperature
- Identifies critical transition temperatures
- Most accurate method
```

---

## Case Study: Self-Compacting High-Alumina

**Formulation:**
```
28% Tabular alumina 3-6 mm (G ≈ 80 μm)
38% Tabular alumina 1-3 mm (G ≈ 60 μm)
22% Calcined alumina 0.1-1 mm (G ≈ 20 μm)
8% CAC cement
4% Reactive alumina (G ≈ 3 μm)
18% Water (w/c = 0.35 based on cement+reactive)
```

**Predicted Shrinkage:**

```
Chemical (8% CAC, w/c=0.35):
ΔL_chem = 0.12 × 0.35 × 0.08 / 3 = 0.11%

Sintering at 1450°C (1 hour hold):
- Tabular (low reactivity): ~0.05%
- Calcined (medium): ~0.15%
- Reactive (high): ~0.40%

Weighted average:
ΔL_sinter = 0.28×0.05 + 0.38×0.05 + 0.22×0.15 + 0.12×0.40
         = 0.014 + 0.019 + 0.033 + 0.048
         = 0.11%

Total Linear Shrinkage:
ΔL_total = 0.11% + 0.11% = 0.22%
```

**Conclusion:** Very low shrinkage, suitable for tight tolerances!

---

## Summary

**Key Takeaways:**

1. **Two main types:** Chemical (cement/water) and Sintering (temperature/grain size)

2. **Chemical shrinkage:** Proportional to cement and water content

3. **Sintering shrinkage:** Depends on temperature, time, and grain size (G³ dependence!)

4. **Prediction:** MSC model works well with proper calibration

5. **Minimization strategies:**
   - Reduce cement (ULC formulations)
   - Optimize PSD (better packing)
   - Select stable aggregates (large grain, low reactivity)
   - Control firing schedule

6. **Typical ranges:**
   - Chemical: 0.1-0.5% linear
   - Sintering: 0.1-2% linear (highly variable)
   - Total: 0.2-2.5% linear

---

**Implementation:** `src/calculators/ShrinkageCalculator.ts`  
**Related:** BLEND_OPTIMIZATION_EXPLAINED.md, docs/spec.md  
**References:** Su & Johnson (1996), Coble (1961), Powers (1946)

