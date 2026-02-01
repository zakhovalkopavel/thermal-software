# Particle Size Distribution Optimization - Concepts

**Purpose:** Understanding the principles and workflow of blend optimization for refractory castables

---

## Why Optimize Particle Size Distribution?

### The Problem

Refractory castables consist of particles ranging from coarse aggregates (several millimeters) to ultra-fine reactive powders (submicron). The distribution of these particle sizes critically affects:

1. **Packing Density** - How tightly particles fit together
2. **Porosity** - Void space in the material
3. **Flowability** - How easily the mix flows and fills molds
4. **Water Demand** - Amount of water needed for workability
5. **Strength** - Both green strength and fired strength
6. **Shrinkage** - Dimensional changes during drying and firing

**Poor PSD:**
- High porosity (40-50%)
- Excessive water demand
- Low strength
- High shrinkage
- Unpredictable properties

**Optimized PSD:**
- Low porosity (20-30%)
- Minimal water demand
- High strength
- Controlled shrinkage
- Consistent, predictable properties

---

## The Optimization Workflow

### Complete Process

```
1. Define Requirements
   ↓
2. Select Materials & Size Fractions
   ↓
3. Choose PSD Model & Parameters
   ↓
4. Calculate Optimal Distribution
   ↓
5. Predict Packing Properties
   ↓
6. Estimate Shrinkage Behavior
   ↓
7. Evaluate Performance
   ↓
8. Refine & Iterate
```

### Step-by-Step Explanation

#### Step 1: Define Requirements

**Target Properties:**
- **Application temperature:** 1200°C, 1450°C, 1650°C?
- **Installation method:** Self-compacting, pumpable, vibratable, ramming?
- **Performance criteria:** RUL, thermal shock, erosion resistance?
- **Economic constraints:** Material costs, processing complexity?

**Example Requirement:**
```
Application: Rotary kiln lining
Temperature: 1450°C
Installation: Self-compacting (no vibration)
Constraint: Low shrinkage (< 3% linear)
```

#### Step 2: Select Materials & Size Fractions

**Material Selection:**
Based on temperature and chemistry requirements:
- **1200-1400°C:** Chamotte, alumina (70-85% Al₂O₃)
- **1400-1600°C:** Tabular alumina, spinel
- **1600-1800°C:** Fused alumina, magnesia

**Size Fraction Design:**

**Minimum 3 fractions:**
```
Coarse:   3-6 mm (aggregate, skeleton)
Medium:   0.5-2 mm (intermediate packing)
Fine:     < 0.1 mm (matrix, reactive binding)
```

**Optimal 4-6 fractions:**
```
1. Coarse-1:  3-6 mm
2. Coarse-2:  1-3 mm  
3. Medium:    0.1-1 mm
4. Fine:      0.01-0.1 mm (includes cement if used)
5. Ultra-fine: < 0.01 mm (optional, reactive alumina)
```

**Why multiple fractions?**
- Each size class fills voids left by larger particles
- Creates continuous packing from coarse to fine
- Minimizes total void volume
- Optimizes flowability

#### Step 3: Choose PSD Model & Parameters

**Model Selection:**

**Andreasen Model:**
```
P(D) = (D^q - D_min^q) / (D_max^q - D_min^q)
```

Used when:
- Traditional aggregate systems
- Well-defined minimum size
- Classic castable formulations

**Funk-Dinger Model:**
```
Same equation, but D_min = 0.001 mm (recommended)
```

Used when:
- Reactive fine powders present
- Cement-bonded systems
- Ultra-low cement formulations
- Nano-sized additives

**Parameter q (Distribution Modulus):**

Controls the distribution shape and consequently the flowability:

```
q = 0.21-0.25 → Self-compacting (highest fines)
q = 0.26-0.28 → Flowable (moderate-high fines)
q = 0.29-0.31 → Vibratable (moderate fines)
q = 0.32-0.37 → Hand-pressed (lowest fines)
```

**Physical meaning of q:**
- **Lower q:** More fine particles relative to coarse
  - Better flowability
  - Lower water demand  
  - Higher shrinkage risk
  - Better surface finish
  
- **Higher q:** More coarse particles relative to fine
  - Requires more compaction energy
  - Higher water demand
  - Lower shrinkage
  - More robust to variations

#### Step 4: Calculate Optimal Distribution

**Mathematical Calculation:**

For each size bin `[D_i-1, D_i]`:

```
1. Calculate cumulative fraction at lower boundary:
   P_lower = (D_i-1^q - D_min^q) / (D_max^q - D_min^q)

2. Calculate cumulative fraction at upper boundary:
   P_upper = (D_i^q - D_min^q) / (D_max^q - D_min^q)

3. Mass fraction in bin:
   w_i = P_upper - P_lower

4. Normalize to ensure sum = 1.0:
   w_i_normalized = w_i / Σw_i

5. Convert to percentages:
   percent_i = w_i_normalized × 100
   Round to integers, ensuring sum = 100%
```

**Example Output:**

For self-compacting mix (q=0.25):
```
Fraction 1 (3-6 mm):    28%
Fraction 2 (1-3 mm):    38%
Fraction 3 (0.1-1 mm):  22%
Fraction 4 (<0.1 mm):   12%
```

