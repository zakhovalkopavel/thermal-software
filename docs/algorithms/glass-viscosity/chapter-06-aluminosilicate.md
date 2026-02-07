# Chapter 6: Aluminosilicate Glass System

**Part II: Composition-Dependent Models**

---

## Overview

**Aluminosilicate glass** (high-alumina glass) is characterized by high Al₂O₃ content (15-30%).

**Applications:**
- High-temperature resistant glass
- Fiberglass (E-glass)
- Geological melts (magmas)
- Laboratory glass tubes
- Halogen lamp envelopes

**Key properties:**
- High softening point (900-1000°C)
- Excellent thermal stability
- Good chemical durability
- High mechanical strength

---

## Composition Range

### Validated Ranges (Giordano et al. 2008)

```
SiO2:       50-70 wt%    (network former)
Al2O3:      15-30 wt%    (network former/modifier)
CaO:        5-15 wt%     (charge balancer)
MgO:        0-10 wt%     (modifier)
Na2O:       0-5 wt%      (flux)
K2O:        0-3 wt%      (flux)
FeO:        0-15 wt%     (modifier, geological)
Fe2O3:      0-10 wt%     (modifier)
```

**Typical composition (E-glass fiber):**
```
SiO2:   54.0%
Al2O3:  14.0%
CaO:    17.0%
MgO:     4.5%
B2O3:    8.0%
Na2O:    0.8%
K2O:     0.2%
```

---

## Viscosity Model

### VFT Equation

```
log₁₀(η) = A + B/(T - T₀)
```

**For standard aluminosilicate:**
```
A = -4.5
B = 19,000 K
T₀ = 350 K (77°C)
```

**Parameter Ranges:**
```
A:  -5.0 to -4.0
B:  16,000 to 22,000 K
T₀: 200 to 500 K
```

---

## Component Effects

### Effect on B Parameter (K·wt%⁻¹)

**Network Formers:**
| Component | Effect | Valid Range | Role |
|-----------|--------|-------------|------|
| SiO2 | +50 to +65 | 50-70% | Primary network former |
| Al2O3 | +65 to +85 | 15-30% | **Coordination-dependent** |

**Network Modifiers:**
| Component | Effect | Valid Range | Role |
|-----------|--------|-------------|------|
| CaO | -55 to -70 | 5-15% | Charge balancer for Al |
| MgO | -45 to -60 | 0-10% | **Acts as modifier (not former)** |
| Na2O | -85 to -100 | 0-5% | Strong flux |
| K2O | -75 to -90 | 0-3% | Flux |
| FeO | -50 to -65 | 0-15% | Weak modifier |
| Fe2O3 | -45 to -60 | 0-10% | Weak modifier |

### Critical: Alumina Coordination

**R = (Na₂O + K₂O + CaO/2 + MgO/2) / Al₂O₃** (molar, charge balance)

```
R < 1:   Al deficient in charge balance
         Al acts as network former (AlO₄⁻ tetrahedra)
         Effect: +85 to +120 K/wt%

R = 1:   Perfect charge balance
         Maximum network polymerization
         Effect: +65 to +85 K/wt%

R > 1:   Excess modifiers
         Al coordination increases (AlO₅, AlO₆)
         Effect: +30 to +65 K/wt%
```

**Implementation:**
```typescript
function getAluminaEffect(comp: Record<string, number>): number {
  const Al2O3_mol = comp.Al2O3 / 102.0;
  const charge_balance = 
    (comp.Na2O || 0) / 62.0 + 
    (comp.K2O || 0) / 94.2 + 
    ((comp.CaO || 0) / 56.1) * 0.5 + 
    ((comp.MgO || 0) / 40.3) * 0.5;
  
  const R = charge_balance / Al2O3_mol;
  
  if (R < 1.0) {
    return 85 + (1 - R) * 35; // 85-120 K/wt%
  } else if (R <= 2.0) {
    return 85 - (R - 1) * 35; // 85-50 K/wt%
  } else {
    return Math.max(30, 50 - (R - 2) * 10);
  }
}
```

---

## Measured Data (E-Glass)

**Source:** Shelby (2005), Fluegel (2007)

**Composition:**
```
SiO2:   54.0%
Al2O3:  14.0%
CaO:    17.0%
MgO:     4.5%
B2O3:    8.0%
```

**Measured Viscosity-Temperature Data:**
| Temp (°C) | Log₁₀ η (Pa·s) | Notes |
|-----------|----------------|-------|
| 1400 | 1.70 | **Fiberizing temperature** |
| 1300 | 2.30 | Fiber drawing |
| 1200 | 3.05 | Working range |
| 1100 | 3.90 | Lower working |
| 1000 | 4.85 | -- |
| 846 | 7.60 | **Softening point** |

**ASTM Fixed Points:**
```
Fiberizing:  1400°C (η ≈ 50 Pa·s, log η = 1.7)
Working:     1200°C (η = 10³ Pa·s)
Softening:    846°C (η = 10^6.6 Pa·s)
Annealing:   ~565°C (estimated)
```

---

## Model Accuracy

**Within validated ranges:**
- Viscosity prediction: ±30-40%
- Fixed points: ±60-80°C
- Confidence level: MEDIUM

**Challenges:**
- Limited commercial data (mostly fiberglass)
- R ratio highly variable
- Geological data includes FeO (redox)

---

## References

1. **Giordano, D., Russell, J.K., Dingwell, D.B. (2008)**
   - Earth Planet. Sci. Lett. 271:123-134
   - DOI: 10.1016/j.epsl.2008.03.038

2. **Shelby, J.E. (2005)**
   - Introduction to Glass Science, Chapter 9

---

**Next:** [Chapter 7 - Lead Glass System](./chapter-07-lead-glass.md)

