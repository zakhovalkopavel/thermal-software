# Chapter 6: Composition Encoding Utilities

**Part II: Model Implementations**

---

## Overview

Both models require a composition transformation before applying regression coefficients. The transformations are different:

| Model | Input | Transformation | Output |
|---|---|---|---|
| Lakatos 1976 | wt% (normalized) | Divide by SiO₂ wt%, multiply by 100 | Parts per 100 parts SiO₂ |
| Fluegel 2007 | wt% (normalized) | Convert to mol%, exclude SiO₂ | mol% (with SiO₂ as balance) |

---

## Algorithm 1: wt% → Parts per 100 SiO₂ (Lakatos)

### Formula

```
x_i = (wt%_i / wt%_SiO₂) × 100
```

- SiO₂ itself is the reference and does not appear in the formula
- The result is a dimensionless ratio scaled to 100

### Edge Cases

| Condition | Handling |
|---|---|
| SiO₂ = 0 wt% | **Error:** `ENCODING_ERROR_SIO2_ZERO` — Lakatos model requires SiO₂ as reference |
| SiO₂ < 50 wt% | **Error:** `ENCODING_ERROR_SIO2_TOO_LOW` — model not valid |
| Component wt% < 0 | **Error:** `ENCODING_ERROR_NEGATIVE_COMPONENT` |
| Sum ≠ 100% | Input should be normalized before calling; issue warning if sum deviates by more than 0.5% |

### TypeScript Pseudocode

```typescript
function encodeForLakatos(compositionWtPct: Record<string, number>): Record<string, number> {
  const SiO2 = compositionWtPct['SiO2'] ?? 0;
  
  if (SiO2 === 0) throw new Error('ENCODING_ERROR_SIO2_ZERO');
  if (SiO2 < 50) throw new Error('ENCODING_ERROR_SIO2_TOO_LOW');
  
  const result: Record<string, number> = {};
  
  for (const [component, wt] of Object.entries(compositionWtPct)) {
    if (component === 'SiO2') continue; // SiO2 is the reference, not a variable
    if (wt < 0) throw new Error(`ENCODING_ERROR_NEGATIVE_COMPONENT: ${component}`);
    if (wt > 0) {
      result[component] = (wt / SiO2) * 100;
    }
  }
  
  return result;
}
```

### Example

| Component | wt% | Parts per 100 SiO₂ |
|---|---|---|
| SiO₂ | 72.0 | (reference, not in table) |
| Na₂O | 14.0 | 14.0/72.0 × 100 = 19.44 |
| CaO | 10.0 | 10.0/72.0 × 100 = 13.89 |
| Al₂O₃ | 2.0 | 2.0/72.0 × 100 = 2.78 |
| MgO | 2.0 | 2.0/72.0 × 100 = 2.78 |

---

## Algorithm 2: wt% → mol% excluding SiO₂ (Fluegel)

### Step 1: Convert wt% to moles

For each component i:
```
n_i = wt%_i / M_i
```

Where M_i is the molar mass in g/mol.

### Step 2: Compute total moles

```
n_total = Σᵢ n_i
```

### Step 3: Compute mol%

```
C_i = (n_i / n_total) × 100
```

### Step 4: Use as Cᵢ in Fluegel formula

The Cᵢ values for all components **except SiO₂** are the inputs to the regression equations. SiO₂ is not included in any regression term. The SiO₂ mol% value (C_SiO₂) is used only for range validation against `Fluegel_table3.csv` bounds.

> **Important:** The denominator n_total includes SiO₂. Do not re-normalize the non-SiO₂ components to sum to 100%.

### Edge Cases

| Condition | Handling |
|---|---|
| Any component wt% < 0 | Error: `ENCODING_ERROR_NEGATIVE_COMPONENT` |
| SiO₂ not present | The model can technically run without SiO₂, but it is physically unreasonable; issue `WARNING_NO_SIO2` |
| Component not in molar mass table | Use the closest known oxide formula; log a warning |

---

## Molar Mass Reference Table

All values in g/mol, derived from IUPAC 2021 atomic weights:

| Oxide | Formula | M (g/mol) |
|---|---|---|
| SiO₂ | SiO₂ | 60.08 |
| Al₂O₃ | Al₂O₃ | 101.96 |
| Na₂O | Na₂O | 61.98 |
| K₂O | K₂O | 94.20 |
| Li₂O | Li₂O | 29.88 |
| CaO | CaO | 56.08 |
| MgO | MgO | 40.30 |
| BaO | BaO | 153.33 |
| ZnO | ZnO | 81.38 |
| PbO | PbO | 223.20 |
| B₂O₃ | B₂O₃ | 69.62 |
| Fe₂O₃ | Fe₂O₃ | 159.69 |
| TiO₂ | TiO₂ | 79.87 |
| ZrO₂ | ZrO₂ | 123.22 |
| SrO | SrO | 103.62 |
| MnO₂ | MnO₂ | 86.94 |
| P₂O₅ | P₂O₅ | 141.94 |
| SO₃ | SO₃ | 80.06 |
| F | F | 19.00 |
| Cl | Cl | 35.45 |
| Bi₂O₃ | Bi₂O₃ | 465.96 |
| Cr₂O₃ | Cr₂O₃ | 151.99 |
| CeO₂ | CeO₂ | 172.12 |
| CoO | CoO | 74.93 |
| CuO | CuO | 79.55 |
| Ga₂O₃ | Ga₂O₃ | 187.44 |
| Gd₂O₃ | Gd₂O₃ | 362.50 |
| GeO₂ | GeO₂ | 104.64 |
| La₂O₃ | La₂O₃ | 325.81 |
| MoO₃ | MoO₃ | 143.94 |
| Nb₂O₅ | Nb₂O₅ | 265.81 |
| Nd₂O₃ | Nd₂O₃ | 336.48 |
| NiO | NiO | 74.69 |
| Sb₂O₃ | Sb₂O₃ | 291.50 |
| Sm₂O₃ | Sm₂O₃ | 348.72 |
| SnO₂ | SnO₂ | 150.71 |
| ThO₂ | ThO₂ | 264.04 |
| UO₂ | UO₂ | 270.03 |
| V₂O₅ | V₂O₅ | 181.88 |
| WO₃ | WO₃ | 231.84 |
| Y₂O₃ | Y₂O₃ | 225.81 |

### TypeScript Pseudocode

```typescript
const MOLAR_MASSES: Record<string, number> = {
  SiO2:  60.08,
  Al2O3: 101.96,
  Na2O:  61.98,
  K2O:   94.20,
  Li2O:  29.88,
  CaO:   56.08,
  MgO:   40.30,
  BaO:   153.33,
  ZnO:   81.38,
  PbO:   223.20,
  B2O3:  69.62,
  Fe2O3: 159.69,
  TiO2:  79.87,
  ZrO2:  123.22,
  SrO:   103.62,
  MnO2:  86.94,
  P2O5:  141.94,
  SO3:   80.06,
  F:     19.00,
  Cl:    35.45,
  // ... (full table as above)
};

function encodeForFluegel(compositionWtPct: Record<string, number>): {
  molPct: Record<string, number>;  // includes SiO2 for range checking
  regressionInputs: Record<string, number>;  // excludes SiO2
} {
  // Step 1: wt% → moles
  const moles: Record<string, number> = {};
  for (const [component, wt] of Object.entries(compositionWtPct)) {
    if (wt <= 0) continue;
    const M = MOLAR_MASSES[component];
    if (M === undefined) {
      console.warn(`Unknown molar mass for ${component}, skipping`);
      continue;
    }
    moles[component] = wt / M;
  }

  // Step 2: total moles
  const totalMoles = Object.values(moles).reduce((a, b) => a + b, 0);
  if (totalMoles === 0) throw new Error('ENCODING_ERROR_ZERO_TOTAL_MOLES');

  // Step 3: mol%
  const molPct: Record<string, number> = {};
  for (const [component, n] of Object.entries(moles)) {
    molPct[component] = (n / totalMoles) * 100;
  }

  // Step 4: regression inputs (SiO2 excluded)
  const regressionInputs: Record<string, number> = { ...molPct };
  delete regressionInputs['SiO2'];

  return { molPct, regressionInputs };
}
```

### Example

Same composition as Lakatos example (wt%: SiO₂=72, Na₂O=14, CaO=10, Al₂O₃=2, MgO=2):

| Component | wt% | M (g/mol) | moles | mol% | Used in regression? |
|---|---|---|---|---|---|
| SiO₂ | 72.0 | 60.08 | 1.1985 | 72.95% | No (range check only) |
| Na₂O | 14.0 | 61.98 | 0.2259 | 13.75% | Yes, C_Na₂O = 13.75 |
| CaO | 10.0 | 56.08 | 0.1784 | 10.86% | Yes, C_CaO = 10.86 |
| Al₂O₃ | 2.0 | 101.96 | 0.01962 | 1.19% | Yes, C_Al₂O₃ = 1.19 |
| MgO | 2.0 | 40.30 | 0.04963 | 3.02% | Yes, C_MgO = 3.02 |
| **Total** | 100.0 | — | 1.6424 | 100.0% | — |

---

## Input Normalization

Both algorithms assume the input wt% values sum to 100%. The service should normalize before encoding:

```typescript
function normalizeComposition(composition: Record<string, number>): Record<string, number> {
  const total = Object.values(composition).reduce((a, b) => a + b, 0);
  if (Math.abs(total - 100) > 0.5) {
    console.warn(`Composition sums to ${total.toFixed(2)}%, normalizing to 100%`);
  }
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(composition)) {
    result[k] = (v / total) * 100;
  }
  return result;
}
```

---

**Next:** [Chapter 7 — VTF Fitting Layer](./chapter-07-vtf-fitting.md)

