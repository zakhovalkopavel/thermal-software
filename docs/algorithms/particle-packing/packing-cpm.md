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

**Actual Packing (φ) — Stovall linear packing density:**

Each size class is treated as potentially dominant; the mix packing is the
minimum of the class packing densities:

```
γ_i = β_i / (y_i + Σ_{j≠i} ξ_ij y_j)
φ   = min_i γ_i
```

Where:
- `y_i` = Volume fraction of class i
- `β_i` = Virtual packing of class i
- `ξ_ij` ∈ [β_i, 1] = size interaction of class j on class i

**Size interaction ξ_ij:**

```
ξ_ij = β_i + (1 − β_i) × (d_min / d_max)^n
```

- Equal sizes → ξ = 1 (no packing gain over mono-size β)
- Large size ratio → ξ → β_i (ideal filling)
- Fines on coarse use a higher exponent (stronger filling)
- Coarse on fine use a lower exponent (wall effect, less gain)

Classical loosening / wall residuals `a_ij`, `b_ij` (de Larrard) are kept for
reference; the solver uses ξ above so φ **changes with mass fractions**, not
only with the set of diameters.

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

**Step 3–4: Stovall solve (implemented in `utils/cpm-packing.ts`)**

```typescript
let phi = Infinity;
for (let i = 0; i < n; i++) {
  let denominator = volumeFractions[i];
  for (let j = 0; j < n; j++) {
    if (i === j) continue;
    denominator += sizeInteraction(diameters[i], diameters[j], virtualPacking[i])
      * volumeFractions[j];
  }
  phi = Math.min(phi, virtualPacking[i] / denominator);
}
// Practical ceiling from calibration (default DENSE_CASTABLE = 0.76)
phi = Math.min(phi, maxPhi);
```

### Compaction Index

Maps physical compaction to the small index `c` used in β = β₀ / (1 − K·c).
The raw pressure ratio is scaled (`CPM_COMPACTION_SCALE ≈ 0.1`) so typical
pressures raise β gradually instead of driving it to 1:

```typescript
const raw = pressure_MPa / (pressure_MPa + PRESSURE_REF_MPA); // 0…1
const c = raw * CPM_COMPACTION_SCALE; // ≲ 0.1
```

**Scenario Mapping (illustrative):**
- Self-compacting / none: 0 MPa → c = 0 → β = β₀
- Vibratable (~0.2–5 MPa): modest β increase
- High pressure: c approaches the scale cap; β → 1 only at extreme compaction

### Expected Results

**Typical packing fractions:**
- Mono-sized spheres: φ = 0.64
- Binary mix (optimal): φ = 0.72-0.75
- Continuous PSD (q=0.25): φ = 0.72-0.76
- Continuous PSD (q=0.30): φ = 0.68-0.72

---
