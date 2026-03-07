# Numerical Methods Convention

## Overview

All numerical solving and optimisation in the backend **must** use the wrapper functions
in `backend/src/common/utils/numeric.util.ts`.  
Direct use of the underlying packages is forbidden — call the wrappers.

The wrappers are named after their **SciPy equivalents** so that algorithms described in
papers or Python prototypes can be translated directly to TypeScript without looking up
API differences.

---

## SciPy → Node.js mapping

| Problem class | SciPy method | Node.js wrapper | Underlying package |
|---|---|---|---|
| 1-D root finding | `scipy.optimize.brentq` | `brentq(f, a, b, tol?)` | `brent-zero-generator` |
| 1-D minimisation | `scipy.optimize.brent` | `brent(f, a, b, tol?)` | built-in (golden-section) |
| N-D minimisation (gradient-free) | `scipy.optimize.minimize(method='Nelder-Mead')` | `nelderMead(f, x0, opts?)` | `fmin` |
| N-D minimisation (gradient-based) | `scipy.optimize.minimize(method='CG')` | `conjugateGradient(f, x0, opts?)` | `fmin` |
| Linear regression | `scipy.stats.linregress` / `numpy.polyfit(deg=1)` | `linearRegression(x, y)` | `ml-regression` |
| Polynomial fit | `numpy.polyfit(x, y, deg)` | `polynomialFit(x, y, degree)` | `ml-regression` |
| Exponential fit y=A·eᴮˣ | `curve_fit` with exp model | `exponentialFit(x, y)` | `ml-regression` |
| Power fit y=A·xᴮ | `curve_fit` with power model | `powerFit(x, y)` | `ml-regression` |
| Arbitrary nonlinear curve fit | `scipy.optimize.curve_fit` / `least_squares` | `levenbergMarquardt(x, y, model, p0)` | `ml-levenberg-marquardt` |
| Dense linear system | `scipy.linalg.solve` / `numpy.linalg.solve` | `luSolve(A, b)` | `mathjs` |

> **Not covered:** sparse systems, global optimisation, integer programming, constrained optimisation (SLSQP).
> Add a new wrapper if needed — do not call the underlying library directly.

---

## ml-regression vs levenbergMarquardt

| Criterion | Use `ml-regression` | Use `levenbergMarquardt` |
|---|---|---|
| Model family | Standard: linear, polynomial, y=A·eᴮˣ, y=A·xᴮ | Arbitrary user-defined function |
| Solver | Closed-form / linearisation (fast, exact) | Iterative (slower, needs initial guess) |
| Initial guess required | No | Yes |
| Examples | Temperature calibration curves, packing density vs pressure | Arrhenius A·exp(B/T), VTF A+B/(T−T₀), multi-parameter slag models |

---

## Package loading strategy

The backend uses **CommonJS** (`"module": "commonjs"` in tsconfig.json).

| Package | Module format | Loading strategy |
|---|---|---|
| `brent-zero-generator` | CJS | `require('brent-zero-generator')` — standard |
| `fmin` | UMD build with `"type":"module"` in package.json | `Function()` wrapper around `build/fmin.js` — loaded once, cached |
| `ml-levenberg-marquardt` | CJS | `require('ml-levenberg-marquardt')` — standard |
| `mathjs` | CJS | `require('mathjs')` — standard |

`fmin` ships `"type":"module"` in its `package.json`, which causes Node.js to treat
all `.js` files in the package as ESM — but the actual `build/fmin.js` is a UMD bundle
that works fine when executed via `new Function(...)`.  
Dynamic `import()` fails because Node tries to parse the UMD file as ESM syntax.  
The `getFmin()` loader in `numeric.util.ts` handles this transparently.  
**Never call `require('fmin')` or `import('fmin')` directly.**

---

## Method reference

### `brentq(f, a, b, tol?)`

```typescript
import { brentq } from '@/common/utils/numeric.util';

// Find T where viscosity(T) = target
const { root } = brentq(T => calcViscosity(T) - target, T_min, T_max, 1e-6);
```

- `f(a)` and `f(b)` **must** have opposite signs (bracketed root).
- Returns `{ root: number }`.
- Typical use: inverting monotone 1-D functions (viscosity → temperature).

---

### `brent(f, a, b, tol?)`

```typescript
import { brent } from '@/common/utils/numeric.util';

// Find minimum of a unimodal scalar function in [a, b]
const { x, fx } = brent(T => Math.abs(calcViscosity(T) - target), T_min, T_max);
```

- Golden-section search — no gradient needed.
- Returns `{ x: [xMin], fx: f(xMin) }`.
- Use when `brentq` is not applicable (non-monotone or function does not change sign).

---

### `nelderMead(f, x0, opts?)`

```typescript
import { nelderMead } from '@/common/utils/numeric.util';

// Fit two Arrhenius parameters to measured data
const { x } = nelderMead(
  ([A, B]) => sumSquares(T_data.map(T => A * Math.exp(B / T) - eta_data[T])),
  [1e-4, 20000],
  { maxIterations: 2000 },
);
const [A, B] = x;
```

