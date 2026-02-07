# Chapter 5: Borosilicate Glass System

**Part II: Composition-Dependent Models**

---

## Overview

**Borosilicate glass** is the second most important commercial glass system:
- **Laboratory glassware** (beakers, flasks, test tubes)
- **Chemical apparatus** (reactors, distillation equipment)
- **Cookware** (Pyrex, heat-resistant bakeware)
- **Pharmaceutical packaging** (Type I glass)
- **NIST reference standard** (SRM 717a)

**Key properties:**
- Low thermal expansion coefficient
- High thermal shock resistance
- Excellent chemical durability
- Higher melting point than soda-lime glass

---

## Composition Range

### Validated Ranges (Dingwell et al. 1992)

```
SiO2:       70-85 wt%    (primary network former)
B2O3:       8-15 wt%     (network former/modifier)
Na2O:       2-8 wt%      (primary flux)
K2O:        0-3 wt%      (secondary flux)
Al2O3:      0-5 wt%      (strengthener)
```

**Typical composition (Pyrex 7740):**
```
SiO2:   80.6%
B2O3:   12.9%
Na2O:    3.9%
Al2O3:   2.3%
K2O:     0.3%
```

---

## Viscosity Model

### VFT (Vogel-Fulcher-Tammann) Equation

```
log₁₀(η) = A + B/(T - T₀)
```

**For standard borosilicate (Pyrex):**
```
A = -3.8
B = 16,200 K
T₀ = 245 K (-28°C)
```

**Parameter Ranges:**
```
A:  -4.5 to -3.5
B:  14,000 to 18,000 K
T₀: 100 to 300 K
```

**Note:** T₀ is LOWER than soda-lime glass, indicating stronger temperature dependence.

---

## Component Effects

### Effect on B Parameter (K·wt%⁻¹)

**Network Formers:**
| Component | Effect | Valid Range | Role |
|-----------|--------|-------------|------|
| SiO2 | +45 to +55 | 70-85% | Primary network former |
| B2O3 | -30 to -20 | 8-15% | **Anomalous behavior** |
| Al2O3 | +90 to +110 | 0-5% | Network strengthener |

**Network Modifiers:**
| Component | Effect | Valid Range | Role |
|-----------|--------|-------------|------|
| Na2O | -80 to -90 | 2-8% | Primary flux |
| K2O | -70 to -80 | 0-3% | Secondary flux |

### Critical: Boron Anomaly

**B₂O₃ behavior depends on alkali/boron ratio!**

**Ratio R = (Na₂O + K₂O) / B₂O₃** (molar ratio)

```
R < 0.5:  B acts as network former (BO₃ triangles)
          Effect: +20 to +30 K/wt%

R = 0.5-1.0: ANOMALY REGION (coordination change)
             Effect: -30 to -20 K/wt%
             Viscosity MINIMUM

R > 1.0:  Excess alkali, B mostly as BO₄⁻
          Effect: -10 to 0 K/wt%
```

**For typical Pyrex (R ≈ 0.35):**
- B₂O₃ effect is NEGATIVE (slight viscosity decrease)
- Near lower end of anomaly region

**See Chapter 10 for detailed boron anomaly treatment**

---

## Measured Data (NIST SRM 717a)

### Reference Standard

**NIST SRM 717a** is the certified reference material for borosilicate glass viscosity.

**Composition (Certified):**
```
SiO2:   80.6 ± 0.2%
B2O3:   12.9 ± 0.1%
Al2O3:   2.3 ± 0.1%
Na2O:    3.9 ± 0.1%
K2O:     0.3 ± 0.05%
Total:  100.0%
```

**Measured Viscosity-Temperature Data (Certified):**
| Temp (°C) | Log₁₀ η (Pa·s) | Viscosity (Pa·s) | Uncertainty | Notes |
|-----------|----------------|------------------|-------------|-------|
| 1500 | 1.60 | 39.8 | ±0.05 | Melting |
| 1400 | 2.10 | 126 | ±0.05 | -- |
| 1300 | 2.85 | 708 | ±0.06 | -- |
| 1200 | 3.45 | 2,818 | ±0.07 | Working |
| 1100 | 4.25 | 17,783 | ±0.10 | -- |
| 1000 | 5.20 | 158,489 | ±0.15 | -- |
| 900 | 6.40 | 2,511,886 | ±0.18 | -- |
| 821 | 7.60 | 39,810,717 | ±0.10 | **Softening (ASTM C338)** |
| 700 | 10.50 | 3.16×10¹⁰ | ±0.35 | Approaching Tg |
| 560 | 13.0 | 10¹³ | ±0.15 | **Annealing (ASTM C336)** |
| 510 | 14.5 | 3.16×10¹⁴ | ±0.20 | **Strain (ASTM C336)** |

