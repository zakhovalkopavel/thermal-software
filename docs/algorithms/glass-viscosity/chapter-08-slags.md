# Chapter 8: Slag Systems

**Part II: Composition-Dependent Models**

---

## Overview

**Slags** are metallurgical melts, NOT glasses. They are high-temperature molten oxides used in steelmaking, blast furnaces, and coal combustion.

**Critical difference from glass:**
- **Above liquidus:** Fully molten
- **Below liquidus:** Crystallization occurs (NOT glass)
- **Composition varies:** Redox reactions change FeO/Fe₂O₃ ratio
- **Models valid ONLY above liquidus temperature**

**Applications:**
- Blast furnace operation
- Steelmaking process control
- Coal ash flow prediction
- Waste glass vitrification

---

## Composition Range

### System: CaO-Al₂O₃-SiO₂-FeO-MgO

**Validated Ranges (Mills 1993):**

```
SiO2:       25-50 wt%    (acidic component)
Al2O3:      5-20 wt%     (amphoteric)
CaO:        30-55 wt%    (basic component)
MgO:        0-15 wt%     (basic component)
FeO:        0-25 wt%     (flux, redox)
MnO:        0-10 wt%     (flux)
Fe2O3:      0-10 wt%     (oxidized form)
```

**Temperature range:** 1300-1700°C (above liquidus only)

---

## Viscosity Model

### Urbain/Riboud Model

**NOT Arrhenius or VFT - Different approach:**

```
log₁₀(η) = A + (1000 × B) / T
```

Where T is in Kelvin.

**Different from glass models:**
- Simpler structure (CaO-dominated)
- Higher temperatures (>1300°C)
- Crystallization below liquidus
- Composition changes with redox

---

## Component Effects

### Urbain Model Parameters

**B calculation (dimensionless):**

| Component | Effect | Valid Range | Role |
|-----------|--------|-------------|------|
| SiO2 | +0.30 to +0.45 | 25-50% | Acidic, increases viscosity |
| Al2O3 | +0.50 to +0.70 | 5-20% | Amphoteric, strong increase |
| CaO | -0.50 to -0.70 | 30-55% | Basic, strong flux |
| MgO | -0.35 to -0.50 | 0-15% | Basic, moderate flux |
| FeO | -0.40 to -0.55 | 0-25% | Flux, redox sensitive |
| MnO | -0.35 to -0.45 | 0-10% | Flux |

**A parameter:**
- Typically -0.5 to +0.5
- Depends on slag basicity ratio

---

## Slag Basicity

### Basicity Index

**B = (CaO + MgO) / (SiO₂ + Al₂O₃)** (wt% ratio)

```
B < 1.0:  Acidic slag
          High viscosity
          Low melting point
          
B = 1.0-1.5: Neutral slag
             Moderate viscosity
             Common in steelmaking
             
B > 1.5:  Basic slag
          Low viscosity (if molten)
          High melting point
          Risk of solidification
```

**Typical values:**
- Blast furnace slag: B = 1.0-1.2
- Steelmaking slag: B = 2.5-3.5
- Coal ash slag: B = 0.3-0.8

---

## Three Slag Types

### Type 1: Blast Furnace Slag

**Composition:**
```
CaO:    40.3%
SiO2:   37.5%
Al2O3:  11.2%
MgO:     8.5%
FeO:     1.5%
MnO:     1.0%
```

**Characteristics:**
- Basicity B = 1.1 (neutral)
- Liquidus ~1350°C
- Viscosity at 1450°C: ~0.5 Pa·s
- Granulated for cement

**Measured Data (Mills 1993):**
| Temp (°C) | Viscosity (Pa·s) | Log₁₀ η |
|-----------|------------------|---------|
| 1550 | 0.15 | -0.82 |
| 1500 | 0.25 | -0.60 |
| 1450 | 0.50 | -0.30 |
| 1400 | 0.90 | -0.05 |
| 1350 | 2.0 | 0.30 |

---

### Type 2: Steelmaking Slag

**Composition:**
```
CaO:    45.0%
SiO2:   30.0%
FeO:    15.0%
MgO:     6.0%
Al2O3:   3.0%
MnO:     1.0%
```

**Characteristics:**
- Basicity B = 1.5 (slightly basic)
- Liquidus ~1400°C
- High FeO (flux effect)
- Redox sensitive

**Measured Data:**
| Temp (°C) | Viscosity (Pa·s) | Log₁₀ η |
|-----------|------------------|---------|
| 1600 | 0.10 | -1.00 |
| 1550 | 0.18 | -0.74 |
| 1500 | 0.35 | -0.46 |
| 1450 | 0.70 | -0.15 |
| 1400 | 1.5 | 0.18 |

