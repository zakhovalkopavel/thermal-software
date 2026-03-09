# Chapter 7: VTF Fitting Layer

**Part II: Model Implementations**

---

## Overview

The VTF fitting layer converts model outputs into a full viscosity-temperature curve.

| Model | Path to VTF |
|---|---|
| **Lakatos 1976 (production)** | Composition → B, A, T₀ directly via Table 6 regression → convert to standard form. **No three-point fit needed.** |
| **Lakatos 1976 (illustration)** | Composition → 3 isokom temperatures (Table 7) → three-point VTF fit |
| **Fluegel 2007** | Composition → 3 isokom temperatures → three-point VTF fit |
| **Hetherington 1964** | Fixed Arrhenius constants — no VTF |

The three-point fit (`fitVtfThreePoints`) is therefore used only by Fluegel and by the Lakatos component-effect illustration path.

---

## VTF Equation

This spec uses the standard form:

```
log₁₀(η [Pa·s]) = A + B / (T [°C] − T₀)
```

Where:
- `A` = high-temperature limiting log viscosity (dimensionless, typically −4 to +3)
- `B` = pseudo-activation energy parameter (K, always positive, typically 1000–20000)
- `T₀` = Vogel temperature (°C, always positive and below lowest glass transition, typically 100–500°C)
- `T` = temperature in °C
- `η` = viscosity in Pa·s

**Inversion** — temperature at target log η:

```
T = B / (log η − A) + T₀
```

---

## Input Data Pairs

### From Lakatos 1976 — production path (Table 6)

VTF constants are obtained directly from composition regression. No isokom temperatures are computed. The raw constants use Lakatos's poise-scale convention:

```
T [°C] = B_vtf / (log η [poise] + A_vtf) + T₀_vtf
```

Convert once to standard form (see Chapter 4):

```
A_std = −(A_vtf + 1),   B_std = B_vtf,   T₀_std = T₀_vtf
```

### From Lakatos 1976 — component-effect illustration (Table 7)

Three isokom temperatures from the regression are in **poise**. Before fitting, subtract 1 to convert to Pa·s:

| Lakatos regression level | Convert to Pa·s level | VTF point |
|---|---|---|
| log η = 2 poise | log η = **1** Pa·s | (T₂, 1) |
| log η = 4 poise | log η = **3** Pa·s | (T₄, 3) |
| log η = 6 poise | log η = **5** Pa·s | (T₆, 5) |

### From Fluegel 2007

No unit conversion needed — Fluegel tables already use Pa·s:

| Fluegel regression level | VTF point |
|---|---|
| log η = 1.5 Pa·s | (T₁·₅, 1.5) |
| log η = 6.6 Pa·s | (T₆·₆, 6.6) |
| log η = 12.0 Pa·s | (T₁₂, 12) |

---

## Three-Point VTF Fit — Levenberg-Marquardt Solver

Although the system is exactly determined (3 equations, 3 unknowns — a unique solution exists in principle), the implementation uses a **Levenberg-Marquardt (LM) nonlinear least-squares solver** rather than the analytical determinant form.

### Why Not the Analytical Form?

The closed-form determinant solution for T₀ is:

```
T₀ = (T₂·T₃·(y₂−y₃) + T₁·T₃·(y₃−y₁) + T₁·T₂·(y₁−y₂))
   / (T₃·(y₂−y₃) + T₁·(y₃−y₁) + T₂·(y₁−y₂))
```

This is mathematically correct but **numerically unstable** for glass viscosity data:
- Temperatures are large (~1000°C) while viscosity differences are small (Δy ~ 2–4 log units)
- The numerator involves products like T₁·T₂ ≈ 10⁶ that cancel almost completely
- Catastrophic cancellation leads to large relative errors in T₀, which then propagate into B and A

The LM solver works directly on the residuals `yᵢ − (A + B/(Tᵢ − T₀))` in the original scale, avoiding large intermediate products entirely.

### Initial Guess Strategy

The LM solver requires a starting point. The seed is chosen to be physically meaningful:

```
T₀_seed = max(1°C,  T_min × 0.4)          ← well below lowest isokom T
B_seed  = Δy / (1/(T_min − T₀_seed) − 1/(T_max − T₀_seed))   ← Arrhenius approximation
A_seed  = y_max − B_seed / (T_max − T₀_seed)
```

Where T_min and T_max are the lowest and highest isokom temperatures respectively.

### Convergence and Validation

After the solver converges, the result is validated:

| Check | Condition | Error thrown |
|---|---|---|
| Physical T₀ | T₀ > 0°C | `VTF_FIT_INVALID_T0` |
| T₀ below data | T₀ < T_min | `VTF_FIT_INVALID_T0` |
| Physical B | B > 0 | `VTF_FIT_INVALID_B` |
| Convergence | max residual < 0.01 log units | `VTF_FIT_SINGULAR` |

