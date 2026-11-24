# Fixed Fractions — Examples, Results, and Workflow

**Parent index:** [BLEND_OPTIMIZER_FIXED_FRACTIONS.md](./BLEND_OPTIMIZER_FIXED_FRACTIONS.md)

---

### Example 1: Fixed Cement + Max Density

**Goal:** Create highest density castable with exactly 15% CAC cement

```typescript
const request: BlendOptimizationRequest = {
  fractions: [
    {
      dMin_mm: 0.001,
      dMax_mm: 0.045,
      isFixed: true,
      massFraction: 0.15,      // Exactly 15% CAC
      density_kgm3: 3100,
    },
    {
      dMin_mm: 0.045,
      dMax_mm: 0.5,
      density_kgm3: 2700,      // Optimize this
    },
    {
      dMin_mm: 0.5,
      dMax_mm: 5.0,
      density_kgm3: 2650,      // Optimize this
    },
  ],
  options: {
    optimizationGoal: 'maxDensity',
    topN: 3,  // Show top 3 solutions
    minPackingEfficiency: 0.70,
  },
};

const results = blendOptimizerService.optimize(request);
```

**Output:**
```typescript
[
  {
    rank: 1,
    optimizationScore: 2.85,
    rhoBulk_gml_green: 2.85,
    packingEfficiency: 0.76,
    porosity_percent_green: 24.0,
    waterDemand_percent: 10.1,
    massFractions: [0.15, 0.35, 0.50],  // CAC fixed at 15%
    // ...
  },
  {
    rank: 2,
    optimizationScore: 2.82,
    rhoBulk_gml_green: 2.82,
    // ...
  },
  {
    rank: 3,
    optimizationScore: 2.79,
    // ...
  },
]
```

---

### Example 2: Minimum Water with Constraints

**Goal:** Low water demand for fast installation

```typescript
const request: BlendOptimizationRequest = {
  fractions: [
    {
      dMin_mm: 0.01,
      dMax_mm: 0.1,
      isFixed: true,
      massFraction: 0.08,      // 8% micro-silica (fixed)
      density_kgm3: 2200,
    },
    {
      dMin_mm: 0.001,
      dMax_mm: 0.05,
      isFixed: true,
      massFraction: 0.12,      // 12% CAC (fixed)
      density_kgm3: 3100,
    },
    {
      dMin_mm: 0.1,
      dMax_mm: 1.0,
      density_kgm3: 2700,      // Optimize
    },
    {
      dMin_mm: 1.0,
      dMax_mm: 6.0,
      density_kgm3: 2650,      // Optimize
    },
  ],
  options: {
    optimizationGoal: 'minWater',
    topN: 5,
    maxWaterDemand: 10,        // Max 10% water
    maxPorosity: 28,           // Max 28% porosity
  },
};
```

**Output:**
```typescript
[
  {
    rank: 1,
    optimizationScore: 42.5,
    waterDemand_percent: 7.5,   // Best: only 7.5% water
    porosity_percent_green: 18.0,
    massFractions: [0.08, 0.12, 0.45, 0.35],  // Fixed: 8%, 12%, Variable: 45%, 35%
  },
  // ... 4 more solutions
]
```

---

### Example 3: Balanced Optimization

**Goal:** Well-rounded formulation

```typescript
const request: BlendOptimizationRequest = {
  fractions: [
    {
      dMin_mm: 0.001,
      dMax_mm: 0.5,
      density_kgm3: 2700,
    },
    {
      dMin_mm: 0.5,
      dMax_mm: 2.0,
      density_kgm3: 2650,
    },
    {
      dMin_mm: 2.0,
      dMax_mm: 6.0,
      density_kgm3: 2600,
    },
  ],
  options: {
    optimizationGoal: 'balanced',  // DEFAULT
    topN: 10,
  },
};
```

**Result:** Returns 10 solutions optimized for balanced performance (density, porosity, water, shrinkage all considered)

---

## Multiple Optimal Solutions

The system **automatically finds multiple solutions** because it:

1. **Tests multiple combinations:**
   - Methods: Andreasen, Funk-Dinger (2)
   - Q values: [0.25, 0.27, 0.30, 0.33] (4)
   - Scenarios: Self-compacting, Flowable, Vibratable, Hand-pressable (4)
   - Packing models: CPM, Furnas (2)
   - **Total:** 2 × 4 × 4 × 2 = **64 combinations**

