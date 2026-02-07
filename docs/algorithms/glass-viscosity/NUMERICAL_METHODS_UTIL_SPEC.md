# Numerical Methods Utility - Implementation Specification

**Location:** `backend/src/common/utils/numerical-methods.util.ts`

**Purpose:** General-purpose numerical methods that can be used across the entire application, not specific to any module.

---

## File Structure

```typescript
/**
 * Numerical Methods Utility
 * 
 * General-purpose numerical algorithms for root finding, optimization, integration, etc.
 * These methods are domain-agnostic and can be used by any module.
 * 
 * @module common/utils/numerical-methods
 */

// ============================================================
// INTERFACES
// ============================================================

/**
 * Configuration for Newton-Raphson root finding
 */
export interface NewtonRaphsonOptions {
  /** Initial guess for the root */
  initialGuess: number;
  
  /** Maximum number of iterations (default: 100) */
  maxIterations?: number;
  
  /** Convergence tolerance - absolute error (default: 1e-6) */
  tolerance?: number;
  
  /** Minimum allowed value for the solution (default: -Infinity) */
  minValue?: number;
  
  /** Maximum allowed value for the solution (default: Infinity) */
  maxValue?: number;
  
  /** Step size for numerical derivative if derivative not provided (default: 1e-8) */
  derivativeStepSize?: number;
}

/**
 * Result of Newton-Raphson iteration
 */
export interface NewtonRaphsonResult {
  /** The root found (solution to f(x) = 0) */
  root: number;
  
  /** Number of iterations performed */
  iterations: number;
  
  /** Final function value at the root (should be close to 0) */
  functionValue: number;
  
  /** Whether convergence was achieved within tolerance */
  converged: boolean;
  
  /** Final error estimate (absolute change in last iteration) */
  error: number;
}

// ============================================================
// NEWTON-RAPHSON ROOT FINDING
// ============================================================

/**
 * Generic Newton-Raphson root finder
 * 
 * Finds x where f(x) = 0 using iterative Newton-Raphson method.
 * Can be used for any continuous differentiable function.
 * 
 * **Algorithm:**
 * ```
 * x_{n+1} = x_n - f(x_n) / f'(x_n)
 * ```
 * 
 * **Features:**
 * - Optional derivative (will approximate numerically if not provided)
 * - Bounded search (enforces min/max constraints)
 * - Configurable convergence tolerance
 * - Convergence diagnostics
 * 
 * @param f - Function to find root of (must be continuous)
 * @param fPrime - Derivative of f (optional - will be approximated if not provided)
 * @param options - Configuration options
 * @returns Root finding result with diagnostics
 * 
 * @throws Error if initial guess is outside bounds
 * @throws Error if derivative is zero (unable to proceed)
 * @throws Error if solution is outside allowed range
 * 
 * @example
 * // Find where x^2 - 4 = 0 (should find x = 2)
 * const result = newtonRaphson(
 *   (x) => x*x - 4,
 *   (x) => 2*x,
 *   { initialGuess: 1, minValue: 0 }
 * );
 * console.log(result.root); // 2.0
 * 
 * @example
 * // Find temperature where VFT equation equals target viscosity
 * const logEtaTarget = Math.log10(targetViscosity);
 * const result = newtonRaphson(
 *   (T) => A + B/(T - T0) - logEtaTarget,
 *   (T) => -B / Math.pow(T - T0, 2),
 *   { 
 *     initialGuess: 1000, 
 *     minValue: 273.15, 
 *     maxValue: 2773.15,
 *     tolerance: 0.01 
 *   }
 * );
 * 
 * @example
 * // Without providing derivative (will approximate numerically)
 * const result = newtonRaphson(
 *   (x) => Math.exp(x) - 10,
 *   undefined, // Derivative will be approximated
 *   { initialGuess: 2 }
 * );
 * console.log(result.root); // ≈ 2.3026 (ln(10))
 */
export function newtonRaphson(
  f: (x: number) => number,
  fPrime?: (x: number) => number,
  options: NewtonRaphsonOptions = { initialGuess: 0 }
): NewtonRaphsonResult {
  // Extract options with defaults
  const {
    initialGuess,
    maxIterations = 100,
    tolerance = 1e-6,
    minValue = -Infinity,
    maxValue = Infinity,
    derivativeStepSize = 1e-8,
  } = options;
  
  // Validate initial guess is within bounds
  if (initialGuess < minValue || initialGuess > maxValue) {
    throw new Error(
      `Initial guess ${initialGuess} outside allowed range [${minValue}, ${maxValue}]`
    );
  }
  
  // If derivative not provided, use numerical approximation
  const derivative = fPrime || ((x: number) => {
    // Central difference approximation: f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
    const h = derivativeStepSize;
    return (f(x + h) - f(x - h)) / (2 * h);
  });
  
  let x = initialGuess;
  let iterations = 0;
  let converged = false;
  let error = Infinity;
  
  for (iterations = 0; iterations < maxIterations; iterations++) {
    // Evaluate function and derivative
    const fx = f(x);
    const fpx = derivative(x);
    
    // Check for zero derivative (would cause division by zero)
    if (Math.abs(fpx) < 1e-15) {
      throw new Error(
        `Derivative is zero at x=${x}. Cannot continue Newton-Raphson iteration. ` +
        `Try a different initial guess.`
      );
    }
    
    // Newton-Raphson step
    const delta = fx / fpx;
    const x_new = x - delta;
    
    // Enforce bounds (clamp to valid range)
    const x_clamped = Math.max(minValue, Math.min(maxValue, x_new));
    
    // Check if we hit a boundary
    if (x_clamped !== x_new) {
      // We're at a boundary - check if this is close enough
      const fx_boundary = f(x_clamped);
      if (Math.abs(fx_boundary) < tolerance) {
        x = x_clamped;
        error = Math.abs(fx_boundary);
        converged = true;
        break;
      } else {
        throw new Error(
          `Solution outside allowed range [${minValue}, ${maxValue}]. ` +
          `Unbounded iteration reached ${x_new.toFixed(6)}. ` +
          `Consider adjusting bounds or initial guess.`
        );
      }
    }
    
    x = x_clamped;
    error = Math.abs(delta);
    
    // Check convergence
    if (error < tolerance) {
      converged = true;
      break;
    }
  }
  
  // Final function evaluation
  const functionValue = f(x);
  
  // Return result with diagnostics
  return {
    root: x,
    iterations: iterations + 1,
    functionValue,
    converged,
    error,
  };
}

// ============================================================
// FUTURE METHODS (Placeholders for expansion)
// ============================================================

/**
 * Bisection method for root finding
 * 
 * Robust but slower than Newton-Raphson. Guaranteed to converge
 * if f(a) and f(b) have opposite signs.
 * 
 * @todo Implement when needed
 */
export function bisection(
  f: (x: number) => number,
  a: number,
  b: number,
  tolerance: number = 1e-6
): number {
  throw new Error('Not implemented yet');
}

/**
 * Secant method for root finding
 * 
 * Similar to Newton-Raphson but approximates derivative using
 * two points instead of requiring analytical derivative.
 * 
 * @todo Implement when needed
 */
export function secant(
  f: (x: number) => number,
  x0: number,
  x1: number,
  tolerance: number = 1e-6
): number {
  throw new Error('Not implemented yet');
}

/**
 * Numerical integration using Simpson's rule
 * 
 * @todo Implement when needed for thermal calculations
 */
export function simpsonsRule(
  f: (x: number) => number,
  a: number,
  b: number,
  n: number
): number {
  throw new Error('Not implemented yet');
}

/**
 * Numerical differentiation using central difference
 * 
 * @todo Implement when needed
 */
export function numericalDerivative(
  f: (x: number) => number,
  x: number,
  h: number = 1e-8
): number {
  // Central difference: f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
  return (f(x + h) - f(x - h)) / (2 * h);
}
```

