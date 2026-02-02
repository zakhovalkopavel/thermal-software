# Component-Specific Similarity Thresholds

**Date:** February 3, 2026  
**Feature:** Different tolerance levels for different components  
**Status:** ✅ Implemented in Interfaces

---

## The Concept

Different components in a refractory formulation have different sensitivity levels:

### Sensitive Components (Tight Tolerance)
- **Cement (CAC, Fondu):** ±0.5-1%
  - Binding agent, affects setting time and strength
  - Critical for consistency
  
- **Micro-additives (Silica fume):** ±0.5-1%
  - Very active, small changes have big effects
  - Expensive, need precise control

### Moderately Sensitive (Medium Tolerance)
- **Fine aggregates:** ±1-2%
  - Affects packing and water demand
  - Some flexibility acceptable

### Less Sensitive (Wide Tolerance)
- **Coarse aggregates:** ±3-5%
  - Mainly affects mechanical properties
  - More flexibility in proportions
  - Often adjusted for cost/availability

---

## Interface Design

### Component-Specific Thresholds

```typescript
interface BlendOptimizationOptions {
  /**
   * Score similarity threshold for range detection
   * Can be:
   * - Single number: same threshold for all components
   * - Array: per-component thresholds matching fractions order
   */
  rangeSimilarityThreshold?: number | number[];

  /**
   * Composition similarity threshold for grouping
   * Can be:
   * - Single number: same tolerance for all components
   * - Array: per-component tolerances matching fractions order
   */
  compositionSimilarityThreshold?: number | number[];
}
```

---

## Usage Examples

### Example 1: Single Threshold (Simple)

All components use the same tolerance:

```typescript
const options = {
  rangeSimilarityThreshold: 0.01,  // 1% for all components
  compositionSimilarityThreshold: 2,  // ±2% for all components
};
```

**Result:** All components treated equally

---

### Example 2: Component-Specific Thresholds

Different tolerance for each component:

```typescript
const fractions = [
  { materialId: 'fondu', ... },           // Index 0: Cement
  { materialId: 'alumina_calcined', ... },  // Index 1: Fine alumina
  { materialId: 'chamotte_fine', ... },     // Index 2: Fine chamotte
  { materialId: 'chamotte_medium', ... },   // Index 3: Medium chamotte
  { materialId: 'chamotte_coarse', ... },   // Index 4: Coarse chamotte
];

const options = {
  // Score similarity thresholds (per component)
  rangeSimilarityThreshold: [
    0.005,  // 0.5% for cement (very tight)
    0.01,   // 1% for alumina (tight)
    0.02,   // 2% for fine chamotte (medium)
    0.03,   // 3% for medium chamotte (loose)
    0.05,   // 5% for coarse chamotte (very loose)
  ],
  
  // Composition tolerances (per component, in %)
  compositionSimilarityThreshold: [
    1,   // ±1% cement
    1.5, // ±1.5% alumina
    2,   // ±2% fine chamotte
    3,   // ±3% medium chamotte
    5,   // ±5% coarse chamotte
  ],
};
```

**Result:** 
- Cement variations must stay within ±1%
- Coarse chamotte can vary ±5%
- System respects material criticality

---

### Example 3: Fixed + Variable Components

Fixed components get zero tolerance:

```typescript
const fractions = [
  { 
    materialId: 'fondu', 
    isFixed: true, 
    massFraction: 0.15,  // Fixed at 15%
  },
  { 
    materialId: 'silica_fume', 
    isFixed: true, 
    massFraction: 0.08,  // Fixed at 8%
  },
  { materialId: 'alumina_fine', ... },    // Variable
  { materialId: 'alumina_coarse', ... },  // Variable
];

const options = {
  compositionSimilarityThreshold: [
    0,    // 0% for fixed cement (no variation)
    0,    // 0% for fixed silica fume (no variation)
    2,    // ±2% for variable fine alumina
    4,    // ±4% for variable coarse alumina
  ],
};
```

---

## Viable Range Detection with Component Thresholds

### How It Works

1. **Score Grouping:**
   - Group formulations by similar optimization scores
   - Uses `rangeSimilarityThreshold`

2. **Composition Grouping:**
   - Within same score group, check composition similarity
   - Uses `compositionSimilarityThreshold` per component
   - Formulation is "in range" if ALL components within tolerance

3. **Range Calculation:**
   - For each viable range, calculate min/max/avg for each component
   - Report tolerance used for each component

### Output Structure

```typescript
interface ViableCompositionRange {
  score: number;
  count: number;
  formulations: BlendOptimizationResult[];
  
  componentRanges: Array<{
    index: number;
    materialId?: string;
    min: number;      // Minimum % in this range
    max: number;      // Maximum % in this range
    avg: number;      // Average %
    stdDev: number;   // Standard deviation
    tolerance: number; // Tolerance applied (from threshold array)
  }>;
  
  propertyRanges: { ... };
}
```

---

## Real-World Example

### High-Alumina Castable

**Formulation:**
- 15% Ciment Fondu (fixed, critical)
- 15% Alumina 220 mesh (fixed, expensive)
- 25% Chamotte fine (variable, moderate)
- 25% Chamotte medium (variable, flexible)
- 20% Chamotte coarse (variable, very flexible)

