# Viable Range Output Format - Human-Readable Results

**Date:** February 3, 2026  
**Feature:** Mean ± Tolerance Format  
**Example:** `[15±1% cement, 40±2% fine, 45±5% coarse] is optimal`

---

## The Format

### Basic Structure

```
[Component1_avg±tolerance%, Component2_avg±tolerance%, ...] is optimal
```

### Real Example

**Input Data:**
- Cement variations: 14%, 15%, 16% → avg=15%, range=2%, tolerance=±1%
- Fine variations: 38%, 40%, 42% → avg=40%, range=4%, tolerance=±2%
- Coarse variations: 40%, 45%, 50% → avg=45%, range=10%, tolerance=±5%

**Output:**
```
[15±1% cement, 40±2% fine, 45±5% coarse] is optimal for maxDensity
```

**Interpretation:**
- Use **15%** cement with ±1% tolerance (14-16% acceptable)
- Use **40%** fine with ±2% tolerance (38-42% acceptable)
- Use **45%** coarse with ±5% tolerance (40-50% acceptable)

---

## How Tolerance is Calculated

### Method 1: From Range (Automatic)

If no specific tolerance provided, calculate from actual range:

```typescript
tolerance = (max - min) / 2
```

**Example:**
- Min: 38%
- Max: 42%
- Tolerance: (42 - 38) / 2 = ±2%
- Mean: (38 + 42) / 2 = 40%
- **Result:** `40±2%`

### Method 2: From User-Specified Threshold

If user provides `compositionSimilarityThreshold`:

```typescript
// User specifies
compositionSimilarityThreshold: [1, 2, 5]  // ±1%, ±2%, ±5%

// Output uses these directly
[15±1%, 40±2%, 45±5%]
```

### Method 3: From Standard Deviation

Alternative method (more statistical):

```typescript
tolerance = stdDev * 2  // 95% confidence interval
```

---

## Output Examples

### Example 1: High-Alumina Castable

**Formulations in Range:**
```
Formulation 1: [15%, 15%, 25%, 25%, 20%]
Formulation 2: [15%, 15%, 27%, 23%, 20%]
Formulation 3: [15%, 15%, 23%, 27%, 20%]
Formulation 4: [15%, 15%, 26%, 24%, 20%]
```

**Analysis:**
- Cement: 15% (fixed, no variation)
- Alumina: 15% (fixed, no variation)
- Fine chamotte: 23-27% (avg: 25%, tol: ±2%)
- Medium chamotte: 23-27% (avg: 25%, tol: ±2%)
- Coarse chamotte: 20% (tol: ±0%)

**Output:**
```
[15±0% cement, 15±0% alumina, 25±2% fine, 25±2% medium, 20±0% coarse] is optimal for maxDensity
```

Or simplified (hide ±0%):
```
[15% cement, 15% alumina, 25±2% fine, 25±2% medium, 20% coarse] is optimal for maxDensity
```

---

### Example 2: Simple Chamotte Mix

**Formulations in Range:**
```
Formulation 1: [38%, 35%, 27%]
Formulation 2: [40%, 33%, 27%]
Formulation 3: [42%, 30%, 28%]
Formulation 4: [40%, 32%, 28%]
```

**Analysis:**
- Fine: 38-42% (avg: 40%, tol: ±2%)
- Medium: 30-35% (avg: 32%, tol: ±2.5% → round to ±3%)
- Coarse: 27-28% (avg: 27.5%, tol: ±0.5% → round to ±1%)

**Output:**
```
[40±2% fine, 32±3% medium, 28±1% coarse] is optimal
```

---

### Example 3: With Material Names

**Formulations with Material IDs:**
```
Materials: ['fondu', 'alumina_calcined', 'chamotte_fine', 'chamotte_coarse']
```

**Output (with material names):**
```
[15±1% Fondu, 15±1% Alumina Calcined, 25±2% Chamotte Fine, 45±5% Chamotte Coarse] is optimal for balanced
```

**Output (cleaned up):**
```
[15±1% Fondu, 15±1% Alumina, 25±2% Fine Chamotte, 45±5% Coarse Chamotte] is optimal
```

---

## Implementation

### Interface

```typescript
interface ViableCompositionRange {
  componentRanges: Array<{
    index: number;
    materialId?: string;
    min: number;           // e.g., 38
    max: number;           // e.g., 42
    avg: number;           // e.g., 40
    tolerance: number;     // e.g., 2
    formatted: string;     // e.g., "40±2% fine"
  }>;
  
  summary: string;  // e.g., "[15±1% cement, 40±2% fine, 45±5% coarse] is optimal"
}
```

### Formatter Function

```typescript
function formatComponentRange(
  avg: number,
  tolerance: number,
  materialId?: string
): string {
  const avgRounded = Math.round(avg);
  const toleranceRounded = Math.round(tolerance);
  
  const baseFormat = `${avgRounded}±${toleranceRounded}%`;
  
  if (materialId) {
    const displayName = cleanMaterialName(materialId);
    return `${baseFormat} ${displayName}`;
  }
  
  return baseFormat;
}
```