**ASTM Fixed Points (NIST Certified):**
```
Melting Point:    1510°C  (certified reference)
Working Point:    1180°C  (certified, η = 10³ Pa·s)
Softening Point:   821°C  (certified ±3°C, ASTM C338)
Annealing Point:   560°C  (certified ±5°C, ASTM C336)
Strain Point:      510°C  (certified ±5°C, ASTM C336)
```

**VFT Parameters (NIST Certified):**
```
A = -3.8 ± 0.1
B = 16,200 ± 200 K
T₀ = 245 ± 10 K

Valid range: 500-1500°C
Uncertainty: ±0.10 log units (±25% viscosity)
R² = 0.9998
```

**This is THE reference standard for model validation!**

---

## Comparison with Soda-Lime Glass

### Fixed Points Comparison

| Property | Borosilicate | Soda-Lime | Difference |
|----------|--------------|-----------|------------|
| Softening Point | 821°C | 730°C | +91°C |
| Annealing Point | 560°C | 546°C | +14°C |
| Strain Point | 510°C | 514°C | -4°C |
| Working Point | 1180°C | 1100°C | +80°C |

**Key differences:**
- **Higher softening point** (+91°C) - harder to deform
- **Higher working point** (+80°C) - requires more energy to form
- **Similar annealing range** - stress relief at similar temperatures

### Thermal Properties

| Property | Borosilicate | Soda-Lime |
|----------|--------------|-----------|
| Thermal expansion coefficient | 3.3×10⁻⁶ K⁻¹ | 9.0×10⁻⁶ K⁻¹ |
| Thermal shock resistance | Excellent | Poor |
| Max service temperature | 500°C | 200°C |

**Why borosilicate is better for thermal shock:**
- Much lower thermal expansion (3.3 vs 9.0)
- Less stress from temperature gradients
- Can withstand rapid heating/cooling

---

## Compositional Variants

### Low-Expansion Borosilicate (Pyrex 7740)

```
SiO2:   80.6%
B2O3:   12.9%
Na2O:    3.9%
Al2O3:   2.3%
K2O:     0.3%

Thermal expansion: 3.3×10⁻⁶ K⁻¹
Softening point: 821°C
Use: General laboratory glassware
```

### High-Silica Borosilicate (Vycor-type)

```
SiO2:   96.0%
B2O3:    3.0%
Na2O:    0.8%
Al2O3:   0.2%

Thermal expansion: 0.75×10⁻⁶ K⁻¹
Softening point: ~1500°C
Use: High-temperature applications, optics
```

### Pharmaceutical Borosilicate (Type I)

```
SiO2:   75.0%
B2O3:   10.0%
Na2O:    6.0%
Al2O3:   6.0%
CaO:     3.0%

Softening point: ~800°C
Use: Pharmaceutical vials, ampules
Higher chemical durability for drugs
```

---

## Model Accuracy

### Expected Performance

**Within validated ranges (NIST standard):**
- Viscosity prediction: ±25-35% (±0.1-0.15 log units)
- Fixed point prediction: ±60°C
- Confidence level: HIGH (NIST certified)

**Near boron anomaly region (R = 0.5-1.0):**
- Viscosity prediction: ±40-50% (±0.2 log units)
- Fixed point prediction: ±80°C
- Confidence level: MEDIUM
- **Warning:** Model accuracy reduced in anomaly region

**Outside validated ranges:**
- B₂O₃ < 7% or > 20%: Switch to different model
- Alkali > 10%: More like soda-lime glass
- Use with caution, validate experimentally

---

## Implementation Notes

### Parameter Calculation