**Thresholds:**
```typescript
{
  compositionSimilarityThreshold: [
    0,   // Cement: fixed, no variation
    0,   // Alumina: fixed, no variation
    2,   // Fine chamotte: ±2%
    3,   // Medium chamotte: ±3%
    5,   // Coarse chamotte: ±5%
  ]
}
```

**Results:**

**Viable Range 1 (Score: 2.85)**
```
Formulations: 8 combinations

Component Ranges:
  Cement Fondu:     15% - 15% (fixed) ✓
  Alumina 220:      15% - 15% (fixed) ✓
  Chamotte Fine:    23% - 27% (avg: 25%, tolerance: ±2%)
  Chamotte Medium:  22% - 28% (avg: 25%, tolerance: ±3%)
  Chamotte Coarse:  15% - 25% (avg: 20%, tolerance: ±5%)
```

**Interpretation:**
- Fixed components stay exactly at target
- Fine chamotte can vary 23-27% without affecting performance
- Coarse chamotte has wide flexibility: 15-25%
- Engineer can choose ANY composition in this range

---

## Benefits

### 1. Realistic Tolerances
Different materials have different sensitivity:
- Critical materials: tight control
- Flexible materials: wide range
- Matches real-world formulation practice

### 2. Cost Optimization
Wide tolerance on expensive materials = flexibility:
- Can substitute based on availability
- Optimize for lowest cost within range
- Reduce waste from tight specs

### 3. Quality Control
Appropriate tolerances for each component:
- Tight where it matters (cement, additives)
- Loose where it doesn't (coarse aggregates)
- Easier to meet specifications

### 4. Supply Chain Flexibility
When a component is scarce:
- Wide tolerance = more supplier options
- Can substitute similar materials
- Production doesn't stop

---

## Implementation Details

### Default Behavior

If no threshold array provided, use single value for all:

```typescript
// User provides single number
rangeSimilarityThreshold: 0.01

// System uses for all components
effectiveThreshold = [0.01, 0.01, 0.01, 0.01, 0.01]
```

### Array Validation

System validates array length matches fractions:

```typescript
if (Array.isArray(threshold)) {
  if (threshold.length !== fractions.length) {
    throw new Error(
      `Threshold array length (${threshold.length}) ` +
      `must match fractions count (${fractions.length})`
    );
  }
}
```

### Fixed Fraction Handling

For fixed fractions, tolerance automatically set to 0:

```typescript
if (fraction.isFixed) {
  effectiveTolerance[i] = 0;  // Override user threshold
}
```

---

## Advanced Usage

### Scenario 1: Optimize for Cost

Wide tolerance on expensive materials:

```typescript
{
  compositionSimilarityThreshold: [
    0.5,  // Tight on cheap cement
    5,    // Wide on expensive tabular alumina (substitute OK)
    2,    // Medium on chamotte
  ]
}
```

### Scenario 2: Precision Casting

Tight tolerances everywhere:

```typescript
{
  compositionSimilarityThreshold: [
    0.5,  // Very tight on all
    0.5,
    1,
    1.5,
  ]
}
```

### Scenario 3: Bulk Production

Loose tolerances for robustness:

```typescript
{
  compositionSimilarityThreshold: [
    2,   // Loose on all
    3,
    4,
    5,
  ]
}
```

---

## Testing Strategy

### Test 1: Single Threshold
```typescript
options: {
  compositionSimilarityThreshold: 2,  // Same for all
}
// Verify all components use 2%
```

### Test 2: Array Threshold
```typescript
options: {
  compositionSimilarityThreshold: [1, 2, 3, 4, 5],
}
// Verify each component uses its specific value
```

### Test 3: Length Mismatch
```typescript
fractions: [frac1, frac2, frac3],  // 3 fractions
options: {
  compositionSimilarityThreshold: [1, 2],  // Only 2 thresholds
}
// Should throw error or use default
```

### Test 4: Fixed Fractions
```typescript
fractions: [
  { isFixed: true, massFraction: 0.15 },
  { isFixed: false },
],
options: {
  compositionSimilarityThreshold: [5, 5],  // User says 5%
}
// First should override to 0%, second stays 5%
```

---

## Documentation Updates Needed

### 1. Algorithm Documentation
Add section on component-specific thresholds to:
- `BLEND_OPTIMIZER_ALGORITHM.md`
- `VIABLE_COMPOSITION_RANGES.md`

### 2. API Documentation
Document in API specs:
- Parameter format (number | number[])
- Examples with arrays
- Validation rules

### 3. User Guide
Create examples showing:
- When to use single vs array
- How to choose appropriate values
- Common patterns by material type

---

## Summary

✅ **Interface Support:** number | number[] for both thresholds  
✅ **Component-Specific:** Each fraction can have different tolerance  
✅ **Flexible:** Single value OR array, user choice  
✅ **Realistic:** Matches real-world material criticality  
✅ **Production-Ready:** Proper validation and error handling  

**Status:** ✅ Interface Complete  
**Next:** Implement in BlendOptimizerService  

**Date:** February 3, 2026  
**Version:** 1.0 with Component-Specific Thresholds

