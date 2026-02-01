# Packing Models - CPM and Furnas

**Module:** PackingCalculator  
**Purpose:** Calculate packing density and void fraction for particulate systems

---

## Overview

Packing models predict how efficiently particles fill space, which directly affects:
- Bulk density
- Porosity
- Water requirement
- Strength
- Permeability

Two models are implemented:
1. **CPM (Compressible Packing Model)** - de Larrard's advanced model
2. **Furnas** - Sequential filling approach

---

## 1. Compressible Packing Model (CPM)

### Theory

Developed by François de Larrard (1999), CPM accounts for:
- Particle size ratios
- Compaction energy
- Particle interactions
- Wall effects

### Key Concepts

**Virtual Packing (β):**
The maximum packing density of a mono-sized system under given compaction.

```
β_i = β_0 / (1 - K × φ_compaction)
```

Where:
- `β_0` = Random close packing (0.64 for spheres)
- `K` = Compaction constant (typically 9)
- `φ_compaction` = Compaction index (0 = none, 1 = maximum)

**Actual Packing (φ):**
Accounting for size distribution and interactions:

```
φ = Σ(y_i × β_i) / (1 + Σ(a_ij × y_j))
```

Where:
- `y_i` = Volume fraction of class i
- `β_i` = Virtual packing of class i
- `a_ij` = Dominance factor (i over j)

### Dominance Factors

**Size Ratio Effect:**

```
a_ij = f(d_i / d_j)
```

When `d_i > d_j`:
- Small particles fit in voids of large particles
- Dominance of large over small

**Calculation:**

```typescript
// Simplified dominance calculation
const sizeRatio = diameters[i] / diameters[j];

if (sizeRatio > 2.0) {
  // Large dominates small - good filling
  a_ij = 1.0 - Math.pow(sizeRatio, -1.5);
} else if (sizeRatio < 0.5) {
  // Small disrupts large - loosening effect  
  a_ij = -0.5;
} else {
  // Similar sizes - partial interaction
  a_ij = 0.0;
}
```

### Implementation Steps

**Step 1: Convert Mass to Volume Fractions**

```typescript
const volumeFractions: number[] = [];
for (let i = 0; i < n; i++) {
  const massVol_i = massFractions[i] / densities[i];
  volumeFractions[i] = massVol_i / totalMassVol;
}
```

**Step 2: Calculate Virtual Packing**

```typescript
const compactionIndex = calculateCompactionIndex(pressure_MPa);
const beta0 = 0.64;  // Spherical particles
const K = 9.0;       // de Larrard constant

const virtualPacking: number[] = [];
for (let i = 0; i < n; i++) {
  const shape = shapeFactor[i] || 1.0;
  const beta0_i = beta0 / Math.pow(shape, 0.333);
  const beta_i = beta0_i / (1 - K * compactionIndex);
  virtualPacking[i] = Math.min(beta_i, 1.0);
}
```

**Step 3: Build Dominance Matrix**

```typescript
const dominance: number[][] = [];
for (let i = 0; i < n; i++) {
  dominance[i] = [];
  for (let j = 0; j < n; j++) {
    if (i === j) {
      dominance[i][j] = 0;
    } else {
      dominance[i][j] = calculateDominance(
        diameters[i],
        diameters[j]
      );
    }
  }
}
```

**Step 4: Solve for Packing Fraction**

```typescript
// Iterative solution (simplified)
let phi = 0;
for (let i = 0; i < n; i++) {
  const numerator = volumeFractions[i] * virtualPacking[i];
  
  let denominator = 1.0;
  for (let j = 0; j < n; j++) {
    if (i !== j) {
      denominator += dominance[i][j] * volumeFractions[j];
    }
  }
  
  phi += numerator / denominator;
}
```

### Compaction Index

Maps physical compaction to CPM parameter:

```typescript
const calculateCompactionIndex = (pressure_MPa: number): number => {
  // Empirical correlation
  if (pressure_MPa < 0.01) return 0.0;      // No compaction
  if (pressure_MPa < 0.1)  return 0.02;     // Slight
  if (pressure_MPa < 0.5)  return 0.05;     // Moderate
  if (pressure_MPa < 2.0)  return 0.10;     // High
  return 0.15;  // Very high
};
```

**Scenario Mapping:**
- Self-compacting: 0.01 MPa → φ_c = 0.01
- Flowable: 0.05 MPa → φ_c = 0.02
- Vibratable: 0.2 MPa → φ_c = 0.05
- Hand-pressed: 1.0 MPa → φ_c = 0.10

### Expected Results