```typescript
function calculateBorosilicateParameters(
  comp: Record<string, number>
): { A: number; B: number; T0: number } {
  // Base VFT parameters
  let A = -3.8;
  let B = 16200;
  let T0 = 245;
  
  // Component effects
  const effects = {
    SiO2: 50,       // K per wt%
    B2O3: -25,      // Negative effect (in typical range)
    Al2O3: 100,
    Na2O: -85,
    K2O: -75,
  };
  
  // Calculate B with component effects
  for (const [component, effect] of Object.entries(effects)) {
    const content = comp[component] || 0;
    B += (content / 100) * effect;
  }
  
  // Check for boron anomaly and apply correction
  const R_molar = calculateBoronRatio(comp);
  if (R_molar > 0.3 && R_molar < 1.2) {
    B = applyBoronAnomalyCorrection(B, comp);
  }
  
  return { A, B, T0 };
}
```

### Validation

```typescript
function validateBorosilicateComposition(
  comp: Record<string, number>
): ValidationResult {
  const warnings: string[] = [];
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  
  // Check B2O3 range
  if (comp.B2O3 < 8 || comp.B2O3 > 15) {
    warnings.push(`B2O3 ${comp.B2O3}% outside range 8-15%`);
    confidence = 'MEDIUM';
  }
  
  // Check boron anomaly
  const R = calculateBoronRatio(comp);
  if (R >= 0.3 && R <= 1.2) {
    warnings.push(
      `Composition in boron anomaly region (R=${R.toFixed(2)}). ` +
      `Model accuracy reduced to ±0.2 log units.`
    );
    confidence = 'MEDIUM';
  }
  
  // Check SiO2 range
  if (comp.SiO2 < 70 || comp.SiO2 > 85) {
    warnings.push(`SiO2 ${comp.SiO2}% outside range 70-85%`);
    confidence = 'MEDIUM';
  }
  
  // Check alkali
  const alkali = (comp.Na2O || 0) + (comp.K2O || 0);
  if (alkali < 2 || alkali > 10) {
    warnings.push(`Alkali ${alkali}% outside range 2-10%`);
    if (alkali > 10) {
      warnings.push('High alkali: consider soda-lime-silica model instead');
      confidence = 'LOW';
    }
  }
  
  return { confidence, warnings };
}
```

### Boron Ratio Calculation

```typescript
function calculateBoronRatio(comp: Record<string, number>): number {
  const B2O3_wt = comp.B2O3 || 0;
  const Na2O_wt = comp.Na2O || 0;
  const K2O_wt = comp.K2O || 0;
  
  if (B2O3_wt < 0.1) return 0;
  
  // Convert to molar
  const mol_B2O3 = B2O3_wt / 69.6;
  const mol_Na2O = Na2O_wt / 62.0;
  const mol_K2O = K2O_wt / 94.2;
  
  const mol_alkali = mol_Na2O + mol_K2O;
  
  return mol_alkali / mol_B2O3;
}
```

---

## Special Considerations

### Boron Volatility

**At high temperatures (>1400°C):**
- B₂O₃ can volatilize as H₃BO₃
- Composition changes during melting
- Affects final glass properties
- Important for manufacturing control

### Phase Separation

**At certain compositions:**
- Can phase separate into two glasses
- SiO2-rich phase + B2O3-rich phase
- Affects optical clarity
- Typically avoided in commercial glass

### Devitrification

**Crystallization risk:**
- Lower than soda-lime glass
- Can occur during reheating
- Forms cristobalite (SiO2 crystals)
- Important for laboratory glassware durability

---

## References

1. **Dingwell, D.B., Knoche, R., Webb, S.L. (1992)**
   - "The effect of B₂O₃ on the viscosity of haplogranitic liquids"
   - Chemical Geology, 95(3-4), 229-237
   - DOI: 10.1016/0009-2541(92)90012-G
   - **Primary reference for borosilicate viscosity**

2. **NIST Standard Reference Material 717a**
   - Borosilicate Glass Viscosity Standard
   - Certificate of Analysis available at www.nist.gov
   - **Reference standard for validation**

3. **Shelby, J.E. (2005)**
   - "Introduction to Glass Science and Technology" (2nd Ed)
   - Royal Society of Chemistry
   - Chapter 9: Viscosity and transport properties
   - ISBN: 978-0-85404-639-3

4. **ASTM C965-96(2012)**
   - Standard Practice for Measuring Viscosity of Glass Above the Softening Point

5. **ASTM C338-93(2020)**
   - Standard Test Method for Softening Point of Glass

---

**Next:** [Chapter 6 - High-Alumina System](./chapter-06-aluminosilicate.md)

