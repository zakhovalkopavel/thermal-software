# Water Demand Algorithm

**Module:** BlendOptimizerService  
**Purpose:** Calculate water demand (workability) based on packing density and porosity  
**Date:** February 2, 2026

---

## Overview

Water demand is the amount of water needed to achieve desired workability in refractory castables. It is **NOT equal to porosity** but rather a fraction of available void space that must be filled to enable particle flow and hydration.

### Key Insight

```
Water_Demand ≈ 0.35-0.50 × Porosity (depending on workability)
```

**Example:**
- Porosity = 25% (void space)
- Water demand = 10.5% (standard workability) = 0.42 × 25%
- **Water fills only ~42% of available voids**

---

## Physical Principle

### Why Water Demand << Porosity

1. **Water's primary role:** Enable flowability and hydration
2. **Not all voids need water:** Only smallest voids matter for particle mobility
3. **Excess water harmful:** Creates:
   - Additional shrinkage during drying
   - Reduced green strength
   - Extended drying time
   - Potential cracking

### Critical Voids vs Total Voids

```
Total Voids (Porosity) = All space between particles
Critical Voids = Space that needs water for workability
Water Fills ≈ Critical Voids ≈ 35-50% of Total Voids
```

---

## Mathematical Model

### Formula

```
Water_Demand (%) = Workability_Factor × (1 - φ_packing) × 100

Where:
- φ_packing = Packing fraction (0-1)
- (1 - φ_packing) = Porosity (decimal, 0-1)
- Workability_Factor = 0.35-0.50 (depends on type)
```

### Workability Factors

| Workability | Factor | Description | Use Case |
|-------------|--------|-------------|----------|
| **Firm** | 0.38 | Minimum water for workability | Pressed castables, vibration-intensive |
| **Standard** | 0.42 | Balanced flow and strength | Default, most applications |
| **Flowable** | 0.50 | Maximum water for self-flow | Self-flowing, pumpable castables |

### Derivation from Porosity

```
Given:
- φ_packing = packing fraction
- Porosity_decimal = (1 - φ_packing)
- Porosity_percent = Porosity_decimal × 100

Then:
Water_Demand_percent = Factor × Porosity_percent
                     = Factor × (1 - φ_packing) × 100
```

---

## Examples

### Example 1: High-Alumina Castable (Standard Workability)

**Input:**
```
Packing Fraction (φ) = 0.74
Workability = Standard (0.42)
```

**Calculation:**
```
Porosity = (1 - 0.74) × 100 = 26%
Water_Demand = 0.42 × 26 = 10.9%
```

**Result:**
```
Water Demand = 10.9% by mass
Typical Range = 10-12% (industry standard)
```

### Example 2: Self-Flowing Castable (Flowable Workability)

**Input:**
```
Packing Fraction (φ) = 0.73
Workability = Flowable (0.50)
```

**Calculation:**
```
Porosity = (1 - 0.73) × 100 = 27%
Water_Demand = 0.50 × 27 = 13.5%
```

**Result:**
```
Water Demand = 13.5% by mass
Typical Range = 12-14% (self-flowing range)
```

### Example 3: Ultra-Dense Castable (Standard Workability)

**Input:**
```
Packing Fraction (φ) = 0.80 (with micro-fillers)
Workability = Standard (0.42)
```

**Calculation:**
```
Porosity = (1 - 0.80) × 100 = 20%
Water_Demand = 0.42 × 20 = 8.4%
```

**Result:**
```
Water Demand = 8.4% by mass
Typical Range = 7-9% (dense castables)
```

---

## Algorithm Implementation

### Code Structure

```typescript
calculateWaterDemand(
  packingFraction: number,
  workability: 'firm' | 'standard' | 'flowable' = 'standard'
): number
```

**Steps:**
1. Look up workability factor (0.38, 0.42, or 0.50)
2. Calculate porosity: `porosity = (1 - φ_packing)`
3. Calculate water demand: `waterDemand = factor × porosity × 100`
4. Return rounded to 1 decimal place

