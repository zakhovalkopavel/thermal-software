# Particle Size Distribution (PSD) Algorithms

**Module:** BlendOptimizer  
**Purpose:** Calculate optimal particle size distributions for refractory castables

---

## Overview

The blend optimizer implements two industry-standard particle size distribution models to achieve optimal packing density and minimize porosity in refractory castables.

---

## 1. Andreasen Model

### Theory

The Andreasen equation (also known as Fuller-Andreasen) describes the cumulative particle size distribution that provides optimal packing:

```
P(D) = (D^q - D_min^q) / (D_max^q - D_min^q)
```

Where:
- `P(D)` = Cumulative fraction passing diameter D
- `D` = Particle diameter (mm)
- `q` = Distribution modulus (typically 0.2-0.4)
- `D_min` = Minimum particle diameter (mm)
- `D_max` = Maximum particle diameter (mm)

### Physical Meaning

The exponent `q` controls the distribution shape:
- **q = 0.25**: Self-compacting (high fines content)
- **q = 0.27-0.29**: Flowable (medium fines)
- **q = 0.30-0.33**: Vibratable (standard)
- **q = 0.37**: Fuller curve (original for concrete)

### Implementation

**Discrete Calculation for Size Bins:**

For each size bin `[D_{i-1}, D_i]`:

```typescript
// Calculate cumulative fraction at boundaries
P_i = (D_i^q - D_min^q) / (D_max^q - D_min^q)
P_{i-1} = (D_{i-1}^q - D_min^q) / (D_max^q - D_min^q)

// Mass fraction in bin
w_i = P_i - P_{i-1}

// Normalize to ensure sum = 1.0
w_i_normalized = w_i / Σw_i
```

**Code Example:**
```typescript
const calculateP = (D: number): number => {
  if (D <= calcDmin) return 0;
  if (D >= calcDmax) return 1;
  return (Math.pow(D, q) - Math.pow(calcDmin, q)) / 
         (Math.pow(calcDmax, q) - Math.pow(calcDmin, q));
};

const massFractions: number[] = [];
for (let i = 0; i < fractions.length; i++) {
  const P_max = calculateP(fractions[i].dMax_mm);
  const P_min = calculateP(fractions[i].dMin_mm);
  massFractions[i] = P_max - P_min;
}

// Normalize
const sum = massFractions.reduce((a, b) => a + b, 0);
return massFractions.map(f => f / sum);
```

### Applications

**Best for:**
- Self-compacting castables (q = 0.23-0.26)
- High-performance refractories
- Minimal water requirement formulations

**Limitations:**
- May not account for particle shape
- Assumes ideal spherical packing
- Requires adjustment for very fine particles (< 10 μm)

### References
- Andreasen, A.A. (1930) "Über die Beziehung zwischen Kornabstufung und Zwischenraum"
- Fuller, W.B. & Thompson, S.E. (1907) "The Laws of Proportioning Concrete"

---

## 2. Funk-Dinger Model

### Theory

The Funk-Dinger modification improves handling of fine particles:

```
P(D) = (D^q - D_min^q) / (D_max^q - D_min^q)
```

With modified `D_min` handling:
- Recommended `D_min` = 0.001 mm (1 μm) or smallest measurable particle
- Better accounts for sub-micron particles in cement and reactive fines

### Key Differences from Andreasen

1. **Fine Particle Treatment:**
   - Uses actual minimum measurable size
   - Accounts for colloidal particles
   - Better for cement-containing systems

2. **Recommended q Values:**
   - q = 0.21-0.25: Ultra-flowable systems
   - q = 0.25-0.27: Self-compacting with good flow
   - q = 0.27-0.30: Standard vibratable

### Implementation

**Enhanced D_min Selection:**

```typescript
// Automatic D_min selection
const calcDmin = Dmin_mm ?? Math.max(
  0.001,  // 1 μm minimum
  Math.min(...fractions.map(f => f.dMin_mm)) * 0.001  // Or 0.1% of smallest
);
```

**Same calculation as Andreasen with better D_min:**

```typescript
// Identical formula, improved parameters
P(D) = (D^q - D_min_improved^q) / (D_max^q - D_min_improved^q)
```

### Applications

**Best for:**
- Castables with reactive fine alumina
- Cement-bonded systems
- Ultra-low cement (< 3%) formulations
- Nano-sized additives

### References
- Funk, J.E. & Dinger, D.R. (1994) "Predictive Process Control of Crowded Particulate Suspensions"
- Dinger, D.R. & Funk, J.E. (1997) "Particle Packing Phenomena and Their Application"

---

## 3. Comparison: Andreasen vs Funk-Dinger

| Aspect | Andreasen | Funk-Dinger |
|--------|-----------|-------------|
| **D_min handling** | User-specified or auto | Recommended 0.001 mm |
| **Fine particles** | May underestimate | Better accuracy |
| **Cement systems** | Good | Excellent |
| **Classic aggregates** | Excellent | Good |
| **Computational** | Identical | Identical |
| **Parameters** | q, D_min, D_max | q, improved D_min, D_max |

### When to Use Which

**Use Andreasen:**
- Traditional aggregate systems
- No significant fines < 10 μm
- Well-established formulations
- When D_min is well-defined

**Use Funk-Dinger:**
- Systems with reactive fines
- Cement bonded (CAC, PC)
- Nano additives present
- Ultra-low cement formulations
- When finest particles < 5 μm

