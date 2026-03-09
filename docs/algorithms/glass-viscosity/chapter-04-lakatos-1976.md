# Chapter 4: Lakatos 1976 Model

**Part II: Model Implementations**

---

## Overview

The Lakatos 1976 paper provides **two separate regression tables** from the same underlying dataset, serving different purposes:

| Table | Source CSV | Purpose | Role in this spec |
|---|---|---|---|
| **Table 6** | `page_002_table_006.csv` | Regress VTF constants B, A, T₀ directly from composition | **Production** — used by `buildVtf()` |
| **Table 7** | `page_001_table_007.csv` | Regress isokom temperatures at 3 viscosity levels | **Illustration** — component-effect analysis only |

Lakatos himself characterised Table 7 as an intermediate step:

> *"Although the factors for calculating the temperatures for different viscosity levels are only an intermediate step, it is of interest to study the effects of different oxides on temperature at different viscosity levels."*
> — Lakatos, T.; Johansson, L-G.; Simmingskőld, B. (1976)

Both tables use the same composition encoding: **parts per 100 parts of SiO₂ by weight** (see Chapter 6).

---

## Production Method — Direct Temperature-Viscosity Equation Determination (Table 6)

### Formula

Each VTF constant is a linear function of composition (plus a quadratic B₂O₃ term):

```
B_vtf  = Σ c_B(i)  · x_i
A_vtf  = Σ c_A(i)  · x_i
T₀_vtf = Σ c_T₀(i) · x_i
```

The viscosity curve is then:

```
T [°C] = B_vtf / (log η [poise] + A_vtf) + T₀_vtf
```

> **Important:** This is Lakatos's own equation form — note `+ A_vtf` in the denominator
> and that log η is in **poise**, not Pa·s.
>
> To convert to the standard form used elsewhere in this spec
> (`log η [Pa·s] = A_std + B_std / (T − T₀_std)`), apply:
> ```
> A_std  = −(A_vtf + 1)      ← the +1 converts poise → Pa·s
> B_std  = B_vtf
> T₀_std = T₀_vtf
> ```

### Coefficient Table

Verbatim from `page_002_table_006.csv`:

| Component | B | A | T₀ |
|---|---|---|---|
| **Constant** | 6237.013 | 1.713 | 149.4 |
| Al₂O₃ | 15.21 | −0.0087 | 1.4 |
| Na₂O | −66.01 | −0.0162 | 0.5 |
| K₂O | −5.41 | 0.0066 | −2.36 |
| Li₂O | −115.18 | −0.0318 | −13.29 |
| CaO | −60.63 | 0.0064 | 7.71 |
| MgO | 56.21 | 0.0589 | −2.12 |
| BaO | −21.03 | 0.0026 | 1.09 |
| ZnO | −3.76 | 0.016 | 0.96 |
| PbO | −25.44 | −0.005 | 0.82 |
| B₂O₃ (linear) | −155.11 | −0.0465 | 12.03 |
| **(B₂O₃)² (quadratic)** | **4.0999** | **0.001627** | **−0.2765** |

**Reference:** Lakatos, T.; Johansson, L-G.; Simmingskőld, B., August 1976, Table 6.

### Step-by-Step Calculation

**Step 1 — Convert composition to parts per 100 parts SiO₂:**

```
x_i = (wt%_i / wt%_SiO₂) × 100
```

**Step 2 — Evaluate each VTF constant:**

```
B_vtf  = 6237.013 + Σ c_B(i)  · x_i  + 4.0999  · x_B₂O₃²
A_vtf  = 1.713    + Σ c_A(i)  · x_i  + 0.001627 · x_B₂O₃²
T₀_vtf = 149.4    + Σ c_T₀(i) · x_i  − 0.2765  · x_B₂O₃²
```

**Step 3 — Convert to standard VTF form:**

```
A_std  = −(A_vtf + 1)
B_std  = B_vtf
T₀_std = T₀_vtf
```

**Step 4 — Evaluate at any target viscosity:**

```
T [°C] = B_std / (log η [Pa·s] − A_std) + T₀_std
```

### Worked Example — S1 glass

**Composition (wt%):** SiO₂ 77.02, Al₂O₃ 0.19, Na₂O 12.03, K₂O 0.13, CaO 10.12

**Step 1 — Parts per 100 SiO₂:**
```
x_Al₂O₃ = 0.2467,  x_Na₂O = 15.619,  x_K₂O = 0.1688,  x_CaO = 13.139
```

**Step 2 — B_vtf:**
```
B_vtf = 6237.013
      + 15.21  × 0.2467
      + (−66.01) × 15.619
      + (−5.41)  × 0.1688
      + (−60.63) × 13.139
      = 6237.013 + 3.754 − 1031.18 − 0.913 − 796.56
      ≈ 4412
```

**Step 3 — A_vtf:**
```
A_vtf = 1.713
      + (−0.0087) × 0.2467
      + (−0.0162) × 15.619
      + 0.0066    × 0.1688
      + 0.0064    × 13.139
      ≈ 1.713 − 0.002 − 0.253 + 0.001 + 0.084
      ≈ 1.543
```

**Step 4 — T₀_vtf:**
```
T₀_vtf = 149.4
        + 1.4    × 0.2467
        + 0.5    × 15.619
        + (−2.36) × 0.1688
        + 7.71   × 13.139
        ≈ 149.4 + 0.345 + 7.810 − 0.398 + 101.30
        ≈ 258.5°C
```

**Step 5 — Standard form:**
```
A_std  = −(1.543 + 1) = −2.543
B_std  = 4412
T₀_std = 258.5°C
```

---

## Illustration Method — Component Viscosity Effects (Table 7)

> **This method is NOT used for production viscosity calculations.**
> It is retained for scientific analysis of how individual oxides affect the
> viscosity-temperature curve — as Lakatos intended.

### Formula

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

Output T(v) in °C at log η = v poise. Convert to Pa·s before VTF fitting: subtract 1.

### Coefficient Table

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

### Qualitative Notes on Component Effects

These coefficients are why Table 7 is valuable for illustration:

- **Li₂O** has the largest viscosity-decreasing effect at melting temperature (log η 2)
- **Na₂O** effect is approximately twice that of K₂O across all levels
- **CaO and MgO** strongly decrease melting temperature; their effect nearly vanishes at log η 6 — MgO even turns slightly positive (network stiffening at low temperature)
- **B₂O₃** makes "short" glasses: large negative coefficient at log η 2 that diminishes rapidly — captured by the quadratic term at high B₂O₃ concentrations
- **Alkali oxides and PbO** make "long" glasses: their coefficients remain significant at all three levels

---

## Implementation in Code

| Function | File | Role |
|---|---|---|
| `predictVtfDirectLakatos(comp)` | `glass-viscosity-vtf.util.ts` | **Production**: Table 6 → standard VTF parameters |
| `buildVtf(comp, selection)` | `glass-viscosity-vtf.util.ts` | Calls `predictVtfDirectLakatos` for `LAKATOS_1976` |
| `predictIsokomsLakatos(comp)` | `glass-viscosity-vtf.util.ts` | **Illustration**: Table 7 → 3 isokom temperatures |
| `LAKATOS_1976_DIRECT_VTF_COEFFICIENTS` | `constants/viscosity-parameters.ts` | Table 6 coefficients |
| `LAKATOS_1976_COEFFICIENTS` | `constants/viscosity-parameters.ts` | Table 7 coefficients |

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
