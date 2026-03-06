# Chapter 4: Lakatos 1976 Model

**Part II: Model Implementations**

---

## Overview

The Lakatos 1976 model predicts the temperature at three isokom viscosity levels via multiple linear regression on glass composition. The composition is expressed as **parts per 100 parts of SiO₂ by weight** (see Chapter 6 for the conversion). B₂O₃ is the only component that requires a quadratic term — all others are linear.

**Source:** `shared/sources/lakatos_ocr/page_001_table_007.csv`

---

## Formula

For each viscosity level v ∈ {2, 4, 6} (in log poise):

```
T(v) = C₀(v)
     + C_Al₂O₃(v)   · x_Al₂O₃
     + C_Na₂O(v)    · x_Na₂O
     + C_K₂O(v)     · x_K₂O
     + C_Li₂O(v)    · x_Li₂O
     + C_CaO(v)     · x_CaO
     + C_MgO(v)     · x_MgO
     + C_BaO(v)     · x_BaO
     + C_ZnO(v)     · x_ZnO
     + C_PbO(v)     · x_PbO
     + C_B₂O₃(v)   · x_B₂O₃
     + C_B₂O₃²(v)  · x_B₂O₃²
```

Where:
- `x_i` = component i expressed in **parts per 100 parts SiO₂ by weight**
- `x_B₂O₃²` = the square of the B₂O₃ value in those same units
- `T(v)` = predicted temperature in **°C**
- The result is a temperature at viscosity level v in **log poise**

---

## Coefficient Table

Verbatim from `page_001_table_007.csv`:

| Component | T at log η 2 (poise) | T at log η 4 (poise) | T at log η 6 (poise) |
|---|---|---|---|
| **Constant** | 1847.8 | 1249.7 | 962.9 |
| Al₂O₃ | 8.32 | 5.23 | 4.01 |
| Na₂O | −12.65 | −9.19 | −7.06 |
| K₂O | −5.93 | −4.17 | −3.53 |
| Li₂O | −35.54 | −30.04 | −26.45 |
| CaO | −11.27 | −3.99 | −0.74 |
| MgO | −5.87 | −0.12 | 0.91 |
| BaO | −5.67 | −3.04 | −1.88 |
| ZnO | −5.37 | −1.88 | −0.71 |
| PbO | −4.85 | −3.17 | −2.24 |
| B₂O₃ (linear) | −21.62 | −11.97 | −6.42 |
| **(B₂O₃)² (quadratic)** | **0.5122** | **0.3182** | **0.19** |

**Reference:** Lakatos, T.; Johansson, L-G.; Simmingskőld, B., August 1976, Table 7.

---

## Step-by-Step Calculation

### Step 1: Convert Composition to Parts/SiO₂

See Chapter 6 for the full algorithm. Quick summary:

```
x_i = (wt%_i / wt%_SiO₂) × 100
```

SiO₂ itself is the reference and does not appear in the formula. Components not in the 11-component list are excluded (with a warning if they exceed 2 wt% individually or 5 wt% collectively).

### Step 2: Compute the Three Isokom Temperatures

Apply the formula above three times, once for v = 2, v = 4, v = 6.

### Step 3: Convert Viscosity Labels to Pa·s

When passing these temperatures to the VTF fitting layer (Chapter 7), pair each temperature with its Pa·s viscosity level:

| Lakatos output | Viscosity level to use in VTF fitting |
|---|---|
| T at log η 2 poise | log η = **1** Pa·s |
| T at log η 4 poise | log η = **3** Pa·s |
| T at log η 6 poise | log η = **5** Pa·s |

---

## Qualitative Notes on Component Effects

From the Lakatos 1976 paper — these help sanity-check results:

- **Li₂O** has the largest viscosity-decreasing effect at melting temperature (log η 2 poise)
- **Na₂O** effect is approximately twice that of K₂O
- **CaO and MgO** decrease mainly the melting temperature; at higher viscosity levels (annealing range) their effect approaches zero — MgO even has a slightly positive coefficient at log η 6
- **B₂O₃** makes "short" glasses (viscosity-temperature curve is steep): its decreasing effect is largest at low viscosity (high temperature) and diminishes quickly at higher viscosity levels
- **Alkali oxides and PbO** make "long" glasses: their effects persist across all viscosity levels
- The quadratic B₂O₃ term ensures the model captures the reversal of the boron effect at high concentrations