#### Step 5: Predict Packing Properties

**Packing Calculation (CPM or Furnas):**

```
Input: Mass fractions + Particle densities + Diameters
       ↓
Process: Account for size interactions, compaction
       ↓
Output: Packing fraction φ (0-1)
```

**Key Outputs:**

1. **Packing Fraction (φ):**
   ```
   φ = V_solids / V_total
   ```
   - Self-compacting: φ = 0.72-0.76
   - Vibratable: φ = 0.68-0.72
   - Hand-pressed: φ = 0.64-0.68

2. **Porosity:**
   ```
   Porosity = (1 - φ) × 100%
   ```
   - Lower is generally better
   - But minimum 15-20% needed for some applications

3. **Bulk Density (Green):**
   ```
   ρ_bulk = ρ_skeletal × φ
   ```
   Where ρ_skeletal = weighted average true density

4. **Water Absorption Estimate:**
   ```
   WA ≈ Porosity / (ρ_bulk × 10)
   ```

#### Step 6: Estimate Shrinkage Behavior

**Chemical Shrinkage (Drying):**

From cement hydration/dehydration:
```
ΔV_chem = k × (w/c) × cement_fraction

where:
k = 0.064 for Portland cement
k = 0.12 for Calcium aluminate cement
w/c = water/cement ratio
```

**Sintering Shrinkage (Firing):**

Using Master Sintering Curve (MSC):
```
At each temperature T:
1. Calculate sintering parameter Θ(t,T)
2. Estimate relative density increase
3. Calculate volumetric shrinkage
4. Convert to linear shrinkage: ΔL/L ≈ ΔV/V / 3
```

**Total Shrinkage:**
```
Total Linear Shrinkage = Chemical + Sintering

Typical ranges:
- Low: 1-2% (low cement, minimal sintering)
- Medium: 2-4% (moderate cement, some sintering)
- High: 4-6% (high cement, significant sintering)
```

#### Step 7: Evaluate Performance

**Check against requirements:**

| Property | Target | Predicted | Status |
|----------|--------|-----------|--------|
| Flowability | Self-compacting | q=0.25 → SC | ✓ |
| Packing density | > 0.72 | 0.74 | ✓ |
| Porosity | < 30% | 26% | ✓ |
| Linear shrinkage | < 3% | 2.8% | ✓ |
| Bulk density | > 2.2 g/cm³ | 2.33 g/cm³ | ✓ |

**Decision:**
- All targets met → Proceed to experimental validation
- Targets not met → Iterate (adjust q, materials, or fractions)

#### Step 8: Refine & Iterate

**Common adjustments:**

**If water demand too high:**
- Decrease q (add more fines)
- Check particle shape (angular vs rounded)
- Verify material dispersion properties

**If shrinkage too high:**
- Increase q (reduce fines)
- Reduce cement content
- Select less reactive materials
- Lower firing temperature

**If strength insufficient:**
- Check packing density
- Verify cement content
- Review firing profile
- Consider reactive fines addition

---

## Key Concepts Explained

### 1. Particle Packing

**Random Close Packing (RCP):**
- Mono-sized spheres: φ = 0.64
- This is the baseline
- Real particles pack worse (shape) or better (size distribution)

**Binary Packing:**
Two sizes can pack better than mono-sized:
```
Large particles: Form skeleton (φ ≈ 0.64)
Small particles: Fill voids
Combined: φ ≈ 0.72-0.75
```

**Continuous Distribution:**
Many size classes pack even better:
```
Optimized PSD: φ ≈ 0.72-0.78
```

### 2. Flowability Categories

**Self-Compacting:**
- Flows like a thick liquid
- No vibration needed
- q ≈ 0.23-0.26
- High fines content (30-40% < 0.1 mm)

**Flowable:**
- Flows under gravity
- Minimal vibration
- q ≈ 0.27-0.29
- Moderate fines (20-30% < 0.1 mm)

**Vibratable:**
- Needs vibration to flow
- Standard castables
- q ≈ 0.30-0.32
- Lower fines (15-25% < 0.1 mm)

**Hand-Pressable:**
- Requires manual compaction
- Plastic consistency
- q ≈ 0.33-0.37
- Low fines (10-20% < 0.1 mm)

### 3. Size Ratio Importance

**Optimal size ratios between adjacent fractions:**
```
D_i / D_i+1 ≈ 3-5
```

**Example:**
```
Fraction 1: 6 mm (max)
Fraction 2: 1.5 mm (ratio ≈ 4)
Fraction 3: 0.3 mm (ratio ≈ 5)
Fraction 4: 0.06 mm (ratio ≈ 5)
```

**Why?**
- Smaller particles can fit in voids of larger
- Avoids "same size" loosening effect
- Too large ratio: Incomplete void filling
- Too small ratio: Inefficient packing

### 4. Water Demand

**Relationship to PSD:**

```
Water needed = f(surface area, packing density)
```

**More fines → More surface area → More water**
BUT
**Better packing → Less voids → Less water**

