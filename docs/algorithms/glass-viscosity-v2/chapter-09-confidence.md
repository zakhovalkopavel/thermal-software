# Chapter 9: Error and Confidence Estimation

**Part III: Output and Confidence**

---

## Overview

The VTF fit from three isokom points is exact — it has zero residual by construction. Therefore all uncertainty in the final fixed-point temperatures comes from uncertainty in the isokom temperatures themselves, which comes from the regression model's reported error.

---

## Model Standard Errors

### Lakatos 1976

From `page_002_table_007.csv`:

| Viscosity level | σ (°C) | 95% CI (≈ ±2σ) |
|---|---|---|
| log η = 2 poise = 1 Pa·s | 4.63 | ±9.3°C |
| log η = 4 poise = 3 Pa·s | 3.34 | ±6.7°C |
| log η = 6 poise = 5 Pa·s | 3.14 | ±6.3°C |

These σ values are the **root-mean-square residuals** on the 44-glass training dataset.

### Fluegel 2007

From paper Section 3 (page 22):
- Overall model standard error: **9–17°C** across the three viscosity levels
- R² = 0.985–0.989

The paper does not separately report σ for each of the three viscosity levels. Use **σ = 17°C** (the conservative upper bound) for all three levels when computing confidence intervals.

---

## Uncertainty Propagation Through VTF Inversion

When the three isokom temperatures each have uncertainty ±σᵢ, the uncertainty in a fixed-point temperature T_fp derived from the VTF fit is approximately:

```
σ_fp² ≈ (∂T_fp/∂T₁)² σ₁² + (∂T_fp/∂T₂)² σ₂² + (∂T_fp/∂T₃)² σ₃²
```

The partial derivatives ∂T_fp/∂Tᵢ depend on where the fixed point falls relative to the three fitting points and on the VTF curve shape. In general:

- Fixed points **within the range** of the three fitting temperatures have lower uncertainty
- Fixed points **outside the range** (extrapolated) have higher uncertainty, growing with extrapolation distance

### Practical Approximation

Rather than computing full analytical Jacobians (which require differentiating the 3×3 determinant solve), use the following **conservative practical estimate**:

For a fixed point at log η = y_fp, with three fitting points at (T₁, y₁), (T₂, y₂), (T₃, y₃):

```
σ_fp ≈ σ_model × (1 + extrapolation_penalty)
```

Where:
- `σ_model` = the model's reported σ at the nearest fitting point (Pa·s scale)
- `extrapolation_penalty` = 0 if y_fp is between y₁ and y₃; scales linearly beyond (0.5 per full σ-range unit)

### Implemented Estimate Function

```typescript
function estimateFixedPointUncertainty(
  vtf: VtfParameters,
  targetLogEtaPaS: number,
  fittingPoints: VtfPoint[],
  modelSigma: number  // σ in °C at the isokom level
): number {
  const logEtaValues = fittingPoints.map(p => p.logEtaPaS);
  const minLogEta = Math.min(...logEtaValues);
  const maxLogEta = Math.max(...logEtaValues);
  const rangeSpan = maxLogEta - minLogEta;

  let extrapolationFactor = 1.0;

  if (targetLogEtaPaS < minLogEta) {
    // Extrapolating toward high-T direction
    extrapolationFactor = 1.0 + (minLogEta - targetLogEtaPaS) / rangeSpan;
  } else if (targetLogEtaPaS > maxLogEta) {
    // Extrapolating toward low-T direction
    extrapolationFactor = 1.0 + (targetLogEtaPaS - maxLogEta) / rangeSpan;
  }

  // Scale σ from log η units to temperature units using local VTF slope
  // dT/d(log η) = -B / (log η - A)²
  const dTdLogEta = Math.abs(-vtf.B / Math.pow(targetLogEtaPaS - vtf.A, 2));

  // Uncertainty in log η from model's σ in °C:
  // σ_logEta ≈ σ_T / |dT/d(logEta)|
  // But we want σ_T_fp from σ_T_isokom, which is more complex.
  // Conservative: propagate as fraction of temperature range.

  return modelSigma * extrapolationFactor;
}
```

### Approximate Values for Standard Glass Compositions

For a typical soda-lime container glass (VTF A ≈ −3.5, B ≈ 6400, T₀ ≈ 55°C):

| Fixed Point | log η (Pa·s) | Lakatos σ_fp (approx.) | Fluegel σ_fp (approx.) |
|---|---|---|---|
| Melting | 1.0 | ±5°C (within range) | ±17°C (within range) |
| Working | 3.0 | ±5°C (within range) | ±17°C (within range) |
| Softening | 6.6 | ±8°C (extrapolated) | ±17°C (within range) |
| Annealing | 12.0 | ±15°C (extrapolated) | ±17°C (within range) |
| Strain | 13.5 | ±20°C (further extrapolated) | ±22°C (slightly extrapolated) |

