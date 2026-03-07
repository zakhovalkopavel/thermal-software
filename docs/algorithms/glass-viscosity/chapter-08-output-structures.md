# Chapter 8: Output Structures

**Part III: Output and Confidence**

---

## Overview

This chapter defines the TypeScript interfaces for all outputs of the glass viscosity  service. These interfaces are the contract between the computation layer and the API/frontend.

---

## Core Interfaces

### `VtfParameters`

The three VTF equation parameters fitted from isokom temperatures.

```typescript
interface VtfParameters {
  /** High-temperature limiting value of log10(η [Pa·s]). Typically -4 to +3. */
  A: number;

  /** Pseudo-activation energy in K (Kelvin). Must be > 0. Typically 1000–20000. */
  B: number;

  /** Vogel temperature in °C. Must be > 0 and < glass transition temperature. */
  T0: number;
}
```

### `IsokemTemperatures`

The three raw isokom temperatures as predicted by the regression model, before VTF fitting. Used for validation and debugging.

```typescript
interface IsokemTemperatures {
  /** Temperature (°C) at the model's lowest viscosity level */
  T_low: number;
  logEta_low: number;  // in Pa·s

  /** Temperature (°C) at the model's middle viscosity level */
  T_mid: number;
  logEta_mid: number;  // in Pa·s

  /** Temperature (°C) at the model's highest viscosity level */
  T_high: number;
  logEta_high: number; // in Pa·s
}
```

### `FixedPoints`

All ASTM C965-96 fixed-point temperatures derived from the VTF fit.

```typescript
interface FixedPoints {
  /** T at log η = 1.0 Pa·s (log η = 2.0 poise). Typical soda-lime: 1200–1500°C */
  meltingPoint: number;

  /** T at log η = 3.0 Pa·s (log η = 4.0 poise). Upper forming temperature. */
  workingPoint: number;

  /** T at log η = 4.0 Pa·s (log η = 5.0 poise). */
  flowPoint: number;

  /** T at log η = 6.6 Pa·s (log η = 7.6 poise). Littleton softening point. Typical: 500–900°C */
  softeningPoint: number;

  /** T at log η = 12.0 Pa·s (log η = 13.0 poise). Typical: 400–650°C */
  annealingPoint: number;

  /** T at log η = 13.5 Pa·s (log η = 14.5 poise). Typical: 370–620°C */
  strainPoint: number;
}
```

### `ConfidenceLevel`

```typescript
type ConfidenceLevel = 'HIGH' | 'NORMAL' | 'REDUCED' | 'LOW';
```

| Level | Meaning |
|---|---|
| `HIGH` | All Lakatos 11-component composition, no components ignored, within training range |
| `NORMAL` | Within Fluegel bounds, no range violations |
| `REDUCED` | Some components out of range or ignored, prediction still computed |
| `LOW` | Significant out-of-range violations; result is extrapolation, treat with caution |

### `ModelWarning`

```typescript
interface ModelWarning {
  /** Machine-readable warning code */
  code: string;
  /** Human-readable description */
  message: string;
  /** Which model generated this warning */
  source: 'LAKATOS' | 'FLUEGEL' | 'VTF' | 'VALIDATION';
}
```

**Warning codes:**

| Code | Meaning |
|---|---|
| `COMPONENTS_IGNORED` | Components present that have no coefficient in the chosen model |
| `OUT_OF_RANGE_SIO2` | SiO₂ content outside validated range |
| `OUT_OF_RANGE_COMPONENT` | A specific component exceeds its max mol% in Fluegel table 3 |
| `VTF_T0_LOW` | Vogel temperature unusually low; curve shape may be unreliable at high viscosity |
| `VTF_B_EXTREME` | B parameter outside 500–30000 K; unusual glass fragility |
| `ORDERING_VIOLATION` | Fixed-point temperatures not in expected order |
| `MODELS_DISAGREE` | Lakatos and Fluegel predictions differ by > 30°C on any fixed point |
| `EXTRAPOLATION` | Prediction is outside the composition space of the training data |

