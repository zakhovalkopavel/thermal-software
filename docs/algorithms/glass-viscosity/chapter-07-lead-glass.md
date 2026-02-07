# Chapter 7: Lead Glass System

**Part II: Composition-Dependent Models**

---

## Overview

**Lead glass** (lead crystal) contains 20-40% PbO as a heavy metal oxide flux.

**Applications:**
- Crystal glassware (tableware, decorative)
- Optical glass (lenses, prisms)
- Radiation shielding glass
- High refractive index applications
- **Note:** Restricted due to lead toxicity

---

## Composition Range

### Validated Ranges (Mazurin 1983)

```
SiO2:       50-70 wt%    (network former)
PbO:        20-40 wt%    (heavy metal flux)
K2O:        5-15 wt%     (primary flux)
Na2O:       0-10 wt%     (secondary flux)
Al2O3:      0-5 wt%      (strengthener)
```

**Typical composition (24% lead crystal):**
```
SiO2:   59.0%
PbO:    24.0%
K2O:    12.0%
Na2O:    4.0%
Al2O3:   1.0%
```

---

## Viscosity Model

### Arrhenius Equation (Preferred for PbO Glass)

```
ln(η) = A + B/T
```

**Why Arrhenius instead of VFT:**
- Lead glasses show more Arrhenius-like behavior
- Two-parameter fit sufficient
- VFT T₀ often unrealistic for PbO systems

**For standard lead crystal:**
```
A = -7.2
B = 11,800 K
```

**Parameter Ranges:**
```
A:  -7.5 to -6.5
B:  11,000 to 14,000 K
```

---

## Component Effects

### Effect on B Parameter (K·wt%⁻¹)

**Network Formers:**
| Component | Effect | Valid Range | Notes |
|-----------|--------|-------------|-------|
| SiO2 | +42 to +52 | 50-70% | Network former |
| Al2O3 | +95 to +115 | 0-5% | Strengthener |

**Network Modifiers:**
| Component | Effect | Valid Range | Notes |
|-----------|--------|-------------|-------|
| PbO | -75 to -95 | 20-40% | **Very strong flux** |
| K2O | -80 to -95 | 5-15% | Primary alkali |
| Na2O | -85 to -100 | 0-10% | Secondary alkali |

### PbO Dominance

**PbO effect is VERY strong:**
- Each 1% PbO lowers softening point by ~8-9°C
- 30% PbO → ~250°C reduction vs soda-lime
- Creates weak Pb-O bonds, high ionic mobility

---

## Measured Data (24% PbO Crystal)

**Source:** Mazurin & Gankin (1983)

**Composition:**
```
SiO2:   59.0%
PbO:    24.0%
K2O:    12.0%
Na2O:    4.0%
Al2O3:   1.0%
```

**Measured Viscosity-Temperature Data:**
| Temp (°C) | Log₁₀ η (Pa·s) | Notes |
|-----------|----------------|-------|
| 1100 | 1.50 | Melting |
| 1000 | 2.30 | Homogenization |
| 900 | 3.20 | **Working range** |
| 800 | 4.30 | Lower forming |
| 700 | 5.70 | -- |
| 635 | 7.60 | **Softening point** |
| 435 | 13.0 | **Annealing point** |
| 405 | 14.5 | **Strain point** |

**ASTM Fixed Points:**
```
Melting Point:   1220°C  (extrapolated)
Working Point:    880°C  (η = 10³ Pa·s)
Softening Point:  635°C  (-95°C vs soda-lime!)
Annealing Point:  435°C  (-111°C vs soda-lime!)
Strain Point:     405°C  (-109°C vs soda-lime!)
```

**Temperature span:** 815°C (melting to strain)

---

## Comparison with Soda-Lime Glass

| Property | Lead Crystal (24% PbO) | Soda-Lime | Difference |
|----------|------------------------|-----------|------------|
| Softening Point | 635°C | 730°C | -95°C |
| Annealing Point | 435°C | 546°C | -111°C |
| Strain Point | 405°C | 514°C | -109°C |
| Working Point | 880°C | 1100°C | -220°C |
| Refractive Index | 1.60 | 1.52 | +0.08 |
| Density | 3.1 g/cm³ | 2.5 g/cm³ | +0.6 |

**Key advantages:**
- Much lower processing temperatures
- High refractive index (optical quality)
- High density (feel of quality)
- Brilliant appearance

**Disadvantages:**
- Lead toxicity concerns
- Environmental restrictions
- Lower chemical durability
- Not food-safe in many jurisdictions

---

## Model Accuracy

**Within validated ranges:**
- Viscosity prediction: ±30-40%
- Fixed points: ±50-70°C
- Confidence level: MEDIUM

**Data limitations:**
- Less data than soda-lime
- Historical (pre-restriction) data
- Limited modern measurements

---

## Environmental and Safety Notes

**Lead content restrictions:**
- EU: Crystal must be labeled with lead content
- US FDA: Lead leaching limits for food contact
- California Prop 65: Warning required
- Many countries: Phasing out lead glass

**Modern alternatives:**
- Barium crystal (BaO instead of PbO)
- Zinc crystal (ZnO)
- Titanium crystal (TiO2)
- Not as brilliant but lead-free

**Model applicability:**
- Historical glassware analysis
- Museum conservation
- Optical glass (non-consumer)
- Radiation shielding (medical, nuclear)

---

## Implementation Notes

```typescript
function calculateLeadGlassParameters(
  comp: Record<string, number>
): { A: number; B: number } {
  // Arrhenius model for lead glass
  let A = -7.2;
  let B = 11800;
  
  const effects = {
    SiO2: 47,      // K per wt%
    PbO: -85,      // Very strong flux
    K2O: -87,
    Na2O: -92,
    Al2O3: 105,
  };
  
  for (const [component, effect] of Object.entries(effects)) {
    const content = comp[component] || 0;
    B += (content / 100) * effect;
  }
  
  return { A, B };
}

function validateLeadGlass(comp: Record<string, number>): ValidationResult {
  const warnings: string[] = [];
  
  const PbO = comp.PbO || 0;
  
  if (PbO < 20) {
    warnings.push('Low PbO content. Consider soda-lime model.');
  }
  
  if (PbO > 40) {
    warnings.push('Very high PbO (>40%). Phase separation risk.');
  }
  
  // Environmental warning
  warnings.push('CAUTION: Lead glass. Environmental and health restrictions apply.');
  
  return { warnings };
}
```

---

## References

1. **Mazurin, O.V., Gankin, Y.V. (1983)**
   - Handbook of Glass Data, Part B
   - Elsevier, Amsterdam
   - ISBN: 0-444-42078-3
   - Pages 246-285

---

**Next:** [Chapter 8 - Slag Systems](./chapter-08-slags.md)

