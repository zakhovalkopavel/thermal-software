# Furnas Sequential Filling Model

**Parent index:** [PACKING_MODELS.md](./PACKING_MODELS.md)

---

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