### Summary Generator

```typescript
function generateRangeSummary(
  range: ViableCompositionRange,
  goal?: string
): string {
  const componentStrings = range.componentRanges.map(comp => 
    formatComponentRange(comp.avg, comp.tolerance, comp.materialId)
  );
  
  const compositionList = componentStrings.join(', ');
  const goalContext = goal ? ` for ${goal}` : '';
  
  return `[${compositionList}] is optimal${goalContext}`;
}
```

---

## Usage in Service

### In BlendOptimizerService

```typescript
// After detecting viable ranges
const viableRange = buildViableRange(
  formulations,
  score,
  tolerances,
  optimizationGoal
);

// viableRange.summary is now:
// "[15±1% cement, 40±2% fine, 45±5% coarse] is optimal for maxDensity"

// Return to user
return {
  viableRanges: [viableRange],
  // ...
};
```

### In API Response

```json
{
  "viableRanges": [
    {
      "score": 2.85,
      "count": 5,
      "summary": "[15±1% cement, 40±2% fine, 45±5% coarse] is optimal for maxDensity",
      "componentRanges": [
        {
          "index": 0,
          "materialId": "fondu",
          "min": 14,
          "max": 16,
          "avg": 15,
          "tolerance": 1,
          "formatted": "15±1% Fondu"
        },
        // ...
      ]
    }
  ]
}
```

---

## Frontend Display

### Simple Display

```
✓ Optimal Composition Found:
  [15±1% cement, 40±2% fine, 45±5% coarse]
  
  Score: 2.85
  Formulations: 5 variations give same result
```

### Detailed Display

```
Viable Range 1 (Score: 2.85, 5 formulations)

Composition:
  • 15±1% Cement Fondu (14-16% acceptable)
  • 40±2% Fine Chamotte (38-42% acceptable)
  • 45±5% Coarse Chamotte (40-50% acceptable)

Properties:
  • Density: 2.84-2.86 g/mL (avg: 2.85)
  • Porosity: 23-25% (avg: 24%)
  • Water Demand: 9.8-10.5% (avg: 10.1%)

✓ Any composition within this range performs identically!
```

---

## Benefits

### For Engineers

✅ **Quick Understanding**
- One glance shows target composition
- Immediately see allowable variation
- No need to analyze tables

✅ **Production Specs**
- Direct specification: "Use 15±1% cement"
- QC tolerances built-in
- Easy to communicate to production team

✅ **Flexibility**
- Can adjust within tolerance for cost/availability
- Knows which components are critical (tight tolerance)
- Knows which have flexibility (wide tolerance)

### For Software

✅ **Standardized Format**
- Consistent across all optimizations
- Easy to parse and display
- Machine-readable and human-readable

✅ **Self-Documenting**
- Format explains itself
- No need for separate documentation
- Clear what numbers mean

---

## Special Cases

### Fixed Components (±0%)

**Option 1: Show explicitly**
```
[15±0% cement, 40±2% fine, 45±5% coarse]
```

**Option 2: Hide tolerance for fixed**
```
[15% cement, 40±2% fine, 45±5% coarse]
```

### Very Small Tolerances (<1%)

**Round or show decimal:**
```
[15.0±0.5% cement, 40±2% fine]
```

### All Components Same Tolerance

**Keep explicit:**
```
[33±2% fine, 33±2% medium, 34±2% coarse]
```

Don't simplify to overall tolerance - each component shown separately.

---

## Test Examples

### Test Input

```typescript
const formulations = [
  { massFractionsRoundedPercent: [15, 38, 47] },
  { massFractionsRoundedPercent: [15, 40, 45] },
  { massFractionsRoundedPercent: [15, 42, 43] },
];

const tolerances = [1, 2, 5];
const materialIds = ['fondu', 'fine_chamotte', 'coarse_chamotte'];
```

### Expected Output

```typescript
{
  componentRanges: [
    { index: 0, materialId: 'fondu', avg: 15, tolerance: 1, formatted: '15±1% Fondu' },
    { index: 1, materialId: 'fine_chamotte', avg: 40, tolerance: 2, formatted: '40±2% Fine Chamotte' },
    { index: 2, materialId: 'coarse_chamotte', avg: 45, tolerance: 5, formatted: '45±5% Coarse Chamotte' },
  ],
  summary: '[15±1% Fondu, 40±2% Fine Chamotte, 45±5% Coarse Chamotte] is optimal'
}
```

---

## Summary

✅ **Format:** `[avg±tol% name, avg±tol% name, ...]`  
✅ **Example:** `[15±1% cement, 40±2% fine, 45±5% coarse]`  
✅ **Meaning:** Use avg value with ±tol variation acceptable  
✅ **Benefits:** Clear, actionable, production-ready specs  
✅ **Implementation:** Via `viable-range-formatter.util.ts`  

**Status:** ✅ Complete  
**Date:** February 3, 2026  
**Version:** 1.0 with Human-Readable Format