### Pseudocode

```
function calculateWaterDemand(phi, workability):
  factors = {
    'firm': 0.38,
    'standard': 0.42,
    'flowable': 0.50
  }
  
  factor = factors[workability]
  porosity = (1 - phi)           // Convert to decimal (0-1)
  waterDemand = factor * porosity * 100  // Convert to percent
  
  return round(waterDemand, 1 decimal)
```

### Python Reference

```python
def calculate_water_demand(packing_fraction, workability='standard'):
    """
    Calculate water demand based on packing and workability.
    
    Args:
        packing_fraction: φ (0-1)
        workability: 'firm', 'standard', or 'flowable'
    
    Returns:
        Water demand as % by mass
    """
    factors = {
        'firm': 0.38,
        'standard': 0.42,
        'flowable': 0.50
    }
    
    factor = factors[workability]
    porosity = 1 - packing_fraction
    water_demand = factor * porosity * 100
    
    return round(water_demand, 1)
```

---

## Relationship to Packing Models

### Integration with CPM/Furnas

```
Workflow:
1. Calculate PSD (Andreasen or Funk-Dinger)
2. Calculate Packing (CPM or Furnas)
   ↓ Returns packingFraction (φ)
3. Calculate Water Demand
   ↓ Uses φ to determine water needed
```

### Result Example

```typescript
// From packing calculation
packingResult = {
  packingFraction_phi: 0.74,
  porosity_percent_green: 26.0,
  composition: {
    hasMicroFillers: false,
    packingQuality: 'good'
  }
}

// Calculate water demand using φ
waterDemandStandard = 0.42 × (1 - 0.74) × 100 = 10.9%
waterDemandRange = {
  min: 9.9%  (firm)
  typical: 10.9% (standard)
  max: 13.0% (flowable)
}
```

---

## Validation & Constraints

### Physical Limits

| Constraint | Condition | Reason |
|-----------|-----------|--------|
| **0% minimum** | WaterDemand ≥ 0% | No negative water |
| **50% maximum** | WaterDemand ≤ 50% | Never fill >50% of voids (would be 100% with flowable) |
| **Monotonic increase** | More porosity → more water needed | Higher φ cap means less water |
| **Factor order** | firm < standard < flowable | More flow requires more water |

### Input Validation

```
- φ_packing: must be in [0.5, 0.95]
  (typical packing range)
  
- workability: must be 'firm', 'standard', or 'flowable'
  (defaults to 'standard')
```

### Output Validation

```
- Result must be number
- Formatted to 1 decimal place
- Range for standard: typically 8-14%
```

---

## Research Backing

### Literature References

**Water-Void Relationship:**

1. **de Larrard (1999)** - "Concrete Mixture Proportioning"
   - Water demand ≈ 40-45% of void volume
   - Standard reference for cement-based materials
   - Applies to refractory castables by analogy

2. **Banerjee (2004)** - "Monolithic Refractories"
   - Refractory castables need 35-50% water fill for workability
   - Higher water needed for self-flowing systems
   - Conservative limits for vibrated systems

3. **Pileggi et al. (2001)** - "Novel Rheometer for Refractory Castables"
   - Rheology depends on water-void ratio, not absolute water%
   - Confirms proportional relationship to porosity
   - Shows workability factor varies with design

### Empirical Data

**Typical Industrial Values:**

| Material Type | Typical Porosity | Typical Water | Ratio |
|---------------|-----------------|---------------|-------|
| High-alumina | 24-28% | 10-12% | 0.40-0.42 |
| Magnesia | 20-25% | 8-10% | 0.40-0.44 |
| Self-flowing | 22-26% | 11-13% | 0.45-0.50 |
| Vibratable | 24-28% | 9-12% | 0.38-0.42 |
| Ultra-dense | 18-22% | 6-8% | 0.35-0.40 |

---

## Usage in Blend Optimizer

### Integration Point

