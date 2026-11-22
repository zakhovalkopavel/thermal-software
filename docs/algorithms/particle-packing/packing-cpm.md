# Compressible Packing Model (CPM)

**Parent index:** [PACKING_MODELS.md](./PACKING_MODELS.md)

---

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
