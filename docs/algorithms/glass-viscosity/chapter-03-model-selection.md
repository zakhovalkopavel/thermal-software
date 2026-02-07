# Chapter 3: Model Selection Framework

**Part II: Composition-Dependent Models**

---

## Overview

Different glass systems require different viscosity models because:
1. **Structural differences:** Silicate vs borate vs aluminate vs phosphate networks
2. **Modifier interactions:** Alkali vs alkaline earth vs heavy metal oxides
3. **Temperature dependencies:** Arrhenius vs VFT behavior
4. **Valid composition ranges:** Each model validated only for specific ranges

**Solution:** Automatic system detection based on composition

---

## System Classification

### 8 Glass System Types

```
1. Soda-Lime-Silica (SLS)     → 70% of commercial glass production
2. Borosilicate                → Laboratory glass, Pyrex
3. Aluminosilicate             → High-temperature resistant glass
4. Lead Glass                  → Crystal, optical applications
5. Pure Silica                 → Optical fibers, reference material
6. Sodium Silicate             → Binary system, high alkali
7. Calcium-Aluminate Slags     → Metallurgical applications
8. Multi-Component Mixing      → Fallback for complex compositions
```

---

## Detection Algorithm

### Decision Tree

```
Composition Analysis
    ↓
Is SiO2 > 99%? 
    YES → Pure Silica
    NO ↓
Is PbO > 15%?
    YES → Lead Glass
    NO ↓
Is B2O3 > 7% AND SiO2 > 70% AND alkali < 10%?
    YES → Borosilicate
    NO ↓
Is Al2O3 > 12% AND SiO2 50-70%?
    YES → Aluminosilicate
    NO ↓
Is CaO > 30% AND SiO2 < 50%?
    YES → Calcium-Aluminate Slag
    NO ↓
Is SiO2 > 60% AND Na2O > 18% AND others < 5%?
    YES → Sodium Silicate (binary)
    NO ↓
Is SiO2 65-80% AND alkali 8-20% AND alkaline earth 3-20%?
    YES → Soda-Lime-Silica (default commercial)
    NO ↓
    → Multi-Component Mixing (low confidence)
```

### Implementation

**See Chapter 12, Phase 1** for complete TypeScript implementation

---

## Model Types

### Type 1: VFT (Vogel-Fulcher-Tammann)

**Equation:**
```
log₁₀(η) = A + B/(T - T₀)
```

**Where:**
- A = pre-exponential constant (dimensionless)
- B = activation energy parameter (K)
- T₀ = VFT temperature (K), also called T∞
- T = absolute temperature (K)

**Used for:**
- Soda-Lime-Silica
- Borosilicate
- Aluminosilicate
- Pure Silica
- Multi-Component Mixing

**Characteristics:**
- **Non-Arrhenius behavior** near glass transition
- T₀ represents temperature where viscosity → ∞ (theoretical)
- Better fit than Arrhenius for most glasses
- 3 parameters to fit

### Type 2: Arrhenius

**Equation:**
```
ln(η) = A + B/T
```

**Where:**
- A = pre-exponential constant
- B = activation energy / R (K)
- T = absolute temperature (K)

**Used for:**
- Lead Glass (PbO-containing)
- Slags (at high temperature)

**Characteristics:**
- **Linear** ln(η) vs 1/T plot
- Simpler than VFT (2 parameters)
- Works well for lead glasses
- Less accurate near glass transition

---

## System Comparison Table

| System | Model Type | Components | A Range | B Range (K) | T₀ Range (K) | Temp Range (°C) |
|--------|------------|-----------|---------|-------------|--------------|-----------------|
| Soda-Lime-Silica | VFT | 7 | -3.5 to -2.5 | 12,000-16,000 | 200-400 | 500-1400 |
| Borosilicate | VFT | 5 | -4.5 to -3.5 | 14,000-18,000 | 100-300 | 400-1400 |
| Aluminosilicate | VFT | 8 | -5.0 to -4.0 | 16,000-22,000 | 200-500 | 900-1600 |
| Lead Glass | Arrhenius | 5 | -7.5 to -6.5 | 11,000-14,000 | N/A | 400-1100 |
| Pure Silica | VFT | 1 | -2.8 | 13,500 | 475 | 1100-2300 |
| Sodium Silicate | VFT | 2 | varies | 6,200-7,500 | 200-250 | 700-1300 |
| CaO-Al2O3 Slag | Urbain | 6 | -0.5 to 0.5 | 2,500-4,500 | N/A | 1300-1600 |
| Multi-Component | VFT | All | -3.5 | 14,000 | 300 | 300-1600 |

---

## Composition Range Validation

### Why Ranges Matter

**Example - MgO behavior:**
- **In Soda-Lime-Silica:** Acts as network former (+30 to +40 K/wt%)
- **In Aluminosilicate:** Acts as network modifier (-45 to -60 K/wt%)

**Same component, opposite effect!** This is why composition ranges are critical.

### Range Checking

For each detected system, verify ALL components are within validated ranges:

**Example - Soda-Lime-Silica:**
```typescript
Valid Ranges:
  SiO2: 65-80%
  Na2O+K2O: 10-18%
  CaO+MgO: 5-15%
  Al2O3: 0-5%
  Fe2O3: 0-2%

If any component outside range:
  → Warning issued
  → Confidence level降低
  → Extrapolation risk increased
```

