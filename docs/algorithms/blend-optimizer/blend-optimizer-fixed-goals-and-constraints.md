# Fixed Fractions — Goals and Constraints

**Parent index:** [BLEND_OPTIMIZER_FIXED_FRACTIONS.md](./BLEND_OPTIMIZER_FIXED_FRACTIONS.md)

---

### ✅ Fixed Fractions Support

The system **already supports** fixed fractions through the `isFixed` property:

```typescript
interface Fraction {
  dMin_mm: number;
  dMax_mm: number;
  isFixed?: boolean;           // ← Mark as fixed
  massFraction?: number;        // ← Specify exact amount
  density_kgm3?: number;
}
```

**Example:**
```typescript
const fractions = [
  {
    dMin_mm: 0.001,
    dMax_mm: 0.045,
    isFixed: true,              // ← Fixed fraction
    massFraction: 0.15,          // ← Exactly 15%
    density_kgm3: 3100,          // CAC cement
  },
  {
    dMin_mm: 0.045,
    dMax_mm: 0.5,
    // isFixed: false (default)  // ← Variable fraction
    density_kgm3: 2700,          // Fine aggregate
  },
  {
    dMin_mm: 0.5,
    dMax_mm: 5.0,
    // isFixed: false (default)  // ← Variable fraction
    density_kgm3: 2650,          // Coarse aggregate
  },
];
```

**Result:** 
- CAC cement will be exactly 15% in all solutions
- Fine and coarse aggregates will be optimized for remaining 85%

---

## Optimization Goals

### Available Goals

```typescript
type OptimizationGoal = 
  | 'maxDensity'     // Maximize bulk density
  | 'minPorosity'    // Minimize porosity
  | 'minWater'       // Minimize water demand
  | 'minShrinkage'   // Minimize firing shrinkage
  | 'balanced';      // Balance all factors (DEFAULT)
```

### Goal Details

#### 1. `maxDensity` - Maximum Bulk Density
- **Score:** Bulk density (g/mL)
- **Use Case:** High-performance applications, wear resistance
- **Example:** Dense castables for steel ladles

#### 2. `minPorosity` - Minimum Porosity
- **Score:** 100 - porosity%
- **Use Case:** Low permeability, corrosion resistance
- **Example:** Molten metal contact areas

#### 3. `minWater` - Minimum Water Demand
- **Score:** 50 - waterDemand%
- **Use Case:** Faster drying, reduced shrinkage, lower cost
- **Example:** Quick installation projects

#### 4. `minShrinkage` - Minimum Firing Shrinkage
- **Score:** 100 - maxShrinkage%
- **Use Case:** Dimensional stability, crack prevention
- **Example:** Precision-fit linings

#### 5. `balanced` - Balanced Optimization (DEFAULT)
- **Score:** Average of all normalized factors
- **Formula:** `(densityScore + porosityScore + waterScore + shrinkageScore) / 4`
- **Use Case:** General-purpose, well-rounded formulations
- **Example:** Standard furnace linings

---

## Constraints

### Available Constraints

```typescript
interface BlendOptimizationOptions {
  // ...other options...
  
  /** Minimum acceptable packing efficiency (0-1) */
  minPackingEfficiency?: number;
  
  /** Maximum acceptable water demand (%) */
  maxWaterDemand?: number;
  
  /** Maximum acceptable porosity (%) */
  maxPorosity?: number;
}
```

### Constraint Examples

**Constraint 1: High-density requirement**
```typescript
options: {
  minPackingEfficiency: 0.72,  // At least 72% packing
}
```

**Constraint 2: Low water for fast drying**
```typescript
options: {
  maxWaterDemand: 10,  // Max 10% water
}
```

**Constraint 3: Low permeability**
```typescript
options: {
  maxPorosity: 25,  // Max 25% porosity
}
```

**Constraint 4: Combined constraints**
```typescript
options: {
  minPackingEfficiency: 0.70,
  maxWaterDemand: 12,
  maxPorosity: 30,
}
```

---

## Top N Results

Return only the best N solutions:

```typescript
options: {
  topN: 5,  // Return only top 5 results
  optimizationGoal: 'maxDensity',
}
```

**Result:** Returns 5 best formulations ranked by bulk density

---