2. **Ranks all solutions** by optimization score

3. **Returns top N** if requested

### Finding Solution Ranges

To find a **range of near-optimal solutions**:

```typescript
options: {
  optimizationGoal: 'maxDensity',
  topN: 20,  // Get top 20 solutions
  minPackingEfficiency: 0.70,
}

// After getting results:
const top20 = results.slice(0, 20);
const densityRange = {
  min: Math.min(...top20.map(r => r.rhoBulk_gml_green)),
  max: Math.max(...top20.map(r => r.rhoBulk_gml_green)),
  avg: top20.reduce((sum, r) => sum + r.rhoBulk_gml_green, 0) / 20,
};

console.log(`Density range: ${densityRange.min} - ${densityRange.max} g/mL`);
// Output: Density range: 2.75 - 2.89 g/mL
```

---

## Result Structure

Each result now includes:

```typescript
interface BlendOptimizationResult {
  // ...existing fields...
  
  /** Optimization score (higher is better) */
  optimizationScore?: number;
  
  /** Rank among all results (1 = best) */
  rank?: number;
}
```

**Example result:**
```typescript
{
  rank: 1,                        // ← Best solution
  optimizationScore: 85.4,        // ← Score (higher = better)
  method: 'Andreasen',
  q: 0.27,
  scenario: 'Flowable',
  packingModel: 'CPM',
  rhoBulk_gml_green: 2.85,
  porosity_percent_green: 24.0,
  waterDemand_percent: 10.1,
  massFractions: [0.15, 0.40, 0.45],
  // ...
}
```

---

## Workflow Example

### Step 1: Define Fixed Fractions
```typescript
const fixedCAC = {
  dMin_mm: 0.001,
  dMax_mm: 0.045,
  isFixed: true,
  massFraction: 0.15,
  density_kgm3: 3100,
};
```

### Step 2: Define Variable Fractions
```typescript
const variableFine = {
  dMin_mm: 0.045,
  dMax_mm: 0.5,
  density_kgm3: 2700,
};

const variableCoarse = {
  dMin_mm: 0.5,
  dMax_mm: 5.0,
  density_kgm3: 2650,
};
```

### Step 3: Set Optimization Goal
```typescript
const options = {
  optimizationGoal: 'maxDensity' as const,
  topN: 5,
  minPackingEfficiency: 0.72,
  maxWaterDemand: 12,
};
```

### Step 4: Optimize
```typescript
const results = blendOptimizerService.optimize({
  fractions: [fixedCAC, variableFine, variableCoarse],
  options,
});
```

### Step 5: Review Results
```typescript
console.log(`Found ${results.length} optimal solutions`);
console.log(`Best: ${results[0].optimizationScore} score, ${results[0].rhoBulk_gml_green} g/mL`);
console.log(`Mixture: ${results[0].massFractionsRoundedPercent.join('%, ')}%`);
```

---

## Tips & Best Practices

### 1. Start with Balanced
Always start with `optimizationGoal: 'balanced'` to get a good overview

### 2. Use topN to Limit Results
Request `topN: 10` to avoid information overload

### 3. Apply Realistic Constraints
Use constraints based on real requirements:
- Min packing efficiency: typically 0.65-0.75
- Max water demand: typically 8-15%
- Max porosity: typically 20-30%

### 4. Compare Multiple Goals
Run optimization multiple times with different goals to compare trade-offs

### 5. Check Score Distribution
If top 10 solutions have similar scores (±5%), they're all viable options

### 6. Consider Fixed Fraction Limits
Total fixed fractions should leave room for optimization (typically < 30-40%)

---

## Summary

✅ **Fixed Fractions:** Use `isFixed: true` and `massFraction: X`  
✅ **Optimization Goals:** Choose from 5 goals or use balanced  
✅ **Constraints:** Apply min/max limits as needed  
✅ **Multiple Solutions:** Automatically finds and ranks all combinations  
✅ **Top N:** Return only best N results  
✅ **Solution Ranges:** Get top 20-50 to see range of viable options  

---

**Status:** ✅ Feature Complete  
**Date:** February 2, 2026  
**Documentation:** Complete with examples