---

## Confidence Levels

### HIGH Confidence
- All components within validated ranges
- System clearly identified
- Expected accuracy: ±25-35% viscosity, ±40-60°C fixed points

**Systems:**
- Soda-Lime-Silica (most validated)
- Borosilicate (NIST standard)

### MEDIUM Confidence
- Minor components outside range (<10% deviation)
- System identified but near boundaries
- Expected accuracy: ±40-50% viscosity, ±75-100°C fixed points

**Systems:**
- Aluminosilicate
- Lead Glass
- Pure Silica

### LOW Confidence
- Composition in anomaly region (boron anomaly, mixed alkali)
- Binary/specialty systems with limited data
- Expected accuracy: ±50-70% viscosity, ±100-150°C fixed points

**Systems:**
- Sodium Silicate
- Calcium-Aluminate Slags
- Fluoride Glasses

### VERY LOW Confidence
- Multi-component mixing (no specific system match)
- Significant extrapolation
- Expected accuracy: ±70-100% viscosity, ±150-200°C fixed points
- **Experimental validation required**

**Systems:**
- Multi-Component Mixing

---

## Extrapolation Risk Levels

### NONE
- All components well within validated ranges
- System standard composition
- Historical production data available

### MINOR
- 1-2 components slightly outside range (5-10% deviation)
- Still within physical bounds
- Similar to validated compositions

### MODERATE
- Several components outside range
- In anomaly region (boron, mixed alkali)
- Unusual combination of components

### SEVERE
- No matching system
- Extreme compositions
- Multiple components far outside ranges
- **Do not use for critical applications**

---

## Selection Logic Details

### Priority Order (Most Specific First)

1. **Pure Systems** (SiO2 > 99%)
   - Least ambiguous
   - Only one possible classification

2. **Heavy Metal Glasses** (PbO > 15%)
   - Dominant structural modifier
   - Overrides other classifications

3. **Fluoride Glasses** (fluorides > 20%)
   - Different network type
   - Requires special treatment

4. **Borosilicate** (B2O3 > 7%, specific ranges)
   - Before aluminosilicate (can have some Al2O3)
   - Boron anomaly region critical

5. **Aluminosilicate** (Al2O3 > 12%, SiO2 50-70%)
   - High alumina content
   - Different from soda-lime

6. **Slags** (CaO > 30%, low SiO2)
   - Non-glass structure
   - Metallurgical applications only

7. **Binary Sodium Silicate** (high Na2O, minimal others)
   - Specific binary system
   - Before soda-lime-silica

8. **Soda-Lime-Silica** (default commercial range)
   - Most common
   - Wide acceptance criteria

9. **Multi-Component** (fallback)
   - Nothing else matches
   - Lowest confidence

### Handling Edge Cases

**Case 1: Borderline Compositions**
```
Example: SiO2 = 70%, B2O3 = 6%, Na2O = 15%

Is this borosilicate or soda-lime-silica?
→ B2O3 < 7% threshold
→ Classify as Soda-Lime-Silica
→ But issue warning: "B2O3 near borosilicate range"
```

**Case 2: Mixed Systems**
```
Example: SiO2 = 68%, Al2O3 = 8%, B2O3 = 10%

Both borosilicate AND alumina characteristics
→ B2O3 > 7% → Borosilicate wins (checked first)
→ Issue warning: "High Al2O3 for borosilicate"
→ Confidence: MEDIUM
```

**Case 3: Unusual Combinations**
```
Example: SiO2 = 55%, Al2O3 = 18%, PbO = 12%

PbO present but < 15% threshold
→ Not lead glass
→ Al2O3 > 12% → Aluminosilicate
→ Issue warning: "Unusual PbO content"
```

---

## Validation Against Standards

Each system must validate against reference compositions:

| System | Reference | Source | Pass Criteria |
|--------|-----------|--------|---------------|
| Soda-Lime-Silica | Window glass | Lakatos 1972 | ±0.15 log units |
| Borosilicate | NIST SRM 717a | NIST + Dingwell | ±0.10 log units |
| Aluminosilicate | High-alumina | Giordano 2008 | ±0.20 log units |
| Lead Glass | 24% PbO crystal | Mazurin 1983 | ±0.15 log units |
| Pure Silica | 99.9% SiO2 | Hetherington 1964 | ±0.20 log units |

**See Chapter 15 for complete reference datasets**

---

## Implementation Checklist

### Phase 1: Basic Detection
- [ ] Implement `detectViscosityModel()` function
- [ ] Add composition normalization
- [ ] Test with 8 reference compositions
- [ ] Verify correct system identification

### Phase 2: Range Validation
- [ ] Implement `validateComposition()` function
- [ ] Check each component against ranges
- [ ] Generate warnings for violations
- [ ] Assign confidence levels

### Phase 3: Edge Case Handling
- [ ] Add borderline composition logic
- [ ] Implement warning system
- [ ] Test mixed system classifications
- [ ] Validate against unusual compositions

### Phase 4: Integration
- [ ] Connect to `calculateViscosity()`
- [ ] Return system type in output
- [ ] Include validation status
- [ ] Document detected system

---

**Next:** [Chapter 4 - Soda-Lime-Silica System](./chapter-04-soda-lime-silica.md)