---

## Usage Examples

### Example 1: Viscosity Temperature Calculation

```typescript
import { newtonRaphson } from '../../../common/utils/numerical-methods.util';

function calculateTemperatureForViscosity(
  targetViscosity: number,
  A: number,
  B: number,
  T0: number
): number {
  const logEtaTarget = Math.log10(targetViscosity);
  
  const result = newtonRaphson(
    (T) => A + B/(T - T0) - logEtaTarget,
    (T) => -B / Math.pow(T - T0, 2),
    {
      initialGuess: 1000 + 273.15,
      minValue: 273.15,
      maxValue: 2773.15,
      tolerance: 0.01
    }
  );
  
  if (!result.converged) {
    throw new Error('Failed to find temperature for target viscosity');
  }
  
  return result.root - 273.15;
}
```

### Example 2: Thermal Expansion Coefficient

```typescript
import { newtonRaphson } from '../../../common/utils/numerical-methods.util';

function findTemperatureAtVolume(
  targetVolume: number,
  V0: number,
  alpha: number,
  T0: number
): number {
  // V = V0 * (1 + alpha * (T - T0))
  // Solve: V0 * (1 + alpha * (T - T0)) - targetVolume = 0
  
  const result = newtonRaphson(
    (T) => V0 * (1 + alpha * (T - T0)) - targetVolume,
    (T) => V0 * alpha,
    {
      initialGuess: T0,
      minValue: 0,
      maxValue: 3000,
      tolerance: 0.01
    }
  );
  
  return result.root;
}
```