- No gradient required. Robust for non-smooth or noisy objectives.
- Slower than gradient methods for smooth functions.
- Returns `{ x: number[], fx: number }`.

---

### `conjugateGradient(f, x0, opts?)`

```typescript
import { conjugateGradient } from '@/common/utils/numeric.util';

// f must mutate grad in-place AND return the scalar value
const { x } = conjugateGradient(
  (v, grad) => {
    const [x, y] = v;
    grad[0] = 2 * (x - 3);
    grad[1] = 2 * (y - 7);
    return (x - 3) ** 2 + (y - 7) ** 2;
  },
  [0, 0],
);
```

- **Requires analytic gradient.** If gradient is unavailable, use `nelderMead`.
- `f(x, grad)` must **mutate `grad` in-place** (not return it) and **return the scalar** `fx`.
- Returns `{ x: number[], fx: number }`.

---

### `linearRegression(x, y)`

```typescript
import { linearRegression } from '@/common/utils/numeric.util';

const { slope, intercept, r2, predict } = linearRegression(T_values, eta_values);
console.log(`η = ${slope}·T + ${intercept}  R²=${r2.toFixed(4)}`);
```

- Ordinary least squares, closed-form.
- Returns `{ slope, intercept, r2, predict }`.

---

### `polynomialFit(x, y, degree)`

```typescript
import { polynomialFit } from '@/common/utils/numeric.util';

const { coefficients, r2, predict } = polynomialFit(T_values, shrinkage_values, 2);
// coefficients = [c0, c1, c2]  →  y = c0 + c1·x + c2·x²
```

- Returns coefficients in **ascending** degree order `[c0, c1, …, cn]`
  (opposite to `numpy.polyfit` which is descending).

---

### `exponentialFit(x, y)`

```typescript
import { exponentialFit } from '@/common/utils/numeric.util';

// y = A·eᴮˣ  — e.g. creep rate vs temperature
const { A, B, r2, predict } = exponentialFit(T_values, creep_values);
```

- Closed-form via log-linearisation. All `y` must be positive.
- Use `levenbergMarquardt` if the exponent form is `A·exp(B/x)` (Arrhenius) — different model.

---

### `powerFit(x, y)`

```typescript
import { powerFit } from '@/common/utils/numeric.util';

// y = A·xᴮ  — e.g. particle size vs milling time
const { A, B, r2, predict } = powerFit(time_values, size_values);
```

- Closed-form via log-log linearisation. All `x` and `y` must be positive.

---

### `levenbergMarquardt(xData, yData, model, initialValues, opts?)`

```typescript
import { levenbergMarquardt } from '@/common/utils/numeric.util';

// Fit Arrhenius: eta(T) = A * exp(B / T)
const result = levenbergMarquardt(
  T_values,
  eta_measured,
  ([A, B]) => (T) => A * Math.exp(B / T),
  [1e-4, 20000],
);
const [A, B] = result.parameterValues;
```

- Best choice for **overdetermined nonlinear systems** (more data points than parameters).
- Practical substitute for `scipy.optimize.root(method='hybr')` on smooth residuals
  when there are more equations than unknowns.
- Returns `{ parameterValues, parameterError, iterations }`.

---

### `luSolve(A, b)`

```typescript
import { luSolve } from '@/common/utils/numeric.util';

// Solve 3-point VTF system: M · [A, B, T0]ᵀ = rhs
const { x: [A, B, T0] } = luSolve(
  [[1, 1/(T1-t0), 1], [1, 1/(T2-t0), 1], [1, 1/(T3-t0), 1]],
  [logEta1, logEta2, logEta3],
);
```

- `A` must be square and non-singular.
- Returns `{ x: number[] }`.
- For overdetermined systems (more equations than unknowns) use `levenbergMarquardt`.

---

## Choosing the right method

```
Problem has a bracket [a,b] where f(a)·f(b) < 0?
  └─ YES → brentq  (1-D root, fastest)

Minimising a scalar function of 1 variable in [a,b]?
  └─ YES → brent

System is linear (A·x = b)?
  └─ YES → luSolve

Fitting data to a model?
  ├─ Standard family (linear / poly / A·eᴮˣ / A·xᴮ)?
  │   └─ YES → linearRegression / polynomialFit / exponentialFit / powerFit
  └─ Arbitrary nonlinear model?
      └─ YES → levenbergMarquardt

Multi-variable minimisation?
  ├─ Gradient available? → conjugateGradient  (faster)
  └─ No gradient?        → nelderMead         (gradient-free)
```

---

## Adding new wrappers

1. Identify the SciPy equivalent method name.
2. Research the npm package — confirm it is actively maintained, MIT/Apache licensed,
   and works in Node.js CJS context (or document the loading workaround).
3. Add the wrapper to `numeric.util.ts` with full JSDoc including the SciPy equivalent.
4. Add a smoke test case to `test-numeric-smoke.js`.
5. Add a row to the mapping table in this document.