---

## Per-Model Result

### `LakatosResult`

```typescript
interface LakatosResult {
  /** Model identifier */
  model: 'LAKATOS_1976';

  /** The three (T, log η) pairs before VTF fitting, in Pa·s */
  isokemTemperatures: IsokemTemperatures;

  /** VTF parameters fitted from the three isokom points */
  vtfParameters: VtfParameters;

  /** ASTM fixed-point temperatures derived from VTF fit */
  fixedPoints: FixedPoints;

  /** Overall confidence assessment */
  confidenceLevel: ConfidenceLevel;

  /** List of warnings from range checks and VTF validation */
  warnings: ModelWarning[];

  /**
   * Approximate ±°C at each fixed point, propagated from Lakatos σ values
   * (4.63°C at log η 1 Pa·s, 3.34°C at log η 3 Pa·s, 3.14°C at log η 5 Pa·s)
   */
  uncertaintyEstimate: {
    meltingPoint: number;
    softeningPoint: number;
    annealingPoint: number;
    strainPoint: number;
  };
}
```

### `FluegelResult`

```typescript
interface FluegelResult {
  /** Model identifier */
  model: 'FLUEGEL_2007';

  /** The three (T, log η) pairs before VTF fitting, in Pa·s */
  isokemTemperatures: IsokemTemperatures;

  /** VTF parameters fitted from the three isokom points */
  vtfParameters: VtfParameters;

  /** ASTM fixed-point temperatures derived from VTF fit */
  fixedPoints: FixedPoints;

  /** Overall confidence assessment */
  confidenceLevel: ConfidenceLevel;

  /** List of warnings from range checks and VTF validation */
  warnings: ModelWarning[];

  /**
   * Approximate ±°C at each fixed point, propagated from Fluegel SE = 9–17°C.
   * Conservative: use 17°C as σ for all levels.
   */
  uncertaintyEstimate: {
    meltingPoint: number;
    softeningPoint: number;
    annealingPoint: number;
    strainPoint: number;
  };
}
```

---

## Combined Result

### `GlassViscosityResult`

The top-level output of the service. Contains whichever models were applicable.

```typescript
interface GlassViscosityResult {
  /** Input composition as received (wt%), normalized to 100% */
  inputComposition: Record<string, number>;

  /** Which models were run */
  modelsUsed: Array<'LAKATOS_1976' | 'FLUEGEL_2007'>;

  /**
   * The primary recommendation. Set to:
   * - Lakatos result if only Lakatos is valid
   * - Fluegel result if only Fluegel is valid
   * - Lakatos result if both valid and they agree (Lakatos has tighter σ)
   * - null if models disagree; user must choose
   */
  primary: LakatosResult | FluegelResult | null;

  /** Lakatos result, if the model was applicable */
  lakatos?: LakatosResult;

  /** Fluegel result, if the model was applicable */
  fluegel?: FluegelResult;

  /**
   * System-level warnings (in addition to per-model warnings).
   * Includes MODELS_DISAGREE if applicable.
   */
  systemWarnings: ModelWarning[];

  /** Error if no model could be applied */
  error?: string;
}
```

---

## Viscosity Curve Evaluation

The service should also expose a function to evaluate log η at arbitrary temperature, for curve plotting:

```typescript
interface ViscosityCurvePoint {
  T_celsius: number;
  logEtaPaS: number;
  etaPaS: number;  // 10^logEtaPaS
}

/**
 * Generate a viscosity-temperature curve from VTF parameters.
 * Temperatures below T0 + 10°C are excluded (VTF diverges as T → T0).
 */
function generateViscosityCurve(
  vtf: VtfParameters,
  T_min_celsius: number,
  T_max_celsius: number,
  steps: number = 100
): ViscosityCurvePoint[];
```

---

**Next:** [Chapter 9 — Error and Confidence Estimation](./chapter-09-confidence.md)