### Example 3: Chemical Equilibrium

```typescript
import { newtonRaphson } from '../../../common/utils/numerical-methods.util';

function solveEquilibriumConcentration(
  K_eq: number,
  C0: number
): number {
  // For reaction A ⇌ B, find equilibrium concentration
  // K = [B]/[A] = x/(C0-x)
  // Solve: x/(C0-x) - K = 0
  
  const result = newtonRaphson(
    (x) => x/(C0 - x) - K_eq,
    (x) => C0 / Math.pow(C0 - x, 2),
    {
      initialGuess: C0 / 2,
      minValue: 0,
      maxValue: C0,
      tolerance: 1e-8
    }
  );
  
  return result.root;
}
```

---

## Testing Requirements

### Unit Tests

**File:** `backend/test/unit/common/utils/numerical-methods.util.spec.ts`

```typescript
describe('newtonRaphson', () => {
  it('should find root of quadratic equation', () => {
    // Solve x^2 - 4 = 0, expect x = 2
    const result = newtonRaphson(
      (x) => x*x - 4,
      (x) => 2*x,
      { initialGuess: 1, minValue: 0 }
    );
    
    expect(result.converged).toBe(true);
    expect(result.root).toBeCloseTo(2.0, 6);
    expect(result.functionValue).toBeCloseTo(0, 10);
  });
  
  it('should find root without providing derivative', () => {
    // Solve e^x = 10, expect x = ln(10)
    const result = newtonRaphson(
      (x) => Math.exp(x) - 10,
      undefined, // No derivative
      { initialGuess: 2 }
    );
    
    expect(result.converged).toBe(true);
    expect(result.root).toBeCloseTo(Math.log(10), 5);
  });
  
  it('should respect min/max bounds', () => {
    // Solve x^2 - 4 = 0 with positive root only
    const result = newtonRaphson(
      (x) => x*x - 4,
      (x) => 2*x,
      { initialGuess: 1, minValue: 0, maxValue: 10 }
    );
    
    expect(result.root).toBeGreaterThanOrEqual(0);
    expect(result.root).toBeLessThanOrEqual(10);
    expect(result.root).toBeCloseTo(2.0, 6);
  });
  
  it('should throw if initial guess outside bounds', () => {
    expect(() => {
      newtonRaphson(
        (x) => x*x - 4,
        (x) => 2*x,
        { initialGuess: 100, minValue: 0, maxValue: 10 }
      );
    }).toThrow('outside allowed range');
  });
  
  it('should throw if derivative is zero', () => {
    expect(() => {
      newtonRaphson(
        (x) => x*x - 4,
        (x) => 0, // Always zero derivative
        { initialGuess: 1 }
      );
    }).toThrow('Derivative is zero');
  });
  
  it('should converge for VFT viscosity equation', () => {
    const A = -3.2;
    const B = 13250;
    const T0 = 320;
    const targetLogEta = 6.6;
    
    const result = newtonRaphson(
      (T) => A + B/(T - T0) - targetLogEta,
      (T) => -B / Math.pow(T - T0, 2),
      { initialGuess: 1000, minValue: 273, maxValue: 2773, tolerance: 0.01 }
    );
    
    expect(result.converged).toBe(true);
    expect(result.iterations).toBeLessThan(10);
  });
});
```

---

## Implementation Checklist

- [ ] Create `backend/src/common/utils/numerical-methods.util.ts`
- [ ] Implement `newtonRaphson` function with all features
- [ ] Create interfaces `NewtonRaphsonOptions` and `NewtonRaphsonResult`
- [ ] Add comprehensive JSDoc documentation
- [ ] Create test file `backend/test/unit/common/utils/numerical-methods.util.spec.ts`
- [ ] Write unit tests (minimum 6 test cases)
- [ ] Test with real viscosity calculations
- [ ] Test edge cases (zero derivative, bounds violation)
- [ ] Export from common utils index

---

**Status:** Specification complete, ready for implementation

**Next:** Implement the utility and integrate into glass-viscosity.service.ts