---

### Type 3: Coal Ash Slag

**Composition:**
```
SiO2:   52.0%
Al2O3:  28.0%
Fe2O3:  10.0%
CaO:     5.0%
MgO:     3.0%
K2O:     1.5%
Na2O:    0.5%
```

**Characteristics:**
- Basicity B = 0.10 (highly acidic)
- Liquidus ~1250°C
- High Al₂O₃ → high viscosity
- Common in coal-fired boilers

**Measured Data (Vargas 2001):**
| Temp (°C) | Viscosity (Pa·s) | Log₁₀ η |
|-----------|------------------|---------|
| 1500 | 2.5 | 0.40 |
| 1450 | 5.0 | 0.70 |
| 1400 | 12 | 1.08 |
| 1350 | 30 | 1.48 |
| 1300 | 80 | 1.90 |

---

## Critical Limitations

### 1. NOT Glass Formers

**Slags crystallize below liquidus:**
- Cannot make room-temperature glass
- Models invalid below liquidus
- Phase separation common
- Multiple solid phases form

### 2. Redox Equilibrium

**FeO ⇌ Fe₂O₃ depends on:**
- Oxygen partial pressure
- Temperature
- Carbon content (reducing)
- Time at temperature

**Impact:**
- Composition changes during process
- Viscosity affected by Fe²⁺/Fe³⁺ ratio
- Must specify redox conditions

### 3. Temperature Restrictions

**Valid ONLY at high temperature:**
- Minimum: Above liquidus (varies by composition)
- Typical: 1300-1700°C
- Cannot extrapolate to lower temperatures
- Crystallization occurs below liquidus

---

## Model Accuracy

**Within validated ranges:**
- Viscosity prediction: ±50%
- Confidence level: LOW to MEDIUM

**Why lower accuracy:**
- Composition variability (industrial process)
- Redox state uncertainty
- Phase equilibria complex
- Limited precise measurements

---

## Implementation Notes

```typescript
function calculateSlagViscosity(
  comp: Record<string, number>,
  temperature_C: number
): number {
  // Check temperature is above typical liquidus
  if (temperature_C < 1300) {
    throw new Error(
      'Temperature too low for slag model. ' +
      'Slags crystallize below liquidus (~1300-1400°C).'
    );
  }
  
  // Calculate basicity
  const CaO = comp.CaO || 0;
  const MgO = comp.MgO || 0;
  const SiO2 = comp.SiO2 || 0;
  const Al2O3 = comp.Al2O3 || 0;
  
  const basicity = (CaO + MgO) / (SiO2 + Al2O3);
  
  // Urbain model: B parameter
  let B = 0.0;
  B += (SiO2 / 100) * 0.375;
  B += (Al2O3 / 100) * 0.60;
  B -= (CaO / 100) * 0.60;
  B -= (MgO / 100) * 0.425;
  B -= ((comp.FeO || 0) / 100) * 0.475;
  
  // A parameter (simplified)
  const A = 0.0; // Typical for neutral slags
  
  // Urbain equation
  const T_K = temperature_C + 273.15;
  const logViscosity = A + (1000 * B) / T_K;
  
  return Math.pow(10, logViscosity);
}

function validateSlagComposition(
  comp: Record<string, number>
): ValidationResult {
  const warnings: string[] = [];
  
  const basicity = ((comp.CaO || 0) + (comp.MgO || 0)) / 
                   ((comp.SiO2 || 0) + (comp.Al2O3 || 0));
  
  if (basicity > 2.0) {
    warnings.push(
      `High basicity (B=${basicity.toFixed(2)}). ` +
      `Risk of solidification at process temperatures.`
    );
  }
  
  warnings.push(
    'CAUTION: Slag models valid ONLY above liquidus temperature. ' +
    'Crystallization occurs below ~1300-1400°C.'
  );
  
  return { warnings, confidenceLevel: 'LOW' };
}
```

---

## References

1. **Mills, K.C. (Editor) (1993)**
   - "Slag Atlas" (2nd Edition)
   - VDEh (Verein Deutscher Eisenhüttenleute)
   - ISBN: 978-3514004481

2. **Vargas, S., Frandsen, F.J., Dam-Johansen, K. (2001)**
   - "Rheological properties of high-temperature melts of coal ashes"
   - Fuel 80(13):1717-1726
   - DOI: 10.1016/S0016-2361(01)00070-1

---

**Next:** [Chapter 9 - Specialty Systems](./chapter-09-specialty-systems.md)