**Typical packing fractions:**
- Mono-sized spheres: φ = 0.64
- Binary mix (optimal): φ = 0.72-0.75
- Continuous PSD (q=0.25): φ = 0.72-0.76
- Continuous PSD (q=0.30): φ = 0.68-0.72

---

## 2. Furnas Sequential Filling Model

### Theory

Classical approach (Furnas, 1931):
1. Largest particles pack to random close packing (φ₀ = 0.64)
2. Smaller particles fill voids
3. Each size class contributes based on available void space

### Mathematical Framework

**Initial State (Largest Fraction):**

```
V_solids_1 = y_1
V_total_1 = y_1 / φ_0
V_voids_1 = V_total_1 - V_solids_1
```

**Subsequent Fractions (i > 1):**

```
V_voids_fillable = V_voids_{i-1} × η(size_ratio)
V_filled_i = min(V_fraction_i, V_voids_fillable)
V_voids_i = V_voids_{i-1} - V_filled_i
```

Where:
- `η(size_ratio)` = Filling efficiency factor
- `size_ratio` = d_i / d_1 (relative to largest)

### Filling Efficiency

**Size-dependent efficiency:**

```typescript
const efficiency = (size_ratio: number): number => {
  const base = 0.75;  // Base efficiency
  
  // Efficiency decreases with increasing size ratio
  // Very small particles fill better
  return base * Math.pow(size_ratio, 0.5);
};
```

**Physical meaning:**
- Very small particles (size_ratio < 0.1): η ≈ 0.75
- Medium particles (size_ratio = 0.25): η ≈ 0.37
- Similar size (size_ratio > 0.5): η ≈ 0.53

### Implementation

**Complete Algorithm:**

```typescript
const calculateFurnas = (
  volumeFractions: number[],
  diameters: number[]
): number => {
  // Sort by diameter descending
  const sorted = sortBySize(volumeFractions, diameters);
  
  const phi0 = 0.64;  // RCP
  const baseEfficiency = 0.75;
  
  let totalSolids = 0;
  let totalVolume = 0;
  
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      // Largest fraction - initial packing
      totalSolids = sorted.volumeFractions[0];
      totalVolume = totalSolids / phi0;
    } else {
      // Smaller fractions - void filling
      const currentVoid = totalVolume - totalSolids;
      const sizeRatio = sorted.diameters[i] / sorted.diameters[0];
      const efficiency = baseEfficiency * Math.pow(sizeRatio, 0.5);
      
      const fillableVoid = currentVoid * efficiency;
      const volumeNeeded = sorted.volumeFractions[i] / phi0;
      const volumeFilled = Math.min(volumeNeeded, fillableVoid);
      
      totalSolids += sorted.volumeFractions[i];
      totalVolume += volumeFilled;
    }
  }
  
  return totalSolids / totalVolume;
};
```

### Advantages and Limitations

**Advantages:**
- Simple concept
- Fast calculation
- Good for well-separated sizes
- No matrix inversion needed

**Limitations:**
- Less accurate for similar sizes
- No compaction effects
- Assumes sequential filling (not simultaneous)
- Empirical efficiency factors

---

## 3. Model Comparison

### CPM vs Furnas

| Aspect | CPM | Furnas |
|--------|-----|--------|
| **Complexity** | High | Low |
| **Accuracy** | Very good | Good |
| **Compaction** | Explicitly modeled | Not included |
| **Size interactions** | Full matrix | Sequential only |
| **Computation** | Moderate | Fast |
| **Calibration** | Well-established | Empirical |
| **Best for** | Research, optimization | Quick estimates |

### When to Use Which

**Use CPM when:**
- High accuracy needed
- Compaction is important
- Multiple similar-sized fractions
- Research or optimization work
- Sufficient calibration data

**Use Furnas when:**
- Quick estimate needed
- Well-separated size classes
- Simple binary/ternary mixes
- Educational purposes
- Initial screening

---

## 4. Validation and Calibration

### Experimental Validation

**Method 1: Tap Density Test**

```
1. Fill container with blend (loose)
2. Measure mass M and volume V_loose
3. Tap until no further densification
4. Measure final volume V_tap
5. Calculate: φ = M / (ρ_true × V_tap)
```

**Typical agreement:**
- CPM: ± 0.02 absolute (e.g., 0.72 ± 0.02)
- Furnas: ± 0.04 absolute

**Method 2: Green Density Measurement**

```
1. Prepare castable with optimized blend
2. Cast into mold with known compaction
3. Measure green density
4. Compare with prediction
```

### Calibration Parameters

**CPM Calibration:**
- `β_0`: Adjust for particle shape (0.60-0.68)
- `K`: Adjust for material friction (7-11)
- Shape factors: Measure from particle images