---

## Confidence Level Rules

The `ConfidenceLevel` field on each result is set according to the following rules, applied in order (first matching rule wins):

### Lakatos 1976

| Condition | Level |
|---|---|
| All components in the 11-set AND no component exceeds its range AND no B₂O₃ > 20 wt% | `HIGH` |
| Ignored components sum < 2 wt% AND SiO₂ > 65 wt% | `NORMAL` |
| Ignored components sum 2–5 wt% OR SiO₂ 50–65 wt% | `REDUCED` |
| SiO₂ < 50 wt% (model not applicable) | — (Lakatos not used) |
| Ignored components sum > 5 wt% | `LOW` |

### Fluegel 2007

| Condition | Level |
|---|---|
| All components within `Fluegel_table3.csv` bounds AND SiO₂ within [42.62, 89.2] mol% | `NORMAL` |
| 1–3 components out of range by < 20% relative | `REDUCED` |
| Any component > 20% above table 3 limit | `LOW` |
| SiO₂ outside [42.62, 89.2] mol% | `LOW` |

---

## Warning Generation

### Conditions That Produce Warnings

```typescript
function generateWarnings(
  composition: Record<string, number>,
  model: 'LAKATOS' | 'FLUEGEL',
  vtf: VtfParameters,
  fixedPoints: Record<string, number>
): ModelWarning[] {
  const warnings: ModelWarning[] = [];

  // --- VTF parameter warnings ---

  if (vtf.T0 < 50) {
    warnings.push({
      code: 'VTF_T0_LOW',
      message: `Vogel temperature T₀ = ${vtf.T0.toFixed(1)}°C is unusually low. ` +
               `Fixed-point temperatures in the annealing/strain range may be unreliable.`,
      source: 'VTF'
    });
  }

  if (vtf.B < 500 || vtf.B > 30000) {
    warnings.push({
      code: 'VTF_B_EXTREME',
      message: `VTF parameter B = ${vtf.B.toFixed(0)} K is outside the expected range ` +
               `500–30000 K. This indicates unusual glass fragility behavior.`,
      source: 'VTF'
    });
  }

  // --- Fixed-point ordering warnings ---

  const orderChecks = [
    ['strain', 'annealing'],
    ['annealing', 'softening'],
    ['softening', 'working'],
    ['working', 'melting'],
  ] as const;

  for (const [lower, upper] of orderChecks) {
    if (fixedPoints[lower + 'Point'] >= fixedPoints[upper + 'Point']) {
      warnings.push({
        code: 'ORDERING_VIOLATION',
        message: `${lower} point (${fixedPoints[lower + 'Point'].toFixed(0)}°C) ≥ ` +
                 `${upper} point (${fixedPoints[upper + 'Point'].toFixed(0)}°C). ` +
                 `This is non-physical.`,
        source: 'VALIDATION'
      });
    }
  }

  // --- Range warnings ---

  if (fixedPoints['softeningPoint'] < 300 || fixedPoints['softeningPoint'] > 1300) {
    warnings.push({
      code: 'EXTRAPOLATION',
      message: `Predicted softening point (${fixedPoints['softeningPoint'].toFixed(0)}°C) ` +
               `is outside the typical glass range 300–1300°C.`,
      source: 'VALIDATION'
    });
  }

  return warnings;
}
```

---

## Dual-Model Disagreement

When both Lakatos and Fluegel are run, compare fixed-point temperatures:

```typescript
function checkModelAgreement(
  lakatosFixed: FixedPoints,
  fluegelFixed: FixedPoints
): ModelWarning[] {
  const warnings: ModelWarning[] = [];
  const THRESHOLD = 30; // °C

  const pointsToCheck: Array<keyof FixedPoints> = [
    'meltingPoint', 'workingPoint', 'softeningPoint', 'annealingPoint', 'strainPoint'
  ];

  for (const point of pointsToCheck) {
    const diff = Math.abs(lakatosFixed[point] - fluegelFixed[point]);
    if (diff > THRESHOLD) {
      warnings.push({
        code: 'MODELS_DISAGREE',
        message: `Lakatos and Fluegel ${point} predictions differ by ${diff.toFixed(0)}°C ` +
                 `(Lakatos: ${lakatosFixed[point].toFixed(0)}°C, ` +
                 `Fluegel: ${fluegelFixed[point].toFixed(0)}°C). ` +
                 `Difference exceeds ${THRESHOLD}°C threshold. Verify composition validity.`,
        source: 'VALIDATION'
      });
    }
  }

  return warnings;
}
```

---

**Next:** [Chapter 10 — Validation Dataset](./chapter-10-validation-dataset.md)