**Optimized PSD minimizes water by:**
- Maximizing packing (reduces void water)
- Balancing surface area (not too much fines)
- Typical: 16-22% water for self-compacting

### 5. Green vs Fired Properties

**Green State (After Casting, Before Firing):**
- Packing determines bulk density
- Water fills remaining voids
- Chemical bonds (cement) develop

**Fired State (After Thermal Treatment):**
- Water removed → shrinkage
- Sintering → densification
- Ceramic bonds form
- Final properties established

**The optimization targets both:**
- Good green properties (flowability, strength)
- Predictable fired properties (shrinkage, porosity)

---

## Practical Example: Complete Workflow

### Requirement

```
Application: Steel ladle lining
Service temperature: 1550°C
Installation: Self-compacting (tight geometries)
Constraints: Low shrinkage, high thermal shock
```

### Solution Development

**Step 1: Material Selection**
```
Based on 1550°C requirement:
- Tabular alumina (99% Al₂O₃)
- Calcium aluminate cement (bonding)
- Reactive alumina (matrix filler)
```

**Step 2: Fraction Design**
```
Fraction 1: 3-6 mm Tabular alumina
Fraction 2: 1-3 mm Tabular alumina
Fraction 3: 0.1-1 mm Tabular alumina
Fraction 4: <0.1 mm CAC + Reactive alumina
```

**Step 3: PSD Optimization**
```
Model: Andreasen
Target: q = 0.25 (self-compacting)
D_min: 0.001 mm
D_max: 6 mm
```

**Step 4: Calculated Distribution**
```
Fraction 1: 28%
Fraction 2: 38%
Fraction 3: 22%
Fraction 4: 12% (8% CAC + 4% Reactive alumina)
```

**Step 5: Predicted Properties**
```
Packing fraction: φ = 0.74
Bulk density (green): 2.35 g/cm³
Porosity (green): 26%
Estimated water: 18%
```

**Step 6: Shrinkage Prediction**
```
Chemical (8% CAC, w/c=0.35): 0.27% volumetric → 0.09% linear
Sintering (1550°C, alumina): ~0.5% volumetric → 0.17% linear
Total linear shrinkage: 0.26% (very low!) ✓
```

**Step 7: Verification**
```
✓ Self-compacting achieved (q=0.25)
✓ Low shrinkage (< 1%)
✓ High packing (74%)
✓ Suitable for 1550°C (alumina-based)
```

**Step 8: Experimental Validation**
```
Next: Mix trial batch
      Measure: Flow test, density, shrinkage
      Adjust: Fine-tune based on results
```

---

## Common Misconceptions

### ❌ Myth 1: "More fines is always better"

**Reality:** While fines improve flowability, excessive fines cause:
- High water demand
- Excessive shrinkage
- Cracking risk
- Increased cost

**Optimal:** Balance determined by PSD model

### ❌ Myth 2: "Packing models are just theoretical"

**Reality:** Models match experiments to ±5% when:
- Materials are properly characterized
- Mixing is uniform
- Measurements are careful
- Calibration is done

### ❌ Myth 3: "Same q works for all materials"

**Reality:** Optimal q depends on:
- Particle shape (angular vs rounded)
- Material type (oxide, carbide, etc.)
- Bonding system (cement vs colloidal)
- Installation method

**Typical range:** q = 0.23-0.33 for most refractories

### ❌ Myth 4: "Optimization is one-time"

**Reality:** Optimization is iterative:
- Theoretical calculation → initial guess
- Experimental validation → refine
- Production trials → final adjustment
- Continuous monitoring → long-term optimization

---

## Benefits of Systematic Optimization

### Economic Benefits

1. **Reduced Material Cost:**
   - Optimal aggregate/fine ratio
   - Less waste from trial-and-error
   - Predictable consumption

2. **Lower Installation Cost:**
   - Better flowability → faster installation
   - Less labor (no vibration for SC mixes)
   - Fewer defects → less rework

3. **Extended Service Life:**
   - Lower porosity → better corrosion resistance
   - Controlled shrinkage → fewer cracks
   - Optimized properties → longer campaigns

### Technical Benefits

1. **Predictable Performance:**
   - Properties calculable before mixing
   - Reduced experimental iterations
   - Consistent batch-to-batch

2. **Better Quality:**
   - Optimized packing → higher strength
   - Lower porosity → better resistance
   - Controlled shrinkage → dimensional stability

3. **Process Control:**
   - Documented formulations
   - Traceable development
   - Reproducible results

---

## Conclusion

Particle size distribution optimization is a powerful tool that transforms refractory formulation from art to science. By combining:
- **PSD models** (Andreasen, Funk-Dinger)
- **Packing theories** (CPM, Furnas)
- **Shrinkage predictions** (Chemical, MSC)

We achieve:
- Predictable properties
- Reduced development time
- Optimized performance
- Lower costs

The workflow presented here provides a systematic approach applicable to any refractory castable development project.

---

**Related Documentation:**
- PSD_ALGORITHMS.md - Mathematical details
- PACKING_MODELS.md - Packing theories
- docs/BLEND_OPTIMIZER_GUIDE.md - User guide
- docs/spec.md - Complete technical specification