**Furnas Calibration:**
- Base efficiency: Fit to experimental data (0.70-0.80)
- Size ratio exponent: Adjust (0.3-0.7)

---

## 5. Practical Applications

### Example 1: High-Alumina Self-Compacting

**Input:**
```
Fraction 1: 3-6 mm Tabular Alumina (28%, ρ=3.95 g/cm³)
Fraction 2: 1-3 mm Tabular Alumina (38%, ρ=3.95 g/cm³)
Fraction 3: 0.1-1 mm Chamotte (22%, ρ=2.65 g/cm³)
Fraction 4: <0.1 mm CAC (12%, ρ=3.20 g/cm³)
```

**CPM Result:**
```
Packing fraction: φ = 0.74
Bulk density (green): 2.33 g/cm³
Porosity: 26%
```

**Interpretation:**
- High packing efficiency (self-compacting achieved)
- Low water demand expected
- Good green strength

### Example 2: Standard Vibratable

**Input:**
```
Same materials, q = 0.30:
35%, 40%, 18%, 7%
```

**CPM Result:**
```
Packing fraction: φ = 0.70
Bulk density (green): 2.20 g/cm³
Porosity: 30%
```

**Interpretation:**
- Moderate packing (needs vibration)
- Standard water demand
- Typical working properties

---

## 6. Integration with Other Calculators

### Workflow in Blend Optimizer

```
PSD → Packing → Density → Shrinkage → Final Properties
```

**Complete calculation chain:**

```typescript
// 1. PSD calculation
const psd = PSDCalculator.andreasenDiscrete(fractions, 0.25);

// 2. Packing calculation
const packing = PackingCalculator.calculateCPM({
  massFractions: psd.massFractions,
  densities_kgm3: materials.map(m => m.rho_true),
  diameters_mm: fractions.map(f => (f.dMin + f.dMax) / 2),
  compactionPressure_MPa: 0.05
});

// 3. Bulk density
const rho_skeletal = calculateWeightedDensity(materials, psd.massFractions);
const rho_bulk_green = rho_skeletal * packing.packingFraction_phi;

// 4. Porosity
const porosity = (1 - packing.packingFraction_phi) * 100;

// 5. Feed to shrinkage calculator...
```

---

## 7. Advanced Topics

### Shape Factor Corrections

**Non-spherical particles:**

```
β_0_corrected = β_0_sphere / (shape_factor^0.333)
```

Shape factors:
- Spheres: 1.0
- Rounded gravel: 1.1
- Angular crushed: 1.2-1.3
- Flaky particles: 1.4-1.6
- Fibers: 2.0+

### Wall Effects

For containers with diameter D_container:

```
φ_effective = φ_bulk × (1 - k × d_max / D_container)
```

Typically significant when `d_max / D_container > 0.1`.

### Multi-Modal Distributions

For bimodal or trimodal mixes:

```
CPM: Handles automatically via dominance matrix
Furnas: Group modes and apply sequentially
```

---

## 8. Troubleshooting

### Common Issues

**Problem: Predicted φ too high (> 0.80)**

**Causes:**
- Shape factor too low
- Compaction index too high
- Unrealistic particle sizes

**Solutions:**
- Check shape factors
- Verify compaction pressure
- Review size distribution

**Problem: Large discrepancy with experiments**

**Causes:**
- Particle segregation
- Non-uniform mixing
- Moisture effects
- Air entrainment

**Solutions:**
- Improve mixing procedure
- Dry materials properly
- Use de-airing in measurements
- Recalibrate model constants

---

## 9. References

### Primary Literature

**CPM:**
- de Larrard, F. (1999) "Concrete Mixture Proportioning: A Scientific Approach"
- Wong, H.H.C. & Kwan, A.K.H. (2008) "Packing density of cementitious materials"

**Furnas:**
- Furnas, C.C. (1931) "Grading Aggregates - Mathematical Relations for Beds of Broken Solids"
- Westman, A.E.R. & Hugill, H.R. (1930) "The Packing of Particles"

### Application Papers

- Oliveira, I.R. et al. (2000) "Dispersion and Packing of Particles"
- Funk, J.E. & Dinger, D.R. (1994) "Particle Packing"

---

## Conclusion

Packing models are essential for:
- Predicting bulk density
- Minimizing porosity
- Optimizing water demand
- Achieving target flowability
- Reducing material cost

Combined with PSD optimization, they enable systematic formulation design with predictable performance.

---

**Implementation:** `src/calculators/PackingCalculator.ts`  
**Documentation:** This file  
**Related:** PSD_ALGORITHMS.md, SHRINKAGE_MODELS.md