```typescript
// In optimize() method:
const packingResult = this.packingService.calculateCPM({...});

// Add water demand calculation:
const porosity_percent = (1 - packingResult.packingFraction_phi) * 100;
const waterDemand = this.calculateWaterDemand(
  packingResult.packingFraction_phi,
  'standard'
);

// Or get range:
const waterDemandRange = this.calculateWaterDemandRange(
  packingResult.packingFraction_phi
);
```

### Result Addition

```typescript
results.push({
  // ...existing fields...
  porosity_percent_green: porosity_percent,
  waterDemand_percent: waterDemand,
  waterDemandRange: {
    min: waterDemandRange.min,
    typical: waterDemandRange.typical,
    max: waterDemandRange.max
  }
});
```

---

## Design Decisions & Trade-offs

### Why 0.42 is Default for Standard Workability

```
0.38 (firm)    - Minimum for vibrated systems
0.42 (standard) - Balanced: good flow + strength (RECOMMENDED)
0.50 (flowable) - Maximum for self-flowing (high cost, shrinkage)
```

**Choice of 0.42:**
- ✅ Widely proven in literature (de Larrard, Banerjee)
- ✅ Provides good balance between workability and strength
- ✅ Reduces drying shrinkage vs 0.50
- ✅ Allows for casting method variations
- ✅ Industry standard for most castables

### Factors Not Included

The model does **NOT** account for:
- Binder type (CAC vs silicate) → Users adjust with waterCementRatio
- Temperature dependence → Handled in shrinkage calculator
- Aggregate surface texture → Approximated in porosity
- Mix additives (plasticizers, retarders) → Domain-specific

These can be addressed with a **calibration multiplier**:

```typescript
const calibratedWaterDemand = baseWaterDemand × calibrationFactor;
// calibrationFactor: 0.9-1.1 (±10% from base)
```

---

## Testing Strategy

### Test Categories

1. **Unit Tests** (basic calculations)
   - Individual workability factors
   - Edge cases (φ near 0, 1)
   - Output formatting

2. **Integration Tests** (with packing)
   - Realistic porosity ranges
   - Workability ranges
   - Real-world scenarios

3. **Validation Tests** (physical constraints)
   - Output bounds (0-50%)
   - Monotonicity (firm < standard < flowable)
   - Relationship to porosity

4. **Real-world Tests** (industry standards)
   - High-alumina typical values
   - Magnesia typical values
   - Self-flowing vs vibratable

See: `backend/test/unit/refractory/services/blend-optimizer.water-demand.spec.ts`

---

## Future Enhancements

1. **Adaptive Factors** - Adjust 0.42 based on:
   - Material composition
   - Ambient temperature
   - Mixing method

2. **Temperature Correction** - Account for:
   - Evaporation rate
   - Setting speed
   - Hydration kinetics

3. **Binder-Specific Models** - Different factors for:
   - CAC (calcium aluminate cement)
   - Silicate binders
   - Hybrids

4. **Additives Module** - Adjust for:
   - Plasticizers (reduce water 2-5%)
   - Retarders (allow higher water)
   - Accelerators (require less water)

---

## Conclusion

The water demand algorithm provides a **physics-based, literature-backed method** to estimate water requirements from packing density. Key points:

✅ **Not equal to porosity** - Only 35-50% of voids need filling  
✅ **Workability-driven** - Different factors for firm/standard/flowable  
✅ **Research-validated** - Based on de Larrard, Banerjee, Pileggi  
✅ **Industry-aligned** - Matches typical castable water ranges  
✅ **Easily integrated** - Works with existing packing calculations  
✅ **Extensible** - Supports future refinements and calibrations  

---

**Implementation:** `backend/src/modules/refractory/services/blend-optimizer.service.ts`  
**Tests:** `backend/test/unit/refractory/services/blend-optimizer.water-demand.spec.ts`  
**Related:** PACKING_MODELS.md, BLEND_OPTIMIZER_ALGORITHM.md