---

## Worked Example

**Composition:** Soda-lime container glass, sample S1 from `page_003_table_001.csv`

**Input (wt%):**
| SiO₂ | Al₂O₃ | Na₂O | K₂O | Li₂O | CaO | MgO | BaO | ZnO | PbO | B₂O₃ |
|---|---|---|---|---|---|---|---|---|---|---|
| 77.02 | 0.19 | 12.03 | 0.13 | 0 | 10.12 | 0 | 0 | 0 | 0 | 0 |

**Step 1 — Convert to parts/SiO₂:**

```
x_Al₂O₃ = (0.19 / 77.02) × 100 = 0.2467
x_Na₂O  = (12.03 / 77.02) × 100 = 15.619
x_K₂O   = (0.13 / 77.02) × 100 = 0.1688
x_CaO   = (10.12 / 77.02) × 100 = 13.139
x_B₂O₃  = 0  (all others = 0)
```

**Step 2 — T at log η 2 poise:**

```
T₂ = 1847.8
   + 8.32 × 0.2467
   + (−12.65) × 15.619
   + (−5.93) × 0.1688
   + (−11.27) × 13.139
   + 0 (all others zero)
   = 1847.8 + 2.053 − 197.58 − 1.001 − 148.08
   = 1503.19°C
```

**Expected from paper:** 1503.7°C (ΔT = −5.3°C in paper, so measured was ~1509°C)

**Step 2 — T at log η 4 poise:**

```
T₄ = 1249.7
   + 5.23 × 0.2467
   + (−9.19) × 15.619
   + (−4.17) × 0.1688
   + (−3.99) × 13.139
   = 1249.7 + 1.290 − 143.54 − 0.704 − 52.42
   = 1054.33°C
```

**Expected from paper:** 1054.3°C ✓

**Step 2 — T at log η 6 poise:**

```
T₆ = 962.9
   + 4.01 × 0.2467
   + (−7.06) × 15.619
   + (−3.53) × 0.1688
   + (−0.74) × 13.139
   = 962.9 + 0.989 − 110.27 − 0.596 − 9.723
   = 843.30°C
```

**Expected from paper:** 843.3°C ✓

**Step 3 — VTF input pairs (with unit conversion):**

```
(T, log η [Pa·s]) pairs:
(1503.19, 1)   ← from log η 2 poise
(1054.33, 3)   ← from log η 4 poise
(843.30,  5)   ← from log η 6 poise
```

These three pairs are passed to Chapter 7 for VTF fitting.

---

## Validity Check Algorithm

```typescript
function checkLakatosValidity(composition: Record<string, number>): ValidationResult {
  const SiO2 = composition['SiO2'] ?? 0;
  
  if (SiO2 < 50) {
    return { valid: false, error: 'SiO2 too low for Lakatos model (< 50 wt%)' };
  }
  
  const lakatosComponents = new Set([
    'SiO2', 'Al2O3', 'Na2O', 'K2O', 'Li2O', 'CaO', 'MgO', 'BaO', 'ZnO', 'PbO', 'B2O3'
  ]);
  
  let ignoredWeight = 0;
  const ignoredComponents: string[] = [];
  
  for (const [component, wt] of Object.entries(composition)) {
    if (!lakatosComponents.has(component) && wt > 0) {
      ignoredWeight += wt;
      ignoredComponents.push(component);
    }
  }
  
  const warnings: string[] = [];
  
  if (ignoredComponents.some(c => (composition[c] ?? 0) > 2)) {
    warnings.push(`WARNING_COMPONENTS_IGNORED: ${ignoredComponents.join(', ')} exceed 2 wt% individually`);
  }
  
  if (ignoredWeight > 5) {
    warnings.push(`CONFIDENCE_REDUCED: ${ignoredWeight.toFixed(1)} wt% of composition not modelled`);
  }
  
  return { valid: true, warnings };
}
```

---

**Next:** [Chapter 5 — Fluegel 2007 Model](./chapter-05-fluegel-2007.md)