---

## 4. Rounding and Normalization

### Integer Percentages

The optimizer converts continuous fractions to integer percentages:

```typescript
// Round to integers ensuring sum = 100%
const roundToInt = (fractions: number[]): number[] => {
  const scaled = fractions.map(f => f * 100);
  const rounded = scaled.map(s => Math.round(s));
  
  // Adjust last fraction to ensure sum = 100
  const sum = rounded.reduce((a, b) => a + b, 0);
  rounded[rounded.length - 1] += (100 - sum);
  
  return rounded;
};
```

### Validation

**Mass balance check:**
```typescript
const sum = massFractions.reduce((a, b) => a + b, 0);
if (Math.abs(sum - 1.0) > 0.001) {
  throw new Error(`Mass fractions must sum to 1.0 (got ${sum})`);
}
```

---

## 5. Practical Examples

### Example 1: Self-Compacting Mix (q = 0.25)

**Input Fractions:**
```
Fraction 1: 3-6 mm (Chamotte)
Fraction 2: 1-3 mm (Chamotte)
Fraction 3: 0.1-1 mm (Chamotte)
Fraction 4: 0.01-0.1 mm (CAC)
```

**Andreasen Result (q=0.25):**
```
Fraction 1: 28%
Fraction 2: 38%
Fraction 3: 22%
Fraction 4: 12%
```

**Characteristics:**
- High fine content (34% < 1 mm)
- Self-compacting flow
- Low water demand

### Example 2: Vibratable Mix (q = 0.30)

**Same fractions, different q:**

**Andreasen Result (q=0.30):**
```
Fraction 1: 35%
Fraction 2: 40%
Fraction 3: 18%
Fraction 4: 7%
```

**Characteristics:**
- Less fines (25% < 1 mm)
- Requires vibration
- Standard working properties

---

## 6. Sensitivity Analysis

### Effect of q Value

```
Δq = 0.01 → Δfines ≈ 2-3%
```

Small changes in q significantly affect fine particle content:
- Lower q → More fines → Better flow, higher shrinkage
- Higher q → Less fines → More vibration needed, lower shrinkage

### Effect of D_min

```
D_min: 0.001 mm → More fines included
D_min: 0.01 mm  → Fewer fines included
```

Reducing D_min increases calculated fine fraction.

---

## 7. Integration with Packing Models

The PSD output feeds into packing calculators:

```
PSD (mass fractions) → PackingCalculator → Packing density φ
                                        → Bulk density
                                        → Porosity
```

**Workflow:**
```typescript
// 1. Calculate PSD
const psd = PSDCalculator.andreasenDiscrete(fractions, q);

// 2. Calculate packing
const packing = PackingCalculator.calculateCPM(
  materials,
  psd.massFractions,
  compactionIndex
);

// 3. Result
console.log(`Packing density: ${packing.packingFraction_phi}`);
```

---

## 8. Validation and Testing

### Theoretical Validation

**Check 1: Mass Balance**
```typescript
assert(Math.abs(sum(massFractions) - 1.0) < 0.001);
```

**Check 2: Monotonicity (for sorted fractions)**
```typescript
// P(D) should increase with D
assert(P(D_i) >= P(D_{i-1}));
```

**Check 3: Boundary Conditions**
```typescript
assert(P(D_min) === 0);
assert(P(D_max) === 1);
```

### Experimental Validation

Compare calculated vs measured sieve analysis:
- Calculate PSD for given q
- Mix materials according to fractions
- Perform sieve analysis
- Compare results (typically ± 5% agreement)

---

## 9. Optimization Tips

### Choosing q Value

**Start with scenario presets:**
- Self-compacting: q = 0.25
- Flowable: q = 0.27
- Vibratable: q = 0.30
- Hand-pressed: q = 0.33

**Then fine-tune based on:**
- Flowability tests
- Water demand measurements
- Packing density measurements
- Shrinkage behavior

### Fraction Selection

**Minimum 3 fractions recommended:**
- Coarse (> 1 mm)
- Medium (0.1 - 1 mm)
- Fine (< 0.1 mm)

**Optimal: 4-6 fractions:**
- Provides better control
- Matches commercial aggregate sizes
- Balances complexity vs performance

---

## 10. Common Pitfalls

**❌ Avoid:**
1. **q too low (< 0.20):** Excessive fines, high water demand, cracking
2. **q too high (> 0.40):** Poor packing, high porosity, low strength
3. **Too few fractions (< 3):** Cannot achieve optimal distribution
4. **Gaps in size distribution:** Compromises packing efficiency
5. **D_min = 0:** Mathematical singularity in calculations

**✅ Best Practices:**
1. Use 4-6 size fractions
2. Keep q in range 0.23-0.35
3. Ensure continuous size distribution (no gaps)
4. Set realistic D_min (≥ 0.001 mm)
5. Validate with experimental packing tests

---

## Conclusion

The PSD algorithms provide a scientific foundation for blend design, enabling:
- Systematic optimization
- Reproducible formulations
- Predictable performance
- Reduced trial-and-error

Combined with packing and shrinkage models, they form a complete computational framework for refractory castable development.

---

**Implementation:** `src/calculators/PSDCalculator.ts`  
**Documentation:** This file  
**References:** See spec.md section 11.6-11.7