A max residual > 0.01 log units indicates the three points are nearly collinear (Arrhenius-like) — the LM solver cannot fit a VTF curve through them, which is physically meaningful: it means the glass does not show VTF behaviour in the given range.

### TypeScript Implementation

```typescript
function fitVtfThreePoints(p1: VtfPoint, p2: VtfPoint, p3: VtfPoint): VtfParameters {
  // Sort descending T: T1 > T2 > T3, y1 < y2 < y3
  const pts = [p1, p2, p3].sort((a, b) => b.T_celsius - a.T_celsius);
  const [q1, q2, q3] = pts;
  const T1 = q1.T_celsius, y1 = q1.logEtaPaS;
  const T2 = q2.T_celsius;
  const T3 = q3.T_celsius, y3 = q3.logEtaPaS;

  // Seed T₀ well below the lowest measured temperature
  const T0_seed = Math.max(1, T3 * 0.4);

  // Seed B from Arrhenius slope between the two extreme points
  const dY = y3 - y1;
  const dInvT = 1 / (T3 - T0_seed) - 1 / (T1 - T0_seed);
  const B_seed = Math.abs(dInvT) > 1e-12 ? dY / dInvT : 5000;

  // Seed A from the VTF equation at point 1
  const A_seed = y1 - B_seed / (T1 - T0_seed);

  // VTF model: ([A, B, T0]) => (T) => A + B / (T - T0)
  const vtfModel = ([A, B, T0]: number[]) => (T: number) => A + B / (T - T0);

  const fit = levenbergMarquardt(
    [T1, T2, T3],
    [q1.logEtaPaS, q2.logEtaPaS, q3.logEtaPaS],
    vtfModel,
    [A_seed, B_seed, T0_seed],
    { maxIterations: 1000, damping: 1e-3, gradientDifference: 1e-5 },
  );

  const [A, B, T0] = fit.parameterValues;

  // Physical and convergence validation
  if (T0 <= 0)  throw new Error(`VTF_FIT_INVALID_T0: T₀ = ${T0.toFixed(1)}°C (must be > 0°C)`);
  if (T0 >= T3) throw new Error(`VTF_FIT_INVALID_T0: T₀ = ${T0.toFixed(1)}°C ≥ lowest isokom T`);
  if (B  <= 0)  throw new Error(`VTF_FIT_INVALID_B: B = ${B.toFixed(1)} K (must be > 0)`);

  const maxResidual = Math.max(...[T1, T2, T3].map(
    (T, i) => Math.abs(vtfModel([A, B, T0])(T) - [q1, q2, q3][i].logEtaPaS)
  ));
  if (maxResidual > 0.01) {
    throw new Error(
      `VTF_FIT_SINGULAR: LM did not converge — max residual ${maxResidual.toFixed(4)}. ` +
      'Points may be collinear (Arrhenius-like).'
    );
  }

  return { A, B, T0 };
}
```

---

## Fixed-Point Calculation

Once VTF parameters are known, derive temperature at any log η target:

```typescript
function temperatureAtViscosity(vtf: VtfParameters, targetLogEtaPaS: number): number {
  // T = B / (log η - A) + T0
  const denom = targetLogEtaPaS - vtf.A;
  if (Math.abs(denom) < 1e-10) {
    throw new Error('Target log η equals A — viscosity is asymptotically unreachable');
  }
  return vtf.B / denom + vtf.T0;
}
```

### ASTM Fixed-Point Targets

| Fixed Point | log η (Pa·s) | log η (poise) |
|---|---|---|
| Melting point | 1.0 | 2.0 |
| Flow point | 4.0 | 5.0 |
| Working point | 3.0 | 4.0 |
| Littleton softening point | 6.6 | 7.6 |
| Annealing point | 12.0 | 13.0 |
| Strain point | 13.5 | 14.5 |

```typescript
const ASTM_FIXED_POINTS: Record<string, number> = {
  meltingPoint:   1.0,
  flowPoint:      4.0,
  workingPoint:   3.0,
  softeningPoint: 6.6,
  annealingPoint: 12.0,
  strainPoint:    13.5,
};

function calculateAllFixedPoints(vtf: VtfParameters): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [name, logEta] of Object.entries(ASTM_FIXED_POINTS)) {
    result[name] = temperatureAtViscosity(vtf, logEta);
  }
  return result;
}
```

---

## Physical Constraints and Sanity Checks

After computing VTF parameters and fixed points, validate:

| Check | Condition | Action on failure |
|---|---|---|
| T₀ positive | T₀ > 0°C | Error: non-physical VTF fit |
| T₀ below glass transition | T₀ < T_annealing − 100°C | Warning: unusual VTF shape |
| B positive | B > 0 | Error: non-physical VTF fit |
| B reasonable | 500 < B < 30000 | Warning: extreme fragility |
| Temperature ordering | T_strain < T_annealing < T_softening < T_working < T_melting | Error if violated |
| Softening point range | 400 < T_softening < 1200°C | Warning if outside |
| Annealing point range | 300 < T_annealing < 800°C | Warning if outside |

```typescript
function validateFixedPoints(fixedPoints: Record<string, number>): string[] {
  const warnings: string[] = [];

  const { strainPoint, annealingPoint, softeningPoint, workingPoint, meltingPoint } = fixedPoints;

  if (strainPoint >= annealingPoint) {
    warnings.push(`ORDERING_VIOLATION: strain (${strainPoint.toFixed(0)}°C) ≥ annealing (${annealingPoint.toFixed(0)}°C)`);
  }
  if (annealingPoint >= softeningPoint) {
    warnings.push(`ORDERING_VIOLATION: annealing (${annealingPoint.toFixed(0)}°C) ≥ softening (${softeningPoint.toFixed(0)}°C)`);
  }
  if (softeningPoint >= workingPoint) {
    warnings.push(`ORDERING_VIOLATION: softening (${softeningPoint.toFixed(0)}°C) ≥ working (${workingPoint.toFixed(0)}°C)`);
  }
  if (workingPoint >= meltingPoint) {
    warnings.push(`ORDERING_VIOLATION: working (${workingPoint.toFixed(0)}°C) ≥ melting (${meltingPoint.toFixed(0)}°C)`);
  }

  return warnings;
}
```

---

## Note on R² and Fit Quality

With exactly three data points and three free parameters (A, B, T₀), the VTF fit is **exactly determined** — the LM solver converges to a zero-residual solution (max residual < 0.01 log units is enforced). R² = 1.0 by construction. This means fit quality **cannot** be used as a confidence indicator for Fluegel or for the Lakatos illustration path.

For the **Lakatos production path** (Table 6 direct VTF), no fitting occurs at all — the VTF constants are read directly from the regression, so there is no residual to report.

The confidence of the fixed-point predictions comes entirely from:
1. The model's reported σ on the training dataset (Lakatos: 3–5°C at isokom levels; Fluegel: 9–17°C)
2. Error propagation through the VTF inversion (see Chapter 9)
3. Composition range compliance (Chapter 3)

Do not report R² as a quality metric for this fit.

---

## Worked Example — S1 glass (Fluegel / Lakatos illustration path)

> **Note:** This example shows the analytical determinant approach for mathematical transparency.
> The actual implementation (`fitVtfThreePoints`) uses the Levenberg-Marquardt solver
> which produces the same result numerically but avoids catastrophic cancellation.

**Input points from Lakatos Table 7 (illustration path), S1 glass:**

```
(T₁, y₁) = (1503.19, 1)   [T at log η = 1 Pa·s]
(T₂, y₂) = (1054.33, 3)   [T at log η = 3 Pa·s]
(T₃, y₃) = (843.30,  5)   [T at log η = 5 Pa·s]
```

**T₀ from determinant form:**

```
num = 1054.33 × 843.30 × (3−5) + 1503.19 × 843.30 × (5−1) + 1503.19 × 1054.33 × (1−3)
    = −1,778,804 + 5,072,775 − 3,167,490 = 126,481

den = 843.30 × (3−5) + 1503.19 × (5−1) + 1054.33 × (1−3)
    = −1686.6 + 6012.76 − 2108.66 = 2217.5

T₀ ≈ 57.0°C
```

**B and A:**

```
B = (3−1) × (1503.19−57.0) × (1054.33−57.0) / (1503.19−1054.33) ≈ 6430 K
A = 1 − 6430 / (1503.19−57.0) ≈ −3.447
```

**LM result** (from `fitVtfThreePoints` on the same input): T₀ ≈ 57°C, B ≈ 6430 K, A ≈ −3.45 — matches to the precision that matters.

**Fixed points from these VTF parameters:**

```
T_softening (log η = 6.6)  = 6430 / (6.6 − (−3.447)) + 57.0 ≈ 697°C
T_annealing (log η = 12.0) = 6430 / (12.0 − (−3.447)) + 57.0 ≈ 473°C
T_strain    (log η = 13.5) = 6430 / (13.5 − (−3.447)) + 57.0 ≈ 436°C
```

These values are physically consistent for a soda-lime glass.

---

**Next:** [Chapter 8 — Output Structures](./chapter-08-output-structures.md)

